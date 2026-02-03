import { motion } from 'framer-motion'
import { type ThemeConfig } from '../../utils/theme'
import { type DBProfile } from '../../services/api'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

interface NavbarProps {
    agent: DBProfile
    theme: ThemeConfig
}

export function Navbar({ agent, theme }: NavbarProps) {
    const [isOpen, setIsOpen] = useState(false)

    // Scroll to section handler
    const scrollTo = (id: string) => {
        setIsOpen(false)
        const element = document.getElementById(id)
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
        }
    }

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm"
        >
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                {/* Agent Name / Logo */}
                <div
                    className="cursor-pointer"
                    onClick={() => scrollTo('hero')}
                >
                    <h1 className={`text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${theme.gradientFrom} via-slate-500 ${theme.gradientTo}`}>
                        {agent.full_name}
                    </h1>
                </div>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-8">
                    <button onClick={() => scrollTo('about')} className="text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium">About</button>
                    <button onClick={() => scrollTo('services')} className="text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium">Services</button>
                    <button onClick={() => scrollTo('contact')} className={`text-sm font-bold px-5 py-2.5 rounded-full bg-${theme.primaryColor} text-white hover:brightness-110 transition-all shadow-md hover:shadow-lg`}>
                        Contact
                    </button>
                </div>

                {/* Logos Section - CLEAN (No Container) */}
                <div className="hidden md:flex items-center">
                    <div className="flex items-center gap-6 h-20 px-2">
                        {/* Team Logo (Primary - Larger) */}
                        {agent.logo_url && (
                            <>
                                <img
                                    src={agent.logo_url}
                                    alt="Team Logo"
                                    className="h-full object-contain max-w-[180px] scale-100 origin-center mix-blend-multiply"
                                />
                                <div className="w-px h-10 bg-slate-300 mx-1" />
                            </>
                        )}

                        {/* Brokerage Logo (Secondary - Standard) */}
                        {agent.brokerage_logo_url ? (
                            <img
                                src={agent.brokerage_logo_url}
                                alt="Brokerage"
                                className="h-2/3 w-auto object-contain max-w-[140px]"
                            />
                        ) : (
                            <span className="text-xs text-slate-800 font-serif tracking-widest uppercase">Coldwell Banker Realty</span>
                        )}
                    </div>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 text-slate-600"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="md:hidden bg-white border-b border-slate-200"
                >
                    <div className="flex flex-col p-6 gap-4">
                        <button onClick={() => scrollTo('about')} className="text-left text-slate-600 font-medium">About</button>
                        <button onClick={() => scrollTo('services')} className="text-left text-slate-600 font-medium">Services</button>
                        <button onClick={() => scrollTo('contact')} className={`text-left text-${theme.primaryColor} font-bold`}>Contact</button>
                    </div>
                </motion.div>
            )}
        </motion.nav>
    )
}
