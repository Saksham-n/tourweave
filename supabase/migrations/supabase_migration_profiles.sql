-- Migration script to add extended fields to User Profiles

alter table public.profiles
  add column if not exists photo_url text,
  add column if not exists bio text,
  add column if not exists location text;

-- (Optional) If we want a stricter security policy later, we can add them here,
-- but the RLS policies from Step 1 already protect this entire table beautifully.
