-- =============================================================================
-- Schema for Agent Scraper "Leads Management System"
-- =============================================================================

-- 1. Create the scraped_agents table
CREATE TABLE IF NOT EXISTS public.scraped_agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Identity
    full_name TEXT NOT NULL,
    brokerage TEXT,
    
    -- Location
    city TEXT,
    state TEXT,
    
    -- Source Tracking (Unique Constraint to prevent duplicates)
    source_platform TEXT NOT NULL,
    source_url TEXT NOT NULL,
    
    -- Contact Info
    primary_email TEXT,
    primary_phone TEXT,
    
    -- Online Presence
    personal_website TEXT,
    brokerage_profile TEXT,
    
    -- Socials
    linkedin_url TEXT,
    instagram_url TEXT,
    facebook_url TEXT,
    twitter_url TEXT,
    youtube_url TEXT,
    
    -- Metadata / Future Proofing
    -- We store the entire JSON object here so we don't lose any extracted fields 
    -- even if we haven't made a column for them yet (like logos, bio, etc.)
    raw_profile JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create a unique index on source_url for the UPSERT logic to work
CREATE UNIQUE INDEX IF NOT EXISTS idx_scraped_agents_source_url 
ON public.scraped_agents(source_url);

-- 3. Enable Row Level Security (RLS) - Optional but recommended
ALTER TABLE public.scraped_agents ENABLE ROW LEVEL SECURITY;

-- 4. Create a policy that allows the Service Role (API) to do everything
-- Note: Service Role bypasses RLS anyway, but this is good practice if using Anon key later
CREATE POLICY "Enable all access for service role" ON public.scraped_agents
    AS PERMISSIVE FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 5. Create a policy for public read access (if you want the dashboard to work with Anon key)
-- ideally we'd restrict this, but for this local tool, we'll allow read
CREATE POLICY "Enable read access for all users" ON public.scraped_agents
    FOR SELECT
    TO public
    USING (true);
