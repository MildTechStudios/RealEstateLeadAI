import * as dotenv from 'dotenv';
// Using native fetch

dotenv.config();

const AUTH_TOKEN = process.env.VERCEL_AUTH_TOKEN;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const TEAM_ID = process.env.VERCEL_TEAM_ID;
const DOMAIN = 'aleppogrillbox.com';

console.log(`--- Checking Domain: ${DOMAIN} ---`);

async function checkDomain() {
    const headers = {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json',
    };

    let url = `https://api.vercel.com/v9/projects/${PROJECT_ID}/domains/${DOMAIN}`;
    if (TEAM_ID) url += `?teamId=${TEAM_ID}`;

    try {
        console.log(`GET ${url}`);
        const res = await fetch(url, { headers });

        if (res.ok) {
            const data = await res.json() as any;
            console.log('✅ Domain Found on Project!');
            console.log('Status:', JSON.stringify(data, null, 2));

            if (data.verified) {
                console.log('🎉 Domain is VERIFIED and ready.');
            } else {
                console.log('⚠️  Domain is NOT verified.');
                if (data.verification) {
                    console.log('Verification Errors:', data.verification);
                }
            }
        } else {
            console.log(`❌ Request Failed: ${res.status} ${res.statusText}`);
            const text = await res.text();
            console.log('Response:', text);

            if (res.status === 404) {
                console.log('The domain is NOT attached to this project yet.');
                console.log('Attempting to ADD it now...');
                await addDomain();
            }
        }
    } catch (e: any) {
        console.error('Network Error:', e.message);
    }
}

async function addDomain() {
    const headers = {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json',
    };

    let url = `https://api.vercel.com/v10/projects/${PROJECT_ID}/domains`;
    if (TEAM_ID) url += `?teamId=${TEAM_ID}`;

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({ name: DOMAIN })
        });

        const data = await res.json() as any;

        if (res.ok) {
            console.log('✅ Domain Added Successfully!');
            console.log('Result:', JSON.stringify(data, null, 2));
        } else {
            console.log(`❌ Failed to Add Domain: ${res.status}`);
            console.log('Error:', JSON.stringify(data, null, 2));

            if (data.error && data.error.code === 'domain_taken') {
                console.log('\n🚨 CONFLICT: This domain is used by another specific Vercel project.');
                console.log('You might need to add a TXT record to prove ownership.');
            }
        }
    } catch (e: any) {
        console.error('Network Error:', e.message);
    }
}

checkDomain();
