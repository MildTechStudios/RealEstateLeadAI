
import { Router } from 'express';
import { getLeadBySlug, getLeadById, updateLead, getAgentBySlug } from '../services/db';
import { hashPassword, verifyPassword, generateToken, verifyToken } from '../services/auth';

const router = Router();

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const { slug, password } = req.body;

        console.log(`[Auth] Login attempt for slug: ${slug}`);

        if (!slug || !password) {
            return res.status(400).json({ error: 'Missing slug or password' });
        }

        // 1. Find Agent (Auth lookup - ignores published status)
        const { data: agent, error } = await getAgentBySlug(slug);

        if (error || !agent) {
            console.warn(`[Auth] Login failed: Agent not found for slug '${slug}'`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // 2. Verify Password
        let isValid = false;

        if (agent.password_hash) {
            isValid = await verifyPassword(password, agent.password_hash);
        } else {
            // Lazy Seeding: If no hash, check if they are using the default "welcome123"
            // If so, grant access AND save the hash for future.
            console.log(`[Auth] Agent ${slug} has no password hash. Checking default credentials...`);

            // Use environment variable for default password (set in .env)
            const defaultPassword = process.env.DEFAULT_AGENT_PASSWORD || 'changeme';

            if (password === defaultPassword) {
                console.log(`[Auth] Default password accepted. Migrating agent ${slug} to secure hash...`);
                const newHash = await hashPassword(password);

                // Save to DB in background (await to be safe)
                await updateLead(agent.id, { password_hash: newHash });
                isValid = true;
            } else {
                console.warn(`[Auth] Agent ${slug} has no hash and provided wrong default password.`);
                isValid = false;
            }
        }

        if (!isValid) {
            console.warn(`[Auth] Login failed: Password mismatch for ${slug}`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log(`[Auth] Login success for ${slug}`);

        // 3. Generate Token
        const token = generateToken(agent.id, agent.website_slug);

        // 4. Return
        res.json({ token, agent: { id: agent.id, name: agent.full_name, slug: agent.website_slug } });

    } catch (err) {
        console.error('[Auth] Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// CHANGE PASSWORD
router.post('/change-password', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const { newPassword } = req.body;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const token = authHeader.split(' ')[1];
        const payload = verifyToken(token);

        if (!payload || !payload.agentId) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Hash new password
        const hashedPassword = await hashPassword(newPassword);

        // Update DB
        const result = await updateLead(payload.agentId, { password_hash: hashedPassword } as any); // Cast because DB types might not include password_hash yet in TS definition if we didn't update types file

        if (!result.success) {
            throw new Error(result.error);
        }

        res.json({ success: true, message: 'Password updated successfully' });

    } catch (err) {
        console.error('[Auth] Change password error:', err);
        res.status(500).json({ error: 'Failed to update password' });
    }
});

// VERIFY TOKEN (Optional: to check if session is valid on load)
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const token = authHeader.split(' ')[1];
        const payload = verifyToken(token);
        if (!payload) return res.status(401).json({ error: 'Invalid token' });

        res.json({ valid: true, agentId: payload.agentId });
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

export default router;
