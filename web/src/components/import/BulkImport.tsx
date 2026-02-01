import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileSpreadsheet, Play, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import { extractProfile } from '../../services/api'
import { isValidCBUrl } from '../../services/api'

interface ImportResult {
    url: string
    status: 'pending' | 'processing' | 'success' | 'error'
    name?: string
    error?: string
}

export function BulkImport() {
    const [urls, setUrls] = useState<string[]>([])
    const [results, setResults] = useState<ImportResult[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)

    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer)
                const workbook = XLSX.read(data, { type: 'array' })
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
                // Get raw 2D array of cell values
                const rows = XLSX.utils.sheet_to_json<(string | number | undefined)[]>(firstSheet, { header: 1 })

                // Extract URLs: flatten, convert to strings, filter valid CB URLs
                const extractedUrls: string[] = rows
                    .flat()
                    .map(cell => String(cell ?? ''))
                    .filter(cell => isValidCBUrl(cell))

                setUrls(extractedUrls)
                setResults(extractedUrls.map(url => ({ url, status: 'pending' })))
            } catch (err) {
                alert('Failed to parse Excel file')
            }
        }
        reader.readAsArrayBuffer(file)
    }, [])

    const startImport = async () => {
        if (urls.length === 0 || isProcessing) return

        setIsProcessing(true)
        setCurrentIndex(0)

        for (let i = 0; i < urls.length; i++) {
            setCurrentIndex(i)
            setResults(prev => prev.map((r, idx) =>
                idx === i ? { ...r, status: 'processing' } : r
            ))

            try {
                const profile = await extractProfile(urls[i])
                setResults(prev => prev.map((r, idx) =>
                    idx === i ? { ...r, status: 'success', name: profile.full_name } : r
                ))
            } catch (err: any) {
                setResults(prev => prev.map((r, idx) =>
                    idx === i ? { ...r, status: 'error', error: err.message } : r
                ))
            }

            // Small delay between requests to be polite
            await new Promise(resolve => setTimeout(resolve, 500))
        }

        setIsProcessing(false)
    }

    const successCount = results.filter(r => r.status === 'success').length
    const errorCount = results.filter(r => r.status === 'error').length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-slate-900/40 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
                    <span className="w-2 h-6 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"></span>
                    Bulk Import
                </h2>

                {/* File Upload */}
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-purple-500/50 hover:bg-slate-800/30 transition-all group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FileSpreadsheet className="w-10 h-10 text-slate-500 group-hover:text-purple-400 transition-colors mb-3" />
                        <p className="text-sm text-slate-400">
                            <span className="font-semibold text-purple-400">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Excel or CSV file with agent URLs</p>
                    </div>
                    <input
                        type="file"
                        className="hidden"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileUpload}
                        disabled={isProcessing}
                    />
                </label>

                {/* Actions */}
                {urls.length > 0 && (
                    <div className="mt-4 flex items-center justify-between">
                        <p className="text-sm text-slate-400">
                            Found <span className="text-white font-semibold">{urls.length}</span> valid agent URLs
                        </p>
                        <button
                            onClick={startImport}
                            disabled={isProcessing}
                            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white rounded-xl font-medium transition-colors disabled:cursor-not-allowed"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Importing {currentIndex + 1} of {urls.length}...
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4" />
                                    Start Import
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Progress Bar */}
                {isProcessing && (
                    <div className="mt-4">
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-purple-600 to-teal-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${((currentIndex + 1) / urls.length) * 100}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Results Summary */}
            {results.length > 0 && !isProcessing && successCount + errorCount > 0 && (
                <div className="flex gap-4">
                    <div className="flex-1 bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                        <p className="text-3xl font-bold text-green-400">{successCount}</p>
                        <p className="text-sm text-green-300/70">Imported</p>
                    </div>
                    <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                        <p className="text-3xl font-bold text-red-400">{errorCount}</p>
                        <p className="text-sm text-red-300/70">Failed</p>
                    </div>
                </div>
            )}

            {/* Results List */}
            {results.length > 0 && (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                    <AnimatePresence>
                        {results.map((result, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex items-center gap-3 p-3 rounded-lg border ${result.status === 'success' ? 'bg-green-500/5 border-green-500/20' :
                                    result.status === 'error' ? 'bg-red-500/5 border-red-500/20' :
                                        result.status === 'processing' ? 'bg-purple-500/5 border-purple-500/20' :
                                            'bg-slate-800/30 border-slate-700/50'
                                    }`}
                            >
                                {result.status === 'pending' && <div className="w-5 h-5 rounded-full border-2 border-slate-600" />}
                                {result.status === 'processing' && <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />}
                                {result.status === 'success' && <CheckCircle className="w-5 h-5 text-green-400" />}
                                {result.status === 'error' && <XCircle className="w-5 h-5 text-red-400" />}

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white truncate">
                                        {result.name || result.url}
                                    </p>
                                    {result.error && (
                                        <p className="text-xs text-red-400 truncate">{result.error}</p>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}
