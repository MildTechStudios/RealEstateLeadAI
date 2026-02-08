import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Shield, Loader2 } from 'lucide-react'
import type { DBProfile } from '../../services/api'
import { deleteLead, deleteEmailLogs } from '../../services/api'

interface DeleteLeadModalProps {
    lead: DBProfile | null
    isOpen: boolean
    onClose: () => void
    onDeleted: (id: string) => void
}

export function DeleteLeadModal({ lead, isOpen, onClose, onDeleted }: DeleteLeadModalProps) {
    const [deleteConfirmation, setDeleteConfirmation] = useState('')
    const [loading, setLoading] = useState(false)

    if (!lead || !isOpen) return null

    const isGhostLead = lead.id.startsWith('ghost-')

    const handleDelete = async () => {
        setLoading(true)
        try {
            if (isGhostLead) {
                // For ghost leads, delete email logs by recipient
                const email = lead.id.replace('ghost-', '')
                await deleteEmailLogs(email)
            } else {
                // For real leads, delete the lead
                await deleteLead(lead.id)
            }
            onDeleted(lead.id)
            onClose()
        } catch (err) {
            alert(isGhostLead ? 'Failed to delete email logs' : 'Failed to delete lead')
        } finally {
            setLoading(false)
        }
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden"
                >
                    {/* Warning Icon Background */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
                            <Trash2 className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Delete {lead.full_name}?</h3>

                        {lead.is_paid ? (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 w-full text-left mt-2">
                                <div className="flex items-start gap-3">
                                    <Shield className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-red-200 font-semibold text-sm">Active Subscription Detected</p>
                                        <p className="text-red-300/80 text-xs mt-1">
                                            This lead has an active Stripe subscription. Deleting them will <span className="font-bold text-red-200">cancel the subscription immediately</span> and remove all data.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-slate-400 text-sm">
                                This action cannot be undone. All data and website configuration for this lead will be permanently removed.
                            </p>
                        )}
                    </div>

                    {lead.is_paid && (
                        <div className="mb-6">
                            <label className="block text-xs font-medium text-slate-500 uppercase mb-2">
                                Type <span className="text-white select-all">delete</span> to confirm
                            </label>
                            <input
                                type="text"
                                value={deleteConfirmation}
                                onChange={(e) => setDeleteConfirmation(e.target.value)}
                                placeholder="delete"
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                                autoFocus
                            />
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={loading || (lead.is_paid && deleteConfirmation !== 'delete')}
                            className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            {lead.is_paid ? 'Cancel & Delete' : 'Delete Lead'}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
