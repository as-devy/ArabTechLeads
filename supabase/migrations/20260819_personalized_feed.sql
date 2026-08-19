-- Personalized feed tables. Safe to re-run.

do $$ begin
  create type "PostInteractionType" as enum (
    'IMPRESSION', 'VIEW', 'LIKE', 'COMMENT', 'SAVE', 'SHARE', 'HIDE', 'NOT_INTERESTED'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type "InterestSource" as enum (
    'EXPLICIT', 'BEHAVIOR', 'COMMUNITY', 'PROJECT', 'FOLLOW', 'INTERACTION'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.post_interactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  type "PostInteractionType" not null,
  position integer,
  feed_version text not null default 'v1',
  created_at timestamptz not null default now()
);

create index if not exists post_interactions_profile_type_created_idx
  on public.post_interactions (profile_id, type, created_at desc);
create index if not exists post_interactions_post_type_idx
  on public.post_interactions (post_id, type);
create index if not exists post_interactions_profile_post_type_created_idx
  on public.post_interactions (profile_id, post_id, type, created_at desc);

create table if not exists public.user_interest_profiles (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  weight double precision not null,
  source "InterestSource" not null,
  updated_at timestamptz not null default now(),
  primary key (profile_id, tag_id, source)
);

create index if not exists user_interest_profiles_profile_weight_idx
  on public.user_interest_profiles (profile_id, weight desc);
create index if not exists user_interest_profiles_tag_idx
  on public.user_interest_profiles (tag_id);

alter table public.post_interactions enable row level security;
alter table public.user_interest_profiles enable row level security;

drop policy if exists "post_interactions_own_read" on public.post_interactions;
create policy "post_interactions_own_read" on public.post_interactions
  for select using (true);

drop policy if exists "user_interest_profiles_read" on public.user_interest_profiles;
create policy "user_interest_profiles_read" on public.user_interest_profiles
  for select using (true);
