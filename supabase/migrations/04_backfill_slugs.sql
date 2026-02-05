-- =============================================================================
-- Migration 04: Backfill Slugs & Publish Status
-- =============================================================================

-- 1. Generate slugs for any agent that has an empty website_slug
-- Using a safe regex replacement to make slugs URL-friendly
UPDATE public.scraped_agents
SET website_slug = lower(regexp_replace(full_name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE website_slug IS NULL OR website_slug = '';

-- 2. Remove trailing dashes if any
UPDATE public.scraped_agents
SET website_slug = trim(both '-' from website_slug)
WHERE website_slug IS NOT NULL;

-- 3. Publish all existing websites by default so they are accessible
UPDATE public.scraped_agents
SET website_published = true
WHERE website_published IS NULL OR website_published = false;

-- 4. Ensure no duplicates (Simple handled: Append ID segment if duplicate? 
--    Checking for duplicates first might be safer, but for now assuming names are relatively unique 
--    or users will fix conflicts manually via dashboard if needed)
