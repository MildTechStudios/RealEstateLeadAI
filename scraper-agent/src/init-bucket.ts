import { getDb } from './services/db';
import * as dotenv from 'dotenv';
dotenv.config();

async function initBucket() {
    console.log('Initializing Storage Bucket...');
    const supabase = getDb();

    if (!supabase) {
        console.error('Failed to initialize Supabase client');
        return;
    }

    // 1. Create Bucket
    const { data: bucket, error: bucketError } = await supabase
        .storage
        .createBucket('agent-assets', {
            public: true,
            fileSizeLimit: 5242880, // 5MB
            allowedMimeTypes: ['image/*']
        });

    if (bucketError) {
        if (bucketError.message.includes('already exists')) {
            console.log('Bucket "agent-assets" already exists.');
        } else {
            console.error('Error creating bucket:', bucketError);
        }
    } else {
        console.log('Bucket "agent-assets" created successfully.');
    }

    // 2. We can't easily create policies via JS client (usually requires SQL), 
    // but a public bucket often allows read by default.
    // The "Public" flag above should confirm public access.

    console.log('Done.');
}

initBucket();
