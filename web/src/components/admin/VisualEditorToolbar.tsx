import { Save, RefreshCw, Palette, User, Minus, Sparkles, GripHorizontal, Facebook, Linkedin, Instagram, Twitter, Youtube, Image as ImageIcon, UploadCloud, Undo, Redo } from 'lucide-react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { adminApi } from '../../services/adminApi'
import { useParams } from 'react-router-dom'

interface VisualEditorToolbarProps {
    isDirty: boolean
    onSave: () => void
    saving: boolean
    config: any
    agent: any
    onUpdateConfig: (keyOrUpdates: string | Record<string, any>, value?: any) => void
    undo: () => void
    redo: () => void
    canUndo: boolean
    canRedo: boolean
}

export function VisualEditorToolbar({
    isDirty,
    onSave,
    saving,
    config,
    agent,
    onUpdateConfig,
    undo,
    redo,
    canUndo,
    canRedo
}: VisualEditorToolbarProps) {
    const [minimized, setMinimized] = useState(false)
    const [activeTab, setActiveTab] = useState<'design' | 'contact'>('contact')
    const [uploading, setUploading] = useState(false)
    const { slug } = useParams()

    // Upload Handler
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, configKey: string) => {
        const file = e.target.files?.[0]
        if (!file || !slug) return

        setUploading(true)
        try {
            const token = localStorage.getItem(`admin_token_${slug}`)
            if (token) {
                const { url } = await adminApi.uploadImage(token, file)
                // console.log('Uploaded URL:', url)
                onUpdateConfig(configKey, url)
                // alert('Image uploaded successfully!') // Remove alert to be less intrusive? Or keep it? Let's keep simpler success indication if possible or just rely on UI update.
            }
        } catch (err: any) {
            console.error('Upload failed', err)
            alert(`Upload failed: ${err.message || err}`)
        } finally {
            setUploading(false)
        }
    }

    // Helper to get effective value (override or original)
    const getVal = (key: string, dbField: string) => {
        if (config[key] !== undefined) return config[key]
        return agent[dbField] || ''
    }

    if (minimized) {
        return (
            <motion.div
                layout
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="fixed bottom-6 right-6 z-[100]"
            >
                <button
                    onClick={() => setMinimized(false)}
                    className="bg-slate-900/90 backdrop-blur-md text-white p-4 rounded-full shadow-2xl hover:bg-slate-800 transition-all border border-slate-700/50 group"
                >
                    <Sparkles className="w-6 h-6 text-indigo-400 group-hover:rotate-12 transition-transform" />
                </button>
            </motion.div>
        )
    }

    return (
        <motion.div
            drag
            dragMomentum={false}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 right-6 w-96 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl z-[100] flex flex-col overflow-hidden"
        >
            {/* Header / Drag Handle */}
            <div className="p-3 border-b border-slate-800 flex items-center justify-between cursor-move bg-slate-900">
                <div className="flex items-center gap-2">
                    <GripHorizontal className="w-4 h-4 text-slate-500" />
                    <span className="text-white font-bold text-sm">Visual Editor</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setMinimized(true)}
                        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex p-2 gap-2 bg-slate-950/30">
                <button
                    onClick={() => setActiveTab('contact')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'contact'
                        ? 'bg-slate-800 text-indigo-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                        }`}
                >
                    <User className="w-3 h-3" />
                    Profile & Contact
                </button>
                <button
                    onClick={() => setActiveTab('design')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'design'
                        ? 'bg-slate-800 text-teal-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                        }`}
                >
                    <Palette className="w-3 h-3" />
                    Design & Colors
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto max-h-[500px] p-5 custom-scrollbar">

                {activeTab === 'design' && (
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                <Palette className="w-3 h-3" />
                                Color Theme
                            </label>

                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { name: 'Fresh Teal', primary: '#14b8a6', secondary: '#0f766e', class: 'bg-teal-500', isDark: false },
                                    { name: 'Royal Blue', primary: '#2563eb', secondary: '#1e40af', class: 'bg-blue-600', isDark: false },
                                    { name: 'Luxe Violet', primary: '#7c3aed', secondary: '#5b21b6', class: 'bg-violet-600', isDark: false },
                                    { name: 'Sunset Rose', primary: '#e11d48', secondary: '#be123c', class: 'bg-rose-600', isDark: false },
                                    { name: 'Midnight Gold', primary: '#b45309', secondary: '#020617', class: 'bg-amber-700', isDark: true },
                                    { name: 'Crimson Night', primary: '#fb7185', secondary: '#4c0519', class: 'bg-rose-500', isDark: true },
                                    { name: 'Cyber Blue', primary: '#38bdf8', secondary: '#082f49', class: 'bg-sky-500', isDark: true },
                                    { name: 'Forest Elite', primary: '#15803d', secondary: '#052e16', class: 'bg-green-700', isDark: false },
                                    { name: 'Slate Minimal', primary: '#475569', secondary: '#0f172a', class: 'bg-slate-600', isDark: false }
                                ].map((theme) => {
                                    const isActive = (config.primaryColor || '#14b8a6') === theme.primary;
                                    return (
                                        <button
                                            key={theme.name}
                                            onClick={() => {
                                                const lightTheme = {
                                                    bgMain: '#ffffff',
                                                    bgAlt: '#f8fafc',
                                                    textMain: '#0f172a',
                                                    textMuted: '#64748b',
                                                    textInv: '#ffffff'
                                                };
                                                const darkTheme = {
                                                    bgMain: '#0f172a',
                                                    bgAlt: '#1e293b',
                                                    textMain: '#f8fafc',
                                                    textMuted: '#94a3b8',
                                                    textInv: '#0f172a'
                                                };

                                                onUpdateConfig({
                                                    primaryColor: theme.primary,
                                                    secondaryColor: theme.secondary,
                                                    ...(theme.isDark ? darkTheme : lightTheme)
                                                });
                                            }}
                                            className={`group relative flex items-center justify-between p-3 rounded-xl border transition-all ${isActive
                                                ? 'bg-slate-800 border-indigo-500 shadow-lg shadow-indigo-500/10'
                                                : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full ${theme.class} shadow-inner flex items-center justify-center`}>
                                                    {isActive && <div className="w-2.5 h-2.5 bg-white rounded-full shadow-sm" />}
                                                </div>
                                                <div className="text-left">
                                                    <p className={`text-sm font-bold ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                                                        {theme.name}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 font-mono">
                                                        {theme.primary}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <div
                                                    className="w-4 h-4 rounded-full shadow-sm"
                                                    style={{ backgroundColor: theme.primary }}
                                                    title="Primary"
                                                />
                                                <div
                                                    className="w-4 h-4 rounded-full shadow-sm"
                                                    style={{ backgroundColor: theme.secondary }}
                                                    title="Secondary"
                                                />
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2">Select a theme to instantly update your website's primary and secondary colors.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'contact' && (
                    <div className="space-y-6">
                        {/* Headshot Section */}
                        <div className="space-y-3">
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                <ImageIcon className="w-3 h-3" /> Headshot URL
                            </label>
                            <div className="flex gap-3">
                                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-700 shrink-0 bg-slate-800">
                                    <img
                                        src={getVal('headshotUrl', 'headshot_url')}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                        onError={(e) => e.currentTarget.style.display = 'none'}
                                    />
                                </div>

                                <input
                                    type="file"
                                    id="headshot-upload"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload(e, 'headshotUrl')}
                                />

                                <div className="flex-1 flex gap-2">
                                    <button
                                        onClick={() => document.getElementById('headshot-upload')?.click()}
                                        disabled={uploading}
                                        className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                                    >
                                        <UploadCloud className="w-4 h-4" />
                                        {uploading ? '...' : 'Upload'}
                                    </button>
                                    <input
                                        value={getVal('headshotUrl', 'headshot_url')}
                                        onChange={e => onUpdateConfig('headshotUrl', e.target.value)}
                                        className="flex-1 bg-slate-950 text-white text-xs rounded-lg px-3 py-2 border border-slate-700 focus:border-indigo-500 outline-none"
                                        placeholder="or paste URL..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Team Logo Section */}
                        <div className="space-y-3">
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                <ImageIcon className="w-3 h-3" /> Team Logo
                            </label>
                            <div className="flex gap-3">
                                <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-slate-700 shrink-0 bg-slate-800 flex items-center justify-center p-1">
                                    <img
                                        src={getVal('logoUrl', 'logo_url')}
                                        alt="Preview"
                                        className="w-full h-full object-contain"
                                        onError={(e) => e.currentTarget.style.display = 'none'}
                                    />
                                </div>

                                <input
                                    type="file"
                                    id="logo-upload"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload(e, 'logoUrl')}
                                />

                                <div className="flex-1 flex gap-2">
                                    <button
                                        onClick={() => document.getElementById('logo-upload')?.click()}
                                        disabled={uploading}
                                        className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                                    >
                                        <UploadCloud className="w-4 h-4" />
                                        {uploading ? '...' : 'Upload'}
                                    </button>
                                    <input
                                        value={getVal('logoUrl', 'logo_url')}
                                        onChange={e => onUpdateConfig('logoUrl', e.target.value)}
                                        className="flex-1 bg-slate-950 text-white text-xs rounded-lg px-3 py-2 border border-slate-700 focus:border-indigo-500 outline-none"
                                        placeholder="or paste URL..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-slate-800 my-4" />

                        {/* Contact Details */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-slate-500 text-[10px] font-bold uppercase">Mobile Phone</label>
                                <input
                                    type="text"
                                    value={getVal('contactPhone', 'primary_phone')}
                                    onChange={e => onUpdateConfig('contactPhone', e.target.value)}
                                    className="w-full bg-slate-950 text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-slate-500 text-[10px] font-bold uppercase">Office Phone</label>
                                <input
                                    type="text"
                                    value={getVal('officePhone', 'office_phone')}
                                    onChange={e => onUpdateConfig('officePhone', e.target.value)}
                                    className="w-full bg-slate-950 text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <div className="col-span-2 space-y-1">
                                <label className="text-slate-500 text-[10px] font-bold uppercase">Email Address</label>
                                <input
                                    type="text"
                                    value={getVal('contactEmail', 'primary_email')}
                                    onChange={e => onUpdateConfig('contactEmail', e.target.value)}
                                    className="w-full bg-slate-950 text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <div className="col-span-2 space-y-1">
                                <label className="text-slate-500 text-[10px] font-bold uppercase">License Number</label>
                                <input
                                    type="text"
                                    value={getVal('licenseNumber', 'license_number')}
                                    onChange={e => onUpdateConfig('licenseNumber', e.target.value)}
                                    className="w-full bg-slate-950 text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <div className="col-span-2 space-y-1">
                                <label className="text-slate-500 text-[10px] font-bold uppercase">Office Address</label>
                                <textarea
                                    value={getVal('contactAddress', 'office_address')}
                                    onChange={e => onUpdateConfig('contactAddress', e.target.value)}
                                    className="w-full bg-slate-950 text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:border-indigo-500 outline-none min-h-[60px]"
                                />
                            </div>
                        </div>

                        <div className="h-px bg-slate-800 my-4" />

                        {/* Social Media */}
                        <div className="space-y-3">
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Social Media</label>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Linkedin className="w-4 h-4 text-blue-400" />
                                    <input
                                        placeholder="LinkedIn URL"
                                        value={getVal('linkedinUrl', 'linkedin_url')}
                                        onChange={e => onUpdateConfig('linkedinUrl', e.target.value)}
                                        className="flex-1 bg-slate-950 text-white text-xs rounded-lg px-3 py-2 border border-slate-700 focus:border-indigo-500 outline-none"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Facebook className="w-4 h-4 text-blue-600" />
                                    <input
                                        placeholder="Facebook URL"
                                        value={getVal('facebookUrl', 'facebook_url')}
                                        onChange={e => onUpdateConfig('facebookUrl', e.target.value)}
                                        className="flex-1 bg-slate-950 text-white text-xs rounded-lg px-3 py-2 border border-slate-700 focus:border-indigo-500 outline-none"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Instagram className="w-4 h-4 text-pink-500" />
                                    <input
                                        placeholder="Instagram URL"
                                        value={getVal('instagramUrl', 'instagram_url')}
                                        onChange={e => onUpdateConfig('instagramUrl', e.target.value)}
                                        className="flex-1 bg-slate-950 text-white text-xs rounded-lg px-3 py-2 border border-slate-700 focus:border-indigo-500 outline-none"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Twitter className="w-4 h-4 text-sky-400" />
                                    <input
                                        placeholder="Twitter/X URL"
                                        value={getVal('twitterUrl', 'twitter_url')}
                                        onChange={e => onUpdateConfig('twitterUrl', e.target.value)}
                                        className="flex-1 bg-slate-950 text-white text-xs rounded-lg px-3 py-2 border border-slate-700 focus:border-indigo-500 outline-none"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Youtube className="w-4 h-4 text-red-500" />
                                    <input
                                        placeholder="YouTube URL"
                                        value={getVal('youtubeUrl', 'youtube_url')}
                                        onChange={e => onUpdateConfig('youtubeUrl', e.target.value)}
                                        className="flex-1 bg-slate-950 text-white text-xs rounded-lg px-3 py-2 border border-slate-700 focus:border-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/50 backdrop-blur-sm">
                <div className="flex gap-2 mb-3">
                    <button
                        onClick={undo}
                        disabled={!canUndo}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${canUndo
                            ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
                            : 'bg-slate-900 text-slate-700 cursor-not-allowed'
                            }`}
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo className="w-3 h-3" /> Undo
                    </button>
                    <button
                        onClick={redo}
                        disabled={!canRedo}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${canRedo
                            ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
                            : 'bg-slate-900 text-slate-700 cursor-not-allowed'
                            }`}
                        title="Redo (Ctrl+Y)"
                    >
                        <Redo className="w-3 h-3" /> Redo
                    </button>
                </div>

                <button
                    onClick={onSave}
                    disabled={!isDirty || saving}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${isDirty
                        ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transform hover:scale-[1.02]'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </motion.div >
    )
}
