/**
 * Coldwell Banker Agent Extractor
 * 
 * Specialized extractor for Coldwell Banker agent profiles.
 * CB profiles expose contact info, headshots, and logos directly on the frontend.
 */

import { scrapePage } from '../utils/firecrawl';
import * as cheerio from 'cheerio';

export interface CBAgentProfile {
    full_name: string;
    email: string | null;
    mobile_phone: string | null;
    office_phone: string | null;
    all_phones: string[];
    headshot_url: string | null;
    logo_url: string | null;            // Team/Personal logo
    brokerage_logo_url: string;         // Standard CB Realty logo
    bio: string | null;
    office_name: string | null;
    office_address: string | null;
    social_links: {
        linkedin: string | null;
        facebook: string | null;
        instagram: string | null;
        twitter: string | null;
        youtube: string | null;
    };
    profile_url: string;
    extraction_success: boolean;
    extraction_errors: string[];
}

// Email regex
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Phone regex (US format)
const PHONE_REGEX = /(?:\+?1[-.\s]?)?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

// Social media patterns
const SOCIAL_PATTERNS = {
    linkedin: /https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?/gi,
    facebook: /https?:\/\/(?:www\.)?facebook\.com\/[a-zA-Z0-9._-]+\/?/gi,
    instagram: /https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9._]+\/?/gi,
    twitter: /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[a-zA-Z0-9_]+\/?/gi,
    youtube: /https?:\/\/(?:www\.)?youtube\.com\/(?:channel\/|user\/|c\/|@)?[a-zA-Z0-9_-]+/gi,
};

// Image URL patterns for headshots
const HEADSHOT_PATTERNS = [
    /https?:\/\/[^\s"']+(?:agent|profile|photo|headshot|portrait)[^\s"']*\.(?:jpg|jpeg|png|webp)/gi,
    /https?:\/\/[^\s"']+\/agents?\/[^\s"']+\.(?:jpg|jpeg|png|webp)/gi,
    /https?:\/\/[^\s"']+cloudinary[^\s"']+\.(?:jpg|jpeg|png|webp)/gi,
    /https?:\/\/[^\s"']+\.(?:jpg|jpeg|png|webp)/gi,
];

// CB Logo patterns (Generic logos we want to AVOID as team logos)
const GENERIC_CB_LOGOS = [
    /coldwell.*banker.*logo/i,
    /logo.*coldwell.*banker/i,
    /cb.*logo/i,
    /realogy.*logo/i,
    /logo.*blue/i, // Heuristic for common filename
];

/**
 * Extract agent name from markdown
 */
function extractName(markdown: string): string | null {
    const lines = markdown.split('\n').filter(l => l.trim());

    // Look for H1 headings - usually the agent name
    for (const line of lines) {
        if (line.startsWith('# ')) {
            const text = line.replace(/^#\s+/, '').trim();
            // Clean up common suffixes
            const cleaned = text
                .replace(/\s*\|.*$/, '')
                .replace(/\s*-\s*Coldwell Banker.*$/i, '')
                .replace(/\s*,\s*(?:Realtor|Agent|Broker).*$/i, '')
                .trim();

            // Validate it looks like a name (2-5 words, mostly letters)
            const words = cleaned.split(/\s+/);
            if (words.length >= 2 && words.length <= 5) {
                const isNameLike = words.every(w => /^[A-Za-z.'-]+$/.test(w));
                if (isNameLike) {
                    return cleaned;
                }
            }
        }
    }

    // Fallback: Look for name patterns
    const namePatterns = [
        /(?:Agent|Realtor|Meet)\s+([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+)/i,
        /([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+)\s+(?:is a|specializes|serves)/i,
    ];

    for (const pattern of namePatterns) {
        const match = markdown.match(pattern);
        if (match) return match[1].trim();
    }

    return null;
}

/**
 * Extract email addresses
 */
function extractEmails(markdown: string): string[] {
    const matches = markdown.match(EMAIL_REGEX) || [];
    const emails = new Set<string>();

    for (const email of matches) {
        const normalized = email.toLowerCase();
        // Skip generic emails
        if (!normalized.includes('noreply') &&
            !normalized.includes('info@') &&
            !normalized.includes('support@') &&
            !normalized.includes('example.com')) {
            emails.add(normalized);
        }
    }

    return Array.from(emails);
}

/**
 * Extract phone numbers
 */
function extractPhones(markdown: string): string[] {
    const matches = markdown.match(PHONE_REGEX) || [];
    const phones = new Set<string>();

    for (const phone of matches) {
        const digits = phone.replace(/\D/g, '');
        if (digits.length >= 10 && digits.length <= 11) {
            // Format: (XXX) XXX-XXXX
            const normalized = digits.length === 11
                ? `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
                : `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
            phones.add(normalized);
        }
    }

    return Array.from(phones);
}

/**
 * Extract image URLs that look like headshots
 */
function extractHeadshotUrl(markdown: string): string | null {
    for (const pattern of HEADSHOT_PATTERNS) {
        const matches = markdown.match(pattern);
        if (matches && matches.length > 0) {
            // Prefer larger images, filter out tiny icons
            for (const url of matches) {
                // Skip obvious non-headshots
                if (url.includes('icon') ||
                    url.includes('logo') ||
                    url.includes('favicon') ||
                    url.includes('1x1') ||
                    url.includes('placeholder')) {
                    continue;
                }
                return url;
            }
        }
    }
    return null;
}

/**
 * Helper to check if a logo URL is just the generic brokerage logo
 */
function isGenericLogo(url: string): boolean {
    const lowerUrl = url.toLowerCase();

    // Check against patterns
    if (GENERIC_CB_LOGOS.some(pattern => pattern.test(lowerUrl))) return true;

    // Check for specific common generic filenames seen in CB
    if (lowerUrl.includes('cbrealty_logo') ||
        lowerUrl.includes('coldwellbanker_logo') ||
        lowerUrl.includes('global-luxury-logo')) {
        return true;
    }

    return false;
}

/**
 * Extract Team/Brokerage logo URL (not building photos)
 */
function extractLogoUrl(markdown: string): string | null {
    let candidateUrl: string | null = null;

    // Strategy 1: Look for images in "Team" section specifically
    const teamSectionMatch = markdown.match(
        /(?:Team|My\s+Team|Partner|Group)[\s\S]{0,500}?!\[[^\]]*\]\(([^)]+)\)/i
    );
    if (teamSectionMatch && teamSectionMatch[1]) {
        candidateUrl = teamSectionMatch[1].replace(/[)\]]+$/, '');
    }

    // Strategy 2: Look for explicit "logo" in URL path
    if (!candidateUrl) {
        const logoPathMatch = markdown.match(
            /https?:\/\/[^\s"')\]]+\/logos\/[^\s"')\]]+/i
        );
        if (logoPathMatch) {
            candidateUrl = logoPathMatch[0].replace(/[)\]]+$/, '');
        }
    }

    // Strategy 3: Realogy CDN
    if (!candidateUrl) {
        const cdnMatch = markdown.match(/https?:\/\/images\.cloud\.realogyprod\.com\/[^\s"')\]]+/gi);
        if (cdnMatch && cdnMatch.length > 0) {
            const found = cdnMatch.find(url =>
                url.includes('/logos/') &&
                !url.includes('/photos/') &&
                !url.includes('/offices/')
            );
            if (found) candidateUrl = found.replace(/[)\]]+$/, '');
        }
    }

    // Strategy 4: Company logos
    if (!candidateUrl) {
        const companyLogoMatch = markdown.match(
            /https?:\/\/[^\s"')\]]+companies[^\s"')\]]+logos[^\s"')\]]+/i
        );
        if (companyLogoMatch) {
            candidateUrl = companyLogoMatch[0].replace(/[)\]]+$/, '');
        }
    }

    // Final Validation: If found, make sure it's NOT a generic CB logo
    if (candidateUrl) {
        // If it's a generic logo, we return null because we display the generic one by default
        if (isGenericLogo(candidateUrl)) {
            return null;
        }
        return candidateUrl;
    }

    return null;
}

/**
 * Extract bio/about text (skip markdown links)
 */
function extractBio(markdown: string): string | null {
    // Remove markdown links and images first
    const cleanText = markdown
        .replace(/!\[[^\]]*\]\([^)]+\)/g, '') // Remove images
        .replace(/\[[^\]]*\]\([^)]+\)/g, '')   // Remove links
        .replace(/\*\*([^*]+)\*\*/g, '$1')     // Remove bold
        .replace(/\*([^*]+)\*/g, '$1');        // Remove italic

    // Look for about/bio section
    const bioPatterns = [
        /(?:About\s+(?:Me|[A-Z][a-z]+)|Biography|Bio)[:\s]*\n+([^#\n][^\n]{50,})/i,
        /(?:^|\n)([A-Z][a-z]+ (?:is|has been|specializes|brings|serves)[^.]+\.[^.]+\.)/m, // Sentences about the agent
    ];

    for (const pattern of bioPatterns) {
        const match = cleanText.match(pattern);
        if (match && match[1]) {
            const bio = match[1].trim();
            // Must be real text, not just whitespace/short
            if (bio.length > 50 && !bio.includes('http')) {
                return bio.substring(0, 500);
            }
        }
    }

    // Fallback: Find paragraphs that look like bio content
    const paragraphs = cleanText.split(/\n\n+/).filter(p => {
        const trimmed = p.trim();
        return (
            trimmed.length > 100 &&
            !trimmed.startsWith('#') &&
            !trimmed.startsWith('|') &&      // Not a table
            !trimmed.includes('http') &&     // Not a link
            !trimmed.match(/^\d+/) &&        // Not starting with number
            trimmed.match(/[a-z]/)           // Has lowercase (real text)
        );
    });

    if (paragraphs.length > 0) {
        return paragraphs[0].trim().substring(0, 500);
    }

    return null;
}

/**
 * Extract social media links
 */
function extractSocialLinks(markdown: string): CBAgentProfile['social_links'] {
    const social: CBAgentProfile['social_links'] = {
        linkedin: null,
        facebook: null,
        instagram: null,
        twitter: null,
        youtube: null,
    };

    for (const [platform, pattern] of Object.entries(SOCIAL_PATTERNS)) {
        const matches = markdown.match(pattern);
        if (matches && matches.length > 0) {
            // Filter out generic/company pages for personal profiles
            const filtered = matches.filter(url => {
                const lower = url.toLowerCase();
                return !lower.includes('/coldwellbanker') &&
                    !lower.includes('/cbglobal') &&
                    !lower.includes('/company/');
            });
            if (filtered.length > 0) {
                social[platform as keyof typeof social] = filtered[0];
            } else if (matches.length > 0) {
                // Fallback to any match
                social[platform as keyof typeof social] = matches[0];
            }
        }
    }

    return social;
}

/**
 * Extract office information
 */
function extractOfficeInfo(markdown: string): { name: string | null; address: string | null } {
    // Office name patterns - look for "Coldwell Banker Realty" specifically
    let officeName: string | null = null;

    // First try: Look for explicit "Coldwell Banker Realty - Location"
    const cbRealtyMatch = markdown.match(/Coldwell\s+Banker\s+Realty\s*[-–]?\s*([A-Za-z\s]{3,30})/i);
    if (cbRealtyMatch && cbRealtyMatch[1]) {
        const candidate = cbRealtyMatch[1].trim();
        // Skip false positives
        if (!['License', 'Agent', 'About', 'Contact'].includes(candidate)) {
            officeName = `Coldwell Banker Realty - ${candidate}`;
        }
    }

    // Fallback: Just use "Coldwell Banker Realty" if found
    if (!officeName && markdown.match(/Coldwell\s+Banker\s+Realty/i)) {
        officeName = 'Coldwell Banker Realty';
    }

    // ADDRESS EXTRACTION - Multiple strategies
    let address: string | null = null;

    // Strategy 1: Look for address in map links [Address Text](map_url)
    const mapLinkMatch = markdown.match(/\[([^\]]*\d{5}[^\]]*)\]\([^)]*(?:map|google|maps)[^)]*\)/i);
    if (mapLinkMatch && mapLinkMatch[1]) {
        address = mapLinkMatch[1].trim();
    }

    // Strategy 2: Look for address near "Office" section with flexible format
    if (!address) {
        // Match: Street Number + Street Name + (optional Suite) + City + State + Zip
        const officeAddressMatch = markdown.match(
            /(?:Office|Location|Address)[:\s\S]{0,100}?(\d+\s+[A-Za-z0-9\s]+(?:Blvd|St|Ave|Rd|Dr|Ln|Way|Ct|Pkwy)[,.\s]+(?:Ste\.?|Suite)?\s*\d*[,.\s]+[A-Za-z\s]+,?\s*[A-Z]{2}\s*\d{5})/i
        );
        if (officeAddressMatch && officeAddressMatch[1]) {
            address = officeAddressMatch[1].replace(/\s+/g, ' ').trim();
        }
    }

    // Strategy 3: Broad search for any US address pattern
    if (!address) {
        const broadMatch = markdown.match(
            /(\d+\s+[A-Za-z0-9\s]+(?:Boulevard|Blvd|Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Way|Court|Ct|Parkway|Pkwy)[,.\s]+(?:Ste\.?|Suite\.?)?\s*\d*[,.\s]*[A-Za-z\s]+,\s*[A-Z]{2}\s*\d{5})/i
        );
        if (broadMatch && broadMatch[1]) {
            address = broadMatch[1].replace(/\s+/g, ' ').trim();
        }
    }

    return { name: officeName, address };
}

/**
 * Extract bio from Meta tags (Fallback)
 */
function extractBioFromMeta(html?: string): string | null {
    if (!html) return null;

    // Check various meta descriptions
    const patterns = [
        /<meta\s+property="og:description"\s+content="([^"]*)"/i,
        /<meta\s+name="description"\s+content="([^"]*)"/i,
        /<meta\s+name="twitter:description"\s+content="([^"]*)"/i
    ];

    for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
            // content might be HTML encoded
            let text = match[1];
            // Simple decode
            text = text.replace(/&quot;/g, '"')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&#39;/g, "'");
            return text;
        }
    }
    return null;
}

/**
 * Extract bio from JSON-LD Schema (Preferred method for full text)
 */
function extractBioFromJsonLd(html?: string): string | null {
    if (!html) {
        console.log('[JSON-LD] No HTML content provided');
        return null;
    }

    try {
        // Relaxed regex to capture script content - handle attributes and spacing
        const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);

        if (!jsonLdMatches) {
            console.log(`[JSON-LD] No LD+JSON script tags found in ${html.length} bytes of HTML`);
            return null;
        }

        console.log(`[JSON-LD] Found ${jsonLdMatches.length} script tags`);

        for (const match of jsonLdMatches) {
            // Strip tags to get raw JSON
            const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '');
            try {
                const data = JSON.parse(jsonContent);

                // data could be an object or array of objects
                const entities = Array.isArray(data) ? data : [data];

                for (const entity of entities) {
                    const type = entity['@type'];
                    // console.log(`[JSON-LD] Inspecting entity: ${type}`);

                    if (['Person', 'RealEstateAgent', 'ProfilePage'].includes(type)) {
                        if (entity.description) {
                            console.log(`[JSON-LD] Found bio in ${type}`);
                            return entity.description;
                        }
                        // Check nested 'about'
                        if (entity.about && entity.about.description) {
                            console.log(`[JSON-LD] Found bio in ${type}.about`);
                            return entity.about.description;
                        }
                        // Check 'mainEntity'
                        if (entity.mainEntity && entity.mainEntity.description) {
                            console.log(`[JSON-LD] Found bio in ${type}.mainEntity`);
                            return entity.mainEntity.description;
                        }
                    }
                }
            } catch (e) {
                // Ignore parse errors for individual blocks
                continue;
            }
        }
    } catch (e) {
        console.error('Error parsing JSON-LD:', e);
    }

    return null;
}

/**
 * Main extraction function for Coldwell Banker profiles
 */
/**
 * Extract bio from HTML using Cheerio (Best for hidden/truncated DOM elements)
 */
function extractBioFromHtml(html?: string): string | null {
    if (!html) return null;

    try {
        const $ = cheerio.load(html);

        // Strategy 1: Specific class identified by user (Truncated text container)
        // Matches class containing "AgentProfile_clipText" or "clipText"
        const specificClass = $('[class*="AgentProfile_clipText"], [class*="clipText"]');
        if (specificClass.length > 0) {
            return specificClass.text().trim();
        }

        // Strategy 2: "About <Name>" section logic
        // Look for headers that contain "About" and take the next paragraph
        let targetP: string | null = null;
        $('h1, h2, h3, h4, h5').each((_, el) => {
            const text = $(el).text().trim();
            if (text.includes('About')) {
                // Return the text of the next p sibling or the next div's text
                const nextP = $(el).next('p');
                if (nextP.length) {
                    targetP = nextP.text().trim();
                    return false; // break
                }
                const nextDiv = $(el).next('div');
                if (nextDiv.length) {
                    targetP = nextDiv.text().trim();
                    return false;
                }
            }
        });

        if (targetP) {
            return targetP;
        }

    } catch (e) {
        console.error('Error parsing HTML bio:', e);
    }

    return null;
}

/**
 * Main extraction function for Coldwell Banker profiles
 */
export async function extractCBProfile(profileUrl: string): Promise<CBAgentProfile> {
    console.log(`[CB Extractor] Extracting from: ${profileUrl}`);

    const errors: string[] = [];

    // Scrape the page
    const scrapeResult = await scrapePage(profileUrl);

    if (!scrapeResult.success || !scrapeResult.data?.markdown) {
        console.error('[CB Extractor] Failed to scrape page');
        return {
            full_name: '',
            email: null,
            mobile_phone: null,
            office_phone: null,
            all_phones: [],
            headshot_url: null,
            logo_url: null,
            brokerage_logo_url: '/assets/cb-realty-logo.jpg',
            bio: null,
            office_name: null,
            office_address: null,
            social_links: { linkedin: null, facebook: null, instagram: null, twitter: null, youtube: null },
            profile_url: profileUrl,
            extraction_success: false,
            extraction_errors: ['Failed to scrape page: ' + (scrapeResult.error || 'Unknown error')]
        };
    }

    const markdown = scrapeResult.data.markdown;
    const html = scrapeResult.data.html; // New field
    console.log(`[CB Extractor] Scraped ${markdown.length} markdown chars`);
    if (html) console.log(`[CB Extractor] Scraped ${html.length} HTML chars`);

    // Extract all fields
    const name = extractName(markdown);
    if (!name) errors.push('Could not extract name');

    const emails = extractEmails(markdown);
    const phones = extractPhones(markdown);
    const headshotUrl = extractHeadshotUrl(markdown);
    const logoUrl = extractLogoUrl(markdown);
    const socialLinks = extractSocialLinks(markdown);
    const officeInfo = extractOfficeInfo(markdown);

    // BIO STRATEGY: JSON-LD > DOM (Cheerio) > Meta Tags > Markdown
    // We prioritize DOM/JSON-LD as they are likely the full text sources
    const jsonLdBio = extractBioFromJsonLd(html);
    const htmlBio = extractBioFromHtml(html);
    const metaBio = extractBioFromMeta(html);
    const markdownBio = extractBio(markdown);

    let bioSource = 'None';
    let bio: string | null = null;

    if (jsonLdBio && jsonLdBio.length > 50) {
        bio = jsonLdBio;
        bioSource = 'JSON-LD';
    } else if (htmlBio && htmlBio.length > 50) {
        bio = htmlBio;
        bioSource = 'HTML (DOM)';
    } else if (metaBio && metaBio.length > (markdownBio?.length || 0)) {
        bio = metaBio;
        bioSource = 'Meta Tag';
    } else {
        bio = markdownBio;
        bioSource = 'Markdown (Scraped)';
    }

    if (emails.length === 0) errors.push('No email found');
    if (phones.length === 0) errors.push('No phone found');
    if (!headshotUrl) errors.push('No headshot found');

    // Assign phones: first is mobile, second is office (if available)
    const mobilePhone = phones.length > 0 ? phones[0] : null;
    const officePhone = phones.length > 1 ? phones[1] : null;

    const profile: CBAgentProfile = {
        full_name: name || '',
        email: emails[0] || null,
        mobile_phone: mobilePhone,
        office_phone: officePhone,
        all_phones: phones,
        headshot_url: headshotUrl,
        logo_url: logoUrl,
        brokerage_logo_url: '/assets/cb-realty-logo.jpg',
        bio,
        office_name: officeInfo.name,
        office_address: officeInfo.address,
        social_links: socialLinks,
        profile_url: profileUrl,
        extraction_success: !!name && (emails.length > 0 || phones.length > 0),
        extraction_errors: errors
    };

    console.log('[CB Extractor] Extraction result:');
    console.log(`  Name: ${profile.full_name || '(not found)'}`);
    console.log(`  Email: ${profile.email || '(not found)'}`);
    console.log(`  Mobile: ${profile.mobile_phone || '(not found)'}`);
    console.log(`  Office: ${profile.office_phone || '(not found)'}`);
    console.log(`  All Phones: ${profile.all_phones.length > 0 ? profile.all_phones.join(', ') : '(none)'}`);
    console.log(`  Headshot: ${profile.headshot_url ? 'Found' : 'Not found'}`);
    console.log(`  Social: ${Object.values(profile.social_links).filter(Boolean).length} found`);
    console.log(`  Bio: ${bio ? 'Found (' + bio.length + ' chars)' : 'Not found'}, Source: ${bioSource}`);
    console.log(`  Success: ${profile.extraction_success}`);

    return profile;
}
