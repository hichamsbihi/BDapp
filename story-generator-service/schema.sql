-- ============================================================
-- Story Generator — Supabase Schema
-- Run this in your Supabase SQL editor to create all tables
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- UNIVERSES TABLE
-- One universe can contain many stories
-- ─────────────────────────────────────────────
create table if not exists universes (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  description     text not null,
  theme           text not null,
  setting         text not null,
  tone            text not null,
  lore            text not null,
  "visualStyle"   text not null,

  -- mainCharacter stored as JSONB document
  "mainCharacter" jsonb not null,
  -- {
  --   name: string
  --   age?: number
  --   gender?: string
  --   appearance: string
  --   personality: string
  --   backstory: string
  --   skills: string[]
  --   flaws: string[]
  -- }

  -- Array of story UUIDs in this universe
  "storyIds"      text[] not null default '{}',

  "createdAt"     timestamptz not null default now(),
  "updatedAt"     timestamptz not null default now()
);

-- Index for fast lookup by theme
create index if not exists idx_universes_theme on universes(theme);

-- ─────────────────────────────────────────────
-- STORIES TABLE
-- One story belongs to one universe
-- Parts are stored separately in the parts table
-- ─────────────────────────────────────────────
create table if not exists stories (
  id              uuid primary key default uuid_generate_v4(),
  "universeId"    uuid not null references universes(id) on delete cascade,
  title           text not null,
  synopsis        text not null,
  theme           text not null,
  "totalParts"    integer not null check ("totalParts" >= 1),

  -- Ordered array of part UUIDs (the narrative sequence)
  "partIds"       text[] not null default '{}',

  -- Character snapshot at story creation time (for portability)
  "mainCharacter" jsonb not null,

  status          text not null default 'generating'
                    check (status in ('generating', 'complete', 'error')),

  "createdAt"     timestamptz not null default now(),
  "completedAt"   timestamptz
);

-- Index for fast lookup by universe
create index if not exists idx_stories_universe on stories("universeId");
create index if not exists idx_stories_status on stories(status);

-- ─────────────────────────────────────────────
-- PARTS TABLE
-- Each row is one narrative segment of a story
-- ─────────────────────────────────────────────
create table if not exists parts (
  id              uuid primary key default uuid_generate_v4(),
  "storyId"       uuid not null references stories(id) on delete cascade,
  "universeId"    uuid not null references universes(id) on delete cascade,
  "partNumber"    integer not null check ("partNumber" >= 1),
  "isOpening"     boolean not null default false,
  "isEnding"      boolean not null default false,

  -- Narrative content
  title           text not null,
  "narrativeText" text not null,
  mood            text not null,

  -- Choices stored as JSONB array
  choices         jsonb not null default '[]',
  -- [
  --   {
  --     id: "choice_a" | "choice_b",
  --     label: string,
  --     description: string,
  --     leadsToPartId: string (UUID)
  --   }
  -- ]

  -- Image fields
  "imagePrompt"   text not null,
  "imagePath"     text not null,    -- local relative path: images/{universeId}/{storyId}/{partId}.png
  "imageUrl"      text,             -- optional public Supabase Storage URL

  status          text not null default 'generated'
                    check (status in ('generated', 'pending', 'error')),

  "generatedAt"   timestamptz not null default now()
);

-- Ensure part numbers are unique within a story
create unique index if not exists idx_parts_story_number
  on parts("storyId", "partNumber");

-- Fast lookup by story
create index if not exists idx_parts_story on parts("storyId");
create index if not exists idx_parts_universe on parts("universeId");

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- Enable for production — adjust policies to your auth setup
-- ─────────────────────────────────────────────

-- Uncomment these lines to enable RLS:
-- alter table universes enable row level security;
-- alter table stories enable row level security;
-- alter table parts enable row level security;

-- Example: allow read access to all authenticated users
-- create policy "Allow read" on universes for select using (auth.role() = 'authenticated');
-- create policy "Allow read" on stories for select using (auth.role() = 'authenticated');
-- create policy "Allow read" on parts for select using (auth.role() = 'authenticated');

-- Example: allow write only with service role (for the generator backend)
-- The service role key bypasses RLS by default — no insert policy needed for it

-- ─────────────────────────────────────────────
-- HELPER VIEWS
-- ─────────────────────────────────────────────

-- Stories with their universe names (useful for listing)
create or replace view story_list as
  select
    s.id,
    s.title,
    s.synopsis,
    s.theme,
    s."totalParts",
    s.status,
    s."createdAt",
    u.name as "universeName",
    u.id as "universeId"
  from stories s
  join universes u on s."universeId" = u.id
  order by s."createdAt" desc;

-- Part count per story (for validation)
create or replace view story_part_counts as
  select
    "storyId",
    count(*) as "actualPartCount",
    min("partNumber") as "firstPart",
    max("partNumber") as "lastPart"
  from parts
  group by "storyId";
