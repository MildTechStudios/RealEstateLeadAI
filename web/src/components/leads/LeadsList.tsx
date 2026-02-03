import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLeads, deleteLead, type DBProfile } from '../../services/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Search, ExternalLink, Mail, Phone, MapPin, Globe } from 'lucide-react'
import { LeadDetailsModal } from './LeadDetailsModal'

export function LeadsList() {
    // const navigate = useNavigate() // Removed as not used
    const [leads, setLeads] = useState<DBProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [selectedLead, setSelectedLead] = useState<DBProfile | null>(null)

    useEffect(() => {
        fetchLeads()
    }, [])

    const fetchLeads = async () => {
        try {
            const data = await getLeads()
            setLeads(data)
        } catch (err) {
            setError('Failed to load leads')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation() // Prevent row click events if any
        if (!confirm('Are you sure you want to delete this lead?')) return

        try {
            setDeletingId(id)
            await deleteLead(id)
            // Optimistic update
            setLeads(prev => prev.filter(l => l.id !== id))
        } catch (err) {
            alert('Failed to delete lead')
        } finally {
            setDeletingId(null)
        }
    }

    const filteredLeads = leads.filter(lead => {
        const term = searchTerm.toLowerCase()
        return (
            lead.full_name?.toLowerCase().includes(term) ||
            lead.brokerage?.toLowerCase().includes(term) ||
            lead.city?.toLowerCase().includes(term)
        )
    })

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-slate-700 border-t-teal-500 rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-400">Loading your leads...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-8 text-center bg-red-500/10 border border-red-500/20 rounded-2xl backdrop-blur-sm">
                <p className="text-red-400">{error}</p>
                <button
                    onClick={fetchLeads}
                    className="mt-4 px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                    Try Again
                </button>
            </div>
        )
    }

    return (
        <>
            <div className="space-y-6">
                {/* Header / Search */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/40 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <span className="w-2 h-6 bg-teal-500 rounded-full shadow-[0_0_10px_rgba(20,184,166,0.5)]"></span>
                        My Leads <span className="text-slate-500 text-sm font-normal ml-2">({leads.length})</span>
                    </h2>

                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search agents..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="space-y-3">
                    <AnimatePresence mode='popLayout'>
                        {filteredLeads.map((lead) => (
                            <motion.div
                                key={lead.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -50, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                onClick={() => setSelectedLead(lead)}
                                className="group relative bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-xl p-4 hover:bg-slate-800/60 hover:border-teal-500/20 transition-all duration-300 shadow-sm hover:shadow-lg cursor-pointer"
                            >
                                <div className="flex items-start sm:items-center gap-4">
                                    {/* Auto-Index or Avatar */}
                                    <div className="hidden sm:flex flex-shrink-0 w-12 h-12 bg-slate-800 rounded-full items-center justify-center border border-white/5 overflow-hidden">
                                        {lead.headshot_url ? (
                                            <img src={lead.headshot_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-slate-500 font-bold text-lg">{lead.full_name[0]}</span>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-12 gap-4">
                                        {/* Name & Title */}
                                        <div className="sm:col-span-4">
                                            <h3 className="font-semibold text-white truncate group-hover:text-teal-400 transition-colors">
                                                {lead.full_name}
                                            </h3>
                                            <p className="text-xs text-slate-400 truncate mt-0.5 flex items-center gap-1">
                                                {lead.brokerage && <span className="truncate">{lead.brokerage}</span>}
                                            </p>
                                        </div>

                                        {/* Location */}
                                        <div className="sm:col-span-3 flex items-center gap-2 text-sm text-slate-300">
                                            <MapPin className="w-3 h-3 text-slate-500" />
                                            <span className="truncate">{lead.city || 'Unknown'}, {lead.state || '—'}</span>
                                        </div>

                                        {/* Contacts */}
                                        <div className="sm:col-span-3 flex flex-col justify-center gap-1.5">
                                            <div className="flex items-center gap-2 text-xs text-slate-300 truncate">
                                                <Mail className="w-3 h-3 text-slate-500 flex-shrink-0" />
                                                <span className="truncate select-all">{lead.primary_email || '—'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-300 truncate">
                                                <Phone className="w-3 h-3 text-slate-500 flex-shrink-0" />
                                                <span className="truncate select-all">{lead.primary_phone || '—'}</span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="sm:col-span-2 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {lead.website_slug && (
                                                <a
                                                    href={`/w/${lead.website_slug}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="p-2 text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 rounded-lg transition-colors"
                                                    title="Open Website"
                                                >
                                                    <Globe className="w-4 h-4" />
                                                </a>
                                            )}
                                            <a
                                                href={lead.source_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                                                title="View Original Profile"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                            <button
                                                onClick={(e) => handleDelete(lead.id, e)}
                                                disabled={deletingId === lead.id}
                                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                                                title="Delete Lead"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {filteredLeads.length === 0 && !loading && (
                        <div className="text-center py-12 bg-slate-900/30 rounded-2xl border dashed border-slate-800">
                            <p className="text-slate-500">No leads found matching your search.</p>
                        </div>
                    )}
                </div>
            </div>



            {/* Lead Details Modal */}
            {
                selectedLead && (
                    <LeadDetailsModal
                        lead={selectedLead}
                        isOpen={!!selectedLead}
                        onClose={() => setSelectedLead(null)}
                        onUpdated={fetchLeads}
                    />
                )
            }
        </>
    )
}
