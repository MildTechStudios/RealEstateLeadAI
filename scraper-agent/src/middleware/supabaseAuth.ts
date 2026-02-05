import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '../services/auth';

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
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ error: 'Missing authorization header' });
        }

        const token = authHeader.replace('Bearer ', '');

        // Strategy 1: Try Supabase Auth first (Platform Dashboard)
        if (supabase) {
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (user && !error) {
                req.user = user;
                return next();
            }
        }

        // Strategy 2: Try Agent JWT fallback (Agent Dashboard)
        const jwtPayload = verifyToken(token);
        if (jwtPayload && jwtPayload.agentId) {
            req.user = {
                id: jwtPayload.agentId,
                slug: jwtPayload.slug,
                role: 'agent'
            };
            return next();
        }

        // Neither worked
        return res.status(401).json({ error: 'Invalid or expired token' });

    } catch (err) {
        console.error('Auth Middleware Error:', err);
        return res.status(500).json({ error: 'Internal auth error' });
    }
};
