
import dotenv from 'dotenv';
dotenv.config();

const AUTH_TOKEN = process.env.VERCEL_AUTH_TOKEN;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const TEAM_ID = process.env.VERCEL_TEAM_ID;
const domain = 'aleppogrillbox.com';

console.log(`--- Checking Domain: ${domain} ---`);

async function checkDomain() {
    const headers = {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json',
    };

    const url = `https://api.vercel.com/v9/projects/${PROJECT_ID}/domains/${domain}?teamId=${TEAM_ID}`;

    try {
        console.log(`GET ${url}`);
        const res = await fetch(url, { headers });
        const data = await res.json() as any;

        console.log('Status:', res.status);

        if (res.ok) {
            console.log('Verified:', data.verified);
            if (!data.verified) {
                console.log('Verification Info:', JSON.stringify(data.verification, null, 2));

                // Trigger Verify
                console.log('\n--- Triggering Verification ---');
                const verifyUrl = `https://api.vercel.com/v9/projects/${PROJECT_ID}/domains/${domain}/verify?teamId=${TEAM_ID}`;
                const vRes = await fetch(verifyUrl, { method: 'POST', headers });
                const vData = await vRes.json();
                console.log('Verify Result:', vRes.status);
                console.log('Verify Data:', JSON.stringify(vData, null, 2));
            } else {
                console.log('✅ Domain is verified!');
            }
        } else {
            console.log('Error:', JSON.stringify(data, null, 2));
        }

    } catch (error: any) {
        console.error('Fetch Error:', error.message);
    }
}

checkDomain();
