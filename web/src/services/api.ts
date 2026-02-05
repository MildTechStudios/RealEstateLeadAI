/**
 * API Service
 * Centralized API calls for the agent scraper
 */

import type { CBAgentProfile } from '../types/agent'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Database Profile Interface
export interface DBProfile {
    id: string
    full_name: string
    brokerage: string
    city: string | null
    state: string | null
    primary_email: string | null
    primary_phone: string | null
    headshot_url: string | null
    logo_url: string | null
    brokerage_logo_url: string | null
    bio: string | null
    office_name: string | null
    office_address: string | null
    office_phone: string | null
    license_number: string | null
    facebook_url: string | null
    linkedin_url: string | null
    instagram_url: string | null
    twitter_url: string | null
    youtube_url: string | null
    source_url: string
    website_slug: string | null
    website_published: boolean
    website_config: any | null
    created_at: string
    updated_at: string
}

/**
 * Validate a Coldwell Banker URL
 */
export function isValidCBUrl(url: string): boolean {
    return url.includes('coldwellbanker.com') && url.includes('/agents/')
}

/**
 * Helper to get Auth Headers
 */
const getAuthHeaders = (): Record<string, string> => {
    // Get the session from local storage (Supabase default)
    // We scan for the key that starts with 'sb-' and ends with '-auth-token'
    const key = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
    if (!key) return {}

    try {
        const session = JSON.parse(localStorage.getItem(key) || '{}')
        if (session.access_token) {
            return { 'Authorization': `Bearer ${session.access_token}` }
        }
    } catch (e) {
        console.error('Error parsing auth token', e)
    }
    return {}
}

/**
 * Extract an agent profile from a CB URL
 */
export async function extractProfile(url: string): Promise<CBAgentProfile> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
    }

    const response = await fetch(`${API_BASE}/api/extract`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ url })
    })

    if (!response.ok) {
        if (response.status === 401) throw new Error('Unauthorized: Please login')

        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        // Handle extraction_errors array if present (from 422)
        if (errorData.extraction_errors && Array.isArray(errorData.extraction_errors)) {
            throw new Error(errorData.extraction_errors.join(', '))
        }
        throw new Error(errorData.error || `Request failed with status ${response.status}`)
    }

    return response.json()
}

/**
 * Fetch all saved leads from the database
 */
export async function getLeads(): Promise<DBProfile[]> {
    const response = await fetch(`${API_BASE}/api/leads`, {
        headers: getAuthHeaders()
    })

    if (!response.ok) {
        if (response.status === 401) throw new Error('Unauthorized: Please login')
        throw new Error('Failed to fetch leads')
    }

    return response.json()
}

/**
 * Delete a lead
 */
export async function deleteLead(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/leads/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    })

    if (!response.ok) {
        throw new Error('Failed to delete lead')
    }
}

/**
 * Update lead website configuration
 */
export async function updateLeadConfig(
    id: string,
    config: { website_slug?: string; website_published?: boolean }
): Promise<void> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
    }

    const response = await fetch(`${API_BASE}/api/leads/${id}/config`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(config)
    })

    if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to update config')
    }
}

/**
 * Get website by slug (public)
 */
export async function getWebsiteBySlug(slug: string): Promise<DBProfile> {
    const response = await fetch(`${API_BASE}/api/website/${slug}`)

    if (!response.ok) {
        throw new Error('Website not found')
    }

    return response.json()
}

/**
 * Update lead profile data
 */
export async function updateLead(
    id: string,
    data: Partial<Omit<DBProfile, 'id' | 'created_at' | 'updated_at' | 'source_url'>>
): Promise<void> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
    }

    const response = await fetch(`${API_BASE}/api/leads/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data)
    })

    if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to update lead')
    }
}
