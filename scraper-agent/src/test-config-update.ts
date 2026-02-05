
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testUpdateConfig() {
    console.log('Testing config update...');

    // 1. Get the agent
    const { data: agent, error: findError } = await supabase
        .from('scraped_agents')
        .select('id, website_config')
        .eq('website_slug', 'karyn-wynne')
        .single();

    if (findError || !agent) {
        console.error('Agent not found:', findError);
        return;
    }

    console.log('Current Config:', agent.website_config);

    // 2. Mock update like the endpoint does
    const updates = { custom_domain: 'aleppogrillbox.com' };
    const currentConfig = agent.website_config || {};
    const mergedConfig = { ...currentConfig, ...updates };

    console.log('Merged Config to save:', mergedConfig);

    const { error: updateError } = await supabase
        .from('scraped_agents')
        .update({
            website_config: mergedConfig,
            updated_at: new Date().toISOString()
        })
        .eq('id', agent.id);

    if (updateError) {
        console.error('Update failed:', updateError);
    } else {
        console.log('Update successful!');
    }

    // 3. Verify
    const { data: verifyUrl } = await supabase
        .from('scraped_agents')
        .select('website_config')
        .eq('id', agent.id)
        .single();

    console.log('Verified Config in DB:', verifyUrl?.website_config);
}

testUpdateConfig();
