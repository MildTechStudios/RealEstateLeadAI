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
 * Extract an agent profile from a CB URL
 */
export async function extractProfile(url: string): Promise<CBAgentProfile> {
    const response = await fetch(`${API_BASE}/api/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
    })

    if (!response.ok) {
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
    const response = await fetch(`${API_BASE}/api/leads`)

    if (!response.ok) {
        throw new Error('Failed to fetch leads')
    }

    return response.json()
}

/**
 * Delete a lead
 */
export async function deleteLead(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/leads/${id}`, {
        method: 'DELETE'
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
    const response = await fetch(`${API_BASE}/api/leads/${id}/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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
    const response = await fetch(`${API_BASE}/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })

    if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to update lead')
    }
}
