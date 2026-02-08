
import { useState } from 'react'
import { HelpCircle, X, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function HelpButton() {
    const [isOpen, setIsOpen] = useState(false)
    const [expandedQuestion, setExpandedQuestion] = useState<string | null>('domain')

    const toggleOpen = () => setIsOpen(!isOpen)
    const toggleQuestion = (id: string) => {
        setExpandedQuestion(expandedQuestion === id ? null : id)
    }

    return (
        <>
            {/* Floating Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleOpen}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-500 transition-colors shadow-indigo-500/30"
                aria-label="Help & FAQ"
            >
                <HelpCircle className="w-8 h-8" />
            </motion.button>

            {/* Modal */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={toggleOpen}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            className="fixed bottom-24 right-6 w-[90vw] md:w-[480px] max-h-[80vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-[70] overflow-hidden flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <HelpCircle className="w-5 h-5 text-indigo-400" />
                                    Help & Resources
                                </h3>
                                <button
                                    onClick={toggleOpen}
                                    className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content - Scrollable */}
                            <div className="p-4 overflow-y-auto custom-scrollbar space-y-4">

                                {/* FAQ Item: Domain Connection */}
                                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-800/30">
                                    <button
                                        onClick={() => toggleQuestion('domain')}
                                        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/50 transition-colors"
                                    >
                                        <span className="font-semibold text-slate-200">How to connect my custom domain?</span>
                                        {expandedQuestion === 'domain' ? (
                                            <ChevronUp className="w-5 h-5 text-slate-400" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-slate-400" />
                                        )}
                                    </button>

                                    <AnimatePresence>
                                        {expandedQuestion === 'domain' && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="p-4 pt-0 text-slate-300 text-sm space-y-3 border-t border-slate-800/50">
                                                    <p className="mt-2">
                                                        Connecting your custom domain (e.g., <code>yourname.com</code>) makes your website look professional.
                                                    </p>
                                                    <ol className="list-decimal list-inside space-y-1 ml-1 text-slate-400">
                                                        <li>Log in to your domain provider (GoDaddy, Namecheap, etc.).</li>
                                                        <li>Go to <strong>DNS Settings</strong> or <strong>DNS Management</strong>.</li>
                                                        <li>Add a <strong>CNAME Record</strong>:
                                                            <ul className="list-disc list-inside ml-4 mt-1 mb-1 text-indigo-300">
                                                                <li>Type: <strong>CNAME</strong></li>
                                                                <li>Name/Host: <strong>www</strong> (or @ for root)</li>
                                                                <li>Value/Target: <strong>cname.siteo.io</strong></li>
                                                            </ul>
                                                        </li>
                                                        <li>Save changes. It may take up to 24-48 hours to propagate.</li>
                                                    </ol>

                                                    {/* Video Embed */}
                                                    <div className="mt-4 rounded-lg overflow-hidden border border-slate-700 bg-black aspect-video relative group cursor-pointer">
                                                        <iframe
                                                            width="100%"
                                                            height="100%"
                                                            src="https://www.youtube.com/embed/BUPRQaZ7rYA?si=Qb3LTcoolSJWVqyW"
                                                            title="How to connect domain"
                                                            frameBorder="0"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                            allowFullScreen
                                                            className="absolute inset-0 w-full h-full"
                                                        ></iframe>
                                                    </div>
                                                    <p className="text-xs text-slate-500 italic mt-2">
                                                        Watch the video above for a step-by-step walkthrough.
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Placeholder for other FAQs */}
                                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-800/30 opacity-60">
                                    <button
                                        className="w-full flex items-center justify-between p-4 text-left cursor-not-allowed"
                                        disabled
                                    >
                                        <span className="font-semibold text-slate-400">More guides coming soon...</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}
