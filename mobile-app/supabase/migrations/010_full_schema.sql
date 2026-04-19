-- ============================================================
-- StoryMagic — Full Supabase Schema
-- Run in Supabase SQL editor (or via CLI: supabase db push)
-- ============================================================

-- ─────────────────────────────────────────────
-- PROFILES (extends auth.users)
-- ─────────────────────────────────────────────
create table if not exists profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               text,
  username            text,
  avatar_url          text,
  selected_avatar_id  text,
  age                 integer,
  gender              text check (gender in ('boy', 'girl')),
  last_universe_id    text,
  last_login_at       timestamptz,
  is_premium          boolean not null default false,
  is_child_account    boolean not null default false,
  provider            text not null default 'anonymous'
                        check (provider in ('anonymous', 'email', 'google', 'apple')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- WALLETS (credit balance per user)
-- ─────────────────────────────────────────────
create table if not exists wallets (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null unique references auth.users(id) on delete cascade,
  credits               integer not null default 6,
  unlimited             boolean not null default false,
  unlimited_expires_at  timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- TRANSACTIONS (audit trail for credit changes)
-- ─────────────────────────────────────────────
create table if not exists transactions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  type            text not null check (type in ('purchase', 'consumption', 'refund', 'grant')),
  amount          integer not null,
  product_id      text,
  transaction_id  text unique,
  metadata        jsonb default '{}',
  created_at      timestamptz not null default now()
);

create index if not exists idx_transactions_user on transactions(user_id);
create index if not exists idx_transactions_type on transactions(type);

-- ─────────────────────────────────────────────
-- AVATARS (selectable characters)
-- ─────────────────────────────────────────────
create table if not exists avatars (
  id              text primary key,
  character_name  text not null,
  gender          text not null check (gender in ('boy', 'girl', 'all')),
  frame_slug      text not null,
  image_happy     text,
  image_smiling   text,
  display_order   integer not null default 0,
  created_at      timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- UNIVERSES (story worlds filtered by gender)
-- ─────────────────────────────────────────────
create table if not exists universes (
  id                    text primary key,
  name                  text not null,
  description           text not null,
  image_url             text not null,
  background_image_url  text not null,
  color                 text not null default '#333333',
  language              text not null default 'fr',
  emoji                 text not null default '',
  gender                text not null check (gender in ('boy', 'girl')),
  display_order         integer not null default 0,
  created_at            timestamptz not null default now()
);

create index if not exists idx_universes_gender on universes(gender);

-- ─────────────────────────────────────────────
-- STORIES (belong to a universe)
-- ─────────────────────────────────────────────
create table if not exists stories (
  id                text primary key,
  universe_id       text not null references universes(id) on delete cascade,
  title             text not null,
  synopsis          text not null,
  theme             text not null default '',
  image_url         text not null,
  credits_required  integer not null default 3,
  total_parts       integer not null default 0,
  status            text not null default 'complete'
                      check (status in ('generating', 'complete', 'error')),
  created_at        timestamptz not null default now(),
  completed_at      timestamptz
);

create index if not exists idx_stories_universe on stories(universe_id);
create index if not exists idx_stories_status on stories(status);

-- ─────────────────────────────────────────────
-- STORY PARTS (narrative segments of a story)
-- ─────────────────────────────────────────────
create table if not exists story_parts (
  id              text primary key,
  story_id        text not null references stories(id) on delete cascade,
  universe_id     text not null references universes(id) on delete cascade,
  part_number     integer not null check (part_number >= 1),
  is_opening      boolean not null default false,
  is_ending       boolean not null default false,
  title           text not null,
  narrative_text  text not null,
  mood            text not null default '',
  choices         jsonb not null default '[]',
  image_prompt    text not null default '',
  image_path      text not null default '',
  image_url       text,
  status          text not null default 'generated'
                    check (status in ('generated', 'pending', 'error')),
  generated_at    timestamptz not null default now(),
  unique(story_id, part_number)
);

create index if not exists idx_story_parts_story on story_parts(story_id);

-- ─────────────────────────────────────────────
-- USER UNLOCKED STORIES (junction)
-- ─────────────────────────────────────────────
create table if not exists user_unlocked_stories (
  user_id     uuid not null references auth.users(id) on delete cascade,
  story_id    text not null references stories(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, story_id)
);

-- ─────────────────────────────────────────────
-- USER FAVORITE STORIES (junction)
-- ─────────────────────────────────────────────
create table if not exists user_favorite_stories (
  user_id     uuid not null references auth.users(id) on delete cascade,
  story_id    text not null references stories(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, story_id)
);

-- ─────────────────────────────────────────────
-- USER STORY PROGRESS (resume cursor)
-- ─────────────────────────────────────────────
create table if not exists user_story_progress (
  user_id             uuid not null references auth.users(id) on delete cascade,
  universe_id         text not null,
  current_page_number integer not null default 1,
  updated_at          timestamptz not null default now(),
  primary key (user_id, universe_id)
);

-- ─────────────────────────────────────────────
-- USER CHOICES (recorded for replay/resume)
-- ─────────────────────────────────────────────
create table if not exists user_choices (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  universe_id text not null,
  page_number integer not null,
  choice_id   text not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_user_choices_user on user_choices(user_id);

-- ─────────────────────────────────────────────
-- USER CREATED STORIES (completed stories)
-- ─────────────────────────────────────────────
create table if not exists user_created_stories (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  story_client_id text not null,
  universe_id     text not null,
  title           text not null default 'Sans titre',
  hero_id         text,
  pages           jsonb not null default '[]',
  start_id        text,
  opening_text    text,
  is_complete     boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(user_id, story_client_id)
);

create index if not exists idx_user_created_stories_user on user_created_stories(user_id);

-- ─────────────────────────────────────────────
-- TRIGGER: auto-create profile + wallet on signup
-- ─────────────────────────────────────────────
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, provider)
  values (
    new.id,
    new.email,
    case when new.is_anonymous then 'anonymous' else 'email' end
  );
  insert into public.wallets (user_id, credits)
  values (new.id, 6);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─────────────────────────────────────────────
-- ATOMIC TRANSACTION (idempotent — RevenueCat retry safe)
-- ─────────────────────────────────────────────
create or replace function apply_transaction(
  p_user_id uuid,
  p_amount int,
  p_type text,
  p_product_id text,
  p_transaction_id text
)
returns void as $$
begin
  if exists (
    select 1 from transactions
    where transaction_id = p_transaction_id
  ) then
    return;
  end if;

  insert into transactions (
    user_id, type, amount, product_id, transaction_id
  )
  values (
    p_user_id, p_type, p_amount, p_product_id, p_transaction_id
  );

  update wallets
  set credits = credits + p_amount,
      updated_at = now()
  where user_id = p_user_id;
end;
$$ language plpgsql;

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────

alter table profiles enable row level security;
alter table wallets enable row level security;
alter table transactions enable row level security;
alter table avatars enable row level security;
alter table universes enable row level security;
alter table stories enable row level security;
alter table story_parts enable row level security;
alter table user_unlocked_stories enable row level security;
alter table user_favorite_stories enable row level security;
alter table user_story_progress enable row level security;
alter table user_choices enable row level security;
alter table user_created_stories enable row level security;

-- Profiles: own row only
create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- Wallets: own row only
create policy "wallets_select_own" on wallets for select using (auth.uid() = user_id);
create policy "wallets_update_own" on wallets for update using (auth.uid() = user_id);

-- Transactions: read own, insert own
create policy "transactions_select_own" on transactions for select using (auth.uid() = user_id);
create policy "transactions_insert_own" on transactions for insert with check (auth.uid() = user_id);

-- Content tables: read-only for all authenticated (incl. anonymous)
create policy "avatars_select_all" on avatars for select using (auth.role() = 'authenticated');
create policy "universes_select_all" on universes for select using (auth.role() = 'authenticated');
create policy "stories_select_all" on stories for select using (auth.role() = 'authenticated');
create policy "story_parts_select_all" on story_parts for select using (auth.role() = 'authenticated');

-- User junction tables: own rows
create policy "unlocked_select_own" on user_unlocked_stories for select using (auth.uid() = user_id);
create policy "unlocked_insert_own" on user_unlocked_stories for insert with check (auth.uid() = user_id);
create policy "unlocked_delete_own" on user_unlocked_stories for delete using (auth.uid() = user_id);

create policy "favorites_select_own" on user_favorite_stories for select using (auth.uid() = user_id);
create policy "favorites_insert_own" on user_favorite_stories for insert with check (auth.uid() = user_id);
create policy "favorites_delete_own" on user_favorite_stories for delete using (auth.uid() = user_id);

-- Progress / choices / created stories: own rows
create policy "progress_select_own" on user_story_progress for select using (auth.uid() = user_id);
create policy "progress_insert_own" on user_story_progress for insert with check (auth.uid() = user_id);
create policy "progress_update_own" on user_story_progress for update using (auth.uid() = user_id);

create policy "choices_select_own" on user_choices for select using (auth.uid() = user_id);
create policy "choices_insert_own" on user_choices for insert with check (auth.uid() = user_id);

create policy "created_stories_select_own" on user_created_stories for select using (auth.uid() = user_id);
create policy "created_stories_insert_own" on user_created_stories for insert with check (auth.uid() = user_id);
create policy "created_stories_update_own" on user_created_stories for update using (auth.uid() = user_id);
