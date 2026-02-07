import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { motion } from 'framer-motion'
import { ArrowRight, Lock } from 'lucide-react'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabase: any = null

if (supabaseUrl && supabaseKey) {
    try {
        supabase = createClient(supabaseUrl, supabaseKey)
    } catch (e) {
        console.error('Supabase init failed', e);
    }
}

export function PlatformLogin() {
    const [username, setUsername] = useState('Admin')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (!supabase) {
        return <div className="text-red-500 p-4">Error: Supabase not configured</div>
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        if (username !== 'Admin') {
            setError('Invalid username. Please use "Admin".')
            setLoading(false)
            return
        }

        // Map Admin -> admin@platform.system
        const email = 'admin@platform.system'

        try {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password
            })

            if (authError) {
                setError('Invalid password')
            } else {
                window.location.reload()
            }
        } catch (err: any) {
            setError(err.message || 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2 overflow-hidden bg-slate-950 font-sans text-slate-100">
            {/* Left: Brand & Value Prop */}
            <div className="relative flex flex-col justify-center p-12 lg:p-20 bg-slate-900 overflow-hidden">
                {/* Background Gradients */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                    <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute top-[40%] -right-[10%] w-[60%] h-[60%] bg-violet-600/10 rounded-full blur-[100px]" />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-10 max-w-lg"
                >
                    <div className="flex items-center gap-3 mb-8">
                        <span className="text-4xl font-bold tracking-tight text-white">Site<span style={{ color: '#6366F1' }}>o</span></span>
                    </div>

                    <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6 leading-[1.1]">
                        Create outstanding websites.
                    </h1>
                    <p className="text-xl text-slate-400 leading-relaxed mb-8">
                        The AI-powered platform for real estate agents to build, manage, and scale their digital presence instantly.
                    </p>

                    <div className="space-y-4">
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Trusted by industry leaders</p>
                        <div className="flex items-center gap-8 opacity-50 grayscale mix-blend-screen">
                            {/* Google */}
                            <svg className="h-6 w-auto" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1V11.1Z" />
                            </svg>
                            {/* GoDaddy (Text/Icon approx) */}
                            <div className="flex items-center gap-1 font-bold text-lg">
                                <span className="text-xl">GoDaddy</span>
                            </div>
                            {/* Hostinger (Text/Icon approx) */}
                            <div className="flex items-center gap-1 font-bold text-lg">
                                <span className="text-xl">Hostinger</span>
                            </div>
                            {/* AWS */}
                            <div className="flex items-center gap-1 font-bold text-lg">
                                <span className="text-xl">aws</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Right: Login Form */}
            <div className="flex items-center justify-center p-8 bg-slate-950">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="w-full max-w-md space-y-8"
                >
                    <div className="text-center lg:text-left">
                        <h2 className="text-2xl font-bold text-white">Welcome back</h2>
                        <p className="text-slate-400 mt-2">Enter your credentials to access the platform.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                placeholder="Admin"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-300">Password</label>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                                <Lock className="w-4 h-4" /> {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Sign In <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-sm text-slate-500">
                        Restricted access. Authorized personnel only.
                    </p>
                </motion.div>
            </div>
        </div>
    )
}
