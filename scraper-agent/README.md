# Real Estate Agent Scraper

A Node.js CLI tool that takes a single agent profile URL (Zillow, Redfin, or Realtor.com) and automatically discovers and aggregates comprehensive information about that agent.

## Features

- **Identity Extraction** — Parses agent name, brokerage, and location from the source profile
- **Discovery** — Google search + cross-platform search to find all online presence
- **Validation** — Fuzzy name matching + geo filtering to eliminate wrong-person results
- **Classification** — Routes URLs to appropriate processing (crawl vs verify vs reference)
- **Deep Extraction** — Extracts emails, phones, social links, and booking tools
- **Assembly** — Deduplicates and produces a confidence-scored final profile

## Prerequisites

1. **Node.js 18+** installed
2. **API Keys** required:
   - [Firecrawl](https://firecrawl.dev) — Web scraping ($16/month for 3,000 pages)
   - [Serper](https://serper.dev) — Google search (Free tier: 100 searches)
3. **Supabase** (optional) — For database storage

## Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env and add your API keys
```

## Usage

```bash
# Run with a Zillow profile
npm start -- --url "https://www.zillow.com/profile/AgentName/"

# Run with a Redfin profile
npm start -- --url "https://www.redfin.com/real-estate-agents/12345/agent-name"

# Run with a Realtor.com profile
npm start -- --url "https://www.realtor.com/realestateagents/AgentName_City_ST"

# Skip Supabase save
npm start -- --url "https://www.zillow.com/profile/AgentName/" --skip-supabase
```

## Output

The tool produces:

1. **Final JSON profile** saved to `output/AgentName_timestamp.json`
2. **Debug files** saved to `output/debug/` for each pipeline step
3. **Supabase record** (if configured) in the `scraped_agents` table

## Project Structure

```
scraper-agent/
├── src/
│   ├── main.ts           # CLI entry point
│   ├── step1-extract.ts  # Identity extraction
│   ├── step2-discover.ts # Google + platform search
│   ├── step3-validate.ts # Fuzzy matching + geo filter
│   ├── step4-classify.ts # URL bucketing
│   ├── step5-extract.ts  # Deep crawling + data extraction
│   ├── step6-assemble.ts # Merge + dedupe + final profile
│   ├── supabase.ts       # Database operations
│   ├── types.ts          # TypeScript interfaces
│   └── utils/
│       ├── firecrawl.ts  # Firecrawl API wrapper
│       ├── serper.ts     # Serper API wrapper
│       └── fuzzy.ts      # Name matching logic
├── output/               # JSON output files
├── .env                  # API keys (create from .env.example)
└── package.json
```

## Supabase Table Schema

If using Supabase, create this table:

```sql
CREATE TABLE scraped_agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  brokerage TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  source_platform TEXT NOT NULL,
  source_url TEXT NOT NULL UNIQUE,
  primary_email TEXT,
  primary_phone TEXT,
  personal_website TEXT,
  brokerage_profile TEXT,
  linkedin_url TEXT,
  instagram_url TEXT,
  facebook_url TEXT,
  overall_confidence DECIMAL(3,2),
  data_completeness TEXT,
  raw_profile JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Cost Estimate

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| Firecrawl | Hobby | $16 |
| Serper | Free tier | $0 |
| **Total** | | **~$16-19/month** |

Covers approximately 100-150 agent profiles per month.
