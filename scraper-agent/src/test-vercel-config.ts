import * as dotenv from 'dotenv';
// Using native fetch

dotenv.config();

const AUTH_TOKEN = process.env.VERCEL_AUTH_TOKEN;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const TEAM_ID = process.env.VERCEL_TEAM_ID;

console.log('--- Vercel Configuration Check ---');
console.log(`Token: ${AUTH_TOKEN ? 'Present' : 'MISSING'}`);
console.log(`Project ID: ${PROJECT_ID}`);
console.log(`Team ID: ${TEAM_ID || '(None provided)'}`);
console.log('----------------------------------');

async function check() {
    if (!AUTH_TOKEN) {
        console.error('ERROR: No Auth Token found.');
        return;
    }

    const headers = {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json',
    };

    // 1. Check User/Token Identity
    try {
        console.log('\n1. Checking Token Identity...');
        const userRes = await fetch('https://api.vercel.com/v2/user', { headers });
        const userData = await userRes.json() as any;

        if (userRes.ok) {
            console.log(`   Logged in as: ${userData.user.username} (${userData.user.email})`);
        } else {
            console.error('   FAILED to get user:', userData);
        }
    } catch (e: any) {
        console.error('   Network Error checking user:', e.message);
    }

    // 2. Check Project Access
    try {
        console.log('\n2. Checking Project Access...');
        let url = `https://api.vercel.com/v9/projects/${PROJECT_ID}`;
        if (TEAM_ID) url += `?teamId=${TEAM_ID}`;

        const projRes = await fetch(url, { headers });

        if (projRes.ok) {
            const projData = await projRes.json() as any;
            console.log(`   ✅ SUCCESS! Found Project: "${projData.name}"`);
            console.log(`   Project ID matches: ${projData.id}`);
        } else {
            console.error(`   ❌ FAILED to find project. Status: ${projRes.status}`);
            const err = await projRes.json() as any;
            console.error('   Error Details:', JSON.stringify(err, null, 2));

            if (projRes.status === 404 && !TEAM_ID) {
                console.log('\n   ⚠️  HINT: You might need a VERCEL_TEAM_ID if this project belongs to a team.');

                // Try to list teams
                console.log('   Checking available teams...');
                const teamsRes = await fetch('https://api.vercel.com/v2/teams', { headers });
                if (teamsRes.ok) {
                    const teamsData = await teamsRes.json() as any;
                    if (teamsData.teams && teamsData.teams.length > 0) {
                        console.log('   Found these Teams (One of these IDs might be needed):');
                        teamsData.teams.forEach((t: any) => {
                            console.log(`   - Name: ${t.name}, ID: ${t.id}`);
                        });
                    } else {
                        console.log('   No teams found on this account.');
                    }
                }
            }
        }
    } catch (e: any) {
        console.error('   Network Error checking project:', e.message);
    }
}

check();
