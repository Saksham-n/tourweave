-- Migration script for Travel Pattern Analysis (DNA History)
create table public.travel_dna_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  snapshot jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.travel_dna_history enable row level security;

create policy "Users can view own DNA history" on travel_dna_history
  for select using (auth.uid() = user_id);

create policy "Users can insert own DNA history" on travel_dna_history
  for insert with check (auth.uid() = user_id);
