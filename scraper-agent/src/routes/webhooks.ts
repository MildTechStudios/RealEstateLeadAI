import { Router } from 'express';
import { getDb } from '../services/db';

const router = Router();

// Handle Resend Webhooks
// POST /api/webhooks/resend
router.post('/resend', async (req, res) => {
    try {
        const event = req.body;

        // Resend sends an event object like:
        // { type: 'email.sent', data: { created_at, email_id, to, subject, ... } }
        // { type: 'email.opened', data: { created_at, email_id, ... } }

        const type = event.type;
        const data = event.data;

        if (!type || !data || !data.email_id) {
            return res.status(400).json({ error: 'Invalid webhook payload' });
        }

        console.log(`[Webhook] Received Resend event: ${type} for ${data.email_id}`);

        const db = getDb();
        if (!db) {
            console.error('[Webhook] DB not available');
            return res.status(500).json({ error: 'Database unavailable' });
        }

        // Map Resend event types to our status
        let status = 'sent';
        switch (type) {
            case 'email.sent': status = 'sent'; break;
            case 'email.delivered': status = 'delivered'; break;
            case 'email.delivery_delayed': status = 'delivery_delayed'; break;
            case 'email.complained': status = 'complained'; break;
            case 'email.bounced': status = 'bounced'; break;
            case 'email.suppressed': status = 'bounced'; break; // Treat suppression as bounce
            case 'email.opened': status = 'opened'; break;
            case 'email.clicked': status = 'clicked'; break;
            default: status = 'sent'; // active/unknown
        }

        // We only want to update if the new status is "more significant" or just always update?
        // Usually, we just want the latest status.
        // 'opened' is better than 'delivered'. 'clicked' is better than 'opened'.

        // Update the log entry by resend_id
        const { error } = await db
            .from('email_logs')
            .update({
                status: status,
                // optionally track open_count or last_event_at
            })
            .eq('resend_id', data.email_id);

        if (error) {
            console.error('[Webhook] Failed to update log:', error);
            return res.status(500).json({ error: error.message });
        }

        res.json({ success: true });

    } catch (err: any) {
        console.error('[Webhook] Error:', err);
        res.status(500).json({ error: err.message });
    }
});

export const webhookRoutes = router;
