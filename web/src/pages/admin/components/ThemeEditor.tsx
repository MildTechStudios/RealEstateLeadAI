import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { adminApi } from '../../../services/adminApi'
import { motion } from 'framer-motion'
import { Save, RefreshCw } from 'lucide-react'

// Predefined efficient color palettes for agents to choose from
const COLOR_PRESETS = [
    { name: 'Coldwell Blue', primary: '#b91c1c', secondary: '#1e3a8a' }, // Wait, CB is blue/white usually, defaulting to existing
    { name: 'Modern Teal', primary: '#14b8a6', secondary: '#0f766e' },
    { name: 'Lux Gold', primary: '#d97706', secondary: '#78350f' },
    { name: 'Royal Purple', primary: '#7c3aed', secondary: '#4c1d95' },
    { name: 'Slate Minimal', primary: '#475569', secondary: '#0f172a' },
    { name: 'Rose Elegance', primary: '#e11d48', secondary: '#881337' },
]

export function ThemeEditor() {
    const { slug } = useParams()
    const [config, setConfig] = useState<any>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')

    useEffect(() => {
        loadConfig()
    }, [slug])

    const loadConfig = async () => {
        if (!slug) return
        try {
            const token = localStorage.getItem(`admin_token_${slug}`)
            if (!token) return

            const data = await adminApi.getConfig(token)
            setConfig(data || {})
        } catch (err) {
            console.error('Failed to load theme config', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        setMessage('')
        try {
            const token = localStorage.getItem(`admin_token_${slug}`)
            if (!token) throw new Error('Not authenticated')

            await adminApi.updateConfig(token, config)
            setMessage('Theme saved successfully! Refresh your website to see changes.')
        } catch (err) {
            setMessage('Failed to save changes.')
        } finally {
            setSaving(false)
        }
    }

    const updateColor = (key: string, value: string) => {
        setConfig((prev: any) => ({ ...prev, [key]: value }))
    }

    if (loading) return <div className="p-8 text-slate-400">Loading editor...</div>

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Design & Colors</h1>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-teal-500 text-slate-900 font-bold rounded-full hover:bg-teal-400 transition-colors disabled:opacity-50"
                >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-xl ${message.includes('Failed') ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                    {message}
                </div>
            )}

            {/* Quick Presets */}
            <section className="space-y-4">
                <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Quick Presets</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {COLOR_PRESETS.map((preset) => (
                        <button
                            key={preset.name}
                            onClick={() => setConfig({ ...config, primaryColor: preset.primary, secondaryColor: preset.secondary })}
                            className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-600 transition-colors group"
                        >
                            <div className="flex gap-1">
                                <div className="w-6 h-6 rounded-full shadow-sm" style={{ backgroundColor: preset.primary }} />
                                <div className="w-6 h-6 rounded-full shadow-sm -ml-2" style={{ backgroundColor: preset.secondary }} />
                            </div>
                            <span className="text-slate-300 text-sm font-medium group-hover:text-white">{preset.name}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Custom Colors */}
            <section className="space-y-4 pt-4 border-t border-slate-800">
                <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Custom Colors</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Primary Color */}
                    <div className="space-y-2">
                        <label className="text-slate-300 text-sm">Primary Brand Color</label>
                        <div className="flex gap-4">
                            <input
                                type="color"
                                value={config.primaryColor || '#14b8a6'} // Default Teal
                                onChange={(e) => updateColor('primaryColor', e.target.value)}
                                className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-none"
                            />
                            <input
                                type="text"
                                value={config.primaryColor || '#14b8a6'}
                                onChange={(e) => updateColor('primaryColor', e.target.value)}
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 text-white font-mono text-sm"
                            />
                        </div>
                        <p className="text-xs text-slate-500">Used for buttons, highlights, and icons.</p>
                    </div>

                    {/* Secondary Color */}
                    <div className="space-y-2">
                        <label className="text-slate-300 text-sm">Secondary Color</label>
                        <div className="flex gap-4">
                            <input
                                type="color"
                                value={config.secondaryColor || '#0f766e'}
                                onChange={(e) => updateColor('secondaryColor', e.target.value)}
                                className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-none"
                            />
                            <input
                                type="text"
                                value={config.secondaryColor || '#0f766e'}
                                onChange={(e) => updateColor('secondaryColor', e.target.value)}
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 text-white font-mono text-sm"
                            />
                        </div>
                        <p className="text-xs text-slate-500">Used for gradients and backgrounds.</p>
                    </div>
                </div>
            </section>
        </div>
    )
}
