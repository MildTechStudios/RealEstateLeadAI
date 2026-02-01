/**
 * API Server for Agent Scraper
 * 
 * Exposes the CB extraction as an HTTP endpoint for the web frontend.
 * Automatically saves extracted profiles to the Lead Management System (Supabase).
 */

import * as dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { extractCBProfile } from './extractors/coldwellbanker';
import { saveProfile } from './services/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// CB Profile Extraction
app.post('/api/extract', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    // Validate it's a CB URL
    if (!url.includes('coldwellbanker.com')) {
        return res.status(400).json({ error: 'URL must be from coldwellbanker.com' });
    }

    try {
        console.log(`[API] Extracting profile from: ${url}`);
        const profile = await extractCBProfile(url);

        if (!profile.extraction_success) {
            // If provided extracted data but marked as failed, return it with 422
            return res.status(422).json(profile);
        }

        // Auto-Save to Database
        console.log('[API] Auto-saving profile to Lead Management System...');
        const saveResult = await saveProfile(profile);

        // Return profile with save status
        res.json({
            ...profile,
            saved_to_db: saveResult.success,
            db_id: saveResult.id,
            db_error: saveResult.error
        });

    } catch (error: any) {
        console.error('[API] Extraction error:', error);
        res.status(500).json({ error: error.message || 'Extraction failed' });
    }
});

import { getLeads } from './services/db';

// Get All Leads
app.get('/api/leads', async (req, res) => {
    try {
        console.log('[API] Fetching leads...');
        const result = await getLeads();

        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }

        res.json(result.data);
    } catch (error: any) {
        console.error('[API] Error fetching leads:', error);
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
});

// Delete Lead
import { deleteLead } from './services/db';

app.delete('/api/leads/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`[API] Deleting lead: ${id}`);

        const result = await deleteLead(id);

        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }

        res.json({ success: true });
    } catch (error: any) {
        console.error('[API] Error deleting lead:', error);
        res.status(500).json({ error: 'Failed to delete lead' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Agent Scraper API running on http://localhost:${PORT}`);
    console.log(`   POST /api/extract - Extract & Auto-Save CB profile`);
    console.log(`   GET  /api/health  - Health check\n`);
});
