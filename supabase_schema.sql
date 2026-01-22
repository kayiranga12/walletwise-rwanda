-- Clean up existing tables if they exist (Run this to reset your database for WalletWise)
-- WARNING: This will delete all data in these tables!
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.transactions;
DROP TABLE IF EXISTS public.savings_goals;
DROP TABLE IF EXISTS public.users;

-- Enable Row Level Security
alter table auth.users enable row level security;

-- 1. Create Users Table (public profile)
create table public.users (
  id uuid references auth.users(id) on delete cascade not null primary key,
  email text unique,
  username text,
  preferred_language text default 'en',
  profile_picture_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.users enable row level security;

create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.users
  for insert with check (auth.uid() = id);

-- Trigger to handle new user signup automatically
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, username)
  values (new.id, new.email, new.raw_user_meta_data->>'username');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. Create Savings Goals Table
create table public.savings_goals (
  id text not null primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text,
  target_amount decimal(10,2),
  current_amount decimal(10,2) default 0,
  deadline date,
  pet_avatar text,
  color_theme text,
  is_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.savings_goals enable row level security;

create policy "Users can view own goals" on public.savings_goals
  for select using (auth.uid() = user_id);

create policy "Users can insert own goals" on public.savings_goals
  for insert with check (auth.uid() = user_id);

create policy "Users can update own goals" on public.savings_goals
  for update using (auth.uid() = user_id);

create policy "Users can delete own goals" on public.savings_goals
  for delete using (auth.uid() = user_id);


-- 3. Create Transactions Table
create table public.transactions (
  id text not null primary key,
  goal_id text references public.savings_goals(id) on delete cascade not null,
  amount decimal(10,2),
  type text,
  note text,
  transaction_date timestamptz,
  synced boolean default true,
  created_at timestamptz default now()
);

alter table public.transactions enable row level security;

create policy "Users can view own transactions" on public.transactions
  for select using (
    goal_id in (select id from public.savings_goals where user_id = auth.uid())
  );

create policy "Users can insert own transactions" on public.transactions
  for insert with check (
    goal_id in (select id from public.savings_goals where user_id = auth.uid())
  );

create policy "Users can delete own transactions" on public.transactions
  for delete using (
    goal_id in (select id from public.savings_goals where user_id = auth.uid())
  );
