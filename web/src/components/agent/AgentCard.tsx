/**
 * Agent Profile Card Component
 */

import type { CBAgentProfile } from '../../types/agent'

interface AgentCardProps {
    profile: CBAgentProfile
    state: 'preview' | 'saving' | 'saved'
    onSave: () => void
    onCancel: () => void
}

export function AgentCard({ profile, state, onSave, onCancel }: AgentCardProps) {
    return (
        <div className="relative group">
            {/* Glow Effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>

            <div className="relative bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                {/* Success Banner */}
                <div className="bg-teal-500/10 border-b border-white/5 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-teal-500/20 p-1.5 rounded-full">
                            <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <span className="text-teal-400 font-medium tracking-wide text-sm">Extraction Successful</span>
                    </div>
                    {profile.saved_to_db && (
                        <div className="flex items-center gap-2 bg-teal-500/20 px-3 py-1 rounded-full border border-teal-500/30 shadow-[0_0_10px_rgba(20,184,166,0.3)]">
                            <span className="text-xs text-teal-300 font-medium">Auto-Saved</span>
                        </div>
                    )}
                </div>

                <div className="p-8">
                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Headshot & Branding */}
                        <div className="flex flex-col gap-4 flex-shrink-0 items-center md:items-start">
                            {profile.headshot_url ? (
                                <div className="relative group/image">
                                    <div className="absolute inset-0 bg-teal-500/20 rounded-2xl blur-md opacity-0 group-hover/image:opacity-100 transition duration-500"></div>
                                    <img
                                        src={profile.headshot_url}
                                        alt={profile.full_name}
                                        className="relative w-40 h-40 rounded-2xl object-cover border border-white/10 shadow-lg z-10"
                                    />
                                </div>
                            ) : (
                                <div className="w-40 h-40 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 backdrop-blur-md">
                                    <svg className="w-12 h-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                            )}

                            {/* Brokerage Logo */}
                            <div className="w-40 p-3 bg-white rounded-xl border border-white/10 shadow-sm">
                                <img src={profile.brokerage_logo_url} alt="Brokerage Logo" className="w-full h-12 object-contain" />
                            </div>
                        </div>

                        {/* Info Column */}
                        <div className="flex-1 space-y-6">
                            <div className="space-y-1 text-center md:text-left">
                                <h3 className="text-3xl font-bold text-white tracking-tight">{profile.full_name}</h3>
                                {profile.office_name && (
                                    <p className="text-teal-400 font-medium">{profile.office_name}</p>
                                )}
                            </div>

                            {/* Contact Grid - Glass Tiles */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                                    <label className="text-xs text-slate-400 uppercase tracking-widest font-semibold block mb-1">Email</label>
                                    <p className="text-slate-200 font-mono text-sm truncate">{profile.email || '—'}</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                                    <label className="text-xs text-slate-400 uppercase tracking-widest font-semibold block mb-1">Mobile</label>
                                    <p className="text-slate-200 font-mono text-sm">{profile.mobile_phone || '—'}</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                                    <label className="text-xs text-slate-400 uppercase tracking-widest font-semibold block mb-1">Office</label>
                                    <p className="text-slate-200 font-mono text-sm">{profile.office_phone || '—'}</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                                    <label className="text-xs text-slate-400 uppercase tracking-widest font-semibold block mb-1">Address</label>
                                    <p className="text-slate-200 font-medium text-sm truncate">{profile.office_address || '—'}</p>
                                </div>
                            </div>

                            {/* Social & Bio Split */}
                            <div className="space-y-6">
                                {/* Socials */}
                                <div>
                                    <label className="text-xs text-slate-500 uppercase tracking-widest font-semibold block mb-3">Connect</label>
                                    <div className="flex flex-wrap gap-3">
                                        {[
                                            { key: 'facebook', icon: 'f', bg: 'bg-[#1877F2]' },
                                            { key: 'linkedin', icon: 'in', bg: 'bg-[#0A66C2]' },
                                            { key: 'twitter', icon: '𝕏', bg: 'bg-black border border-white/20' },
                                            { key: 'instagram', icon: 'IG', bg: 'bg-gradient-to-br from-purple-500 to-pink-500' },
                                            { key: 'youtube', icon: '▶', bg: 'bg-[#FF0000]' }
                                        ].map((platform) => {
                                            const url = profile.social_links[platform.key as keyof typeof profile.social_links];
                                            if (!url) return null;
                                            return (
                                                <a key={platform.key} href={url} target="_blank" rel="noopener noreferrer"
                                                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform ${platform.bg}`}>
                                                    <span className="font-bold text-sm">{platform.icon}</span>
                                                </a>
                                            );
                                        })}
                                        {Object.values(profile.social_links).every(v => !v) && (
                                            <span className="text-slate-500 text-sm italic">No social profiles found</span>
                                        )}
                                    </div>
                                </div>

                                {/* Bio */}
                                {profile.bio && (
                                    <div className="bg-slate-950/30 p-5 rounded-xl border border-white/5">
                                        <label className="text-xs text-teal-500 uppercase tracking-widest font-semibold block mb-2">About Agent</label>
                                        <p className="text-slate-300 text-sm leading-relaxed max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                            {profile.bio}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 mt-8 pt-8 border-t border-white/5">
                        <button
                            onClick={onSave}
                            disabled={state === 'saving' || state === 'saved'}
                            className="flex-1 py-3.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-semibold rounded-xl hover:from-teal-400 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-[0_0_20px_rgba(20,184,166,0.4)] flex items-center justify-center gap-2"
                        >
                            {state === 'saving' ? 'Saving...' : state === 'saved' ? 'Saved Successfully' : 'Save to Leads'}
                        </button>
                        <button
                            onClick={onCancel}
                            className="px-8 py-3.5 bg-white/5 text-slate-300 font-medium rounded-xl hover:bg-white/10 hover:text-white border border-white/5 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
