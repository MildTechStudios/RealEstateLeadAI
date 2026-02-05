import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { adminApi } from '../../../services/adminApi'
import { Save, RefreshCw } from 'lucide-react'

export function ContentEditor() {
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
            console.error('Failed to load content config', err)
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
            setMessage('Content saved successfully! Refresh your website to see changes.')
        } catch (err) {
            setMessage('Failed to save changes.')
        } finally {
            setSaving(false)
        }
    }

    const handleChange = (key: string, value: string) => {
        setConfig((prev: any) => ({ ...prev, [key]: value }))
    }

    if (loading) return <div className="p-8 text-slate-400">Loading editor...</div>

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Content & Bio</h1>
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

            <div className="space-y-6">
                {/* Custom Title */}
                <div className="space-y-2">
                    <label className="text-slate-300 text-sm font-medium">Custom Hero Title</label>
                    <input
                        type="text"
                        value={config.customTitle || ''}
                        onChange={(e) => handleChange('customTitle', e.target.value)}
                        placeholder="e.g. Your Dream Home Awaits"
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 outline-none focus:border-teal-500 transition-colors"
                    />
                    <p className="text-xs text-slate-500">Overrides the default "Luxury Real Estate in [City]" title.</p>
                </div>

                {/* Custom Bio Headline */}
                <div className="space-y-2">
                    <label className="text-slate-300 text-sm font-medium">Bio Headline</label>
                    <input
                        type="text"
                        value={config.bioHeadline || ''}
                        onChange={(e) => handleChange('bioHeadline', e.target.value)}
                        placeholder="e.g. About Me"
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 outline-none focus:border-teal-500 transition-colors"
                    />
                </div>

                {/* Custom Bio Text */}
                <div className="space-y-2">
                    <label className="text-slate-300 text-sm font-medium">Custom Bio</label>
                    <textarea
                        value={config.customBio || ''}
                        onChange={(e) => handleChange('customBio', e.target.value)}
                        rows={8}
                        placeholder="Write a custom bio here to override the scraped one..."
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 outline-none focus:border-teal-500 transition-colors resize-y"
                    />
                    <p className="text-xs text-slate-500">Leave empty to use the original scraped bio.</p>
                </div>

                {/* Custom Headshot URL */}
                <div className="space-y-2 pt-4 border-t border-slate-800">
                    <label className="text-slate-300 text-sm font-medium">Profile Image URL</label>
                    <input
                        type="text"
                        value={config.customHeadshotUrl || ''}
                        onChange={(e) => handleChange('customHeadshotUrl', e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 outline-none focus:border-teal-500 transition-colors"
                    />
                    <p className="text-xs text-slate-500">Paste a link to a new headshot to override the default one.</p>
                </div>
            </div>
        </div>
    )
}
