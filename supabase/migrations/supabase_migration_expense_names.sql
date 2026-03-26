-- Name-based expense splitting (no auth.users FKs on ledger data)
-- Run after prior expense migration if upgrading: drops old auth-linked tables.

-- 0) Tear down previous expense schema (auth-based)
drop trigger if exists on_group_created_add_owner on public.groups;
drop function if exists public.handle_new_group_owner();
drop function if exists public.user_in_group(uuid);

drop table if exists public.expense_splits cascade;
drop table if exists public.expenses cascade;
drop table if exists public.settlements cascade;
drop table if exists public.group_members cascade;
drop table if exists public.participants cascade;
drop table if exists public.groups cascade;

-- 1) Ledger group: owner_user_id stores Supabase auth uid for RLS only (no FK to auth.users)
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'My split',
  owner_user_id uuid,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  name text not null,
  name_key text generated always as (lower(trim(name))) stored,
  constraint participants_name_nonempty check (char_length(trim(name)) > 0),
  unique (group_id, name_key)
);

create index participants_group_id_idx on public.participants (group_id);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  payer_name text not null,
  total_amount numeric(14, 2) not null check (total_amount > 0),
  split_type text not null check (split_type in ('equal', 'exact', 'percentage', 'shares')),
  description text,
  receipt_url text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index expenses_group_id_idx on public.expenses (group_id);
create index expenses_created_at_idx on public.expenses (created_at desc);

create table public.expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses (id) on delete cascade,
  participant_name text not null,
  amount_owed numeric(14, 2) not null check (amount_owed >= 0),
  name_key text generated always as (lower(trim(participant_name))) stored,
  unique (expense_id, name_key),
  constraint expense_splits_participant_nonempty check (char_length(trim(participant_name)) > 0)
);

create index expense_splits_expense_id_idx on public.expense_splits (expense_id);

create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  from_name text not null,
  to_name text not null,
  amount numeric(14, 2) not null check (amount > 0),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index settlements_group_id_idx on public.settlements (group_id);

-- 2) RLS helper — bypasses RLS on groups when checking ownership
create or replace function public.user_owns_group(gid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.groups g
    where g.id = gid
      and g.owner_user_id is not null
      and g.owner_user_id = auth.uid()
  );
$$;

grant execute on function public.user_owns_group(uuid) to authenticated;
grant execute on function public.user_owns_group(uuid) to service_role;

alter table public.groups enable row level security;
alter table public.participants enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.settlements enable row level security;

create policy "split_groups_select" on public.groups
  for select using (public.is_admin() or public.user_owns_group(id));

create policy "split_groups_insert" on public.groups
  for insert with check (
    public.is_admin()
    or (auth.uid() is not null and owner_user_id = auth.uid())
  );

create policy "split_groups_update" on public.groups
  for update using (public.is_admin() or public.user_owns_group(id));

create policy "split_groups_delete" on public.groups
  for delete using (public.is_admin() or public.user_owns_group(id));

create policy "participants_select" on public.participants
  for select using (public.is_admin() or public.user_owns_group(group_id));

create policy "participants_insert" on public.participants
  for insert with check (public.is_admin() or public.user_owns_group(group_id));

create policy "participants_update" on public.participants
  for update using (public.is_admin() or public.user_owns_group(group_id));

create policy "participants_delete" on public.participants
  for delete using (public.is_admin() or public.user_owns_group(group_id));

create policy "expenses_select" on public.expenses
  for select using (public.is_admin() or public.user_owns_group(group_id));

create policy "expenses_insert" on public.expenses
  for insert with check (public.is_admin() or public.user_owns_group(group_id));

create policy "expenses_update" on public.expenses
  for update using (public.is_admin() or public.user_owns_group(group_id));

create policy "expenses_delete" on public.expenses
  for delete using (public.is_admin() or public.user_owns_group(group_id));

create policy "expense_splits_select" on public.expense_splits
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.expenses e
      where e.id = expense_splits.expense_id and public.user_owns_group(e.group_id)
    )
  );

create policy "expense_splits_insert" on public.expense_splits
  for insert with check (
    public.is_admin()
    or exists (
      select 1 from public.expenses e
      where e.id = expense_splits.expense_id and public.user_owns_group(e.group_id)
    )
  );

create policy "expense_splits_update" on public.expense_splits
  for update using (
    public.is_admin()
    or exists (
      select 1 from public.expenses e
      where e.id = expense_splits.expense_id and public.user_owns_group(e.group_id)
    )
  );

create policy "expense_splits_delete" on public.expense_splits
  for delete using (
    public.is_admin()
    or exists (
      select 1 from public.expenses e
      where e.id = expense_splits.expense_id and public.user_owns_group(e.group_id)
    )
  );

create policy "settlements_select" on public.settlements
  for select using (public.is_admin() or public.user_owns_group(group_id));

create policy "settlements_insert" on public.settlements
  for insert with check (public.is_admin() or public.user_owns_group(group_id));

create policy "settlements_delete" on public.settlements
  for delete using (public.is_admin() or public.user_owns_group(group_id));

-- Private receipt objects (path stored in expenses.receipt_url)
insert into storage.buckets (id, name, public)
values ('expense-receipts', 'expense-receipts', false)
on conflict (id) do nothing;

drop policy if exists "Expense receipt read own prefix" on storage.objects;
drop policy if exists "Expense receipt upload own prefix" on storage.objects;
drop policy if exists "Expense receipt update own prefix" on storage.objects;
drop policy if exists "Expense receipt delete own prefix" on storage.objects;

create policy "Expense receipt read own prefix"
on storage.objects for select to authenticated
using (
  bucket_id = 'expense-receipts'
  and (
    public.is_admin()
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);

create policy "Expense receipt upload own prefix"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'expense-receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Expense receipt update own prefix"
on storage.objects for update to authenticated
using (
  bucket_id = 'expense-receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Expense receipt delete own prefix"
on storage.objects for delete to authenticated
using (
  bucket_id = 'expense-receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);
