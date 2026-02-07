-- Create a table to store email logs
create table if not exists email_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  recipient text not null,
  subject text not null,
  status text not null default 'sent', -- 'sent', 'delivered', 'failed'
  resend_id text, -- ID returned from Resend API
  error_message text
);

-- Enable Row Level Security (RLS)
alter table email_logs enable row level security;

-- Create a policy that allows everything for now (or restrict as needed)
-- For simplicity in this rough-in, allowing public read/write if anon key is used, 
-- but ideally should be restricted to service_role or authenticated users.
create policy "Allow all access" on email_logs for all using (true) with check (true);
