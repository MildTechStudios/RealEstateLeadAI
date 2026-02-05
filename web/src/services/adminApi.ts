export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface AdminLoginResponse {
    token: string
    slug: string
}

export const adminApi = {
    login: async (slug: string, password: string): Promise<AdminLoginResponse> => {
        const response = await fetch(`${API_BASE}/api/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug, password }),
        })

        if (!response.ok) {
            const data = await response.json().catch(() => ({ error: 'Login failed' }))
            throw new Error(data.error || 'Login failed')
        }

        return response.json()
    },

    getConfig: async (token: string) => {
        const response = await fetch(`${API_BASE}/api/admin/config`, {
            headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) throw new Error('Failed to fetch config')
        return response.json()
    },

    updateConfig: async (token: string, config: any) => {
        const response = await fetch(`${API_BASE}/api/admin/config`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(config),
        })

        if (!response.ok) throw new Error('Failed to update config')
        return response.json()
    },

    uploadImage: async (token: string, file: File) => {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch(`${API_BASE}/api/admin/upload`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        })

        if (!response.ok) {
            const err = await response.json().catch(() => ({}))
            throw new Error(err.error || 'Failed to upload image')
        }
        return response.json()
    },

    // --- Domain Management ---
    addDomain: async (token: string, domain: string) => {
        const response = await fetch(`${API_BASE}/api/admin/domains`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ domain }),
        })

        if (!response.ok) {
            const err = await response.json().catch(() => ({}))
            const error: any = new Error(err.message || err.error?.message || 'Failed to add domain')
            // Attach full error body (which might contain verification info from backend)
            // Backend sends `err.details` which is the Vercel error object (code, message, verification, etc.)
            // So `err` is that object.
            error.details = err;
            throw error
        }
        return response.json()
    },

    getDomainStatus: async (token: string, domain: string) => {
        const response = await fetch(`${API_BASE}/api/admin/domains/${domain}`, {
            headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) {
            if (response.status === 404) return null
            throw new Error('Failed to get domain status')
        }
        return response.json()
    },

    verifyDomain: async (token: string, domain: string) => {
        const response = await fetch(`${API_BASE}/api/admin/domains/${domain}/verify`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) {
            const err = await response.json().catch(() => ({}))
            const error: any = new Error(err.message || err.error || 'Failed to verify domain')
            error.details = err
            throw error
        }
        return response.json()
    },

    removeDomain: async (token: string, domain: string) => {
        const response = await fetch(`${API_BASE}/api/admin/domains/${domain}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) throw new Error('Failed to remove domain')
        return response.json()
    }
}
