import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Globe, Check, Copy, Loader2, Sparkles } from 'lucide-react'
import { updateLeadConfig, type DBProfile } from '../../services/api'
import { getThemeConfig } from '../../utils/theme'

interface Props {
    lead: DBProfile
    isOpen: boolean
    onClose: () => void
    onUpdated: () => void
}

function generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function WebsiteConfigModal({ lead, isOpen, onClose, onUpdated }: Props) {
    const [slug, setSlug] = useState(lead.website_slug || generateSlug(lead.full_name))
    const [published, setPublished] = useState(lead.website_published || false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    // Detect Theme Vibe
    const theme = useMemo(() => getThemeConfig(lead.city, lead.state), [lead])

    useEffect(() => {
        setSlug(lead.website_slug || generateSlug(lead.full_name))
        setPublished(lead.website_published || false)
    }, [lead])

    const handleSave = async () => {
        try {
            setSaving(true)
            setError(null)
            await updateLeadConfig(lead.id, { website_slug: slug, website_published: published })
            onUpdated()
            onClose()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    const websiteUrl = `${window.location.origin}/w/${slug}`

    const copyUrl = () => {
        navigator.clipboard.writeText(websiteUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={e => e.stopPropagation()}
                    className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Globe className="w-5 h-5 text-amber-500" />
                            Website Settings
                        </h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Agent Name & Vibe Badge */}
                    <div className="flex items-end justify-between mb-6">
                        <p className="text-slate-400">
                            Configuring for <span className="text-white font-semibold">{lead.full_name}</span>
                        </p>
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-${theme.primaryColor}/10 text-${theme.primaryColor} border border-${theme.primaryColor}/20`}>
                            <Sparkles className="w-3 h-3" />
                            {theme.vibeName} Detected
                        </div>
                    </div>

                    {/* Slug Input */}
                    <div className="mb-6">
                        <label className="block text-sm text-slate-400 mb-2">Website URL</label>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 flex items-center bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                                <span className="px-3 text-slate-500 text-sm">{window.location.origin}/w/</span>
                                <input
                                    type="text"
                                    value={slug}
                                    onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                    className="flex-1 bg-transparent border-none px-2 py-3 text-white text-sm focus:outline-none"
                                    placeholder="john-doe"
                                />
                            </div>
                            <button
                                onClick={copyUrl}
                                className="p-3 bg-slate-800 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                            >
                                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Published Toggle */}
                    <div className="mb-6 flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                        <div>
                            <p className="text-white font-medium">Publish Website</p>
                            <p className="text-sm text-slate-400">Make this website accessible to the public</p>
                        </div>
                        <button
                            onClick={() => setPublished(!published)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${published ? 'bg-green-500' : 'bg-slate-600'}`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${published ? 'left-6' : 'left-0.5'}`}></div>
                        </button>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 px-4 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || !slug}
                            className="flex-1 py-3 px-4 bg-amber-500 text-black font-semibold rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            {saving ? 'Saving...' : 'Save & Publish'}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
