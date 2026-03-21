-- Step 9: Trips and Membership SQL Migration

-- 1. Create the core explicit Trips table
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references auth.users on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create the Junction Table (Many-to-Many Mapping)
create table public.trip_members (
  trip_id uuid references public.trips on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (trip_id, user_id)
);

-- 3. Instigate Lock-Down via Row Level Security
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;

-- 4. Polices for Trip Memberships
create policy "Users can view their own memberships" on trip_members
  for select using (auth.uid() = user_id or public.is_admin());

create policy "Users can insert their own memberships" on trip_members
  for insert with check (auth.uid() = user_id or public.is_admin());

create policy "Users can update their own memberships" on trip_members
  for update using (auth.uid() = user_id or public.is_admin());

create policy "Users can delete their own memberships" on trip_members
  for delete using (auth.uid() = user_id or public.is_admin());

-- 5. Policies for Trips (Crucial: Users can ONLY see trips they are members of)
create policy "Users can view trips they are members of" on trips
  for select using (
    exists (
      select 1 from public.trip_members
      where trip_id = trips.id and user_id = auth.uid()
    ) or public.is_admin()
  );

create policy "Users can insert trips" on trips
  for insert with check (auth.uid() = created_by or public.is_admin());

create policy "Users can update trips they are owners or editors of" on trips
  for update using (
    exists (
      select 1 from public.trip_members
      where trip_id = trips.id and user_id = auth.uid() and role in ('owner', 'editor')
    ) or public.is_admin()
  );

create policy "Users can delete trips they own" on trips
  for delete using (
    exists (
      select 1 from public.trip_members
      where trip_id = trips.id and user_id = auth.uid() and role = 'owner'
    ) or public.is_admin()
  );
