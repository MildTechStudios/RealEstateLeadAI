/**
 * Core Types for Scraper Agent
 */

export interface FirecrawlScrapeResponse {
    success: boolean;
    data?: {
        markdown?: string;
        html?: string;
        metadata?: Record<string, unknown>;
    };
    error?: string;
}

export interface FirecrawlCrawlResponse {
    success: boolean;
    id?: string;
    status?: string;
    data?: Array<{
        url: string;
        markdown?: string;
        html?: string;
    }>;
    error?: string;
}

export interface SerperSearchResponse {
    organic?: Array<{
        title: string;
        link: string;
        snippet: string;
        position: number;
    }>;
    searchParameters?: {
        q: string;
    };
}
