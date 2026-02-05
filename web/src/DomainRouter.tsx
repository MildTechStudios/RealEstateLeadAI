import { useState, useEffect } from 'react'
import { PublicWebsite } from './pages/PublicWebsite'
import App from './App'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export function DomainRouter() {
    const [loading, setLoading] = useState(true)
    const [customSlug, setCustomSlug] = useState<string | null>(null)
    const [error, setError] = useState<boolean>(false)

    useEffect(() => {
        const checkDomain = async () => {
            const hostname = window.location.hostname

            // Allow localhost/vercel to pass through to main App
            if (hostname.includes('localhost') ||
                hostname.includes('127.0.0.1') ||
                hostname.includes('.vercel.app') ||
                hostname === 'agent-scraper-web.vercel.app') { // Explicit fallback
                setLoading(false)
                return
            }

            try {
                // It's a custom domain! Check if it maps to an agent.
                const res = await fetch(`${API_BASE}/api/public/lookup-domain?domain=${hostname}`)
                if (res.ok) {
                    const data = await res.json()
                    if (data.slug) {
                        setCustomSlug(data.slug)
                    } else {
                        setError(true)
                    }
                } else {
                    setError(true)
                }
            } catch (err) {
                console.error('Domain lookup failed', err)
                setError(true)
            } finally {
                setLoading(false)
            }
        }

        checkDomain()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-slate-800 border-t-teal-500 rounded-full animate-spin"></div>
            </div>
        )
    }

    if (customSlug) {
        return <PublicWebsite slug={customSlug} />
    }

    if (error) {
        // Fallback or Error Page for unmapped domains
        return (
            <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 text-center">
                <h1 className="text-3xl font-bold mb-4">Site Not Found</h1>
                <p className="text-slate-400">The custom domain <b>{window.location.hostname}</b> is not connected to a published website.</p>
            </div>
        )
    }

    // Default: Render the Dashboard App
    return <App />
}
