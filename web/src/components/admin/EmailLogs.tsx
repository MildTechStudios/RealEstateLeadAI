import { useState, useEffect } from 'react'
import { adminApi } from '../../services/adminApi'
import {
    CheckCircle,
    XCircle,
    Mail,
    RefreshCw,
    Clock,
    ExternalLink,
    MousePointerClick,
    AlertTriangle,
    Ban
} from 'lucide-react'

// Types based on Resend API response
interface EmailLog {
    id: string
    recipient?: string
    from?: string
    to?: string[]
    subject: string
    created_at: string
    status: 'sent' | 'delivered' | 'delivery_delayed' | 'complained' | 'bounced' | 'opened' | 'clicked' | 'failed'
    error_message?: string
}

function StatusBadge({ status }: { status: EmailLog['status'] }) {
    switch (status) {
        case 'opened':
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Opened
                </span>
            )
        case 'clicked':
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                    <MousePointerClick className="w-3.5 h-3.5" />
                    Clicked
                </span>
            )
        case 'delivered':
        case 'sent':
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {status === 'delivered' ? 'Delivered' : 'Sent'}
                </span>
            )
        case 'bounced':
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                    <Ban className="w-3.5 h-3.5" />
                    Bounced
                </span>
            )
        case 'complained':
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Spam Report
                </span>
            )
        case 'failed':
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                    <XCircle className="w-3.5 h-3.5" />
                    Failed
                </span>
            )
        default:
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    <Clock className="w-3.5 h-3.5" />
                    {status}
                </span>
            )
    }
}

export function EmailLogs() {
    const [logs, setLogs] = useState<EmailLog[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchLogs = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('sb-jqtrgdmjosegilmbxino-auth-token')
            let headers = {}
            if (token) {
                const session = JSON.parse(token)
                headers = { 'Authorization': `Bearer ${session.access_token}` }
            }

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/emails`, {
                headers
            })

            if (!response.ok) throw new Error('Failed to fetch logs')

            const data = await response.json()

            if (data.data && Array.isArray(data.data)) {
                setLogs(data.data)
            } else if (Array.isArray(data)) {
                setLogs(data)
            } else {
                setLogs([])
            }
        } catch (err: any) {
            console.error(err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs()
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">Email Logs</h2>
                    <p className="text-sm text-slate-500">Track deliverability and engagement of automated emails.</p>
                </div>
                <button
                    onClick={fetchLogs}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                    title="Refresh Logs"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Error loading logs: {error}
                </div>
            )}

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 font-semibold text-slate-500 uppercase tracking-wider text-xs">Status</th>
                            <th className="px-6 py-3 font-semibold text-slate-500 uppercase tracking-wider text-xs">To</th>
                            <th className="px-6 py-3 font-semibold text-slate-500 uppercase tracking-wider text-xs">Subject</th>
                            <th className="px-6 py-3 font-semibold text-slate-500 uppercase tracking-wider text-xs">Sent At</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-6 py-4"><div className="h-6 w-24 bg-slate-100 rounded-full"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 w-48 bg-slate-100 rounded"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 w-64 bg-slate-100 rounded"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-100 rounded"></div></td>
                                </tr>
                            ))
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                            <Mail className="w-6 h-6 text-slate-400" />
                                        </div>
                                        <p className="font-medium text-slate-900">No emails sent yet</p>
                                        <p className="text-sm text-slate-400 mt-1">Sent emails will appear here.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <StatusBadge status={log.status} />
                                    </td>
                                    <td className="px-6 py-4 text-slate-900 font-medium">
                                        {/* DB uses 'recipient', Resend uses 'to' array */}
                                        {log.recipient || (log.to ? log.to.join(', ') : 'Unknown')}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 truncate max-w-xs group-hover:text-slate-900 transition-colors" title={log.subject}>
                                        {log.subject}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                                        {new Date(log.created_at).toLocaleString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
