import express from 'express';
import { getDb } from '../services/db';

export const publicRoutes = express.Router();

// Lookup Agent Slug by Custom Domain
publicRoutes.get('/lookup-domain', async (req, res) => {
    try {
        const supabase = getDb();
        if (!supabase) {
            return res.status(500).json({ error: 'Database connection failed' });
        }

        const { domain } = req.query;

        if (!domain) {
            return res.status(400).json({ error: 'Domain is required' });
        }

        console.log(`[API] Looking up domain: ${domain}`);

        // Search for agent with this custom domain in their config
        // Note: We use the arrow operator ->> to extract text from JSONB
        // effectively: WHERE website_config->>'custom_domain' = domain
        // BUT Supabase JS syntax is slightly different.

        // .contains('website_config', { custom_domain: domain }) is the robust way for JSONB check
        const { data, error } = await supabase
            .from('scraped_agents')
            .select('website_slug, website_published')
            .contains('website_config', { custom_domain: domain })
            .single();

        if (error || !data) {
            console.log(`[API] Domain not found: ${domain}`);
            return res.status(404).json({ error: 'Domain not found' });
        }

        if (!data.website_published) {
            console.log(`[API] Domain found but site not published: ${domain}`);
            return res.status(404).json({ error: 'Website not published' });
        }

        console.log(`[API] Resolved ${domain} -> ${data.website_slug}`);
        res.json({ slug: data.website_slug });

    } catch (err: any) {
        console.error('[API] Domain lookup error:', err);
        res.status(500).json({ error: 'Lookup failed' });
    }
});
