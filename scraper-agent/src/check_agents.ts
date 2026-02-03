
import * as dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load env from the root of scraper-agent
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

async function checkAgents() {
    console.log('Checking agents in DB...');
    const { data, error } = await supabase
        .from('scraped_agents')
        .select('id, full_name, primary_email, website_slug')
        .limit(10);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Found agents:');
    data.forEach(agent => {
        console.log(`- ${agent.full_name} (${agent.website_slug}): ${agent.primary_email}`);
    });
}

checkAgents();
