import fetch from 'node-fetch';
import { getDb } from './services/db';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
    // 1. Get a recent log to test with
    const db = getDb();
    if (!db) { console.error('DB not init'); return; };

    const { data: recentLog } = await db
        .from('email_logs')
        .select('*')
        .eq('status', 'sent')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (!recentLog) {
        console.error('No "sent" logs found to test with.');
        return;
    }

    console.log(`Found recent log for: ${recentLog.recipient} (ID: ${recentLog.resend_id})`);
    console.log('Current status:', recentLog.status);

    // 2. Simulate "Opened" Webhook
    const payload = {
        type: 'email.opened',
        created_at: new Date().toISOString(),
        data: {
            created_at: new Date().toISOString(),
            email_id: recentLog.resend_id,
            to: [recentLog.recipient],
            subject: recentLog.subject
        }
    };

    console.log('\nSending fake webhook payload to localhost...');

    try {
        const response = await fetch('http://localhost:3001/api/webhooks/resend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        console.log('Webhook Response:', result);

        // 3. Verify DB update
        const { data: updatedLog } = await db
            .from('email_logs')
            .select('*')
            .eq('id', recentLog.id)
            .single();

        console.log('\nUpdated Status:', updatedLog?.status);
        console.log(updatedLog?.status === 'opened' ? '✅ SUCCESS: Status updated to "opened"' : '❌ FAILED');

    } catch (err) {
        console.error('Request failed:', err);
    }
}

main();
