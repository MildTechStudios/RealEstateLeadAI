import { useEffect, useState } from 'react'
import { getLeads, deleteLead, type DBProfile } from '../../services/api'
import { adminApi } from '../../services/adminApi'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Search, ExternalLink, Mail, Phone, MapPin, Globe, Send, Shield, X, Loader2 } from 'lucide-react'
import { LeadDetailsModal } from './LeadDetailsModal'

export function LeadsList() {
    const [leads, setLeads] = useState<DBProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [selectedLead, setSelectedLead] = useState<DBProfile | null>(null)
    const [sendingEmail, setSendingEmail] = useState(false)
    const [showModal, setShowModal] = useState(false)

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
        e.stopPropagation()
        if (!confirm('Are you sure you want to delete this lead?')) return

        try {
            setDeletingId(id)
            await deleteLead(id)
            setLeads(prev => prev.filter(l => l.id !== id))
            if (selectedLead?.id === id) setSelectedLead(null)
        } catch (err) {
            alert('Failed to delete lead')
        } finally {
            setDeletingId(null)
        }
    }

    const handleSendWelcome = async (lead: DBProfile) => {
        if (!lead || sendingEmail) return

        // Confirmation dialog
        if (!confirm(`Send welcome email to ${lead.full_name}?`)) return

        setSendingEmail(true)
        try {
            await adminApi.notifyAgent(lead.id)
            alert(`Welcome email sent to ${lead.full_name}!`)
        } catch (err: any) {
            alert('Failed to send email: ' + (err.message || 'Unknown error'))
        } finally {
            setSendingEmail(false)
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
                <button onClick={fetchLeads} className="mt-4 px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors">
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

                <div className="flex flex-col lg:flex-row gap-6 items-start">
                    {/* LEFT COLUMN: List */}
                    <div className="flex-1 w-full space-y-3">
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
                                    className={`group relative bg-slate-900/60 backdrop-blur-md border rounded-xl p-4 transition-all duration-300 shadow-sm cursor-pointer ${selectedLead?.id === lead.id
                                            ? 'border-teal-500/50 bg-teal-500/5 shadow-[0_0_20px_rgba(20,184,166,0.1)]'
                                            : 'border-white/5 hover:bg-slate-800/60 hover:border-teal-500/20 hover:shadow-lg'
                                        }`}
                                >
                                    <div className="flex items-start sm:items-center gap-4">
                                        {/* Avatar */}
                                        <div className="hidden sm:flex flex-shrink-0 w-12 h-12 bg-slate-800 rounded-full items-center justify-center border border-white/5 overflow-hidden">
                                            {lead.headshot_url ? (
                                                <img src={lead.headshot_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-slate-500 font-bold text-lg">{lead.full_name[0]}</span>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-12 gap-4">
                                            <div className="sm:col-span-4">
                                                <h3 className={`font-semibold truncate transition-colors ${selectedLead?.id === lead.id ? 'text-teal-400' : 'text-white group-hover:text-teal-400'}`}>
                                                    {lead.full_name}
                                                </h3>
                                                <p className="text-xs text-slate-400 truncate mt-0.5">{lead.brokerage}</p>
                                            </div>

                                            <div className="sm:col-span-4 flex items-center gap-2 text-sm text-slate-300">
                                                <MapPin className="w-3 h-3 text-slate-500" />
                                                <span className="truncate">{lead.city || 'Unknown'}, {lead.state || '—'}</span>
                                            </div>

                                            <div className="sm:col-span-4 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {/* Quick Actions in row (optional, maybe just delete?) */}
                                                <button
                                                    onClick={(e) => handleDelete(lead.id, e)}
                                                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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

                    {/* RIGHT COLUMN: Action Panel */}
                    <div className="w-full lg:w-80 shrink-0">
                        <div className="sticky top-6">
                            <AnimatePresence mode="wait">
                                {selectedLead ? (
                                    <motion.div
                                        key="selected"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-4">
                                            <button onClick={() => setSelectedLead(null)} className="text-slate-500 hover:text-white transition-colors">
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>

                                        {/* Profile Summary */}
                                        <div className="flex flex-col items-center text-center mb-6">
                                            <div className="w-20 h-20 rounded-full border-4 border-slate-800 shadow-lg overflow-hidden mb-3">
                                                {selectedLead.headshot_url ? (
                                                    <img src={selectedLead.headshot_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-slate-800 flex items-center justify-center text-2xl font-bold text-slate-500">
                                                        {selectedLead.full_name[0]}
                                                    </div>
                                                )}
                                            </div>
                                            <h3 className="text-lg font-bold text-white">{selectedLead.full_name}</h3>
                                            <p className="text-sm text-slate-400">{selectedLead.brokerage}</p>
                                        </div>

                                        {/* Actions */}
                                        <div className="space-y-3">
                                            <button
                                                onClick={() => handleSendWelcome(selectedLead)}
                                                disabled={sendingEmail}
                                                className="w-full py-3 px-4 bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold rounded-xl shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                                                {sendingEmail ? 'Sending...' : 'Send Welcome Email'}
                                            </button>

                                            <div className="grid grid-cols-2 gap-3">
                                                <a
                                                    href={selectedLead.website_config?.custom_domain
                                                        ? `https://${selectedLead.website_config.custom_domain}`
                                                        : `/w/${selectedLead.website_slug}`
                                                    }
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                                                >
                                                    <Globe className="w-4 h-4 text-teal-400" />
                                                    Website
                                                </a>
                                                <a
                                                    href={`/w/${selectedLead.website_slug}/admin/login`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                                                >
                                                    <Shield className="w-4 h-4 text-purple-400" />
                                                    Admin
                                                </a>
                                            </div>

                                            <button
                                                onClick={() => setShowModal(true)}
                                                className="w-full py-2.5 px-4 border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white font-medium rounded-xl transition-colors text-sm"
                                            >
                                                View Full Details
                                            </button>
                                        </div>

                                        {/* Contact Info Preview */}
                                        <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
                                            <div className="flex items-center gap-3 text-sm text-slate-400">
                                                <Mail className="w-4 h-4 text-slate-600" />
                                                <span className="truncate">{selectedLead.primary_email || 'No email'}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-slate-400">
                                                <Phone className="w-4 h-4 text-slate-600" />
                                                <span className="truncate">{selectedLead.primary_phone || 'No phone'}</span>
                                            </div>
                                        </div>

                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="empty"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="bg-slate-900/30 border border-slate-800/50 border-dashed rounded-2xl p-8 text-center"
                                    >
                                        <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Search className="w-6 h-6 text-slate-600" />
                                        </div>
                                        <h3 className="text-slate-400 font-medium mb-1">Select an Agent</h3>
                                        <p className="text-xs text-slate-500">
                                            Click on a lead from the list to view actions and details.
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lead Details Modal - Only triggers if button clicked */}
            {selectedLead && showModal && (
                <LeadDetailsModal
                    lead={selectedLead}
                    isOpen={true}
                    onClose={() => setShowModal(false)}
                    onUpdated={fetchLeads}
                />
            )}
        </>
    )
}
