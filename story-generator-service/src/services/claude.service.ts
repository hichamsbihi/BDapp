import Anthropic from "@anthropic-ai/sdk";
import {
  Character,
  ClaudePartResponse,
  ClaudeStoryInitResponse,
  GenerationInput,
  StoryTheme,
} from "../types";

// HistoryEntry mirrors Anthropic's MessageParam shape
interface HistoryEntry {
  role: "user" | "assistant";
  content: string;
}

export class ClaudeService {
  private client: Anthropic;
  private model = "claude-haiku-4-5-20251001";
  private history: HistoryEntry[] = [];

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    this.client = new Anthropic({ apiKey });
  }

  // ─────────────────────────────────────────────
  // RESET history between stories
  // ─────────────────────────────────────────────
  resetHistory(): void {
    this.history = [];
  }

  // ─────────────────────────────────────────────
  // STEP 1 — Parse universe + character from input
  // and produce the World Bible that anchors all future parts
  // ─────────────────────────────────────────────
  async initializeStory(input: GenerationInput): Promise<ClaudeStoryInitResponse> {
    const systemPrompt = `You are a creative director and world-builder for interactive narrative stories.
Your job is to take a universe description and character description and produce a structured World Bible.
You ALWAYS respond with valid JSON only — no markdown, no prose outside the JSON object.`;

    const userPrompt = `Create a World Bible for a branching narrative story with these inputs:

UNIVERSE DESCRIPTION:
${input.universeDescription}

CHARACTER DESCRIPTION:
${input.characterDescription}

THEME: ${input.theme ?? "unspecified — infer from the universe description"}
TOTAL PARTS: ${input.numberOfParts}

Return a JSON object with EXACTLY this structure:
{
  "storyTitle": "Evocative title for this story",
  "synopsis": "2-3 sentence summary of the overall story arc",
  "universe": {
    "name": "Name of this universe/world",
    "setting": "Era and place summary in one sentence",
    "tone": "Overall mood (e.g. dark and gritty, whimsical, tense)",
    "lore": "Key world rules, factions, technology, magic — 3-5 sentences",
    "visualStyle": "Visual art direction for image generation — lighting, palette, style keywords"
  },
  "character": {
    "name": "Character full name",
    "age": 30,
    "gender": "non-binary",
    "appearance": "Physical description for image prompts — 2-3 sentences",
    "personality": "Core personality traits — 2-3 sentences",
    "backstory": "Origin and motivation — 2-3 sentences",
    "skills": ["skill1", "skill2", "skill3"],
    "flaws": ["flaw1", "flaw2"]
  }
}`;

    const response = await this.sendMessage(systemPrompt, userPrompt);
    return this.parseJson<ClaudeStoryInitResponse>(response, "story initialization");
  }

  // ─────────────────────────────────────────────
  // STEP 2 — Generate a single story part
  // Sends the full accumulated history for narrative continuity
  // ─────────────────────────────────────────────
  async generatePart(
    partNumber: number,
    totalParts: number,
    universe: ClaudeStoryInitResponse,
    previousChoice: string | null,
    allPartsSoFar: string // JSON summary of generated parts for context
  ): Promise<ClaudePartResponse> {
    const isFirst = partNumber === 1;
    const isLast = partNumber === totalParts;

    const systemPrompt = `You are a master storyteller writing a branching interactive narrative.
The story exists in a fully established world. You write in second person ("you").
You ALWAYS respond with valid JSON only — no markdown, no prose outside the JSON object.
Maintain strict narrative continuity with everything that happened in previous parts.`;

    const worldContext = `WORLD BIBLE:
Universe: ${universe.universe.name}
Setting: ${universe.universe.setting}
Tone: ${universe.universe.tone}
Lore: ${universe.universe.lore}
Visual Style: ${universe.universe.visualStyle}

MAIN CHARACTER:
Name: ${universe.character.name}
Appearance: ${universe.character.appearance}
Personality: ${universe.character.personality}
Skills: ${universe.character.skills.join(", ")}
Flaws: ${universe.character.flaws.join(", ")}`;

    const userPrompt = `${worldContext}

STORY PROGRESS:
${allPartsSoFar || "This is the opening part — no previous events."}

CURRENT REQUEST:
- Write Part ${partNumber} of ${totalParts}
- ${isFirst ? "This is the OPENING part — establish the scene and hook the reader." : `The user made this choice in the previous part: "${previousChoice}"`}
- ${isLast ? "This is the ENDING part — bring the story to a satisfying conclusion. Set isEnding to true and provide NO choices (empty array)." : `This is NOT the final part. Provide exactly 2 meaningful choices that lead to distinctly different narrative directions.`}
- Write ${isLast ? "a rich concluding" : "an immersive"} narrative segment of 150-250 words.
- The image prompt must describe a cinematic single scene for this part, consistent with: ${universe.universe.visualStyle}

Return a JSON object with EXACTLY this structure:
{
  "partNumber": ${partNumber},
  "title": "Short evocative title for this part (4-7 words)",
  "narrativeText": "Full story prose for this part (150-250 words, second person)",
  "mood": "Emotional tone of this specific part (one word or short phrase)",
  "isEnding": ${isLast},
  "imagePrompt": "Detailed cinematic image prompt for Flux image model (40-60 words, no character names, describe visually)",
  "choices": ${isLast ? "[]" : `[
    {
      "id": "choice_a",
      "label": "Short action label (max 6 words)",
      "description": "One sentence hinting at consequence"
    },
    {
      "id": "choice_b", 
      "label": "Short action label (max 6 words)",
      "description": "One sentence hinting at consequence"
    }
  ]`}
}`;

    const response = await this.sendMessage(systemPrompt, userPrompt);
    return this.parseJson<ClaudePartResponse>(response, `part ${partNumber}`);
  }

  // ─────────────────────────────────────────────
  // INTERNAL — send a message with history tracking
  // ─────────────────────────────────────────────
  private async sendMessage(
    systemPrompt: string,
    userMessage: string
  ): Promise<string> {
    // Build messages array: full history + new user message
    const messages: Anthropic.MessageParam[] = [
      ...this.history.map((h) => ({
        role: h.role as "user" | "assistant",
        content: h.content,
      })),
      { role: "user", content: userMessage },
    ];

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    });

    const assistantMessage =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Append to history for continuity
    this.history.push({ role: "user", content: userMessage });
    this.history.push({ role: "assistant", content: assistantMessage });

    return assistantMessage;
  }

  // ─────────────────────────────────────────────
  // INTERNAL — safe JSON parsing with error context
  // ─────────────────────────────────────────────
  private parseJson<T>(raw: string, context: string): T {
    try {
      // Strip markdown code fences if Claude adds them despite instructions
      const cleaned = raw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/, "")
        .trim();
      return JSON.parse(cleaned) as T;
    } catch (err) {
      throw new Error(
        `Failed to parse Claude JSON response for ${context}.\nRaw response:\n${raw}\nError: ${err}`
      );
    }
  }

  // ─────────────────────────────────────────────
  // Utility — summarize history if it grows large
  // (Flash-Lite is cheap, but good practice)
  // ─────────────────────────────────────────────
  getHistoryTokenEstimate(): number {
    const totalChars = this.history.reduce(
      (sum, h) => sum + h.content.length,
      0
    );
    return Math.round(totalChars / 4); // rough token estimate
  }
}
