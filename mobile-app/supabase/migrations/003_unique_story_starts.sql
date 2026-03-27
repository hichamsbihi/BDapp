-- story_starts previously used static IDs like "start-A" / "start-B" as primary key.
-- This caused every new story generation for the same universe to OVERWRITE existing rows.
--
-- Fix: add path_id TEXT to store the narrative path label (start-A, start-B, …)
-- while the primary key (id) now receives a unique value generated in n8n.
-- The app sorts story starts by path_id (alphabetical) to preserve page_number mapping.

ALTER TABLE story_starts
  ADD COLUMN IF NOT EXISTS path_id TEXT;

-- Backfill existing rows: derive path_id from the old id column (e.g. "start-A" → "start-A")
UPDATE story_starts
  SET path_id = id
  WHERE path_id IS NULL;

-- Useful index for fetching + sorting starts by universe + path
CREATE INDEX IF NOT EXISTS idx_story_starts_universe_path
  ON story_starts (universe_id, path_id);
