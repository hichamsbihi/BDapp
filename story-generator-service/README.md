# Story Generator

AI-powered branching narrative story generator using **Claude Haiku 3.5** (narrative) + **Flux Schnell on Replicate** (images).

## Architecture

```
src/
├── index.ts                  # CLI entry point
├── orchestrator.ts           # Main generation pipeline
├── types/
│   └── index.ts              # All TypeScript interfaces
└── services/
    ├── claude.service.ts     # Claude Haiku — story + narrative
    ├── image.service.ts      # Replicate Flux Schnell — image generation
    └── supabase.service.ts   # NoSQL persistence layer

supabase/
└── schema.sql                # Run this in Supabase SQL editor

images/
└── {universeId}/{storyId}/{partId}.png   # Generated images

output/
└── story_{storyId}.json      # Full JSON output per story
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in your `.env`:

```
ANTHROPIC_API_KEY=sk-ant-...
REPLICATE_API_TOKEN=r8_...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhb...
IMAGES_BASE_DIR=./images
```

### 3. Set up Supabase

In your Supabase dashboard → SQL editor, run the entire contents of `supabase/schema.sql`.

This creates 3 tables: `universes`, `stories`, `parts`.

### 4. Run the generator

```bash
npm run dev
# or after build:
npm run build && npm start
```

You'll be prompted for:
- Universe description
- Main character description  
- Number of parts (2–20)
- Theme (optional)
- Story title (optional)

---

## Data Models

### Universe
Stored in `universes` table. One universe can host many stories.

### Story  
Stored in `stories` table. References its universe. Holds an ordered `partIds[]` array.

### Part
Stored in `parts` table. Each part has:
- `narrativeText` — the prose
- `choices[]` — 2 choices (or empty for endings), each with `leadsToPartId`
- `imagePath` — local image file path
- `imagePrompt` — prompt sent to Flux Schnell

---

## Context Strategy

Two-layer approach for narrative continuity:

| Layer | What | How |
|---|---|---|
| World Bible | Universe rules, character traits | Injected as system context on every call |
| Chat History | Story events across parts | Accumulated via Claude's `messages` history array |

The Claude service maintains a `history[]` array that grows with each part. This ensures Part 5 knows exactly what happened in Parts 1–4.

---

## Cost Estimate (per 100 stories, 10 parts each)

| Item | Cost |
|---|---|
| Claude Haiku 3.5 (text) | ~$2–4 |
| Flux Schnell images (1000 × $0.003) | ~$3 |
| **Total** | **~$5–7** |

---

## Output Format

Each run produces `output/story_{uuid}.json` containing the full universe + story + all parts with resolved choice navigation links.

See `sample_output.json` for a complete example.
