import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Loader2, CheckCircle, Home, TrendingUp, BarChart2 } from 'lucide-react'

export type ServiceType = 'selling' | 'buying' | 'valuation'

interface ServiceModalProps {
    isOpen: boolean
    onClose: () => void
    serviceType: ServiceType
    agentId: string
    agentName: string
}

interface FormField {
    name: string
    label: string
    type: 'text' | 'email' | 'tel' | 'select' | 'textarea'
    required?: boolean
    placeholder?: string
    options?: string[]
}

const SERVICE_CONFIG: Record<ServiceType, { title: string; subtitle: string; icon: typeof Home; fields: FormField[] }> = {
    selling: {
        title: 'Selling Your Home',
        subtitle: 'Let\'s discuss your property and goals.',
        icon: TrendingUp,
        fields: [
            { name: 'propertyAddress', label: 'Property Address', type: 'text', required: true, placeholder: '123 Main St, City, State' },
            { name: 'timeline', label: 'Selling Timeline', type: 'select', required: true, options: ['ASAP', '1-3 Months', '3-6 Months', 'Just Exploring'] },
            { name: 'priceGoal', label: 'Price Expectation (Optional)', type: 'text', placeholder: '$500,000' },
            { name: 'name', label: 'Your Name', type: 'text', required: true, placeholder: 'John Doe' },
            { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'john@example.com' },
            { name: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: '(555) 123-4567' },
        ]
    },
    buying: {
        title: 'Buying a Home',
        subtitle: 'Tell me what you\'re looking for.',
        icon: Home,
        fields: [
            { name: 'desiredArea', label: 'Desired Area / City', type: 'text', required: true, placeholder: 'Frisco, TX' },
            { name: 'budget', label: 'Budget Range', type: 'select', required: true, options: ['Under $300k', '$300k - $500k', '$500k - $1M', '$1M+'] },
            { name: 'timeframe', label: 'Timeframe', type: 'select', required: true, options: ['Ready Now', 'Pre-Approved', 'Just Browsing'] },
            { name: 'mustHaves', label: 'Must-Haves (Optional)', type: 'textarea', placeholder: 'Pool, 4+ bedrooms, etc.' },
            { name: 'name', label: 'Your Name', type: 'text', required: true, placeholder: 'John Doe' },
            { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'john@example.com' },
            { name: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: '(555) 123-4567' },
        ]
    },
    valuation: {
        title: 'Home Valuation',
        subtitle: 'Get a professional assessment of your property.',
        icon: BarChart2,
        fields: [
            { name: 'propertyAddress', label: 'Property Address', type: 'text', required: true, placeholder: '123 Main St, City, State' },
            { name: 'propertyType', label: 'Property Type', type: 'select', required: true, options: ['Single Family', 'Condo / Townhouse', 'Multi-Family', 'Land'] },
            { name: 'condition', label: 'Condition', type: 'select', required: true, options: ['Needs Work', 'Average', 'Updated', 'Like New'] },
            { name: 'recentUpdates', label: 'Recent Updates (Optional)', type: 'textarea', placeholder: 'New roof, renovated kitchen...' },
            { name: 'name', label: 'Your Name', type: 'text', required: true, placeholder: 'John Doe' },
            { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'john@example.com' },
            { name: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: '(555) 123-4567' },
        ]
    }
}

export function ServiceModal({ isOpen, onClose, serviceType, agentId, agentName }: ServiceModalProps) {
    const config = SERVICE_CONFIG[serviceType]
    const [formData, setFormData] = useState<Record<string, string>>({})
    const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState('')

    // Reset form state when modal opens or service type changes
    useEffect(() => {
        if (isOpen) {
            setFormData({})
            setStatus('idle')
            setErrorMessage('')
        }
    }, [isOpen, serviceType])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setStatus('sending')
        setErrorMessage('')

        // Build a formatted message from the form data
        const messageLines = [
            `Service: ${config.title}`,
            '---',
            ...config.fields.map(f => `${f.label}: ${formData[f.name] || 'N/A'}`)
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
            setFormData({})
        } catch (err: any) {
            setStatus('error')
            setErrorMessage(err.message || 'Something went wrong.')
        }
    }

    const Icon = config.icon

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
                        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-700/10 flex items-center justify-center text-amber-700">
                                <Icon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                                    {config.title}
                                </h3>
                                <p className="text-sm text-slate-500">{config.subtitle}</p>
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
                                    <p className="text-slate-500">{agentName} will be in touch shortly.</p>
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

                                    {config.fields.map((field) => (
                                        <div key={field.name}>
                                            <label htmlFor={field.name} className="block text-sm font-medium text-slate-700 mb-1">
                                                {field.label} {field.required && <span className="text-red-500">*</span>}
                                            </label>
                                            {field.type === 'select' ? (
                                                <select
                                                    id={field.name}
                                                    name={field.name}
                                                    required={field.required}
                                                    value={formData[field.name] || ''}
                                                    onChange={handleChange}
                                                    disabled={status === 'sending'}
                                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20 outline-none transition-all disabled:bg-slate-100"
                                                >
                                                    <option value="">Select...</option>
                                                    {field.options?.map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            ) : field.type === 'textarea' ? (
                                                <textarea
                                                    id={field.name}
                                                    name={field.name}
                                                    rows={3}
                                                    value={formData[field.name] || ''}
                                                    onChange={handleChange}
                                                    disabled={status === 'sending'}
                                                    placeholder={field.placeholder}
                                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20 outline-none transition-all resize-none disabled:bg-slate-100"
                                                />
                                            ) : (
                                                <input
                                                    type={field.type}
                                                    id={field.name}
                                                    name={field.name}
                                                    required={field.required}
                                                    value={formData[field.name] || ''}
                                                    onChange={handleChange}
                                                    disabled={status === 'sending'}
                                                    placeholder={field.placeholder}
                                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20 outline-none transition-all disabled:bg-slate-100"
                                                />
                                            )}
                                        </div>
                                    ))}

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
                                                Submit Request
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
