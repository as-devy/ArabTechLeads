-- Stage 3 project RLS. Apply after 0005_projects. Auth is enforced in Prisma
-- server actions; these policies protect any direct PostgREST access.

alter table public.projects enable row level security;
alter table public.project_roles enable row level security;
alter table public.project_members enable row level security;
alter table public.project_technologies enable row level security;
alter table public.project_invitations enable row level security;
alter table public.project_join_requests enable row level security;
alter table public.project_tasks enable row level security;
alter table public.project_task_comments enable row level security;
alter table public.project_discussions enable row level security;
alter table public.project_discussion_comments enable row level security;
alter table public.project_activity enable row level security;
alter table public.project_showcases enable row level security;
alter table public.github_accounts enable row level security;

create or replace function public.is_project_member(pid uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.project_members m
    where m.project_id = pid and m.profile_id = auth.uid()
  );
$$;

create policy "projects_select" on public.projects for select using (
  visibility = 'PUBLIC' or owner_id = auth.uid() or public.is_project_member(id)
);
create policy "projects_insert" on public.projects for insert with check (owner_id = auth.uid());
create policy "projects_update" on public.projects for update using (owner_id = auth.uid());
create policy "projects_delete" on public.projects for delete using (owner_id = auth.uid());

create policy "project_roles_select" on public.project_roles for select using (
  exists (select 1 from public.projects p where p.id = project_id and (p.visibility = 'PUBLIC' or p.owner_id = auth.uid() or public.is_project_member(p.id)))
);
create policy "project_roles_write" on public.project_roles for all using (
  exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
);

create policy "project_members_select" on public.project_members for select using (
  exists (select 1 from public.projects p where p.id = project_id and (p.visibility = 'PUBLIC' or p.owner_id = auth.uid() or public.is_project_member(p.id)))
);

create policy "project_tech_select" on public.project_technologies for select using (true);

create policy "invites_select" on public.project_invitations for select using (
  recipient_id = auth.uid() or sender_id = auth.uid()
    or exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
);

create policy "join_select" on public.project_join_requests for select using (
  profile_id = auth.uid()
    or exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
);

create policy "tasks_select" on public.project_tasks for select using (public.is_project_member(project_id));
create policy "discussions_select" on public.project_discussions for select using (
  exists (select 1 from public.projects p where p.id = project_id and (p.visibility = 'PUBLIC' or public.is_project_member(p.id)))
);
create policy "activity_select" on public.project_activity for select using (
  exists (select 1 from public.projects p where p.id = project_id and (p.visibility = 'PUBLIC' or public.is_project_member(p.id)))
);
create policy "showcases_select" on public.project_showcases for select using (true);
create policy "github_accounts_select" on public.github_accounts for select using (true);
create policy "github_accounts_write" on public.github_accounts for all using (profile_id = auth.uid());
