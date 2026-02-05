import { Router } from 'express';
import { getDb } from '../services/db';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth';
import multer from 'multer';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret_do_not_use_in_prod';
const DEFAULT_PASSWORD = 'welcome123'; // Simple default for V1
const upload = multer({ storage: multer.memoryStorage() });

// LOGIN: POST /api/admin/login
router.post('/login', async (req, res) => {
    const { slug, password } = req.body;

    if (!slug || !password) {
        return res.status(400).json({ error: 'Slug and password are required' });
    }

    try {
        // 1. Fetch agent by slug
        const db = getDb();
        if (!db) return res.status(500).json({ error: 'Database not available' });

        const { data: agent, error } = await db
            .from('scraped_agents')
            .select('id, website_slug, auth_password_hash')
            .eq('website_slug', slug)
            .single();

        if (error || !agent) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // 2. Validate Password
        // V1 Logic: If auth_password_hash is null, check against DEFAULT_PASSWORD
        // If it's set, we would usually compare hash (e.g. bcrypt).
        // For this iteration, we'll keep it simple: Real DB hash check can be added later if needed,
        // but for now we assume they use the default unless we implement a "change password" flow.
        const isValid = password === DEFAULT_PASSWORD;

        // TODO: In V2, verify hash using bcrypt if agent.auth_password_hash is present
        // const isValid = agent.auth_password_hash 
        //    ? await bcrypt.compare(password, agent.auth_password_hash)
        //    : password === DEFAULT_PASSWORD;

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // 3. Generate Token
        const token = jwt.sign(
            { id: agent.id, slug: agent.website_slug },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, slug: agent.website_slug });

    } catch (err: any) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET CONFIG: GET /api/admin/config
router.get('/config', authenticateToken, async (req, res) => {
    try {
        const { id } = req.user!;
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

// UPDATE CONFIG: PATCH /api/admin/config
router.patch('/config', authenticateToken, async (req, res) => {
    try {
        const { id } = req.user!;
        const updates = req.body; // Expect JSON object with theme/content keys

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

// UPLOAD IMAGE: POST /api/admin/upload
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        const { slug } = req.user!;

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
router.post('/domains', authenticateToken, async (req, res) => {
    try {
        const { domain } = req.body;
        if (!domain) return res.status(400).json({ error: 'Domain is required' });

        const result = await vercelService.addDomain(String(domain).trim());
        res.json(result);
    } catch (err: any) {
        console.error('Add domain error:', err.message);
        // If we have Vercel error details (like verification challenge), pass them along
        if (err.details) {
            return res.status(err.status || 400).json(err.details);
        }
        res.status(500).json({ error: err.message });
    }
});

// GET DOMAIN STATUS: GET /api/admin/domains/:domain
router.get('/domains/:domain', authenticateToken, async (req, res) => {
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
router.post('/domains/:domain/verify', authenticateToken, async (req, res) => {
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
router.delete('/domains/:domain', authenticateToken, async (req, res) => {
    try {
        const { domain } = req.params;
        const result = await vercelService.removeDomain(String(domain).trim());
        res.json(result);
    } catch (err: any) {
        console.error('Remove domain error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

export const adminRoutes = router;
