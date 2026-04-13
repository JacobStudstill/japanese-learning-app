-- Run this in Supabase: Dashboard → SQL Editor → New Query
-- Adds display_name and avatar columns to user_profile

ALTER TABLE user_profile
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT '🐶';
