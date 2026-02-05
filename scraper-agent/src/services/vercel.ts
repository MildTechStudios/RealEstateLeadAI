

const VERCEL_API_BASE = 'https://api.vercel.com';
const PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const TEAM_ID = process.env.VERCEL_TEAM_ID; // Optional
const AUTH_TOKEN = process.env.VERCEL_AUTH_TOKEN;

// Helper to construct URL with teamId if present
const getUrl = (path: string) => {
    let url = `${VERCEL_API_BASE}${path}?projectId=${PROJECT_ID}`;
    if (TEAM_ID) {
        url += `&teamId=${TEAM_ID}`;
    }
    console.log(`[Vercel] Request URL: ${url} (TeamID: ${TEAM_ID ? 'YES' : 'NO'})`);
    return url;
};

const headers = {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
};

// HELPER: Improved Error Handling
const handleResponse = async (res: any, context: string) => {
    const text = await res.text();
    console.log(`[Vercel] ${context} Response: ${res.status} ${text.substring(0, 200)}...`);

    if (!res.ok) {
        console.error(`[Vercel] ${context} Failed:`, res.status, text);
        let message = 'Vercel API request failed';
        let errorDetails: any = {};
        try {
            const json = JSON.parse(text);
            message = json.error?.message || message;
            errorDetails = json.error || {};
        } catch (e) {
            message = text || message;
        }

        // Attach full details to the error object for upstream handling
        const error: any = new Error(message);
        error.details = errorDetails;
        error.status = res.status;
        throw error;
    }

    return text ? JSON.parse(text) : {};
}

export const vercelService = {
    addDomain: async (domain: string) => {
        console.log(`[Vercel] Adding domain: ${domain}`);
        // POST /v10/projects/:idOrName/domains
        const response = await fetch(getUrl(`/v10/projects/${PROJECT_ID}/domains`), {
            method: 'POST',
            headers,
            body: JSON.stringify({ name: domain }),
        });
        return handleResponse(response, 'Add Domain');
    },

    getDomainStatus: async (domain: string) => {
        // GET /v10/projects/:idOrName/domains/:domain
        const url = getUrl(`/v10/projects/${PROJECT_ID}/domains/${domain}`);
        const response = await fetch(url, {
            method: 'GET',
            headers,
        });

        if (!response.ok) {
            if (response.status === 404) return null; // Domain not on project
            const text = await response.text();
            console.error('[Vercel] Get Status Failed:', response.status, text);
            throw new Error('Failed to get domain status');
        }

        const data = await response.json();
        console.log(`[Vercel] Domain Status for ${domain}:`, JSON.stringify(data, null, 2)); // Log full detail
        return data;
    },

    removeDomain: async (domain: string) => {
        console.log(`[Vercel] Removing domain: ${domain}`);
        // DELETE /v10/projects/:idOrName/domains/:domain
        // Note: Docs say v9, but v10 is consistent. If fails, we revert.
        const response = await fetch(getUrl(`/v10/projects/${PROJECT_ID}/domains/${domain}`), {
            method: 'DELETE',
            headers,
        });
        return handleResponse(response, 'Remove Domain');
    },

    verifyDomain: async (domain: string) => {
        console.log(`[Vercel] Verifying domain: ${domain}`);
        // POST /v9/projects/:idOrName/domains/:domain/verify
        const response = await fetch(getUrl(`/v9/projects/${PROJECT_ID}/domains/${domain}/verify`), {
            method: 'POST',
            headers,
        });
        return handleResponse(response, 'Verify Domain');
    }
};
