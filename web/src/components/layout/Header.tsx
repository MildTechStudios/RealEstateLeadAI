/**
 * Header Component
 */

export function Header() {
    return (
        <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">CB</span>
                </div>
                <div>
                    <h1 className="text-xl font-semibold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                        Agent Importer
                    </h1>
                    <p className="text-sm text-slate-400">Coldwell Banker Profile Extraction</p>
                </div>
            </div>
        </header>
    )
}
