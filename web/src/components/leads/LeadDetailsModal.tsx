import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Edit2, Save, Loader2, Mail, Phone, MapPin, Building, User, ExternalLink, Facebook, Linkedin, Instagram, Twitter, Youtube } from 'lucide-react'
import { type DBProfile, updateLead } from '../../services/api'

interface LeadDetailsModalProps {
    lead: DBProfile
    isOpen: boolean
    onClose: () => void
    onUpdated: () => void
}

export function LeadDetailsModal({ lead, isOpen, onClose, onUpdated }: LeadDetailsModalProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        full_name: lead.full_name || '',
        primary_email: lead.primary_email || '',
        primary_phone: lead.primary_phone || '',
        bio: lead.bio || '',
        city: lead.city || '',
        state: lead.state || '',
        office_name: lead.office_name || '',
        office_address: lead.office_address || '',
        facebook_url: lead.facebook_url || '',
        linkedin_url: lead.linkedin_url || '',
        instagram_url: lead.instagram_url || '',
        twitter_url: lead.twitter_url || '',
        youtube_url: lead.youtube_url || '',
        logo_url: lead.logo_url || '',
        brokerage_logo_url: lead.brokerage_logo_url || '',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleSave = async () => {
        setIsSaving(true)
        setError(null)

        try {
            await updateLead(lead.id, formData)
            setIsEditing(false)
            onUpdated()
        } catch (err: any) {
            setError(err.message || 'Failed to save changes')
        } finally {
            setIsSaving(false)
        }
    }

    const handleCancel = () => {
        setFormData({
            full_name: lead.full_name || '',
            primary_email: lead.primary_email || '',
            primary_phone: lead.primary_phone || '',
            bio: lead.bio || '',
            city: lead.city || '',
            state: lead.state || '',
            office_name: lead.office_name || '',
            office_address: lead.office_address || '',
            facebook_url: lead.facebook_url || '',
            linkedin_url: lead.linkedin_url || '',
            instagram_url: lead.instagram_url || '',
            twitter_url: lead.twitter_url || '',
            youtube_url: lead.youtube_url || '',
            logo_url: lead.logo_url || '',
            brokerage_logo_url: lead.brokerage_logo_url || '',
        })
        setIsEditing(false)
        setError(null)
    }

    const isGenericBio = (bio: string | null) => {
        if (!bio) return true
        const lowBio = bio.toLowerCase().trim()
        return lowBio.startsWith('yes, i would like more information from coldwell banker') ||
            lowBio === 'no bio available'
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/10">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-slate-800 overflow-hidden border-2 border-teal-500/30">
                                {lead.headshot_url ? (
                                    <img src={lead.headshot_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-2xl">
                                        {lead.full_name[0]}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">{lead.full_name}</h2>
                                <p className="text-sm text-slate-400">{lead.brokerage}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {!isEditing ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-teal-500/20 text-teal-400 rounded-lg hover:bg-teal-500/30 transition-colors"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Edit
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={handleCancel}
                                        disabled={isSaving}
                                        className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Save
                                    </button>
                                </>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] space-y-6">
                        {error && (
                            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Basic Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Basic Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FieldRow icon={User} label="Full Name" name="full_name" value={formData.full_name} onChange={handleChange} isEditing={isEditing} />
                                <FieldRow icon={Mail} label="Email" name="primary_email" value={formData.primary_email} onChange={handleChange} isEditing={isEditing} type="email" />
                                <FieldRow icon={Phone} label="Phone" name="primary_phone" value={formData.primary_phone} onChange={handleChange} isEditing={isEditing} type="tel" />
                                <FieldRow icon={MapPin} label="City" name="city" value={formData.city} onChange={handleChange} isEditing={isEditing} />
                                <FieldRow icon={MapPin} label="State" name="state" value={formData.state} onChange={handleChange} isEditing={isEditing} />
                                <FieldRow icon={Building} label="Office Name" name="office_name" value={formData.office_name} onChange={handleChange} isEditing={isEditing} />
                            </div>
                            <FieldRow icon={Building} label="Office Address" name="office_address" value={formData.office_address} onChange={handleChange} isEditing={isEditing} fullWidth />
                        </div>

                        {/* Branding */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Branding</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <FieldRow icon={User} label="Team Logo URL" name="logo_url" value={formData.logo_url} onChange={handleChange} isEditing={isEditing} type="url" />
                                    {formData.logo_url && !isEditing && (
                                        <div className="p-2 bg-white rounded-lg border border-slate-700 w-fit">
                                            <img src={formData.logo_url} alt="Team Logo" className="h-8 object-contain" />
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <FieldRow icon={Building} label="Brokerage Logo URL" name="brokerage_logo_url" value={formData.brokerage_logo_url} onChange={handleChange} isEditing={isEditing} type="url" />
                                    {formData.brokerage_logo_url && !isEditing && (
                                        <div className="p-2 bg-white rounded-lg border border-slate-700 w-fit">
                                            <img src={formData.brokerage_logo_url} alt="Brokerage Logo" className="h-8 object-contain" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Bio</h3>
                            {isEditing ? (
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none"
                                    placeholder="Agent bio..."
                                />
                            ) : (
                                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                                    {!isGenericBio(formData.bio) ? formData.bio : <span className="text-slate-500 italic">No bio available</span>}
                                </p>
                            )}
                        </div>

                        {/* Social Links */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Social Links</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FieldRow icon={Facebook} label="Facebook" name="facebook_url" value={formData.facebook_url} onChange={handleChange} isEditing={isEditing} type="url" />
                                <FieldRow icon={Linkedin} label="LinkedIn" name="linkedin_url" value={formData.linkedin_url} onChange={handleChange} isEditing={isEditing} type="url" />
                                <FieldRow icon={Instagram} label="Instagram" name="instagram_url" value={formData.instagram_url} onChange={handleChange} isEditing={isEditing} type="url" />
                                <FieldRow icon={Twitter} label="Twitter" name="twitter_url" value={formData.twitter_url} onChange={handleChange} isEditing={isEditing} type="url" />
                                <FieldRow icon={Youtube} label="YouTube" name="youtube_url" value={formData.youtube_url} onChange={handleChange} isEditing={isEditing} type="url" />
                            </div>
                        </div>

                        {/* Source Link */}
                        <div className="pt-4 border-t border-white/10">
                            <a
                                href={lead.source_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 text-sm transition-colors"
                            >
                                <ExternalLink className="w-4 h-4" />
                                View Original Profile
                            </a>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}

// Reusable field row component
interface FieldRowProps {
    icon: React.ComponentType<{ className?: string }>
    label: string
    name: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    isEditing: boolean
    type?: string
    fullWidth?: boolean
}

function FieldRow({ icon: Icon, label, name, value, onChange, isEditing, type = 'text', fullWidth }: FieldRowProps) {
    return (
        <div className={fullWidth ? 'col-span-full' : ''}>
            <label className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <Icon className="w-3 h-3" />
                {label}
            </label>
            {isEditing ? (
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                    placeholder={`Enter ${label.toLowerCase()}...`}
                />
            ) : (
                <p className="text-slate-200 text-sm truncate">
                    {value || <span className="text-slate-500">—</span>}
                </p>
            )}
        </div>
    )
}
