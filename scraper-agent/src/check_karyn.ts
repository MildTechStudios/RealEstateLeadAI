
import * as dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load env from the root of scraper-agent
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

async function checkSpecificAgent() {
    const slug = 'karyn-wynne';
    console.log(`Checking email for agent slug: ${slug}...`);

    const { data, error } = await supabase
        .from('scraped_agents')
        .select('id, full_name, primary_email, website_slug')
        .eq('website_slug', slug)
        .single();

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (data) {
        console.log('--- FOUND AGENT ---');
        console.log(`Name: ${data.full_name}`);
        console.log(`Email: ${data.primary_email}`);
        console.log('-------------------');
    } else {
        console.log('Agent not found.');
    }
}

checkSpecificAgent();
