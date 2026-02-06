
import { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export function useDomainLookup() {
    const [loading, setLoading] = useState(true)
    const [slug, setSlug] = useState<string | null>(null)
    const [error, setError] = useState(false)
    const [isCustomDomain, setIsCustomDomain] = useState(false)

    useEffect(() => {
        const checkDomain = async () => {
            const hostname = window.location.hostname

            if (hostname.includes('localhost') ||
                hostname.includes('127.0.0.1') ||
                hostname.includes('.vercel.app') ||
                hostname === 'real-estate-lead-ai.vercel.app' ||
                hostname === 'siteo.io' ||
                hostname === 'www.siteo.io') {
                setIsCustomDomain(false)
                setLoading(false)
                return
            }

            setIsCustomDomain(true)

            try {
                const res = await fetch(`${API_BASE}/api/public/lookup-domain?domain=${hostname}`)
                if (res.ok) {
                    const data = await res.json()
                    if (data.slug) {
                        setSlug(data.slug)
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

    return { loading, slug, error, isCustomDomain }
}
