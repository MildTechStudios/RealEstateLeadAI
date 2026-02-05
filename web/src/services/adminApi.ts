

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

/**
 * Helper to get Auth Headers (Reused from api.ts logic)
 * Ideally we should export this from api.ts
 */
const getAuthHeaders = (): Record<string, string> => {
    const key = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
    if (!key) return {}
    try {
        const session = JSON.parse(localStorage.getItem(key) || '{}')
        if (session.access_token) {
            return { 'Authorization': `Bearer ${session.access_token}` }
        }
    } catch (e) {
        console.error('Error parsing auth token', e)
    }
    return {}
}

export const adminApi = {
    // Legacy Login removed. No more separate login.

    getConfig: async (id: string) => {
        const response = await fetch(`${API_BASE}/api/admin/config/${id}`, {
            headers: getAuthHeaders(),
        })

        if (!response.ok) throw new Error('Failed to fetch config')
        return response.json()
    },

    updateConfig: async (id: string, config: any) => {
        const response = await fetch(`${API_BASE}/api/admin/config/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
            body: JSON.stringify(config),
        })

        if (!response.ok) throw new Error('Failed to update config')
        return response.json()
    },

    uploadImage: async (slug: string, file: File) => {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch(`${API_BASE}/api/admin/upload/${slug}`, {
            method: 'POST',
            headers: getAuthHeaders(), // No Content-Type for FormData
            body: formData,
        })

        if (!response.ok) {
            const err = await response.json().catch(() => ({}))
            throw new Error(err.error || 'Failed to upload image')
        }
        return response.json()
    },

    // --- Domain Management ---
    addDomain: async (domain: string) => {
        const response = await fetch(`${API_BASE}/api/admin/domains`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
            body: JSON.stringify({ domain }),
        })

        if (!response.ok) {
            const err = await response.json().catch(() => ({}))
            const error: any = new Error(err.message || err.error?.message || 'Failed to add domain')
            error.details = err.details || err;
            throw error
        }
        return response.json()
    },

    getDomainStatus: async (domain: string) => {
        const response = await fetch(`${API_BASE}/api/admin/domains/${domain}`, {
            headers: getAuthHeaders(),
        })

        if (!response.ok) {
            if (response.status === 404) return null
            throw new Error('Failed to get domain status')
        }
        return response.json()
    },

    verifyDomain: async (domain: string) => {
        const response = await fetch(`${API_BASE}/api/admin/domains/${domain}/verify`, {
            method: 'POST',
            headers: getAuthHeaders(),
        })

        if (!response.ok) {
            const err = await response.json().catch(() => ({}))
            const error: any = new Error(err.message || err.error || 'Failed to verify domain')
            error.details = err.details || err
            throw error
        }
        return response.json()
    },

    removeDomain: async (domain: string) => {
        const response = await fetch(`${API_BASE}/api/admin/domains/${domain}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        })

        if (!response.ok) throw new Error('Failed to remove domain')
        return response.json()
    }
}
