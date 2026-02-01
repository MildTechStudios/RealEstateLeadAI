/**
 * Test API Auto-Save
 * 
 * Sends a request to the local API server and checks if the profile is saved to the DB.
 */

import axios from 'axios';

const TEST_URL = 'https://www.coldwellbanker.com/tx/frisco/agents/karyn-wynne/aid-P00200000FuGe6u3sxHMhO8O4YQTbIMa7wfUvbmZ';
const PORT = process.env.API_PORT || 3001;
const API_URL = `http://localhost:${PORT}/api/extract`;

async function testApi() {
    console.log(`Testing API Endpoint: ${API_URL}`);

    try {
        const response = await axios.post(API_URL, {
            url: TEST_URL
        }, { timeout: 60000 });

        const data = response.data;

        console.log('\nResponse Received:');
        console.log(`Name: ${data.full_name}`);
        console.log(`Saved to DB: ${data.saved_to_db}`);

        if (data.saved_to_db) {
            console.log(`DB ID: ${data.db_id}`);
            console.log('✅ Auto-save integration works!');
        } else {
            console.log('⚠️ Auto-save returned false.');
            console.log(`Error: ${data.db_error}`);

            if (!data.db_error || data.db_error === 'Database not configured') {
                console.log('ℹ️ check your .env file for SUPABASE credentials');
            }
        }

    } catch (error: any) {
        console.error('API Call Failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testApi();
