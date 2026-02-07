import express from 'express';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Initialize Stripe
// If key is missing, we'll handle it gracefully in the endpoint or let it throw
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    apiVersion: '2024-12-18.acacia', // Latest stable API version as of early 2025 (approx)
    typescript: true,
} as any);

// Initialize Supabase (Service Role for admin access)
const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
);

// POST /api/stripe/create-checkout-session
router.post('/create-checkout-session', async (req, res) => {
    try {
        const { leadId, returnUrl } = req.body;

        if (!leadId) {
            return res.status(400).json({ error: 'Missing leadId' });
        }

        if (!process.env.STRIPE_SECRET_KEY) {
            console.error('[Stripe] Missing STRIPE_SECRET_KEY');
            return res.status(500).json({ error: 'Payment system not configured (Missing Key)' });
        }

        // Get Lead info to personalize checkout
        const { data: lead, error } = await supabase
            .from('scraped_agents')
            .select('*')
            .eq('id', leadId)
            .single();

        if (error || !lead) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        console.log(`[Stripe] Creating checkout session for lead: ${lead.full_name} (${leadId})`);

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: process.env.STRIPE_PRICE_ID,
                    quantity: 1,
                },
            ],
            // Redirects
            success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}&success=true`,
            cancel_url: `${returnUrl}?canceled=true`,
            // Metadata for Webhook
            metadata: {
                leadId: leadId,
                slug: lead.slug,
                type: 'subscription_activation'
            },
            // Pre-fill email if available
            customer_email: lead.primary_email,
        });

        res.json({ url: session.url });

    } catch (err: any) {
        console.error('[Stripe] Error creating session:', err);
        res.status(500).json({ error: err.message });
    }
});

export { router as stripeRoutes };
