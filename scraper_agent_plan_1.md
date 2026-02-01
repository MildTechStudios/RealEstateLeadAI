# Real Estate Agent Scraper — Full Project Plan

## What This System Does

User provides ONE input — a single agent profile URL from Zillow, Redfin, or Realtor.com.

The system automatically finds and extracts everything publicly available about that agent. Zero additional user input required. The output is a complete agent profile ready to be used for website generation.

---

## Tech Stack

| Tool | Role | Cost |
|------|------|------|
| **Firecrawl** | All website scraping and crawling — handles JS rendering, proxies, anti-bot | $16/month (Hobby plan) |
| **Serper API** | Google search queries to discover the agent's broader online footprint | ~$1-3/month at this scale |
| **Your code (Node.js or Python)** | Controls the logic, validation, classification, and assembly | Free |

**Total estimated cost: ~$19-20/month to start.**

---

## Architecture Overview

```
User Input (1 URL)
        │
        ▼
┌─────────────────┐
│   STEP 1        │  Identity Extraction
│   Firecrawl     │  Scrape the profile → clean identity
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   STEP 2        │  Discovery (runs in parallel)
│   Serper +      │  Google searches + cross-platform searches
│   Firecrawl     │  → raw list of URLs
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   STEP 3        │  Validation
│   Your Code     │  Filter: is this actually our agent?
│                 │  → only verified results survive
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   STEP 4        │  Classification
│   Your Code     │  Sort verified URLs into buckets
│                 │  → route each URL to the right action
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   STEP 5        │  Deep Extraction
│   Firecrawl     │  Crawl high-value pages
│                 │  → extract contacts, socials, emails, phones
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   STEP 6        │  Assembly
│   Your Code     │  Merge, dedupe, score, finalize
│                 │  → one clean complete profile
└─────────────────┘
         │
         ▼
   Final Profile JSON
   (ready for website generation)
```

---

## STEP 1 — Identity Extraction

### Goal

Extract a clean, minimal identity from the single profile URL the user provided. This is the anchor for everything else in the pipeline. If this is wrong, everything downstream is wrong.

### Input

```
One URL. Examples:
  https://www.zillow.com/profile/JohnASmith/
  https://www.redfin.com/real-estate-agents/12345/john-a-smith
  https://www.realtor.com/realestateagents/JohnASmith_Los-Angeles_CA
```

### How It Works

1. Detect the source platform from the URL domain (not from page content).
2. Send the URL to Firecrawl. Firecrawl handles JS rendering, returns clean structured content.
3. Parse the output and extract only these fields:

```json
{
  "full_name": "John A. Smith",
  "brokerage": "Coldwell Banker Realty",
  "city": "Los Angeles",
  "state": "CA",
  "profile_url": "https://www.zillow.com/profile/JohnASmith/",
  "source_platform": "zillow"
}
```

### Extraction Rules

**Source Platform** — determined ONLY by URL domain:

| Domain | source_platform |
|--------|-----------------|
| zillow.com | zillow |
| redfin.com | redfin |
| realtor.com | realtor |

Never infer from page content. This value is locked for the entire pipeline.

**Full Name** — most critical field:
- Extract exactly as written on the page
- Preserve middle initials (John A. Smith, not John Smith)
- Preserve suffixes (Jr, Sr, III)
- Preserve capitalization
- If multiple names appear, choose the primary agent name, ignore team members or assistants

**Brokerage** — use the display name exactly as it appears:
- Do NOT shorten or normalize
- If missing, set empty string — do NOT guess

**City + State** — both are required:
- City must be explicit, not a region
- State must be 2-letter abbreviation (CA, NY, TX, etc.)
- If either is missing, the pipeline STOPS

**Profile URL** — set to the exact input URL. No cleanup, no redirects.

### Validation (all must pass or pipeline stops)

```
✓ full_name is not empty
✓ city is not empty
✓ state is not empty
✓ source_platform is one of: zillow, redfin, realtor
✓ profile_url matches the input URL exactly
```

### Why This Step Is Strict

This identity object is used as:
- The search seed for Step 2
- The matching anchor for Step 3 validation
- The deduplication key in Step 6
- The audit trail root

If it's polluted with guesses or enrichment, you can never tell whether later failures are caused by bad search queries, bad classification, or bad extraction. Keep it clean.

### Firecrawl API Call

```javascript
const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: inputUrl,
    formats: ['markdown'],
    actions: [{ type: 'wait', duration: 2000 }]
  })
});
```

---

## STEP 2 — Discovery

### Goal

Find every other public page that belongs to this agent. This is where you discover duplicates on other platforms, personal websites, brokerage profiles, and social media.

### Input

The clean identity from Step 1:

```json
{
  "full_name": "John A. Smith",
  "brokerage": "Coldwell Banker Realty",
  "city": "Los Angeles",
  "state": "CA",
  "source_platform": "zillow"
}
```

### How It Works

Two things run IN PARALLEL:

#### A) Google Search via Serper

Run exactly these two queries:

```
Query 1: "John A. Smith" Realtor
Query 2: "John A. Smith" "Los Angeles" Realtor
```

Rules:
- Quotes MUST be used around the name and city
- The word "Realtor" MUST be included
- No synonyms, no extra keywords, no experimentation
- Capture ALL organic results from page 1 of both queries
- Do NOT stop at the first result
- Do NOT filter or classify results yet

For every organic result, store:

```json
{
  "query": "\"John A. Smith\" Realtor",
  "position": 1,
  "title": "John A. Smith | Coldwell Banker Realty",
  "url": "https://www.coldwellbanker.com/agent/john-a-smith",
  "snippet": "John A. Smith is a licensed real estate agent..."
}
```

#### B) Cross-Platform Search via Firecrawl

Since the agent exists on one platform, search the other two for duplicates:

| If input was from | Search these platforms |
|-------------------|----------------------|
| Zillow | Redfin, Realtor.com |
| Redfin | Zillow, Realtor.com |
| Realtor.com | Zillow, Redfin |

Use Firecrawl to scrape the search results pages on each platform. Construct search URLs using the agent's name and city:

```
Zillow:     https://www.zillow.com/agents/?q=John+A.+Smith+Los+Angeles
Redfin:     https://www.redfin.com/real-estate-agents/?query=John+A.+Smith
Realtor:    https://www.realtor.com/realestateagents/?agentName=John+A.+Smith
```

Capture any agent profiles that come back from those pages.

### Serper API Call

```javascript
const response = await fetch('https://api.serper.dev/search', {
  method: 'POST',
  headers: {
    'X-API-KEY': SERPER_API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    q: `"${fullName}" Realtor`,
    gl: 'us',
    hl: 'en'
  })
});
```

### Output

A raw combined list of all URLs from both Google and the platform searches. No filtering, no classification yet. Duplicates are allowed — deduplication happens later.

### Validation

```
✓ Both Google queries executed
✓ All organic page-1 results captured
✓ Cross-platform searches executed for the other 2 platforms
✓ Total results count ≥ 1
```

If Google returns ZERO results AND platform searches return ZERO results → FAIL. The Step 1 identity is likely wrong.

---

## STEP 3 — Validation

### Goal

This is the firewall. Filter out every result that belongs to a DIFFERENT person with the same or similar name. Only results that are actually about YOUR agent survive this step.

### Why This Step Exists

"John Smith Realtor" could return results for 10 different John Smiths across the country. Without validation, wrong-person data silently enters the pipeline and corrupts the final profile. This step was missing from the original plan and is critical.

### Input

Raw URL list from Step 2 (every result, unfiltered).

### How It Works

Every single result is checked against the Step 1 identity using these four criteria in order:

#### 1. Name Match (REQUIRED — first filter)

The result must contain the agent's name. Fuzzy matching is used because exact matches aren't always realistic.

| Comparison | Result |
|------------|--------|
| "John A. Smith" vs "John A. Smith" | ✓ Pass |
| "John A. Smith" vs "John Smith" | ✓ Pass (minor variation) |
| "John A. Smith" vs "J. Smith" | ✓ Pass (abbreviation) |
| "John A. Smith" vs "Johnny Smith" | ⚠ Flag as low confidence |
| "John A. Smith" vs "Jane Smith" | ✗ Discard immediately |
| "John A. Smith" vs "John Davis" | ✗ Discard immediately |

**Threshold: 80%+ fuzzy match score passes. Below 80% is discarded.**

Use a fuzzy matching library (e.g., Fuse.js in Node.js, or python-Levenshtein in Python) to calculate the score. Do not do this with simple string comparison.

#### 2. Geo Match (REQUIRED — second filter)

The result must have a connection to the agent's city or state. This is your strongest filter for eliminating the wrong person.

```
Check the title + snippet + URL for:
  - Agent's city (e.g., "Los Angeles")
  - Agent's state (e.g., "CA" or "California")
  - Nearby cities in the same metro area (optional, lower confidence)
```

A "John A. Smith" profile in New York when your agent is in Los Angeles is almost certainly the wrong person — even if the name matches perfectly.

#### 3. Real Estate Context (REQUIRED — third filter)

The result must be real estate related. Check title + snippet for keywords:

```
realtor, real estate, agent, listings, brokerage, homes, properties,
MLS, property, realty, housing, estate agent, home sales
```

A "John A. Smith" who is a dentist or a lawyer is not your person.

#### 4. Brokerage Match (SUPPORTING SIGNAL — not a hard filter)

If the result mentions a brokerage and it doesn't match yours, flag it as lower confidence but do NOT discard it. Agents change brokerages. This is a supporting signal only.

### Confidence Scoring

Every result that passes all required checks gets a confidence score:

| What matched | Confidence Score |
|--------------|-----------------|
| Name + City + Brokerage | 0.95 |
| Name + City, no brokerage mentioned | 0.80 |
| Name + State + Brokerage | 0.75 |
| Name + State, no brokerage | 0.65 |
| Name only, no geo, no brokerage | 0.40 → DISCARDED |

**Discard threshold: anything below 0.60 is permanently removed from the pipeline.**

### Output

```json
{
  "validated_results": [
    {
      "url": "https://www.coldwellbanker.com/agent/john-a-smith",
      "title": "John A. Smith | Coldwell Banker Realty",
      "snippet": "...",
      "confidence": 0.95,
      "matched_signals": ["name", "city", "brokerage", "real_estate_context"]
    },
    {
      "url": "https://linkedin.com/in/johnasmith-realtor",
      "title": "John A. Smith - Real Estate Agent at Coldwell Banker",
      "snippet": "...",
      "confidence": 0.80,
      "matched_signals": ["name", "city", "real_estate_context"]
    }
  ],
  "discarded_results": [
    {
      "url": "https://johnasmith-dentist.com",
      "reason": "no real estate context"
    },
    {
      "url": "https://www.zillow.com/profile/JohnSmithNY",
      "reason": "geo mismatch — New York vs Los Angeles"
    }
  ]
}
```

Everything that was discarded is logged with the reason. Nothing is silently dropped.

---

## STEP 4 — Classification

### Goal

Sort every validated URL into a bucket so the system knows exactly what to do with it next.

### Input

Validated results from Step 3 (each with a confidence score and matched signals).

### The Five Buckets

Every URL goes into ONE AND ONLY ONE bucket. No "mixed." No "maybe." If it doesn't cleanly fit → irrelevant.

| Bucket | What it is | Next action |
|--------|-----------|-------------|
| personal_website | The agent's own website | Crawl in Step 5 |
| brokerage_profile | Agent's page on their brokerage site | Crawl in Step 5 |
| social_profile | LinkedIn, Instagram, Facebook, X, YouTube, TikTok | Verify in Step 5 |
| directory_or_aggregator | Zillow/Redfin/Realtor duplicates, "Best Agents" pages, Yelp listings | Extract references only in Step 5 |
| irrelevant | Anything that doesn't fit cleanly | Discard |

### Classification Rules

**personal_website:**
- Domain is NOT a known directory or social platform
- Page represents this specific agent (not a team page or brokerage homepage)
- Name matches the canonical identity
- Real estate context is clear
- Examples: johnsmithrealty.com, smithhomesla.com
- NOT personal sites: brokerage main homepages, franchise landing pages, "Top Agents in LA" pages

**brokerage_profile:**
- Hosted on a known brokerage domain
- Clearly an individual agent bio or profile page
- Brokerage name matches or is related to Step 1 brokerage
- Examples: coldwellbanker.com/agent/john-smith, kw.com/agent/johnsmith
- These are HIGH VALUE — always crawl

**social_profile:**
- Domain is a known social platform (LinkedIn, Instagram, Facebook, X/Twitter, YouTube, TikTok)
- Appears to be an individual account (not a company page)
- Name resemblance exists in title or snippet
- No deep verification yet — that happens in Step 5

**directory_or_aggregator:**
- Lists many agents (not just one)
- SEO-style "top agents" or "best realtors" pages
- Duplicate profiles on Zillow, Redfin, Realtor.com (the ones found in Step 2B)
- Do NOT crawl these deeply — only scan for outbound links in Step 5

**irrelevant:**
- Everything else: news articles, legal docs, wrong profession, wrong person that somehow passed validation at low confidence, random mentions

### Known Domain Lists (use these for classification)

**Social platforms:**
```
linkedin.com, instagram.com, facebook.com, twitter.com, x.com,
youtube.com, tiktok.com
```

**Directory / aggregator platforms:**
```
zillow.com, redfin.com, realtor.com, trulia.com, homes.com,
yelp.com, google.com/maps, homesmart.com
```

**Known brokerage domains (partial list — expand as needed):**
```
coldwellbanker.com, kw.com (Keller Williams), eXpWorld.com,
century21.com, sothebysrealty.com, remax.com, berkshirehathaway.com,
douglaselliman.com, compass.com, christiesrealestate.com
```

### Output

```json
{
  "classified": [
    {
      "url": "https://www.coldwellbanker.com/agent/john-a-smith",
      "bucket": "brokerage_profile",
      "confidence": 0.95,
      "action": "crawl"
    },
    {
      "url": "https://johnsmithrealty.com",
      "bucket": "personal_website",
      "confidence": 0.80,
      "action": "crawl"
    },
    {
      "url": "https://linkedin.com/in/johnasmith-realtor",
      "bucket": "social_profile",
      "confidence": 0.80,
      "action": "verify"
    }
  ],
  "queues": {
    "crawl": ["https://www.coldwellbanker.com/agent/john-a-smith", "https://johnsmithrealty.com"],
    "verify": ["https://linkedin.com/in/johnasmith-realtor"],
    "reference_extract": ["https://www.zillow.com/profile/JohnASmith/"]
  }
}
```

---

## STEP 5 — Deep Extraction & Verification

### Goal

Actually go into the high-value pages and pull out every piece of publicly available contact and identity information. This is where the real data lives.

### Input

The classified queues from Step 4:
- crawl queue (personal websites + brokerage profiles)
- verify queue (social profiles)
- reference_extract queue (directories)

### Part A — Website & Brokerage Crawling

**What to crawl:**

For each URL in the crawl queue, use Firecrawl to scrape these pages ONLY:
- Homepage
- /about
- /contact
- Footer (included in homepage scrape)

Max depth = 1. No blog crawling. No pagination. No recursive crawling.

**Firecrawl crawl API call:**

```javascript
const response = await fetch('https://api.firecrawl.dev/v1/crawl', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: targetUrl,
    limit: 5,
    scrapeOptions: {
      formats: ['markdown'],
      includeTags: ['a', 'p', 'div', 'span', 'footer', 'header'],
      actions: [{ type: 'wait', duration: 2000 }]
    },
    allowedPaths: ['/', '/about', '/contact']
  })
});
```

**What to extract from crawled pages:**

| Data Type | What to look for | Storage format |
|-----------|-----------------|----------------|
| Emails | mailto: links, plain text emails, obfuscated emails (decode if trivial) | Raw value + source page |
| Phone Numbers | Visible numbers, tel: links, WhatsApp click-to-chat | Raw value + source page |
| Social Links | Explicit links to known social platforms | Platform name + URL |
| Booking Tools | Calendly, Acuity, contact forms, CRM widgets | Tool name + URL |
| Schema Data | schema.org Person or RealEstateAgent markup | Full schema block |

**Rules:**
- Only extract what actually appears on the crawled pages
- No guessing, no pattern inference at this stage
- Store everything raw first — normalization happens in Step 6

### Part B — Social Profile Verification

For each URL in the verify queue, use Firecrawl to scrape the profile page and check ALL of these:

| Check | Requirement |
|-------|-------------|
| Name match | Profile name matches Step 1 identity (fuzzy match, 80%+ threshold) |
| Real person | Profile photo appears to be a real human, not a logo or stock image |
| Real estate context | Bio, posts, or profile mentions real estate in some way |
| Location or brokerage | City, state, or brokerage name appears somewhere on the profile |

**All four checks must pass.** If any single check fails → discard this social profile entirely.

If verified:
- Store the profile URL
- Store the platform name
- Do NOT scrape followers, posts, or connection counts
- Do NOT try to extract emails from bios

Social profiles are identity proof, not data mines.

### Part C — Directory Reference Extraction

For each URL in the reference_extract queue:

1. Scrape the page with Firecrawl
2. Scan ONLY for outbound links
3. Capture any links that point to:
   - Personal websites
   - Brokerage profiles
   - Social profiles
4. If any NEW URLs are found that haven't been seen before in this pipeline → send them back to Step 3 for validation
5. This happens ONE TIME ONLY. No loops, no recursive discovery.

**Important:** Do not trust any data directly on the directory page itself. Only trust what it LINKS TO.

### Email Priority Logic

If multiple emails are found across different sources, rank them by confidence:

| Priority | Source | Confidence |
|----------|--------|------------|
| 1 (highest) | Found on agent's personal website | 0.90 – 0.95 |
| 2 | Found on brokerage profile page | 0.85 |
| 3 | Found via WHOIS on agent's domain | 0.40 |
| 4 (last resort) | Pattern-based guess using brokerage domain | 0.60 (if validated) |

**Pattern guess rules (last resort only):**
- Only attempted if a brokerage domain is known
- Only ONE pattern attempt per brokerage domain
- Format examples: firstname.lastname@brokerage.com, flastname@brokerage.com
- MUST be validated via SMTP or MX record check before being kept
- If validation fails → permanently discarded, never tried again

### Confidence on Every Data Point

Every piece of extracted data is stored with its source and confidence:

```json
{
  "value": "john.smith@coldwellbanker.com",
  "source": "brokerage_profile",
  "source_url": "https://www.coldwellbanker.com/agent/john-a-smith",
  "confidence": 0.85,
  "extraction_method": "plain_text"
}
```

No confidence score = the data point is thrown out in Step 6.

### Output

```json
{
  "emails": [
    { "value": "john.smith@coldwellbanker.com", "source": "brokerage_profile", "confidence": 0.85 },
    { "value": "jsmith@johnsmithrealty.com", "source": "personal_website", "confidence": 0.92 }
  ],
  "phones": [
    { "value": "(310) 555-0182", "source": "personal_website", "confidence": 0.90 }
  ],
  "socials": {
    "linkedin": { "url": "https://linkedin.com/in/johnasmith-realtor", "verified": true },
    "instagram": { "url": "https://instagram.com/johnasmithrealty", "verified": true }
  },
  "booking_tools": [
    { "tool": "Calendly", "url": "https://calendly.com/john-a-smith/meeting" }
  ],
  "not_found": ["facebook", "youtube", "personal_phone"]
}
```

Everything that wasn't found is explicitly logged. Nothing is silently assumed to not exist.

---

## STEP 6 — Assembly

### Goal

Take everything from Steps 1–5 and merge it into one clean, deduplicated, confidence-scored final profile.

### Input

- Clean identity from Step 1
- All extracted and verified data from Step 5 (with confidence scores and sources attached to every item)

### How It Works

1. **Deduplicate** — if the same email appears from two different sources, keep one entry with the HIGHER confidence score. Same for phones and social links.

2. **Sort by confidence** — within each category, highest confidence data comes first.

3. **Attach source traceability** — every field in the final profile has a `source` and `source_url` so you can always trace exactly where a piece of data came from.

4. **Flag low confidence** — anything between 0.60 and 0.70 is kept but marked as `"verified": false`.

5. **Calculate overall confidence** — average the confidence scores of all extracted data points to get an overall profile confidence number.

### Output — Final Profile

```json
{
  "identity": {
    "full_name": "John A. Smith",
    "brokerage": "Coldwell Banker Realty",
    "city": "Los Angeles",
    "state": "CA",
    "source_platform": "zillow",
    "profile_url": "https://www.zillow.com/profile/JohnASmith/"
  },
  "contact": {
    "emails": [
      {
        "value": "jsmith@johnsmithrealty.com",
        "source": "personal_website",
        "source_url": "https://johnsmithrealty.com/contact",
        "confidence": 0.92,
        "verified": true
      },
      {
        "value": "john.smith@coldwellbanker.com",
        "source": "brokerage_profile",
        "source_url": "https://www.coldwellbanker.com/agent/john-a-smith",
        "confidence": 0.85,
        "verified": true
      }
    ],
    "phones": [
      {
        "value": "(310) 555-0182",
        "source": "personal_website",
        "source_url": "https://johnsmithrealty.com/contact",
        "confidence": 0.90,
        "verified": true
      }
    ]
  },
  "online_presence": {
    "personal_website": {
      "url": "https://johnsmithrealty.com",
      "confidence": 0.80
    },
    "brokerage_profile": {
      "url": "https://www.coldwellbanker.com/agent/john-a-smith",
      "confidence": 0.95
    },
    "socials": {
      "linkedin": {
        "url": "https://linkedin.com/in/johnasmith-realtor",
        "verified": true,
        "confidence": 0.80
      },
      "instagram": {
        "url": "https://instagram.com/johnasmithrealty",
        "verified": true,
        "confidence": 0.80
      },
      "facebook": null,
      "youtube": null
    },
    "booking_tools": [
      {
        "tool": "Calendly",
        "url": "https://calendly.com/john-a-smith/meeting",
        "source": "personal_website",
        "confidence": 0.90
      }
    ]
  },
  "duplicate_profiles": [
    { "platform": "redfin", "url": "https://www.redfin.com/real-estate-agents/12345/john-a-smith" },
    { "platform": "realtor", "url": "https://www.realtor.com/realestateagents/JohnASmith_Los-Angeles_CA" }
  ],
  "confidence_report": {
    "overall": 0.87,
    "identity": 1.0,
    "contact_info": 0.89,
    "online_presence": 0.84,
    "data_completeness": "high"
  },
  "audit_trail": {
    "steps_completed": ["step1", "step2", "step3", "step4", "step5", "step6"],
    "total_urls_discovered": 14,
    "urls_validated": 8,
    "urls_discarded": 6,
    "discard_reasons": {
      "geo_mismatch": 2,
      "no_real_estate_context": 2,
      "name_mismatch": 1,
      "below_confidence_threshold": 1
    },
    "pages_crawled": 5,
    "social_profiles_verified": 2,
    "social_profiles_discarded": 1,
    "firecrawl_calls_used": 8,
    "serper_calls_used": 2
  }
}
```

This is the final deliverable. Everything is sourced, scored, traceable, and ready for website generation.

---

## Error Handling

Every possible failure point and how the system deals with it:

| What goes wrong | Where it hits | How the system handles it |
|-----------------|--------------|---------------------------|
| Profile URL is invalid or doesn't load | Step 1 | Firecrawl returns error → pipeline stops with clear error message |
| Agent name can't be extracted | Step 1 | Validation fails → pipeline stops, tells user the page couldn't be parsed |
| City or state is missing | Step 1 | Validation fails → pipeline stops |
| Google returns zero results | Step 2 | Cross-platform searches still run. If both return zero → FAIL with error |
| Firecrawl times out on a crawl | Step 5 | That URL is logged as failed, pipeline continues with remaining URLs |
| Agent name is extremely common | Step 3 | Geo + brokerage matching filters out wrong people. Low confidence results are discarded |
| Wrong person's data gets through | Step 3 | Confidence scoring catches it. Anything below 0.60 is removed |
| Agent has no personal website | Step 5 | Logged as "not found" in output. Pipeline doesn't fail |
| Email pattern guess is invalid | Step 5 | SMTP/MX validation catches it. Permanently discarded |
| Directory links to a new unknown page | Step 5 | New URL goes back to Step 3 for validation. Only happens once — no loops |
| Social profile fails verification | Step 5 | Discarded with reason logged. Pipeline continues |
| Firecrawl or Serper API key is invalid | Any step | Immediate failure with clear auth error |
| Rate limit hit on Firecrawl or Serper | Any step | Retry with exponential backoff (max 3 retries). If still failing, log and continue |

---

## Environment Variables

The system needs these configured before running:

```env
FIRECRAWL_API_KEY=fc-335e33935bf743d6b24bed0825b818aa
SERPER_API_KEY=63cf9c8b7bb3c6bfdf10d7d0a93f2e34754bec25
```

---

## Recommended Libraries

**Node.js:**
- `axios` — HTTP requests to Firecrawl and Serper APIs
- `fuse.js` — fuzzy name matching in Step 3
- `dns` (built-in) — MX record validation for email guesses

**Python (if you prefer):**
- `httpx` or `requests` — HTTP requests
- `thefuzz` or `rapidfuzz` — fuzzy name matching
- `dns.resolver` (dnspython) — MX record validation

---

## Costs Breakdown

| Service | Plan | Monthly Cost | What it covers |
|---------|------|-------------|----------------|
| Firecrawl | Hobby | $16 | 3,000 page scrapes/crawls |
| Serper | Free tier | $0 (100 searches) | Google searches |
| Serper | If > 100 searches | ~$1-3 | Additional searches |
| **Total** | | **$16 – $19/month** | Enough for ~100-150 agent profiles |

If you scale beyond 150 agents/month, move Firecrawl to the Standard plan ($83/month) which gives 100,000 pages.

---

## Next Step

After this pipeline produces the final profile JSON, that data feeds into the website generation step — building a personalized website for the agent using all the information collected here.
