import { useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { adminApi } from '../../services/adminApi'
import { motion } from 'framer-motion'
import { KeyRound, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'

export function ResetPassword() {
    const { slug } = useParams()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')

    const [email, setEmail] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // If token exists, show reset form. Otherwise show request form.
    const hasToken = !!token

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            await adminApi.forgotPassword(slug || email)
            setSuccess('If an account exists, a reset email has been sent. Check your inbox.')
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        setLoading(true)

        try {
            const result = await adminApi.resetPassword(token!, newPassword)
            setSuccess('Password updated successfully!')
            setTimeout(() => {
                navigate(`/w/${result.slug || slug}/admin/login`)
            }, 2000)
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
                        <KeyRound className="w-6 h-6 text-indigo-500" />
                    </div>
                </div>

                <h1 className="text-xl font-semibold text-center text-slate-900 mb-2">
                    {hasToken ? 'Set New Password' : 'Reset Password'}
                </h1>
                <p className="text-slate-500 text-center text-sm mb-8">
                    {hasToken ? 'Enter your new password below' : 'Enter your website slug to receive a reset link'}
                </p>

                {success ? (
                    <div className="text-center">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                        <p className="text-green-600 font-medium">{success}</p>
                    </div>
                ) : hasToken ? (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New Password"
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-4 py-3 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                            autoFocus
                        />
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm Password"
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-4 py-3 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                        />

                        {error && <p className="text-red-500 text-xs text-center">{error}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleRequestReset} className="space-y-4">
                        <input
                            type="text"
                            value={slug || email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Website Slug (e.g. john-smith)"
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-4 py-3 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                            disabled={!!slug}
                            autoFocus
                        />

                        {error && <p className="text-red-500 text-xs text-center">{error}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>
                )}

                <div className="text-center mt-6">
                    <a
                        href={slug ? `/w/${slug}/admin/login` : '/'}
                        className="text-xs text-slate-400 hover:text-slate-600 transition-colors inline-flex items-center gap-1"
                    >
                        <ArrowLeft className="w-3 h-3" />
                        Back to Login
                    </a>
                </div>
            </motion.div>
        </div>
    )
}
