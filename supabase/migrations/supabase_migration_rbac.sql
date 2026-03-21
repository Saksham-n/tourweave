-- Step 7: Role-Based Access Control Migration

-- 1. Add role column to profiles
alter table public.profiles
  add column if not exists role text default 'user';

-- 2. Create a secure function to check admin status
-- We use 'security definer' to bypass RLS during the role check to avoid infinite recursion loops,
-- but we must set the search_path for safety.
create or replace function public.is_admin()
returns boolean as $$
declare
  is_admin boolean;
begin
  select (role = 'admin') into is_admin
  from public.profiles
  where id = auth.uid();
  
  return coalesce(is_admin, false);
end;
$$ language plpgsql security definer set search_path = public;

-- 3. Automatically grant Admins completely unrestricted access to both tables!
-- (PostgreSQL evaluates multiple policies on the same table using OR logic)

-- Profiles Admin Overrides
create policy "Admins can view all profiles" on profiles
  for select using (public.is_admin());

create policy "Admins can insert all profiles" on profiles
  for insert with check (public.is_admin());

create policy "Admins can update all profiles" on profiles
  for update using (public.is_admin());

create policy "Admins can delete all profiles" on profiles
  for delete using (public.is_admin());

-- Travel DNA Admin Overrides
create policy "Admins can view all travel DNA" on travel_dna
  for select using (public.is_admin());

create policy "Admins can insert all travel DNA" on travel_dna
  for insert with check (public.is_admin());

create policy "Admins can update all travel DNA" on travel_dna
  for update using (public.is_admin());

create policy "Admins can delete all travel DNA" on travel_dna
  for delete using (public.is_admin());
