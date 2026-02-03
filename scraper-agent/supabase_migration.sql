-- Run this in your Supabase SQL Editor to add the missing columns for Office Phone and License Number

ALTER TABLE scraped_agents 
ADD COLUMN IF NOT EXISTS office_phone TEXT,
ADD COLUMN IF NOT EXISTS license_number TEXT;
