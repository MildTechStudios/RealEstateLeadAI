
import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env from the root of scraper-agent
dotenv.config({ path: path.join(__dirname, '../.env') });

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL;

async function testEmail() {
    console.log('Testing Email Configuration...');
    console.log('API Key:', process.env.RESEND_API_KEY ? 'Set' : 'Missing');
    console.log('From Email:', FROM_EMAIL);

    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL || 'onboarding@resend.dev',
            to: 'delivered@resend.dev', // Resend's test address that always succeeds if setup is correct
            subject: 'Test Email from Agent Scraper',
            html: '<p>If you see this, the configuration is correct!</p>'
        });

        if (error) {
            console.error('❌ Resend Error:', error);
        } else {
            console.log('✅ Email sent successfully!');
            console.log('ID:', data?.id);
        }

    } catch (err) {
        console.error('❌ Unexpected Error:', err);
    }
}

testEmail();
