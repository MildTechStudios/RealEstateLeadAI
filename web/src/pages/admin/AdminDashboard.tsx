import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { LogOut, Zap, LayoutDashboard, Settings, BarChart } from 'lucide-react'
import { getWebsiteBySlug, type DBProfile } from '../../services/api'
import { DomainManager } from '../../components/admin/DomainManager'

export function AdminDashboard() {
    const { slug } = useParams()
    const navigate = useNavigate()
    const [agent, setAgent] = useState<DBProfile | null>(null)

    // Auth & Data Fetch
    useEffect(() => {
        async function init() {
            if (!slug) return
            const token = localStorage.getItem(`admin_token_${slug}`)
            if (!token) {
                navigate(`/w/${slug}/admin/login`)
                return
            }

            try {
                const data = await getWebsiteBySlug(slug)
                setAgent(data)
            } catch (err) {
                console.error(err)
            }
        }
        init()
    }, [slug, navigate])

    const handleLogout = () => {
        if (slug) localStorage.removeItem(`admin_token_${slug}`)
        navigate(`/w/${slug}/admin/login`)
    }

    const handleLaunchEditor = () => {
        // Navigate to public website with edit=true param
        window.open(`/w/${slug}?edit=true`, '_blank')
    }

    return (
        <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex">
            {/* Sidebar */}
            <aside className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col">
                <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                    {agent ? (
                        <>
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-teal-500/30 flex-shrink-0">
                                <img
                                    src={agent.headshot_url || ''}
                                    alt={agent.full_name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-sm truncate">{agent.full_name}</p>
                                <p className="text-xs text-slate-500 truncate">Admin Console</p>
                            </div>
                        </>
                    ) : (
                        // Loading Skeleton
                        <>
                            <div className="w-10 h-10 bg-slate-800 rounded-full animate-pulse" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-slate-800 rounded w-24 animate-pulse" />
                                <div className="h-3 bg-slate-800 rounded w-16 animate-pulse" />
                            </div>
                        </>
                    )}
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <button className="w-full flex items-center gap-3 px-4 py-3 bg-teal-500/10 text-teal-400 rounded-xl font-medium transition-colors">
                        <LayoutDashboard className="w-5 h-5" />
                        Overview
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl font-medium transition-colors">
                        <BarChart className="w-5 h-5" />
                        Analytics
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl font-medium transition-colors">
                        <Settings className="w-5 h-5" />
                        Settings
                    </button>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl font-medium transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col">
                {/* Header */}
                <header className="h-20 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-8">
                    <h1 className="text-xl font-semibold text-white">Dashboard</h1>

                    <button
                        onClick={handleLaunchEditor}
                        className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold rounded-lg transition-all shadow-lg shadow-teal-500/20"
                    >
                        <Zap className="w-4 h-4" />
                        Open Visual Editor
                    </button>
                </header>

                {/* Content Area */}
                <div className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-4xl mx-auto space-y-8">

                        {/* Summary Cards */}
                        <div className="grid grid-cols-3 gap-6">
                            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                                <h3 className="text-slate-400 text-sm font-medium mb-2">Total Views</h3>
                                <p className="text-3xl font-bold text-white">1,240</p>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                                <h3 className="text-slate-400 text-sm font-medium mb-2">Leads Captured</h3>
                                <p className="text-3xl font-bold text-teal-400">12</p>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                                <h3 className="text-slate-400 text-sm font-medium mb-2">Avg. Time</h3>
                                <p className="text-3xl font-bold text-white">2m 15s</p>
                            </div>
                        </div>

                        {/* Domain Manager */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                {agent ? (
                                    <DomainManager
                                        agentId={agent.id}
                                        initialDomain={agent.website_config?.custom_domain}
                                        token={localStorage.getItem(`admin_token_${slug}`) || ''}
                                    />
                                ) : (
                                    <div className="p-12 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-500">
                                        Loading Domain Settings...
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <LayoutDashboard className="w-8 h-8 text-slate-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Welcome to your Dashboard</h2>
                            <p className="text-slate-400 max-w-lg mx-auto">
                                This is where you'll manage your leads, analytics, and website settings.
                                Use the "Open Visual Editor" button above to customize your public website.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
