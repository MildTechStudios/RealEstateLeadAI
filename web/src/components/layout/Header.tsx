/**
 * Header Component
 */

export function Header() {
    return (
        <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <span className="text-white font-bold text-xl font-sans">S</span>
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-0.5">
                        Site<span className="text-indigo-400">o</span>
                    </h1>
                    <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">Agent Automation Platform</p>
                </div>
            </div>
        </header>
    )
}
