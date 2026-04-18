import { v4 as uuidv4 } from "uuid";
import * as path from "path";
import * as fs from "fs-extra";
import { ClaudeService } from "./services/claude.service";
import { ImageService } from "./services/image.service";
import { SupabaseService } from "./services/supabase.service";
import {
  Choice,
  ClaudePartResponse,
  ClaudeStoryInitResponse,
  GenerationInput,
  GenerationResult,
  Part,
  Story,
  Universe,
} from "./types";

export class StoryOrchestrator {
  private claude: ClaudeService;
  private imageService: ImageService;
  private supabase: SupabaseService;

  constructor() {
    this.claude = new ClaudeService();
    this.imageService = new ImageService();
    this.supabase = new SupabaseService();
  }

  // ─────────────────────────────────────────────
  // MAIN ENTRY POINT
  // ─────────────────────────────────────────────
  async generate(input: GenerationInput): Promise<GenerationResult> {
    console.log("\n🚀 Starting story generation...");
    console.log(`   Parts to generate: ${input.numberOfParts}`);
    this.claude.resetHistory();

    // ── Step 1: Initialize world bible ──────────
    console.log("\n📚 Building World Bible...");
    const worldBible = await this.claude.initializeStory(input);
    console.log(`   ✅ Universe: ${worldBible.universe.name}`);
    console.log(`   ✅ Title: ${worldBible.storyTitle}`);
    console.log(`   ✅ Character: ${worldBible.character.name}`);

    // ── Step 2: Create IDs ──────────────────────
    const universeId = uuidv4();
    const storyId = uuidv4();
    const now = new Date().toISOString();

    // ── Step 3: Generate parts sequentially ─────
    console.log("\n✍️  Generating story parts...");
    const generatedParts: Part[] = [];
    let previousChoice: string | null = null;

    for (let partNum = 1; partNum <= input.numberOfParts; partNum++) {
      console.log(`\n📝 Part ${partNum}/${input.numberOfParts}...`);

      // Build a summary of already-generated parts for context injection
      const partsSummary = this.buildPartsSummary(generatedParts);

      // Generate narrative from Claude
      const claudePart = await this.claude.generatePart(
        partNum,
        input.numberOfParts,
        worldBible,
        previousChoice,
        partsSummary
      );
      console.log(`   ✅ Narrative: "${claudePart.title}"`);
      console.log(
        `   📊 History size: ~${this.claude.getHistoryTokenEstimate()} tokens`
      );

      // Generate image in parallel (fire and collect)
      const partId = uuidv4();
      const imagePath = await this.imageService.generateAndSaveImage(
        this.buildImagePrompt(claudePart.imagePrompt, worldBible),
        universeId,
        storyId,
        partId
      );

      // Build the Part object (choices don't have leadsToPartId yet — resolved below)
      const part: Part = {
        id: partId,
        storyId,
        universeId,
        partNumber: partNum,
        isOpening: partNum === 1,
        isEnding: claudePart.isEnding,
        title: claudePart.title,
        narrativeText: claudePart.narrativeText,
        mood: claudePart.mood,
        choices: claudePart.choices.map((c) => ({
          id: c.id,
          label: c.label,
          description: c.description,
          leadsToPartId: "", // placeholder — resolved in post-processing
        })),
        imagePrompt: claudePart.imagePrompt,
        imagePath,
        status: "generated",
        generatedAt: new Date().toISOString(),
      };

      generatedParts.push(part);

      // For next iteration: carry the first choice label as "selected" context
      if (claudePart.choices.length > 0) {
        previousChoice = claudePart.choices[0].label;
      }
    }

    // ── Step 4: Resolve choice links ────────────
    console.log("\n🔗 Resolving choice navigation...");
    const resolvedParts = this.resolveChoiceLinks(generatedParts);

    // ── Step 5: Build Universe + Story models ───
    const universe: Universe = {
      id: universeId,
      name: worldBible.universe.name,
      description: input.universeDescription,
      theme: input.theme ?? "unspecified",
      setting: worldBible.universe.setting,
      tone: worldBible.universe.tone,
      lore: worldBible.universe.lore,
      mainCharacter: worldBible.character,
      visualStyle: worldBible.universe.visualStyle,
      storyIds: [storyId],
      createdAt: now,
      updatedAt: now,
    };

    const story: Story = {
      id: storyId,
      universeId,
      title: input.storyTitle ?? worldBible.storyTitle,
      synopsis: worldBible.synopsis,
      theme: input.theme ?? "unspecified",
      totalParts: input.numberOfParts,
      parts: resolvedParts,
      partIds: resolvedParts.map((p) => p.id),
      mainCharacter: worldBible.character,
      status: "complete",
      createdAt: now,
      completedAt: new Date().toISOString(),
    };

    // ── Step 6: Persist to Supabase ─────────────
    await this.supabase.saveFullStory(universe, story);

    // ── Step 7: Write local JSON output ─────────
    const outputPath = await this.writeOutputJson(story, universe);

    console.log("\n🎉 Story generation complete!");
    console.log(`   Output JSON: ${outputPath}`);

    return { universe, story, outputJsonPath: outputPath };
  }

  // ─────────────────────────────────────────────
  // Build a text summary of generated parts to inject as context
  // ─────────────────────────────────────────────
  private buildPartsSummary(parts: Part[]): string {
    if (parts.length === 0) return "";

    return parts
      .map(
        (p) =>
          `Part ${p.partNumber} — "${p.title}" [Mood: ${p.mood}]\n${p.narrativeText.slice(0, 200)}...`
      )
      .join("\n\n");
  }

  // ─────────────────────────────────────────────
  // Enrich the image prompt with visual style context
  // ─────────────────────────────────────────────
  private buildImagePrompt(
    basePrompt: string,
    worldBible: ClaudeStoryInitResponse
  ): string {
    return `${basePrompt}, ${worldBible.universe.visualStyle}, cinematic composition, 512x512, high detail`;
  }

  // ─────────────────────────────────────────────
  // Post-processing: assign leadsToPartId for each choice
  //
  // Strategy: each choice_a leads to the next sequential part,
  // each choice_b creates a "branch" by pointing to a later part.
  // In a real tree this would be a full binary tree — here we linearize
  // for simplicity while keeping the data model valid.
  // ─────────────────────────────────────────────
  private resolveChoiceLinks(parts: Part[]): Part[] {
    return parts.map((part, index) => {
      if (part.isEnding || part.choices.length === 0) {
        return part; // No links needed for endings
      }

      const nextPart = parts[index + 1];
      const branchPart = parts[Math.min(index + 2, parts.length - 1)];

      const resolvedChoices: Choice[] = part.choices.map((choice, ci) => ({
        ...choice,
        leadsToPartId:
          ci === 0
            ? (nextPart?.id ?? part.id)      // choice_a → next sequential
            : (branchPart?.id ?? nextPart?.id ?? part.id), // choice_b → skip ahead
      }));

      return { ...part, choices: resolvedChoices };
    });
  }

  // ─────────────────────────────────────────────
  // Write final JSON output to disk
  // ─────────────────────────────────────────────
  private async writeOutputJson(
    story: Story,
    universe: Universe
  ): Promise<string> {
    const outputDir = path.join(process.cwd(), "output");
    await fs.ensureDir(outputDir);

    const fileName = `story_${story.id}.json`;
    const filePath = path.join(outputDir, fileName);

    const output = {
      universe,
      story: {
        ...story,
        parts: story.parts, // Full parts with all fields
      },
    };

    await fs.writeJson(filePath, output, { spaces: 2 });
    return filePath;
  }
}
