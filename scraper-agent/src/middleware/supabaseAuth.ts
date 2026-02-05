
import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || ''; // Verification can be done with anon key or service key

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY for auth middleware');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export interface AuthenticatedRequest extends Request {
    user?: any;
}

export const verifySupabaseUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ error: 'Missing authorization header' });
        }

        const token = authHeader.replace('Bearer ', '');

        // Verify token with Supabase Auth
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Optional: Check if user has specific role metadata if needed
        // For now, any valid user is considered a platform admin (since we control user creation)

        req.user = user;
        next();

    } catch (err) {
        console.error('Auth Middleware Error:', err);
        return res.status(500).json({ error: 'Internal auth error' });
    }
};
