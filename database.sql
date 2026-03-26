-- ============================================
-- SPARKCHAT DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- supabase.com → your project → SQL Editor
-- ============================================

-- USERS TABLE
create table if not exists users (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  username text unique not null,
  password_hash text not null,
  avatar text default 'default',
  age integer not null,
  country text default 'India',
  language text default 'English',
  is_student boolean default false,
  college text,
  is_premium boolean default false,
  premium_expires_at timestamp,
  chats_today integer default 0,
  total_chats integer default 0,
  reputation_score integer default 100,
  is_banned boolean default false,
  created_at timestamp default now(),
  last_seen timestamp default now()
);

-- CHAT SESSIONS TABLE
create table if not exists chat_sessions (
  id uuid default gen_random_uuid() primary key,
  user1_id uuid references users(id),
  user2_id uuid references users(id),
  chat_type text not null, -- text, video, voice
  mode text not null,      -- debate, roast, quiz, opinion, random
  topic text,
  started_at timestamp default now(),
  ended_at timestamp,
  duration_seconds integer,
  status text default 'active' -- active, completed, skipped
);

-- MESSAGES TABLE
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references chat_sessions(id),
  sender_id uuid references users(id),
  content text not null,
  message_type text default 'text', -- text, reaction, system
  created_at timestamp default now()
);

-- RATINGS TABLE
create table if not exists ratings (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references chat_sessions(id),
  rater_id uuid references users(id),
  rated_id uuid references users(id),
  stars integer not null check (stars between 1 and 5),
  created_at timestamp default now()
);

-- REPORTS TABLE
create table if not exists reports (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references chat_sessions(id),
  reporter_id uuid references users(id),
  reported_id uuid references users(id),
  reason text not null,
  status text default 'pending', -- pending, reviewed, actioned
  created_at timestamp default now()
);

-- PAYMENTS TABLE
create table if not exists payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id),
  razorpay_order_id text unique,
  razorpay_payment_id text,
  amount integer not null,
  currency text default 'INR',
  plan text not null, -- spark_pro, pro_plus
  status text default 'pending', -- pending, success, failed
  created_at timestamp default now()
);

-- ONLINE USERS (real-time tracking)
create table if not exists online_users (
  user_id uuid references users(id) primary key,
  socket_id text,
  status text default 'online', -- online, waiting, chatting
  chat_type text,
  mode text,
  country text,
  language text,
  updated_at timestamp default now()
);

-- Enable Row Level Security
alter table users enable row level security;
alter table messages enable row level security;
alter table ratings enable row level security;
alter table reports enable row level security;
alter table payments enable row level security;

-- Policies (users can read their own data)
create policy "Users can view own profile" on users
  for select using (auth.uid()::text = id::text);

create policy "Public online count" on online_users
  for select using (true);

-- Realtime (enable for messages)
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table online_users;
