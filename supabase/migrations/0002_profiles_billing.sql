-- Profiles & Stripe billing state.
-- One row per auth.users user. Auto-created by trigger on signup.
-- The Stripe webhook (service-role key) is the only writer for plan/subscription columns.

create table public.profiles (
  id                     uuid        primary key references auth.users(id) on delete cascade,
  plan                   text        not null default 'free' check (plan in ('free','pro')),
  stripe_customer_id     text        unique,
  stripe_subscription_id text        unique,
  subscription_status    text,
  current_period_end     timestamptz,
  updated_at             timestamptz not null default now()
);

create index profiles_stripe_customer_idx on public.profiles (stripe_customer_id);

alter table public.profiles enable row level security;

-- Users can read their own profile. No INSERT/UPDATE/DELETE policies — only the
-- service-role key (used by the Stripe webhook) can write, by design.
create policy "profiles_select_own"
  on public.profiles for select using (auth.uid() = id);

-- Auto-create a profile row on signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill any existing users.
insert into public.profiles (id)
  select id from auth.users
  on conflict (id) do nothing;
