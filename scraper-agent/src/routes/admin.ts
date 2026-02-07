import { Router } from 'express';
import { getDb } from '../services/db';
import multer from 'multer';
import { verifySupabaseUser } from '../middleware/supabaseAuth'; // Use the secure middleware

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Unified Admin Routes - reusing Supabase Auth
// Removed /login (insecure). Use Platform Login instead.

// GET CONFIG: GET /api/admin/config/:id
// Changed to accept ID parameter since we use centralized auth
router.get('/config/:id', verifySupabaseUser, async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDb();
        if (!db) return res.status(500).json({ error: 'Database not available' });

        const { data, error } = await db
            .from('scraped_agents')
            .select('website_config')
            .eq('id', id)
            .single();

        if (error) throw error;

        res.json(data?.website_config || {});
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE CONFIG: PATCH /api/admin/config/:id
router.patch('/config/:id', verifySupabaseUser, async (req, res) => {
    try {
        const { id } = req.params;

        // Ensure user has permission (Platform Admin can edit anyone)
        // const { id: userId } = req.user; 

        const updates = req.body;

        const db = getDb();
        if (!db) return res.status(500).json({ error: 'Database not available' });

        // Fetch existing config first to MERGE instead of overwrite
        const { data: existing, error: fetchError } = await db
            .from('scraped_agents')
            .select('website_config')
            .eq('id', id)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

        const currentConfig = existing?.website_config || {};
        const mergedConfig = { ...currentConfig, ...updates };

        console.log('[Admin] Updating config:', { updates, mergedConfig });

        const { error } = await db
            .from('scraped_agents')
            .update({
                website_config: mergedConfig,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;

        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// UPLOAD IMAGE: POST /api/admin/upload/:slug
// Need slug to organize folder
router.post('/upload/:slug', verifySupabaseUser, upload.single('file'), async (req, res) => {
    try {
        const { slug } = req.params;
        const file = req.file;

        console.log('Upload request received for:', slug);

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const db = getDb();
        if (!db) return res.status(500).json({ error: 'Database not available' });

        const fileExt = file.originalname.split('.').pop();
        const fileName = `${slug}/${Date.now()}.${fileExt}`;

        console.log('Uploading to Storage:', fileName);

        const { data, error } = await db
            .storage
            .from('agent-assets')
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: true
            });

        if (error) {
            console.error('Storage Upload Error:', error);
            throw error;
        }

        const { data: { publicUrl } } = db
            .storage
            .from('agent-assets')
            .getPublicUrl(fileName);

        console.log('Upload success:', publicUrl);
        res.json({ url: publicUrl });

    } catch (err: any) {
        console.error('Upload Endpoint Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// --- DOMAIN MANAGEMENT ROUTES ---
import { vercelService } from '../services/vercel';

// ADD DOMAIN: POST /api/admin/domains
router.post('/domains', verifySupabaseUser, async (req, res) => {
    try {
        const { domain } = req.body;
        if (!domain) return res.status(400).json({ error: 'Domain is required' });

        const result = await vercelService.addDomain(String(domain).trim());
        res.json(result);
    } catch (err: any) {
        console.error('Add domain error:', err.message);
        if (err.details) {
            return res.status(err.status || 400).json(err.details);
        }
        res.status(500).json({ error: err.message });
    }
});

// GET DOMAIN STATUS: GET /api/admin/domains/:domain
router.get('/domains/:domain', verifySupabaseUser, async (req, res) => {
    try {
        const { domain } = req.params;
        const result = await vercelService.getDomainStatus(String(domain).trim());
        res.json(result || { error: 'Domain not found' });
    } catch (err: any) {
        console.error('Get domain error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// VERIFY DOMAIN: POST /api/admin/domains/:domain/verify
router.post('/domains/:domain/verify', verifySupabaseUser, async (req, res) => {
    try {
        const { domain } = req.params;
        const result = await vercelService.verifyDomain(String(domain).trim());
        res.json(result);
    } catch (err: any) {
        console.error('Verify domain error:', err.message);
        if (err.details) {
            return res.status(err.status || 400).json(err.details);
        }
        res.status(500).json({ error: err.message });
    }
});

// DELETE DOMAIN: DELETE /api/admin/domains/:domain
router.delete('/domains/:domain', verifySupabaseUser, async (req, res) => {
    try {
        const { domain } = req.params;
        const result = await vercelService.removeDomain(String(domain).trim());
        res.json(result);
    } catch (err: any) {
        console.error('Remove domain error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// NOTIFY AGENT: POST /api/admin/notify-agent/:id
router.post('/notify-agent/:id', verifySupabaseUser, async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDb();
        if (!db) return res.status(500).json({ error: 'Database not available' });

        // 1. Fetch Agent Details
        const { data: agent, error } = await db
            .from('scraped_agents')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        // 2. Prepare Email Data
        // Determine live URL (Custom Domain or Subdirectory)
        const customDomain = agent.website_config?.custom_domain;
        const slug = agent.website_slug;

        // Base URL from env or default
        const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'; // Fallback for dev

        // If custom domain is set and working, use it? Or just always link to the platform wrapper?
        // Let's use the direct link logic similar to the frontend "Open Website" button
        const safeSlug = slug || id;
        const websiteUrl = customDomain
            ? `https://${customDomain}`
            : `${CLIENT_URL}/w/${safeSlug}`;

        const adminUrl = `${CLIENT_URL}/w/${safeSlug}/admin/login`;

        // Get default password from env or constant
        // Note: In a real app we might not send this if they've already logged in, 
        // but for this onboarding flow we assume it's their first time.
        const defaultPassword = process.env.DEFAULT_AGENT_PASSWORD || 'welcome123';

        // 3. Send Email
        const { sendWelcomeEmail } = await import('../services/email');
        const result = await sendWelcomeEmail({
            agentName: agent.full_name,
            agentEmail: agent.primary_email || agent.raw_profile?.email, // Fallback to raw profile email
            websiteUrl,
            adminUrl,
            defaultPassword
        });

        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }

        res.json({ success: true, id: result.id });

    } catch (err: any) {
        console.error('[Admin] Notify agent CRITICAL error:', err);
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// GET EMAILS: GET /api/admin/emails
router.get('/emails', verifySupabaseUser, async (req, res) => {
    try {
        console.log('[Admin] Fetching email logs (DB mode)...');
        const { getDb } = await import('../services/db');
        const db = getDb();

        if (!db) {
            console.error('[Admin] Database not initialized');
            return res.status(500).json({ error: 'Database not initialized' });
        }

        const { data, error } = await db
            .from('email_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('[Admin] DB Error fetching logs:', error);
            throw error;
        }

        console.log(`[Admin] Successfully fetched ${data?.length} logs`);
        res.json({ data: data || [] });

    } catch (err: any) {
        console.error('Fetch emails error:', err);
        res.status(500).json({ error: err.message });
    }
});

// TEST EMAIL: POST /api/admin/test-email
router.post('/test-email', verifySupabaseUser, async (req, res) => {
    try {
        const { resend } = await import('../services/email');
        const { getDb } = await import('../services/db');

        if (!resend) return res.status(500).json({ error: 'Resend not configured' });

        // Use the configured FROM email as the TO email for safety/testing
        // or allow user to specify if they are admin.
        // For now, let's send to a hardcoded safe address or the configured FROM address (if it's a real inbox)
        // Actually, let's send to 'onboarding@resend.dev' if in test mode, or the user's email?
        // Let's just send to "delivered@resend.dev" which is a magic address that always succeeds
        // OR better, send to the user who is logged in (if we had their email).
        // Let's use 'delivered@resend.dev' to guarantee a log entry.

        // Send actual email
        const { data: result, error } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
            to: 'delivered@resend.dev',
            subject: 'Test Email from Siteo Admin',
            html: '<p>This is a test email to verify logs.</p>'
        });

        if (error) throw error;

        // Log to DB explicitly here too (or rely on service if we used a shared function)
        const db = getDb();
        if (db) {
            await db.from('email_logs').insert({
                recipient: 'delivered@resend.dev',
                subject: 'Test Email from Siteo Admin',
                status: 'sent',
                resend_id: result?.id,
                created_at: new Date().toISOString()
            });
        }

        res.json({ success: true, id: result?.id });

    } catch (err: any) {
        console.error('Test email error:', err);

        // Log failure if possible
        try {
            const { getDb } = await import('../services/db');
            const db = getDb();
            if (db) {
                await db.from('email_logs').insert({
                    recipient: 'delivered@resend.dev',
                    subject: 'Test Email from Siteo Admin',
                    status: 'failed',
                    error_message: err.message,
                    created_at: new Date().toISOString()
                });
            }
        } catch (e) { }

        res.status(500).json({ error: err.message });
    }
});

export const adminRoutes = router;
