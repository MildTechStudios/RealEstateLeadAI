import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminApi } from '../../services/adminApi'
import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'

export function AdminLogin() {
    const { slug } = useParams()
    const navigate = useNavigate()
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            if (!slug) throw new Error('No website specified')

            const { token } = await adminApi.login(slug, password)
            localStorage.setItem(`admin_token_${slug}`, token)
            navigate(`/w/${slug}/admin`)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-8 shadow-xl"
            >
                <div className="flex justify-center mb-6">
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                        <Lock className="w-6 h-6 text-indigo-500" />
                    </div>
                </div>

                <h1 className="text-xl font-semibold text-center text-slate-900 mb-2">Admin Access</h1>
                <p className="text-slate-500 text-center text-sm mb-8">Enter password to edit this website</p>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-4 py-3 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                            autoFocus
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 text-xs text-center">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Verifying...' : 'Login'}
                    </button>

                    <div className="text-center mt-4 space-y-2">
                        <a href={`/w/${slug}/admin/reset-password`} className="block text-xs text-indigo-500 hover:text-indigo-400 transition-colors">
                            Forgot Password?
                        </a>
                        <a href={`/w/${slug}`} className="block text-xs text-slate-400 hover:text-slate-600 transition-colors">
                            ← Back to Website
                        </a>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}
