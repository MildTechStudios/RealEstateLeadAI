/**
 * Agent Profile Types
 */

export interface SocialLinks {
    linkedin: string | null
    facebook: string | null
    instagram: string | null
    twitter: string | null
    youtube: string | null
}

export interface CBAgentProfile {
    full_name: string
    email: string | null
    mobile_phone: string | null
    office_phone: string | null
    all_phones: string[]
    headshot_url: string | null
    logo_url: string | null
    brokerage_logo_url: string
    bio: string | null
    office_name: string | null
    office_address: string | null
    license_number: string | null
    social_links: SocialLinks
    profile_url: string
    extraction_success: boolean
    extraction_errors: string[]
    // Database fields
    saved_to_db?: boolean
    db_id?: string
    db_error?: string
}
