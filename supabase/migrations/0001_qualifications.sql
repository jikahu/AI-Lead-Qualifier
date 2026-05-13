-- One row per lead the user submits.
-- The pending row is inserted by the Next.js API route (anon key + RLS),
-- and the result is written back by the Trigger.dev task using the service-role key (bypasses RLS).
create table public.qualifications (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  run_id        text        not null unique,
  status        text        not null check (status in ('pending','completed','failed')),
  input         jsonb       not null,
  result        jsonb,
  error         text,
  created_at    timestamptz not null default now(),
  completed_at  timestamptz
);

create index qualifications_user_created_idx
  on public.qualifications (user_id, created_at desc);

alter table public.qualifications enable row level security;

create policy "qualifications_select_own"
  on public.qualifications for select using (auth.uid() = user_id);

create policy "qualifications_insert_own"
  on public.qualifications for insert with check (auth.uid() = user_id);
