# Agent Scraper & Lead Management System

A production-ready full-stack automation tool for scraping real estate agent profiles from Coldwell Banker, analyzing the data, and managing leads via a professional dashboard.

## 🚀 Features
- **Scraper Engine**: Robust extraction of agent details (Bio, Contact, Socials, Headshot) using Firecrawl & Cheerio.
- **Smart Parsing**: Uses JSON-LD and DOM analysis to extract full bios without truncation.
- **Auto-Save**: Integrated with Supabase to automatically save valid profiles as leads.
- **Lead Dashboard**: A "Glassmorphism" UI to view, search, and manage your scraped leads.
- **Lead Management**: Delete unwanted leads directly from the interface.

## 🛠️ Tech Stack
- **Frontend**: React, Vite, Tailwind CSS v4, Framer Motion.
- **Backend**: Node.js, Express, TypeScript.
- **Database**: Supabase (PostgreSQL).
- **Scraping**: Firecrawl (API), Cheerio.

## 📁 Project Structure
- `scraper-agent/`: Backend API and Scraper Logic.
- `web/`: Frontend React Application.
- `supabase/`: SQL schemas and database config.

## 🏁 Getting Started

### 1. Setup Backend
```bash
cd scraper-agent
npm install
cp .env.example .env  # Add your SUPABASE & FIRECRAWL keys
npm run server
```

### 2. Setup Frontend
```bash
cd web
npm install
npm run dev
```

### 3. Usage
- Open `http://localhost:5173`.
- Enter a Coldwell Banker agent URL.
- Click **Fetch Profile**.
- View your data in the **My Leads** tab.
