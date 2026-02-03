import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Loader2, CheckCircle, Calendar } from 'lucide-react'

interface BookingModalProps {
    isOpen: boolean
    onClose: () => void
    agentId: string
    agentName: string
}

export function BookingModal({ isOpen, onClose, agentId, agentName }: BookingModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        preferredDate: '',
        preferredTime: '',
        notes: ''
    })
    const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState('')

    // Reset form state when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData({ name: '', email: '', phone: '', preferredDate: '', preferredTime: '', notes: '' })
            setStatus('idle')
            setErrorMessage('')
        }
    }, [isOpen])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setStatus('sending')
        setErrorMessage('')

        const messageLines = [
            'Appointment Request',
            '---',
            `Preferred Date: ${formData.preferredDate}`,
            `Preferred Time: ${formData.preferredTime}`,
            `Notes: ${formData.notes || 'None'}`
        ]

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    message: messageLines.join('\n'),
                    agentId
                })
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || 'Failed to send')

            setStatus('success')
        } catch (err: any) {
            setStatus('error')
            setErrorMessage(err.message || 'Something went wrong.')
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-700/10 flex items-center justify-center text-amber-700">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                                    Book an Appointment
                                </h3>
                                <p className="text-sm text-slate-500">Schedule a call with {agentName.split(' ')[0]}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="ml-auto p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            {status === 'success' ? (
                                <div className="text-center py-8">
                                    <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
                                    <h4 className="text-xl font-bold text-slate-900 mb-2">Request Sent!</h4>
                                    <p className="text-slate-500">{agentName} will confirm your appointment soon.</p>
                                    <button
                                        onClick={onClose}
                                        className="mt-6 px-6 py-2 bg-slate-100 text-slate-700 font-medium rounded-full hover:bg-slate-200 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {status === 'error' && (
                                        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                                            {errorMessage}
                                        </div>
                                    )}

                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                                            Your Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            required
                                            value={formData.name}
                                            onChange={handleChange}
                                            disabled={status === 'sending'}
                                            placeholder="John Doe"
                                            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20 outline-none transition-all disabled:bg-slate-100"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                                                Email <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                required
                                                value={formData.email}
                                                onChange={handleChange}
                                                disabled={status === 'sending'}
                                                placeholder="john@email.com"
                                                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20 outline-none transition-all disabled:bg-slate-100"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
                                                Phone <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                id="phone"
                                                name="phone"
                                                required
                                                value={formData.phone}
                                                onChange={handleChange}
                                                disabled={status === 'sending'}
                                                placeholder="(555) 123-4567"
                                                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20 outline-none transition-all disabled:bg-slate-100"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="preferredDate" className="block text-sm font-medium text-slate-700 mb-1">
                                                Preferred Date <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                id="preferredDate"
                                                name="preferredDate"
                                                required
                                                value={formData.preferredDate}
                                                onChange={handleChange}
                                                disabled={status === 'sending'}
                                                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20 outline-none transition-all disabled:bg-slate-100"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="preferredTime" className="block text-sm font-medium text-slate-700 mb-1">
                                                Preferred Time <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                id="preferredTime"
                                                name="preferredTime"
                                                required
                                                value={formData.preferredTime}
                                                onChange={handleChange}
                                                disabled={status === 'sending'}
                                                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20 outline-none transition-all disabled:bg-slate-100"
                                            >
                                                <option value="">Select...</option>
                                                <option value="Morning (9am-12pm)">Morning (9am-12pm)</option>
                                                <option value="Afternoon (12pm-5pm)">Afternoon (12pm-5pm)</option>
                                                <option value="Evening (5pm-8pm)">Evening (5pm-8pm)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">
                                            Additional Notes <span className="text-slate-400">(optional)</span>
                                        </label>
                                        <textarea
                                            id="notes"
                                            name="notes"
                                            rows={2}
                                            value={formData.notes}
                                            onChange={handleChange}
                                            disabled={status === 'sending'}
                                            placeholder="Anything you'd like to discuss?"
                                            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20 outline-none transition-all resize-none disabled:bg-slate-100"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={status === 'sending'}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-70"
                                    >
                                        {status === 'sending' ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5" />
                                                Request Appointment
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
