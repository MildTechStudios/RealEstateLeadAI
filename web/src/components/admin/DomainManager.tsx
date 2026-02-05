import { useState, useEffect } from 'react'
import { adminApi } from '../../services/adminApi'
import { Globe, AlertTriangle, Loader2, X, RefreshCw } from 'lucide-react'

// interface DomainManagerProps {
//     slug: string
//     token: string
// } 
// REMOVED IN FAVOR OF NEW PROPS IN COMPONENT DEFINITION BELOW

// export function DomainManager({ token }: DomainManagerProps) { // Old prop
// New props: We need the agent ID for config updates
interface DomainManagerProps {
    agentId: string
    initialDomain?: string // Optional pre-loaded domain
    token?: string // Optional auth token (for Agent Dashboard)
}

export function DomainManager({ agentId, initialDomain, token }: DomainManagerProps) {
    const [domain, setDomain] = useState(initialDomain || '')
    const [status, setStatus] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [verifying, setVerifying] = useState(false)

    // Load saved domain from config if available (only if not passed in)
    const checkStatus = async (domainName: string) => {
        try {
            setVerifying(true)
            const data = await adminApi.getDomainStatus(domainName, token)
            setStatus(data)
            return data
        } catch (err: any) {
            console.error(err)
        } finally {
            setVerifying(false)
        }
    }

    const handleAddDomain = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!domain) return

        setLoading(true)
        setError(null)
        setStatus(null)

        try {
            const result = await adminApi.addDomain(domain, token)
            setStatus(result)
        } catch (err: any) {
            setError(err.message)

            // If the error contains verification info (ownership conflict), show it!
            const errorCode = err.details?.code || err.details?.error?.code;
            const verification = err.details?.verification || err.details?.error?.verification;

            // If the error contains verification info (ownership conflict) or is existing domain
            if (errorCode === 'existing_project_domain' || verification) {

                // If it already exists, just fetch the status to "adopt" it
                if (errorCode === 'existing_project_domain') {
                    console.log('Domain already exists, fetching status...');
                    setError(null); // Clear the error message so UI doesn't show "Failed to add domain"
                    await checkStatus(domain);
                    return; // checkStatus will update state
                }

                const verificationList = Array.isArray(verification)
                    ? verification
                    : (verification ? [verification] : []);

                setStatus({
                    name: domain,
                    verified: false,
                    verification: verificationList,
                    error: err.details
                })
            }
        }

        // ALWAYS save the domain to config, regardless of Vercel API result
        try {
            console.log('[DomainManager] Saving custom_domain to config:', domain)
            await adminApi.updateConfig(agentId, { custom_domain: domain }, token)
            console.log('[DomainManager] Domain saved to config successfully')
        } catch (configErr) {
            console.error('[DomainManager] Failed to save domain to config:', configErr)
        }

        setLoading(false)
    }

    const handleVerify = async () => {
        if (!domain && !status?.name) return
        const d = domain || status.name

        setVerifying(true)
        try {
            const result = await adminApi.verifyDomain(d, token)
            setStatus(result)
        } catch (err: any) {
            // Check for 404 "Project Domain not found" -> Auto-heal by adding it again
            if (err.details && err.details.code === 'not_found') {
                try {
                    console.log('Domain missing from Vercel, re-adding...', d)
                    const result = await adminApi.addDomain(d, token)
                    setStatus(result)
                    return
                } catch (addErr: any) {
                    if (addErr.details) err = addErr
                    else setError("Failed to restore domain connection.")
                }
            }

            // If the error contains verification info (ownership conflict), show it!
            const errorCode = err.details?.code || err.details?.error?.code;
            const verification = err.details?.verification || err.details?.error?.verification;

            if (errorCode === 'existing_project_domain' || verification) {

                const verificationList = Array.isArray(verification)
                    ? verification
                    : (verification ? [verification] : []);

                setStatus({
                    name: d,
                    verified: false,
                    verification: verificationList,
                    error: err.details
                })
            } else {
                try {
                    await checkStatus(d)
                } catch (e) {
                    setError(err.message)
                }
            }
        } finally {
            setVerifying(false)
        }
    }

    const handleRemove = async () => {
        if (!confirm('Are you sure you want to disconnect this domain?')) return

        const d = domain || status?.name
        setLoading(true)
        try {
            await adminApi.removeDomain(d, token)
            await adminApi.updateConfig(agentId, { custom_domain: null }, token)
            setDomain('')
            setStatus(null)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // Attempt to load existing custom_domain from config on mount
    useEffect(() => {
        const loadConfig = async () => {
            if (initialDomain) {
                checkStatus(initialDomain)
                return
            }
            try {
                // If we have a token (Agent Dashboard), we might need to fetch config using it?
                // But adminApi.getConfig calls /api/admin/config/:id which defaults to Supabase.
                // We should update getConfig too, but for now assuming initialDomain might suffice or we skip.
                // Actually, let's just rely on initialDomain or skip this if not provided.
                if (!initialDomain && !token) {
                    const config = await adminApi.getConfig(agentId) // Platform Dashboard default
                    if (config.custom_domain) {
                        setDomain(config.custom_domain)
                        checkStatus(config.custom_domain)
                    }
                }
            } catch (err) {
                console.error(err)
            }
        }
        loadConfig()
    }, [agentId, initialDomain, token])

    // Fix: render based on status presence, not domain input value
    if (!status) {
        // If we have an initial domain but no status yet, we are probably loading checkStatus
        if (initialDomain && verifying) {
            return (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
                </div>
            )
        }

        return (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-teal-500/10 rounded-lg flex items-center justify-center">
                        <Globe className="w-5 h-5 text-teal-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">Connect Custom Domain</h3>
                        <p className="text-sm text-slate-400">Use your own domain (e.g. yourname.com)</p>
                    </div>
                </div>

                <form onSubmit={handleAddDomain} className="flex gap-2">
                    <input
                        type="text"
                        placeholder="example.com"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white outline-none focus:border-teal-500 transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold rounded-lg transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Adding...' : 'Connect'}
                    </button>
                </form>
                {error && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-red-400 text-xs font-mono break-all">
                            {typeof error === 'object' ? JSON.stringify(error) : error}
                        </p>
                    </div>
                )}
            </div>
        )
    }

    // Status State
    const isVerified = status?.verified || false
    const currentDomain = domain || status?.name || ''
    const isSubdomain = currentDomain.split('.').length > 2
    const dnsType = isSubdomain ? 'CNAME' : 'A'
    const dnsName = isSubdomain ? (currentDomain.split('.')[0] === 'www' ? 'www' : currentDomain.split('.')[0]) : '@'
    const dnsValue = isSubdomain ? 'cname.vercel-dns.com' : '76.76.21.21'

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isVerified ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                        <Globe className={`w-5 h-5 ${isVerified ? 'text-green-400' : 'text-yellow-400'}`} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            {currentDomain}
                            {isVerified ? (
                                <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30">Active</span>
                            ) : (
                                <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-500/30">Pending DNS</span>
                            )}
                        </h3>
                        <p className="text-sm text-slate-400">Custom Domain Configuration</p>
                    </div>
                </div>
                <button
                    onClick={handleRemove}
                    className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Ownership Verification (TXT Record) */}
            {status?.verification?.some((v: any) => v.reason === 'pending_domain_verification') && (
                <div className="mb-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-white text-sm mb-1">Prove Domain Ownership</h4>
                            <p className="text-xs text-blue-200 mb-3">
                                This domain was used by another Vercel project properly. Please add this <b>TXT Record</b> to prove you own it:
                            </p>

                            {status.verification
                                .filter((v: any) => v.reason === 'pending_domain_verification')
                                .map((v: any, i: number) => (
                                    <div key={i} className="flex items-center gap-4 bg-slate-900 rounded-lg p-3 border border-slate-800">
                                        <div className="flex-1">
                                            <span className="text-[10px] text-slate-500 block uppercase tracking-wider mb-1">Type</span>
                                            <span className="text-white font-mono font-bold text-sm">TXT</span>
                                        </div>
                                        <div className="flex-[2]">
                                            <span className="text-[10px] text-slate-500 block uppercase tracking-wider mb-1">Name</span>
                                            <span className="text-white font-mono font-bold text-sm break-all select-all">
                                                {v.domain.replace(`.${currentDomain}`, '') || '@'}
                                            </span>
                                        </div>
                                        <div className="flex-[3]">
                                            <span className="text-[10px] text-slate-500 block uppercase tracking-wider mb-1">Value</span>
                                            <span className="text-white font-mono font-bold text-sm break-all select-all cursor-pointer" title={v.value}>{v.value}</span>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            )}

            {!isVerified && !status?.verification?.some((v: any) => v.reason === 'pending_domain_verification') && (
                <div className="mb-6 bg-slate-950 border border-slate-800 rounded-xl p-4">

                    {/* Detailed Verification Status */}
                    {status?.verification && status.verification.length > 0 && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <h5 className="text-red-400 font-semibold text-xs uppercase tracking-wide mb-1">Verification Status</h5>
                            {status.verification.map((v: any, i: number) => (
                                <p key={i} className="text-red-300 text-sm">
                                    {v.reason === 'missing_config' && `We can't see the ${v.type.toUpperCase()} record yet.`}
                                    {v.reason === 'conflicting_nameservers' && 'You have conflicting Nameservers set.'}
                                    {v.reason === 'pending_propagation' && 'DNS is updating (propagation)...'}
                                    {!['missing_config', 'conflicting_nameservers', 'pending_propagation'].includes(v.reason) && `Error: ${v.reason}`}
                                </p>
                            ))}
                        </div>
                    )}

                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-white text-sm mb-1">DNS Configuration Required</h4>
                            <p className="text-xs text-slate-400 mb-3">
                                Log in to your domain provider and add the following <b>{dnsType} Record</b>:
                            </p>

                            <div className="flex items-center gap-4 bg-slate-900 rounded-lg p-3 border border-slate-800">
                                <div className="flex-1">
                                    <span className="text-xs text-slate-500 block uppercase tracking-wider mb-1">Type</span>
                                    <span className="text-white font-mono font-bold">{dnsType}</span>
                                </div>
                                <div className="flex-1">
                                    <span className="text-xs text-slate-500 block uppercase tracking-wider mb-1">Name</span>
                                    <span className="text-white font-mono font-bold">{dnsName}</span>
                                </div>
                                <div className="flex-1">
                                    <span className="text-xs text-slate-500 block uppercase tracking-wider mb-1">Value</span>
                                    <span className="text-white font-mono font-bold select-all cursor-pointer truncate" title={dnsValue}>{dnsValue}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="text-[10px] text-slate-500 mt-3 text-center">
                        Note: DNS changes can take up to 48 hours, but usually apply within minutes.
                    </p>
                </div>
            )}

            <div className="flex justify-end gap-3">
                <button
                    onClick={isVerified ? () => checkStatus(domain || status.name) : handleVerify}
                    disabled={verifying}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${isVerified
                        ? 'bg-slate-800 hover:bg-slate-700 text-white'
                        : 'bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold shadow-lg shadow-teal-500/20'
                        }`}
                >
                    {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    {isVerified ? 'Refresh Status' : 'Verify Connection'}
                </button>
            </div>

            {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
                    <p className="text-red-400 text-xs font-mono break-all inline-block text-left">
                        {typeof error === 'object' ? JSON.stringify(error) : error}
                    </p>
                </div>
            )}
        </div>
    )
}
