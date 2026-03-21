-- Migration script to create the Travel DNA database architecture

create table public.travel_dna (
  user_id uuid references auth.users on delete cascade not null primary key,
  budget text,
  travel_style text,
  interests jsonb default '[]'::jsonb,
  preferred_destinations jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Protect the highly sensitive DNA data via Row Level Security
alter table public.travel_dna enable row level security;

-- Policies
create policy "Users can view own travel DNA." on travel_dna
  for select using (auth.uid() = user_id);

create policy "Users can insert own travel DNA." on travel_dna
  for insert with check (auth.uid() = user_id);

create policy "Users can update own travel DNA." on travel_dna
  for update using (auth.uid() = user_id);
