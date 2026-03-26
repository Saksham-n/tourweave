  -- Step 1. Expand public.trips table
  alter table public.trips 
  add column if not exists destination text,
  add column if not exists start_date date,
  add column if not exists end_date date;

  -- Step 2. Create Itinerary Items table (DROP first for a clean state)
  drop table if exists public.itinerary_items cascade;
  create table public.itinerary_items (
    id uuid primary key default gen_random_uuid(),
    trip_id uuid references public.trips on delete cascade not null,
    title text not null,
    description text,
    location_name text,
    latitude double precision,
    longitude double precision,
    date date,
    time time,
    added_by uuid references auth.users on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
  );

  -- Step 3. Enable RLS
  alter table public.itinerary_items enable row level security;

  -- Step 4. RLS Policies for Itinerary Items

  -- 4.1. Select: Members of the trip can view itinerary items
  drop policy if exists "Users can view itinerary items for trips they are members of" on itinerary_items;
  create policy "Users can view itinerary items for trips they are members of" on itinerary_items
    for select using (
      exists (
        select 1 from public.trip_members
        where trip_id = itinerary_items.trip_id and user_id = auth.uid()
      ) or public.is_admin()
    );

  -- 4.2. Insert: Members of the trip can add itinerary items
  drop policy if exists "Users can add itinerary items to trips they are members of" on itinerary_items;
  create policy "Users can add itinerary items to trips they are members of" on itinerary_items
    for insert with check (
      exists (
        select 1 from public.trip_members
        where trip_id = itinerary_items.trip_id and user_id = auth.uid()
      ) or public.is_admin()
    );

  -- 4.3. Update: Owners/Editors of the trip OR the person who added the item can update
  drop policy if exists "Owners, editors, or creators can update itinerary items" on itinerary_items;
  create policy "Owners, editors, or creators can update itinerary items" on itinerary_items
    for update using (
      exists (
        select 1 from public.trip_members
        where trip_id = itinerary_items.trip_id and user_id = auth.uid() and role in ('owner', 'editor')
      ) or auth.uid() = added_by or public.is_admin()
    );

  -- 4.4. Delete: Owners/Editors of the trip OR the person who added the item can delete
  drop policy if exists "Owners, editors, or creators can delete itinerary items" on itinerary_items;
  create policy "Owners, editors, or creators can delete itinerary items" on itinerary_items
    for delete using (
      exists (
        select 1 from public.trip_members
        where trip_id = itinerary_items.trip_id and user_id = auth.uid() and role in ('owner', 'editor')
      ) or auth.uid() = added_by or public.is_admin()
    );

  -- Step 5. Realtime configuration
  -- Enable realtime for itinerary_items
  do $$
  begin
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'itinerary_items') then
      alter publication supabase_realtime add table public.itinerary_items;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'trips') then
      alter publication supabase_realtime add table public.trips;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'trip_members') then
      alter publication supabase_realtime add table public.trip_members;
    end if;
  end $$;

  -- Force PostgREST to reload the schema cache
  NOTIFY pgrst, 'reload schema';
