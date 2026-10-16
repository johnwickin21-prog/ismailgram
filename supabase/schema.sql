-- ============================================================
-- IsmailGram — Supabase Schema
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── PROFILES ───────────────────────────────────────────────
create table if not exists profiles (
  id           text primary key,          -- matches our app user.id
  username     text unique not null,
  name         text not null default '',
  bio          text not null default '',
  avatar_url   text not null default 'https://i.pravatar.cc/150?img=11',
  website      text not null default '',
  followers    integer not null default 0,
  following    integer not null default 0,
  posts_count  integer not null default 0,
  verified     boolean not null default false,
  is_private   boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ─── POSTS ──────────────────────────────────────────────────
create table if not exists posts (
  id           text primary key default ('p_' || gen_random_uuid()::text),
  user_id      text not null references profiles(id) on delete cascade,
  image_url    text not null,
  caption      text not null default '',
  location     text,
  audience     text not null default 'everyone',
  is_video     boolean not null default false,
  likes_count  integer not null default 0,
  created_at   timestamptz not null default now()
);

-- ─── LIKES ──────────────────────────────────────────────────
create table if not exists likes (
  id           uuid primary key default uuid_generate_v4(),
  user_id      text not null references profiles(id) on delete cascade,
  post_id      text not null references posts(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique(user_id, post_id)
);

-- ─── SAVES ──────────────────────────────────────────────────
create table if not exists saves (
  id           uuid primary key default uuid_generate_v4(),
  user_id      text not null references profiles(id) on delete cascade,
  post_id      text not null references posts(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique(user_id, post_id)
);

-- ─── COMMENTS ───────────────────────────────────────────────
create table if not exists comments (
  id           text primary key default ('c_' || gen_random_uuid()::text),
  user_id      text not null references profiles(id) on delete cascade,
  post_id      text not null references posts(id) on delete cascade,
  text         text not null,
  created_at   timestamptz not null default now()
);

-- ─── STORIES ────────────────────────────────────────────────
create table if not exists stories (
  id           text primary key default ('story_' || gen_random_uuid()::text),
  user_id      text not null references profiles(id) on delete cascade,
  image_url    text not null,
  seen_by      text[] not null default '{}',
  created_at   timestamptz not null default now()
);

-- ─── CONVERSATIONS ──────────────────────────────────────────
create table if not exists conversations (
  id           text primary key default ('conv_' || gen_random_uuid()::text),
  user1_id     text not null references profiles(id) on delete cascade,
  user2_id     text not null references profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique(user1_id, user2_id)
);

-- ─── MESSAGES ───────────────────────────────────────────────
create table if not exists messages (
  id           text primary key default ('msg_' || gen_random_uuid()::text),
  conv_id      text not null references conversations(id) on delete cascade,
  sender_id    text not null references profiles(id) on delete cascade,
  text         text not null,
  seen         boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ─── FOLLOWS ────────────────────────────────────────────────
create table if not exists follows (
  id           uuid primary key default uuid_generate_v4(),
  follower_id  text not null references profiles(id) on delete cascade,
  following_id text not null references profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique(follower_id, following_id)
);

-- ─── NOTIFICATIONS ──────────────────────────────────────────
create table if not exists notifications (
  id           text primary key default ('notif_' || gen_random_uuid()::text),
  user_id      text not null references profiles(id) on delete cascade,  -- recipient
  actor_id     text not null references profiles(id) on delete cascade,  -- who did the action
  type         text not null,   -- 'like' | 'comment' | 'follow' | 'mention'
  post_id      text references posts(id) on delete cascade,
  read         boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ─── INDEXES ────────────────────────────────────────────────
create index if not exists idx_posts_user_id on posts(user_id);
create index if not exists idx_posts_created_at on posts(created_at desc);
create index if not exists idx_likes_post_id on likes(post_id);
create index if not exists idx_likes_user_id on likes(user_id);
create index if not exists idx_saves_user_id on saves(user_id);
create index if not exists idx_comments_post_id on comments(post_id);
create index if not exists idx_stories_user_id on stories(user_id);
create index if not exists idx_stories_created_at on stories(created_at desc);
create index if not exists idx_messages_conv_id on messages(conv_id);
create index if not exists idx_messages_created_at on messages(created_at asc);
create index if not exists idx_notifications_user_id on notifications(user_id);
create index if not exists idx_follows_follower on follows(follower_id);
create index if not exists idx_follows_following on follows(following_id);

-- ─── DISABLE RLS (simple app, no Supabase Auth) ─────────────
alter table profiles disable row level security;
alter table posts disable row level security;
alter table likes disable row level security;
alter table saves disable row level security;
alter table comments disable row level security;
alter table stories disable row level security;
alter table conversations disable row level security;
alter table messages disable row level security;
alter table follows disable row level security;
alter table notifications disable row level security;

-- ─── STORAGE BUCKETS (run in Supabase Dashboard → Storage) ──
-- Create these buckets manually with PUBLIC access:
--   posts
--   stories
--   avatars
