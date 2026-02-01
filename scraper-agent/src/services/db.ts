/**
 * Database Service
 * Handles interactions with Supabase for the Lead Management System
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CBAgentProfile } from '../extractors/coldwellbanker';

let supabaseClient: SupabaseClient | null = null;

/**
 * Initialize Supabase client
 * Singleton pattern to reuse the client instance
 */
function getSupabaseClient(): SupabaseClient | null {
    if (supabaseClient) return supabaseClient;

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.warn('[DB] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY. Auto-save disabled.');
        return null;
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey);
    return supabaseClient;
}

/**
 * Save extracted Coldwell Banker profile to the database
 * Uses UPSERT based on the unique source_url
 */
export async function saveProfile(profile: CBAgentProfile): Promise<{ success: boolean; id?: string; error?: string }> {
    const client = getSupabaseClient();

    // Fail silently if DB is not configured (don't block the UI)
    if (!client) {
        return { success: false, error: 'Database not configured' };
    }

    console.log(`[DB] Saving profile for: ${profile.full_name}`);

    try {
        // Map the flattened CBAgentProfile to the schema expected by the table
        // We use the 'raw_profile' JSONB column to store the full object structure
        // allowing us to save new fields (like brokerage_logo_url) without immediate schema migrations.

        const record = {
            full_name: profile.full_name,
            brokerage: 'Coldwell Banker Realty',
            city: _extractCity(profile.office_address) || 'Unknown',
            state: _extractState(profile.office_address) || 'XX',
            source_platform: 'coldwellbanker',
            source_url: profile.profile_url,
            primary_email: profile.email,
            primary_phone: profile.mobile_phone || profile.office_phone,

            // Visuals
            headshot_url: profile.headshot_url,
            logo_url: profile.logo_url,
            brokerage_logo_url: profile.brokerage_logo_url,

            // Details
            bio: profile.bio,
            office_name: profile.office_name,
            office_address: profile.office_address,

            // Socials
            facebook_url: profile.social_links.facebook,
            linkedin_url: profile.social_links.linkedin,
            instagram_url: profile.social_links.instagram,
            twitter_url: profile.social_links.twitter,
            youtube_url: profile.social_links.youtube,

            // Store full data blob for future-proofing
            raw_profile: profile,

            updated_at: new Date().toISOString()
        };

        // Upsert: Insert or Update if source_url exists
        const { data, error } = await client
            .from('scraped_agents')
            .upsert(record, {
                onConflict: 'source_url',
                ignoreDuplicates: false
            })
            .select('id')
            .single();

        if (error) {
            console.error('[DB] Error saving profile:', error.message);
            return { success: false, error: error.message };
        }

        console.log(`[DB] ✓ Profile saved successfully (ID: ${data.id})`);
        return { success: true, id: data.id };

    } catch (err) {
        console.error('[DB] Unexpected error:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

/**
 * Fetch all saved leads from the database
 */
export async function getLeads(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    const client = getSupabaseClient();

    if (!client) {
        return { success: false, error: 'Database not configured' };
    }

    try {
        const { data, error } = await client
            .from('scraped_agents')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(50); // Limit to 50 for now

        if (error) {
            console.error('[DB] Error fetching leads:', error.message);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

/**
 * Delete a lead by ID
 */
export async function deleteLead(id: string): Promise<{ success: boolean; error?: string }> {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Database not configured' };

    try {
        const { error } = await client
            .from('scraped_agents')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return { success: true };
    } catch (err) {
        console.error('[DB] Error deleting lead:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

// Helpers to extract city/state from the unstructured address string
// Format is usually: "123 Main St, City, ST 12345"
function _extractCity(address: string | null): string | null {
    if (!address) return null;
    const parts = address.split(',');
    if (parts.length >= 2) {
        // City is roughly the second to last part
        return parts[parts.length - 2].trim();
    }
    return null;
}

function _extractState(address: string | null): string | null {
    if (!address) return null;
    const match = address.match(/\b([A-Z]{2})\b/);
    return match ? match[1] : null;
}
