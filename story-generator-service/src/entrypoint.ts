import "dotenv/config";
import * as readline from "readline";
import { StoryOrchestrator } from "./orchestrator";
import { GenerationInput, StoryTheme } from "./types";

// ─────────────────────────────────────────────
// CLI helper
// ─────────────────────────────────────────────
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

function askNumber(question: string, defaultVal: number): Promise<number> {
  return new Promise((resolve) => {
    rl.question(`${question} (default: ${defaultVal}): `, (answer) => {
      const num = parseInt(answer.trim(), 10);
      resolve(isNaN(num) ? defaultVal : Math.max(2, Math.min(20, num)));
    });
  });
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
async function main(): Promise<void> {
  console.log("╔════════════════════════════════════════╗");
  console.log("║   🌟  Story Generator — AI Powered     ║");
  console.log("║   Claude Haiku + Flux Schnell           ║");
  console.log("╚════════════════════════════════════════╝\n");

  // ── Check environment ─────────────────────────
  const missingEnv: string[] = [];
  if (!process.env.ANTHROPIC_API_KEY) missingEnv.push("ANTHROPIC_API_KEY");
  if (!process.env.REPLICATE_API_TOKEN) missingEnv.push("REPLICATE_API_TOKEN");
  if (!process.env.SUPABASE_URL) missingEnv.push("SUPABASE_URL");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missingEnv.push("SUPABASE_SERVICE_ROLE_KEY");

  if (missingEnv.length > 0) {
    console.error("❌ Missing required environment variables:");
    missingEnv.forEach((v) => console.error(`   - ${v}`));
    console.error("\nCopy .env.example to .env and fill in your API keys.");
    process.exit(1);
  }

  // ── Collect inputs ────────────────────────────
  console.log("Please provide the following story inputs:\n");

  const universeDescription = await ask(
    "🌍 Universe description (world, setting, rules, atmosphere):\n> "
  );

  const characterDescription = await ask(
    "\n🧙 Main character description (appearance, personality, backstory):\n> "
  );

  const numberOfParts = await askNumber(
    "\n📚 Number of story parts to generate (2-20)",
    5
  );

  const themeInput = await ask(
    "\n🎭 Theme (fantasy / sci-fi / noir / horror / adventure — or press Enter to auto-detect):\n> "
  );

  const storyTitle = await ask(
    "\n📖 Custom story title (or press Enter to let AI generate one):\n> "
  );

  rl.close();

  const input: GenerationInput = {
    universeDescription,
    characterDescription,
    numberOfParts,
    theme: (themeInput as StoryTheme) || undefined,
    storyTitle: storyTitle || undefined,
  };

  // ── Run generation ────────────────────────────
  try {
    const orchestrator = new StoryOrchestrator();
    const result = await orchestrator.generate(input);

    console.log("\n════════════════════════════════════════");
    console.log("📊 Generation Summary");
    console.log("════════════════════════════════════════");
    console.log(`Universe ID : ${result.universe.id}`);
    console.log(`Story ID    : ${result.story.id}`);
    console.log(`Title       : ${result.story.title}`);
    console.log(`Parts       : ${result.story.parts.length}`);
    console.log(`Output JSON : ${result.outputJsonPath}`);
    console.log("════════════════════════════════════════\n");
  } catch (err) {
    console.error("\n❌ Story generation failed:", err);
    process.exit(1);
  }
}

main().catch(console.error);
