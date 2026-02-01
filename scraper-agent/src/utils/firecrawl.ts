/**
 * Firecrawl API wrapper
 * Handles scraping and crawling with retry logic
 */

import axios, { AxiosError } from 'axios';
import { FirecrawlScrapeResponse, FirecrawlCrawlResponse } from '../types';

const FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev/v1';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

function getApiKey(): string {
    const key = process.env.FIRECRAWL_API_KEY;
    if (!key) {
        throw new Error('FIRECRAWL_API_KEY is not set in environment variables');
    }
    return key;
}

async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Scrape a single URL and return markdown content
 */
export async function scrapePage(url: string): Promise<FirecrawlScrapeResponse> {
    const apiKey = getApiKey();

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`[Firecrawl] Scraping attempt ${attempt}/${MAX_RETRIES}: ${url}`);

            const response = await axios.post<FirecrawlScrapeResponse>(
                `${FIRECRAWL_BASE_URL}/scrape`,
                {
                    url,
                    formats: ['markdown', 'html'],
                    // Use waitFor instead of actions for better JS rendering
                    waitFor: 5000, // Wait 5 seconds for page to fully load
                    timeout: 60000, // 60 second timeout for the scrape
                    // Additional options for anti-bot sites
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 90000 // 90 second axios timeout (longer than scrape timeout)
                }
            );

            return response.data;
        } catch (error: any) {
            const axiosError = error as AxiosError;
            const status = axiosError.response?.status;
            const errorMsg = axiosError.response?.data
                ? JSON.stringify(axiosError.response.data)
                : axiosError.message;

            console.log(`[Firecrawl] Attempt ${attempt} failed: ${status || 'network error'} - ${errorMsg}`);

            // Check for rate limiting
            if (status === 429) {
                console.log(`[Firecrawl] Rate limited, waiting ${RETRY_DELAY_MS * attempt}ms...`);
                await sleep(RETRY_DELAY_MS * attempt);
                continue;
            }

            // For timeouts (408) or server errors (5xx), retry with longer delay
            if (status === 408 || (status && status >= 500)) {
                console.log(`[Firecrawl] Server issue, waiting ${RETRY_DELAY_MS * attempt * 2}ms before retry...`);
                await sleep(RETRY_DELAY_MS * attempt * 2);
                continue;
            }

            // Last attempt failed
            if (attempt === MAX_RETRIES) {
                console.error(`[Firecrawl] Failed to scrape ${url} after ${MAX_RETRIES} attempts`);
                return {
                    success: false,
                    error: axiosError.message || 'Unknown error'
                };
            }

            // Wait before retry
            await sleep(RETRY_DELAY_MS * attempt);
        }
    }

    return { success: false, error: 'Max retries exceeded' };
}

/**
 * Crawl a website with limited depth
 * Used for personal websites and brokerage profiles
 */
export async function crawlSite(
    url: string,
    options: {
        limit?: number;
        allowedPaths?: string[];
    } = {}
): Promise<FirecrawlCrawlResponse> {
    const apiKey = getApiKey();
    const { limit = 5, allowedPaths = ['/', '/about', '/contact'] } = options;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            // Start the crawl job
            const startResponse = await axios.post<{ success: boolean; id?: string; error?: string }>(
                `${FIRECRAWL_BASE_URL}/crawl`,
                {
                    url,
                    limit,
                    scrapeOptions: {
                        formats: ['markdown'],
                        includeTags: ['a', 'p', 'div', 'span', 'footer', 'header'],
                        actions: [{ type: 'wait', milliseconds: 2000 }]
                    },
                    allowedPaths
                },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            if (!startResponse.data.success || !startResponse.data.id) {
                return {
                    success: false,
                    error: startResponse.data.error || 'Failed to start crawl'
                };
            }

            const crawlId = startResponse.data.id;

            // Poll for completion
            let status = 'scraping';
            let result: FirecrawlCrawlResponse = { success: false };

            while (status === 'scraping' || status === 'pending') {
                await sleep(3000); // Wait 3 seconds between polls

                const statusResponse = await axios.get<FirecrawlCrawlResponse>(
                    `${FIRECRAWL_BASE_URL}/crawl/${crawlId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${apiKey}`
                        },
                        timeout: 30000
                    }
                );

                status = statusResponse.data.status || 'unknown';
                result = statusResponse.data;

                if (status === 'completed') {
                    return {
                        success: true,
                        id: crawlId,
                        status: 'completed',
                        data: result.data
                    };
                }

                if (status === 'failed') {
                    return {
                        success: false,
                        error: 'Crawl job failed'
                    };
                }
            }

            return result;
        } catch (error: any) {
            const axiosError = error as AxiosError;

            if (axiosError.response?.status === 429) {
                console.log(`[Firecrawl] Rate limited on crawl, waiting before retry ${attempt}/${MAX_RETRIES}...`);
                await sleep(RETRY_DELAY_MS * attempt * 2);
                continue;
            }

            if (attempt === MAX_RETRIES) {
                console.error(`[Firecrawl] Failed to crawl ${url} after ${MAX_RETRIES} attempts`);
                return {
                    success: false,
                    error: axiosError.message || 'Unknown error'
                };
            }

            await sleep(RETRY_DELAY_MS);
        }
    }

    return { success: false, error: 'Max retries exceeded' };
}

/**
 * Scrape a platform search page to find agent profiles
 */
export async function scrapePlatformSearch(
    platform: 'zillow' | 'redfin' | 'realtor',
    agentName: string,
    city?: string
): Promise<string[]> {
    const searchUrls: Record<string, string> = {
        zillow: `https://www.zillow.com/professionals/real-estate-agent-reviews/${encodeURIComponent(agentName.replace(/\s+/g, '-'))}`,
        redfin: `https://www.redfin.com/real-estate-agents?query=${encodeURIComponent(agentName)}`,
        realtor: `https://www.realtor.com/realestateagents/${encodeURIComponent(agentName.replace(/\s+/g, '-'))}`
    };

    const url = searchUrls[platform];
    const result = await scrapePage(url);

    if (!result.success || !result.data?.markdown) {
        console.log(`[Firecrawl] No results from ${platform} search`);
        return [];
    }

    // Extract profile URLs from the markdown
    const profileUrls: string[] = [];
    const markdown = result.data.markdown;

    // Pattern for each platform's profile URLs
    const patterns: Record<string, RegExp> = {
        zillow: /https:\/\/www\.zillow\.com\/profile\/[a-zA-Z0-9_-]+/g,
        redfin: /https:\/\/www\.redfin\.com\/real-estate-agents\/\d+\/[a-zA-Z0-9_-]+/g,
        realtor: /https:\/\/www\.realtor\.com\/realestateagents\/[a-zA-Z0-9_-]+/g
    };

    const pattern = patterns[platform];
    const matches = markdown.match(pattern);

    if (matches) {
        profileUrls.push(...new Set(matches as string[])); // Dedupe
    }

    return profileUrls;
}
