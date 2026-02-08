/**
 * Agent Input Form Component
 */

interface AgentInputProps {
    url: string
    onUrlChange: (url: string) => void
    onSubmit: () => void
    isLoading: boolean
    buttonText: string
}

export function AgentInput({ url, onUrlChange, onSubmit, isLoading, buttonText }: AgentInputProps) {
    return (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
            <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Import Agent Profile
            </h2>
            <p className="text-slate-400 text-sm mb-4">
                Paste a Coldwell Banker agent profile URL to extract their contact information, photo, and social links.
            </p>
            <p className="text-slate-400 text-sm mb-4">
                Find agent profiles with the link below: <a href="https://www.coldwellbanker.com/find-agents" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">https://www.coldwellbanker.com/find-agents</a>
            </p>

            <div className="flex gap-3">
                <input
                    type="url"
                    value={url}
                    onChange={(e) => onUrlChange(e.target.value)}
                    placeholder="https://www.coldwellbanker.com/.../agents/..."
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                />
                <button
                    onClick={onSubmit}
                    disabled={isLoading || !url.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-medium rounded-lg hover:from-indigo-600 hover:to-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Extracting...
                        </>
                    ) : (
                        buttonText
                    )}
                </button>
            </div>
        </div >
    )
}
