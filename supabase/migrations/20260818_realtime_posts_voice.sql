-- Enable Supabase Realtime for feed + voice listing.
-- Safe to re-run.

alter table public.voice_rooms enable row level security;
alter table public.voice_room_members enable row level security;
alter table public.voice_room_invites enable row level security;

drop policy if exists "voice_rooms_read_all" on public.voice_rooms;
create policy "voice_rooms_read_all" on public.voice_rooms for select using (true);

drop policy if exists "voice_room_members_read_all" on public.voice_room_members;
create policy "voice_room_members_read_all" on public.voice_room_members for select using (true);

drop policy if exists "voice_room_invites_read_all" on public.voice_room_invites;
create policy "voice_room_invites_read_all" on public.voice_room_invites for select using (true);

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'posts',
    'comments',
    'post_likes',
    'voice_rooms',
    'voice_room_members',
    'voice_room_invites'
  ]
  loop
    if exists (
      select 1
      from information_schema.tables
      where table_schema = 'public' and table_name = tbl
    ) and not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = tbl
    ) then
      execute format('alter publication supabase_realtime add table public.%I', tbl);
    end if;
  end loop;
end $$;
