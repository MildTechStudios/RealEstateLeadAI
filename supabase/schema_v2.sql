-- =============================================================================
-- Schema V2: Complete Agent Profile Support
-- Run this in Supabase SQL Editor to update your table and ensure all columns exist
-- =============================================================================

-- 1. Ensure table exists with base columns
CREATE TABLE IF NOT EXISTS public.scraped_agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    brokerage TEXT,
    city TEXT,
    state TEXT,
    source_platform TEXT NOT NULL,
    source_url TEXT NOT NULL,
    primary_email TEXT,
    primary_phone TEXT,
    personal_website TEXT,
    brokerage_profile TEXT,
    linkedin_url TEXT,
    instagram_url TEXT,
    facebook_url TEXT,
    twitter_url TEXT,
    youtube_url TEXT,
    raw_profile JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add Missing Columns (Safe to run even if table exists)
ALTER TABLE public.scraped_agents ADD COLUMN IF NOT EXISTS headshot_url TEXT;
ALTER TABLE public.scraped_agents ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.scraped_agents ADD COLUMN IF NOT EXISTS brokerage_logo_url TEXT;
ALTER TABLE public.scraped_agents ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.scraped_agents ADD COLUMN IF NOT EXISTS office_name TEXT;
ALTER TABLE public.scraped_agents ADD COLUMN IF NOT EXISTS office_address TEXT;

-- 3. Indexes & Constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_scraped_agents_source_url 
ON public.scraped_agents(source_url);

-- 4. Permissions (Important: User reported "Table not found", which can be an RLS issue)
ALTER TABLE public.scraped_agents ENABLE ROW LEVEL SECURITY;

-- Allow anon/authenticated read access (for Dashboard)
CREATE POLICY "Public Read Access" ON public.scraped_agents
    FOR SELECT TO public USING (true);

-- Allow service_role full access (for Scraper API)
CREATE POLICY "Service Role Full Access" ON public.scraped_agents
    AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);
