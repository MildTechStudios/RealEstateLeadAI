import { PublicWebsite } from './pages/PublicWebsite'
import App from './App'
import { useDomainLookup } from './hooks/useDomainLookup'

export function DomainRouter() {
    const { loading, slug: customSlug, error } = useDomainLookup()

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
