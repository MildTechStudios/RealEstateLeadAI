
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''; // Must be SERVICE_KEY for admin actions

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
    const email = 'admin@platform.system';
    const password = 'SahGarVar14124';

    console.log(`Checking if user ${email} exists...`);

    // List users to check existence (requires service role)
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('Error listing users:', listError);
        return;
    }

    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
        console.log(`User ${email} already exists (ID: ${existingUser.id}). Updating password...`);
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            { password: password, user_metadata: { role: 'platform_admin' } }
        );

        if (updateError) {
            console.error('Error updating password:', updateError);
        } else {
            console.log('Password updated successfully.');
        }
    } else {
        console.log(`Creating new user ${email}...`);
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { role: 'platform_admin' }
        });

        if (error) {
            console.error('Error creating user:', error);
        } else {
            console.log('User created successfully:', data.user.id);
        }
    }
}

createAdminUser();
