interface TabProps {
    views: { id: string, label: string }[]
    currentView: string
    onChange: (view: string) => void
}

export function Tabs({ views, currentView, onChange }: TabProps) {
    return (
        <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-lg border border-slate-700/50 inline-flex mb-8">
            {views.map(view => (
                <button
                    key={view.id}
                    onClick={() => onChange(view.id)}
                    className={`
                        px-4 py-2 rounded-md text-sm font-medium transition-all
                        ${currentView === view.id
                            ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg'
                            : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                        }
                    `}
                >
                    {view.label}
                </button>
            ))}
        </div>
    )
}
