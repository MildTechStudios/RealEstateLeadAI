/**
 * DOM Analysis Script for Logo Debugging (Standalone)
 * 
 * This script uses the Firecrawl API directly to fetch HTML
 * and analyze all images in a CB profile.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

const FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev/v1';
const API_KEY = process.env.FIRECRAWL_API_KEY;

async function fetchHtml(url: string): Promise<string | null> {
    try {
        const response = await axios.post(
            `${FIRECRAWL_BASE_URL}/scrape`,
            {
                url,
                formats: ['html'],
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${API_KEY}`,
                },
                timeout: 60000,
            }
        );

        if (response.data?.success && response.data?.data?.html) {
            return response.data.data.html;
        }
        console.error('Firecrawl did not return HTML:', response.data);
        return null;
    } catch (error) {
        console.error('Firecrawl error:', error);
        return null;
    }
}

async function analyzeProfile(profileUrl: string) {
    console.log(`\n🔍 Analyzing DOM for: ${profileUrl}\n`);
    console.log('='.repeat(80));

    const html = await fetchHtml(profileUrl);

    if (!html) {
        console.error('❌ Failed to fetch page HTML');
        return;
    }

    const $ = cheerio.load(html);

    console.log(`\n📊 HTML Size: ${html.length} characters\n`);
    console.log('\n📷 ALL IMAGES FOUND:\n');
    console.log('-'.repeat(80));

    let imageCount = 0;
    $('img').each((index, el) => {
        imageCount++;
        const src = $(el).attr('src') || $(el).attr('data-src') || '(no src)';
        const alt = $(el).attr('alt') || '(no alt)';
        const className = $(el).attr('class') || '(no class)';
        const parentClass = $(el).parent().attr('class') || '(no parent class)';
        const grandparentClass = $(el).parent().parent().attr('class') || '(no gp class)';

        console.log(`[Image ${imageCount}]`);
        console.log(`  src: ${src.substring(0, 120)}${src.length > 120 ? '...' : ''}`);
        console.log(`  alt: ${alt}`);
        console.log(`  class: ${className}`);
        console.log(`  parent: ${parentClass.substring(0, 80)}`);
        console.log(`  grandparent: ${grandparentClass.substring(0, 80)}`);

        // Flag potential logos
        const srcLower = src.toLowerCase();
        const altLower = alt.toLowerCase();
        const isLikelyLogo = /logo/i.test(srcLower) || /logo/i.test(altLower) || /logo/i.test(className);
        const isLikelyHeadshot = /photo|headshot|agent|portrait/i.test(altLower) || /photo|headshot|agent/i.test(className);
        const isCBLogo = /coldwell|cbrealty|cb-/i.test(srcLower);

        if (isLikelyLogo && !isCBLogo) console.log(`  ⭐ LIKELY TEAM LOGO`);
        if (isLikelyLogo && isCBLogo) console.log(`  🏢 CB BROKERAGE LOGO`);
        if (isLikelyHeadshot) console.log(`  👤 LIKELY HEADSHOT`);

        console.log('');
    });

    console.log(`\nTotal images found: ${imageCount}`);
    console.log('='.repeat(80));

    // Look for specific logo patterns
    console.log('\n🎯 TARGETED LOGO SEARCH:\n');

    const logoSelectors = [
        'img[alt*="logo" i]',
        'img[src*="logo" i]',
        'img[class*="logo" i]',
        '[class*="sidebar"] img',
        '[class*="branding"] img',
        '[class*="team"] img',
        '[class*="partner"] img',
    ];

    for (const selector of logoSelectors) {
        const matches = $(selector);
        if (matches.length > 0) {
            console.log(`\nSelector: "${selector}" => ${matches.length} match(es)`);
            matches.each((i, el) => {
                const src = $(el).attr('src') || '(no src)';
                const alt = $(el).attr('alt') || '';
                console.log(`  [${i + 1}] ${src.substring(0, 100)}`);
                if (alt) console.log(`      alt: ${alt}`);
            });
        }
    }

    console.log('\n✅ Analysis complete!\n');
}

// Main
const url = process.argv[2] || 'https://www.coldwellbanker.com/tx/frisco/agents/karyn-wynne/aid-P00200000FuGe';
analyzeProfile(url).catch(console.error);
