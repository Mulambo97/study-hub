-- One row per learner: their whole study-hub state as JSON.
create table if not exists public.progress (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  state      jsonb not null,
  updated_ms bigint not null,
  updated_at timestamptz not null default now()
);

alter table public.progress enable row level security;

drop policy if exists "read own progress" on public.progress;
create policy "read own progress" on public.progress
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "insert own progress" on public.progress;
create policy "insert own progress" on public.progress
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "update own progress" on public.progress;
create policy "update own progress" on public.progress
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.progress from anon;
grant select, insert, update on public.progress to authenticated;
