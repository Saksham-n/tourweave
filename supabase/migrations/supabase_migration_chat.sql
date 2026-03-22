-- Chat Assistant Migration: Conversations and Messages Tables
-- This migration creates the database schema for the TourWeave Chat Assistant feature

-- 1. Create conversations table
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  title text not null default 'New Conversation',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create messages table
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable Row Level Security on both tables
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- 4. Create RLS policies for conversations table
create policy "Users can view own conversations" on conversations
  for select using (auth.uid() = user_id);

create policy "Users can insert own conversations" on conversations
  for insert with check (auth.uid() = user_id);

create policy "Users can update own conversations" on conversations
  for update using (auth.uid() = user_id);

create policy "Users can delete own conversations" on conversations
  for delete using (auth.uid() = user_id);

-- 5. Create RLS policies for messages table
create policy "Users can view messages in own conversations" on messages
  for select using (
    exists (
      select 1 from public.conversations
      where id = messages.conversation_id and user_id = auth.uid()
    )
  );

create policy "Users can insert messages in own conversations" on messages
  for insert with check (
    exists (
      select 1 from public.conversations
      where id = messages.conversation_id and user_id = auth.uid()
    )
  );

-- 6. Create function to update conversation timestamp on new message
create or replace function public.update_conversation_timestamp()
returns trigger as $$
begin
  update public.conversations
  set updated_at = timezone('utc'::text, now())
  where id = NEW.conversation_id;
  return NEW;
end;
$$ language plpgsql security definer;

-- 7. Create trigger to auto-update conversation timestamp
create trigger on_message_created
  after insert on public.messages
  for each row execute procedure public.update_conversation_timestamp();

-- 8. Create indexes for better performance
create index idx_conversations_user_id on public.conversations(user_id);
create index idx_conversations_updated_at on public.conversations(updated_at desc);
create index idx_messages_conversation_id on public.messages(conversation_id);
create index idx_messages_created_at on public.messages(created_at);

-- Migration complete: Chat Assistant feature ready for use