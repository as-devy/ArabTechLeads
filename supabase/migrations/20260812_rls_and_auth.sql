-- ArabTechLeads: Auth trigger + Row Level Security
-- Apply after Prisma migrations (tables must exist).
-- Safe to run in Supabase SQL Editor.

-- Link profiles to auth.users
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_id_fkey'
  ) then
    alter table public.profiles
      add constraint profiles_id_fkey
      foreign key (id) references auth.users (id) on delete cascade;
  end if;
end $$;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, created_at, updated_at)
  values (
    new.id,
    new.email,
    now(),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Enable RLS on all application tables
alter table public.roles enable row level security;
alter table public.countries enable row level security;
alter table public.profiles enable row level security;
alter table public.skills enable row level security;
alter table public.profile_skills enable row level security;
alter table public.interests enable row level security;
alter table public.profile_interests enable row level security;
alter table public.posts enable row level security;
alter table public.tags enable row level security;
alter table public.post_tags enable row level security;
alter table public.comments enable row level security;
alter table public.post_likes enable row level security;
alter table public.saved_posts enable row level security;
alter table public.follows enable row level security;
alter table public.connections enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.community_posts enable row level security;
alter table public.notifications enable row level security;

-- Reference data: readable by everyone
create policy "roles_read_all" on public.roles for select using (true);
create policy "countries_read_all" on public.countries for select using (true);
create policy "skills_read_all" on public.skills for select using (true);
create policy "interests_read_all" on public.interests for select using (true);
create policy "tags_read_all" on public.tags for select using (true);
create policy "communities_read_all" on public.communities for select using (true);

-- Profiles
create policy "profiles_read_all" on public.profiles
  for select using (true);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- Profile skills / interests
create policy "profile_skills_read_all" on public.profile_skills for select using (true);
create policy "profile_skills_manage_own" on public.profile_skills
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create policy "profile_interests_read_all" on public.profile_interests for select using (true);
create policy "profile_interests_manage_own" on public.profile_interests
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- Posts
create policy "posts_read_all" on public.posts for select using (true);
create policy "posts_insert_own" on public.posts
  for insert with check (auth.uid() = author_id);
create policy "posts_update_own" on public.posts
  for update using (auth.uid() = author_id) with check (auth.uid() = author_id);
create policy "posts_delete_own" on public.posts
  for delete using (auth.uid() = author_id);

-- Post tags
create policy "post_tags_read_all" on public.post_tags for select using (true);
create policy "post_tags_manage_own_posts" on public.post_tags
  for all using (
    exists (
      select 1 from public.posts p
      where p.id = post_id and p.author_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.posts p
      where p.id = post_id and p.author_id = auth.uid()
    )
  );

-- Comments
create policy "comments_read_all" on public.comments for select using (true);
create policy "comments_insert_auth" on public.comments
  for insert with check (auth.uid() = author_id);
create policy "comments_update_own" on public.comments
  for update using (auth.uid() = author_id) with check (auth.uid() = author_id);
create policy "comments_delete_own" on public.comments
  for delete using (auth.uid() = author_id);

-- Likes
create policy "likes_read_all" on public.post_likes for select using (true);
create policy "likes_manage_own" on public.post_likes
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- Saved posts
create policy "saved_read_own" on public.saved_posts
  for select using (auth.uid() = profile_id);
create policy "saved_manage_own" on public.saved_posts
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- Follows
create policy "follows_read_all" on public.follows for select using (true);
create policy "follows_manage_own" on public.follows
  for all using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

-- Connections
create policy "connections_read_participants" on public.connections
  for select using (auth.uid() = requester_id or auth.uid() = receiver_id);
create policy "connections_insert_requester" on public.connections
  for insert with check (auth.uid() = requester_id);
create policy "connections_update_participants" on public.connections
  for update using (auth.uid() = requester_id or auth.uid() = receiver_id)
  with check (auth.uid() = requester_id or auth.uid() = receiver_id);
create policy "connections_delete_participants" on public.connections
  for delete using (auth.uid() = requester_id or auth.uid() = receiver_id);

-- Community members
create policy "community_members_read_all" on public.community_members for select using (true);
create policy "community_members_join_self" on public.community_members
  for insert with check (auth.uid() = profile_id);
create policy "community_members_leave_self" on public.community_members
  for delete using (auth.uid() = profile_id);

-- Community posts
create policy "community_posts_read_all" on public.community_posts for select using (true);
create policy "community_posts_insert_member" on public.community_posts
  for insert with check (
    exists (
      select 1 from public.posts p
      where p.id = post_id and p.author_id = auth.uid()
    )
  );
create policy "community_posts_delete_own" on public.community_posts
  for delete using (
    exists (
      select 1 from public.posts p
      where p.id = post_id and p.author_id = auth.uid()
    )
  );

-- Notifications
create policy "notifications_read_own" on public.notifications
  for select using (auth.uid() = recipient_id);
create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);
