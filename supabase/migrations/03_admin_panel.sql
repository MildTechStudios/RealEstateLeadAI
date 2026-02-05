-- =============================================================================
-- Schema V3: Admin Panel & Website Customization
-- Run this in Supabase SQL Editor to add admin panel support
-- =============================================================================

-- 1. Add authentication column for agent passwords
ALTER TABLE public.scraped_agents ADD COLUMN IF NOT EXISTS auth_password_hash TEXT;

-- 2. Add website configuration column (stores theme/content overrides)
ALTER TABLE public.scraped_agents ADD COLUMN IF NOT EXISTS website_config JSONB DEFAULT '{}'::jsonb;

-- 3. Add office_phone and license_number if missing (for completeness)
ALTER TABLE public.scraped_agents ADD COLUMN IF NOT EXISTS office_phone TEXT;
ALTER TABLE public.scraped_agents ADD COLUMN IF NOT EXISTS license_number TEXT;

-- 4. Add website_slug and website_published if missing
ALTER TABLE public.scraped_agents ADD COLUMN IF NOT EXISTS website_slug TEXT;
ALTER TABLE public.scraped_agents ADD COLUMN IF NOT EXISTS website_published BOOLEAN DEFAULT false;

-- 5. Create unique index on website_slug (only if not null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_scraped_agents_website_slug 
ON public.scraped_agents(website_slug) WHERE website_slug IS NOT NULL;

-- 6. Grant update permissions for authenticated users (for admin edits)
-- Note: We use service_role for API, but this is good practice
DROP POLICY IF EXISTS "Allow updates via service role" ON public.scraped_agents;
CREATE POLICY "Allow updates via service role" ON public.scraped_agents
    FOR UPDATE TO service_role USING (true) WITH CHECK (true);
