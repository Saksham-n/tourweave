create table public.itineraries (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references public.trips on delete cascade not null unique,
  user_id uuid references auth.users on delete cascade not null,
  days jsonb not null default '[]'::jsonb,
  generated_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
alter table public.itineraries enable row level security;

-- Policies
create policy "Users can manage their own itineraries" on itineraries
  for all using (auth.uid() = user_id);
