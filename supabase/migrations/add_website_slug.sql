-- Migration: Add website configuration columns to scraped_agents
-- Run this in your Supabase SQL Editor

ALTER TABLE scraped_agents
ADD COLUMN IF NOT EXISTS website_slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS website_published BOOLEAN DEFAULT false;

-- Create index for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_scraped_agents_slug ON scraped_agents(website_slug);

-- Function to generate slug from name
CREATE OR REPLACE FUNCTION generate_agent_slug(name TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN LOWER(REGEXP_REPLACE(TRIM(name), '[^a-zA-Z0-9]+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;
