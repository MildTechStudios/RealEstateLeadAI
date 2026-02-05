
import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase: any = null;

if (supabaseUrl && supabaseKey) {
    try {
        supabase = createClient(supabaseUrl, supabaseKey);
    } catch (e) {
        console.error('Failed to initialize Supabase client:', e);
    }
} else {
    console.warn('WARN: Missing SUPABASE_URL or SUPABASE_ANON_KEY. Auth middleware will block all requests.');
}

export interface AuthenticatedRequest extends Request {
    user?: any;
}

export const verifySupabaseUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // If Supabase isn't configured, block everything for safety
    if (!supabase) {
        console.error('Blocking request: Supabase not configured.');
        return res.status(500).json({ error: 'Server authentication misconfigured.' });
    }

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

        req.user = user;
        next();

    } catch (err) {
        console.error('Auth Middleware Error:', err);
        return res.status(500).json({ error: 'Internal auth error' });
    }
};
