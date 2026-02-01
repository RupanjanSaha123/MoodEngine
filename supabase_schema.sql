-- Create a table for storing tasks/memories
create table tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  content text not null,
  type text check (type in ('task', 'note', 'goal')) not null,
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table tasks enable row level security;

-- Policy: Users can only see their own tasks
create policy "Users can view own tasks"
  on tasks for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own tasks
create policy "Users can insert own tasks"
  on tasks for insert
  with check (auth.uid() = user_id);

-- Policy: Users can update their own tasks
create policy "Users can update own tasks"
  on tasks for update
  using (auth.uid() = user_id);

-- Policy: Users can delete their own tasks
create policy "Users can delete own tasks"
  on tasks for delete
  using (auth.uid() = user_id);
