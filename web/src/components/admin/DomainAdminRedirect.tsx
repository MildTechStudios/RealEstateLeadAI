
import { useDomainLookup } from '../../hooks/useDomainLookup'

export function DomainAdminRedirect() {
    const { loading, slug, error, isCustomDomain } = useDomainLookup()

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-slate-800 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
        )
    }

    // If it's a custom domain and we have a slug, redirect to the main app's admin panel
    if (isCustomDomain && slug) {
        const adminUrl = `https://real-estate-lead-ai.vercel.app/w/${slug}/admin`
        if (window.location.origin !== 'https://real-estate-lead-ai.vercel.app') {
            window.location.href = adminUrl
            return null
        }
    }

    // If not a custom domain OR lookup failed, show 404
    if (error || (isCustomDomain && !slug)) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 text-center">
                <h1 className="text-3xl font-bold mb-4">Admin Not Found</h1>
                <p className="text-slate-400">The admin panel for this domain could not be located.</p>
            </div>
        )
    }

    return null
}
