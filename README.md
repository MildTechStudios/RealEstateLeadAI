# RealEstateLeadAI & Agent Website Generator

A production-ready full-stack automation system that extracts real estate agent profiles, manages leads, and **instantly generates premium, high-converting personal websites** for each agent.

## 🚀 Key Features

### 🕷️ Intelligent Scraping & Lead Gen
- **Automated Extraction**: Pulls comprehensive agent details (Bio, Contact, Socials, Headshot) from Coldwell Banker profiles using Firecrawl & Cheerio.
- **Smart Parsing**: Uses JSON-LD and advanced DOM analysis to capture full bios without truncation.
- **CRM Dashboard**: A "Glassmorphism" UI to view, search, and manage your scraped leads.
- **One-Click Export**: Delete unwanted leads or export data directly.

### 🌐 Instant Website Generation
- **Dynamic Routing**: instantly creates a public website for every lead at `/w/[agent-slug]`.
- **Premium Design**:
  - **Animated Hero Section**: Professional first impression with staggered entrance animations.
  - **Modern Footer**: 4-column layout with brand identity, quick links, and contact info.
  - **Testimonials Showcase**: Auto-scrolling reviews to build trust.
- **Mobile-First Experience**:
  - **Fullscreen Mobile Menu**: App-like navigation with body scroll locking and large touch targets.
  - **Smooth Scrolling**: Native smooth scroll for all anchor links.
- **Contact Integration**: Built-in contact form powered by **Resend** to email agents directly.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS v4, Framer Motion (Animations).
- **Backend**: Node.js, Express, TypeScript.
- **Database**: Supabase (PostgreSQL) for persistence.
- **Email**: Resend API for transactional emails.
- **Scraping**: Firecrawl (API) + Cheerio (HTML Parsing).

## 📁 Project Structure

- `scraper-agent/`: Backend API, Email Service, and Scraper Logic.
- `web/`: Frontend React Application & Website Generator.
- `supabase/`: SQL schemas and database configuration.

## 🏁 Getting Started

### 1. Setup Backend
```bash
cd scraper-agent
npm install
cp .env.example .env
# Required Env Vars:
# SUPABASE_URL, SUPABASE_KEY, FIRECRAWL_API_KEY, RESEND_API_KEY
npm run server
```

### 2. Setup Frontend
```bash
cd web
npm install
npm run dev
```

### 3. Usage
1. Open `http://localhost:5173`.
2. Enter a Coldwell Banker agent URL to extract their profile.
3. Click **Fetch Profile** -> **Save Lead**.
4. Go to **My Leads** and click the **Globe Icon** to view their generated website.

## 🚀 Deployment

### Render (Backend)
- Connect the `scraper-agent` folder.
- **Critical**: Add Environment Variables (`RESEND_API_KEY`, etc.) in the Render Dashboard.
- If `RESEND_API_KEY` is missing, the API will start but email features will be disabled.

### Vercel (Frontend)
- Connect the `web` folder.
- Add `VITE_API_URL` pointing to your Render backend.
- Ensure all build settings are default (`vite build`).

## 🔄 Recent Updates
- **Global Footer**: Redesigned with license info, social links, and brokerage compliance.
- **Mobile Navigation**: Fixed scrolling issues with a robust fullscreen overlay menu.
- **Deployment Safety**: Added runtime checks for missing API keys to prevent crashes.
