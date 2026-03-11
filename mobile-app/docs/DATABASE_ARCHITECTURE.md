# Database architecture — User and story system (Supabase PostgreSQL)

This document describes the relational schema connecting **users**, **profiles**, **avatars**, **universes**, and **narrative content** for the interactive comic app.

---

## 1. Architecture overview

```
auth.users (Supabase Auth)
       │
       ▼
  profiles  ◄──── selected_avatar_id ──── avatars
       │              last_universe_id ──── universes
       │
       ├──► user_story_progress (user_id, universe_id, current_page_number)
       │         └── one row per user per universe
       │
       ├──► user_choices (user_id, universe_id, page_number, choice_id)
       │         └── narrative_choices (content)
       │
       └──► stars_transactions (user_id, amount, type, source)
                 └── audit log for stars_balance
```

- **profiles**: extends `auth.users`; holds user preferences and denormalized data (email, username, stars_balance, selected_avatar_id, last_universe_id).
- **user_story_progress**: one row per (user, universe); stores `current_page_number` and timestamps.
- **user_choices**: one row per choice made; links user + universe + page + `narrative_choices.id` to rebuild the path.
- **stars_transactions**: append-only log of star movements (reward, purchase, story_spend, admin) with optional source (countdown, ad, purchase_pack, etc.).

Content tables: **universes**, **avatars**, **story_paragraphs**, **narrative_choices**, **story_starts**.

**Branching (migration 003):**
- **story_paragraphs**: column **step** (integer) — narrative step in the path.
- **narrative_choices**: column **next_paragraph_id** (FK → story_paragraphs.id) — paragraph shown after this choice (different text + image per branch).
- When the user picks a choice, load the next paragraph via `next_paragraph_id` (use `fetchParagraphById`) so each branch has its own continuation and image.

---

## 2. Tables and foreign keys

### profiles (extends auth.users)

| Column               | Type   | Description |
|----------------------|--------|-------------|
| id                   | UUID   | PK, FK → auth.users(id) ON DELETE CASCADE |
| email                | TEXT   | Denormalized from Auth |
| username             | TEXT   | Display name |
| avatar_url           | TEXT   | Legacy/profile picture URL |
| stars_balance        | INT    | Current star balance (cache) |
| created_at, updated_at, last_login_at | TIMESTAMPTZ | |
| provider             | TEXT   | email \| google \| apple |
| is_child_account     | BOOLEAN | |
| **selected_avatar_id** | UUID | FK → avatars(id) ON DELETE SET NULL |
| **last_universe_id**  | UUID | FK → universes(id) ON DELETE SET NULL |

- **selected_avatar_id**: user’s chosen character (avatars table).
- **last_universe_id**: last universe visited (for “continue” or default).

### user_story_progress

| Column              | Type   | Description |
|---------------------|--------|-------------|
| id                  | UUID   | PK |
| user_id             | UUID   | FK → profiles(id) ON DELETE CASCADE |
| universe_id         | UUID   | FK → universes(id) ON DELETE CASCADE |
| current_page_number | INT    | Last reached page in this universe |
| started_at, updated_at | TIMESTAMPTZ | |

- **Unique (user_id, universe_id)**: one progress row per user per universe; upsert when saving progress.

### user_choices

| Column      | Type   | Description |
|-------------|--------|-------------|
| id          | UUID   | PK |
| user_id     | UUID   | FK → profiles(id) ON DELETE CASCADE |
| universe_id | UUID   | FK → universes(id) ON DELETE CASCADE |
| page_number | INT    | Page where the choice was made |
| choice_id   | UUID   | FK → narrative_choices(id) ON DELETE CASCADE |
| created_at  | TIMESTAMPTZ | |

- Append-only: each choice is one row; ordering by (user_id, universe_id, created_at) or page_number rebuilds the path.

### stars_transactions

| Column    | Type   | Description |
|-----------|--------|-------------|
| id        | UUID   | PK |
| user_id   | UUID   | FK → profiles(id) ON DELETE CASCADE |
| amount    | INT    | Positive = credit, negative = debit |
| type      | ENUM   | reward \| purchase \| story_spend \| admin |
| source    | ENUM   | countdown \| ad \| purchase_pack \| story_unlock \| pdf_export \| other (nullable) |
| created_at| TIMESTAMPTZ | |

- Append-only audit log; `profiles.stars_balance` is the cached total.

---

## 3. How the user system connects to story tables

1. **Avatar**  
   User picks a character → set `profiles.selected_avatar_id` to `avatars.id`. UI can load avatar frames from `avatars` via this FK.

2. **Universe**  
   User enters a universe → set `profiles.last_universe_id` to `universes.id`. Optional: upsert `user_story_progress(user_id, universe_id, current_page_number)` when they advance.

3. **Story progress**  
   `user_story_progress` stores, per user and per universe, the last page reached (`current_page_number`). Content for that page comes from `story_paragraphs` and `narrative_choices` filtered by `universe_id` and `page_number`.

4. **Choices**  
   When the user picks an option at a page, insert a row in `user_choices` with `user_id`, `universe_id`, `page_number`, and `choice_id` = `narrative_choices.id`. The path is the ordered list of `user_choices` for that (user_id, universe_id).

5. **Stars**  
   - Display: read `profiles.stars_balance`.  
   - On any change: insert into `stars_transactions` (amount, type, source) and update `profiles.stars_balance`.  
   - Types: reward (countdown, ad), purchase (pack), story_spend (unlock, pdf), admin.

---

## 4. Indexes (performance)

- **profiles**: email; selected_avatar_id; last_universe_id.
- **user_story_progress**: user_id; universe_id; (user_id, universe_id) for upsert/lookup.
- **user_choices**: user_id; (user_id, universe_id); (user_id, universe_id, created_at) for path rebuild.
- **stars_transactions**: user_id; (user_id, created_at DESC); (user_id, type) for history and analytics.

---

## 5. Row Level Security (RLS)

- **profiles**: unchanged; user can SELECT and UPDATE only their own row (auth.uid() = id).
- **user_story_progress**: user can SELECT, INSERT, UPDATE, DELETE only rows where auth.uid() = user_id.
- **user_choices**: user can SELECT and INSERT only rows where auth.uid() = user_id (no update/delete; append-only).
- **stars_transactions**: user can SELECT and INSERT only rows where auth.uid() = user_id (append-only).

Content tables (universes, avatars, story_paragraphs, narrative_choices, story_starts) stay readable by anon/authenticated as needed; no user data.

---

## 6. Migrations

- **001_profiles_auth.sql**: creates `profiles` (with selected_avatar_id, last_universe_id FKs), trigger on auth.users, RLS, updated_at trigger.  
  Requires **avatars** and **universes** to exist (FKs). Run content migrations first if you create them via SQL.

- **002_user_story_system.sql**: adds profile columns if missing (for existing DBs), creates `user_story_progress`, `user_choices`, `stars_transactions`, enums, RLS, indexes, triggers.

**Id types**: All FKs assume **UUID** for `profiles.id`, `avatars.id`, `universes.id`, `narrative_choices.id`. If your content tables use TEXT or another type for `id`, adjust the REFERENCES in the migrations.
