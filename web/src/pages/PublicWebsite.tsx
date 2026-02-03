import { useEffect, useState, useMemo, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { Mail, Phone, MapPin, Linkedin, Facebook, Instagram, Twitter, Youtube, TrendingUp, ArrowDown, Home, BarChart2, Building, BadgeCheck } from 'lucide-react'
import { getWebsiteBySlug, type DBProfile } from '../services/api'
import { getThemeConfig } from '../utils/theme'
import { FloatingNavbar } from '../components/website/FloatingNavbar'
import { ContactForm } from '../components/website/ContactForm'
import { ServiceModal, type ServiceType } from '../components/website/ServiceModal'
import { BookingModal } from '../components/website/BookingModal'

export function PublicWebsite() {
    const { slug } = useParams<{ slug: string }>()
    const [agent, setAgent] = useState<DBProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeModal, setActiveModal] = useState<ServiceType | null>(null)
    const [bookingOpen, setBookingOpen] = useState(false)

    const heroRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: heroRef,
        offset: ["start start", "end start"]
    })

    // Smooth spring for parallax
    const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })

    // Parallax transforms - Name moves slower (behind), Image moves faster
    const nameY = useTransform(smoothProgress, [0, 1], [0, -100])
    const imageY = useTransform(smoothProgress, [0, 1], [0, 150])
    const contentOpacity = useTransform(smoothProgress, [0, 0.5], [1, 0])
    const contentScale = useTransform(smoothProgress, [0, 0.5], [1, 0.9])

    const theme = useMemo(() => {
        if (!agent) return getThemeConfig(null, null)
        return getThemeConfig(agent.city, agent.state)
    }, [agent])

    useEffect(() => {
        async function fetchAgent() {
            if (!slug) return
            try {
                const data = await getWebsiteBySlug(slug)
                setAgent(data)
            } catch (err: any) {
                setError(err.message || 'Website not found')
            } finally {
                setLoading(false)
            }
        }
        fetchAgent()
    }, [slug])

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-slate-700 border-t-amber-500 rounded-full animate-spin"></div>
            </div>
        )
    }

    if (error || !agent) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
                <h1 className="text-4xl font-bold mb-4">Website Not Found</h1>
                <p className="text-slate-400">This agent website doesn't exist or isn't published yet.</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
            <FloatingNavbar agent={agent} onBookClick={() => setBookingOpen(true)} />

            {/* ===== HERO SECTION - "Editorial Depth" ===== */}
            <section
                ref={heroRef}
                id="hero"
                className="relative min-h-[120vh] flex items-center justify-center overflow-hidden"
            >
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <img
                        src={theme.heroImage}
                        alt="Background"
                        className="w-full h-full object-cover opacity-90"
                    />
                    {/* Gradient Overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-50/90 via-slate-50/50 to-amber-50/30" />
                </div>

                {/* Large Name Behind (Parallax Layer 1) */}
                <motion.div
                    style={{ y: nameY }}
                    className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none select-none"
                >
                    <h1
                        className="text-[12vw] md:text-[14vw] lg:text-[12vw] font-bold text-slate-900/40 uppercase tracking-tighter text-center leading-[0.8] mix-blend-overlay"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                        {agent.full_name}
                    </h1>
                </motion.div>

                {/* Headshot (Parallax Layer 2 - In Front) */}
                <motion.div
                    style={{ y: imageY, opacity: contentOpacity, scale: contentScale }}
                    className="relative z-20 text-center px-6"
                >
                    {agent.headshot_url ? (
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                            className="relative"
                        >
                            {/* Decorative Ring */}
                            <div className="absolute -inset-4 rounded-full border-2 border-amber-700/30 animate-pulse" />
                            <div className="w-56 h-56 md:w-72 md:h-72 mx-auto rounded-full overflow-hidden border-4 border-white shadow-2xl shadow-slate-900/20">
                                <img
                                    src={agent.headshot_url}
                                    alt={agent.full_name}
                                    className="w-full h-full object-cover object-top"
                                />
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-56 h-56 md:w-72 md:h-72 mx-auto rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-2xl"
                        >
                            <span
                                className="text-7xl font-bold text-slate-300"
                                style={{ fontFamily: "'Playfair Display', serif" }}
                            >
                                {agent.full_name[0]}
                            </span>
                        </motion.div>
                    )}

                    {/* Info Below Photo */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="mt-8 relative"
                    >
                        {/* Text Shadow for readability */}
                        <div className="absolute inset-0 bg-white/40 blur-xl -z-10 rounded-full scale-150 opacity-60"></div>

                        <p className="text-sm uppercase tracking-[0.3em] text-amber-700 font-bold mb-2 drop-shadow-sm">
                            {agent.brokerage}
                        </p>
                        <h2
                            className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 drop-shadow-sm"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                            {agent.full_name}
                        </h2>
                        <p className="text-slate-800 font-medium flex items-center justify-center gap-2 drop-shadow-sm">
                            <MapPin className="w-4 h-4 text-slate-700" />
                            {agent.city}, {agent.state}
                        </p>
                    </motion.div>

                    {/* CTA Button */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="mt-8"
                    >
                        <a
                            href="#contact"
                            className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900 text-white font-semibold rounded-full hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl group"
                        >
                            <Mail className="w-5 h-5" />
                            Get in Touch
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                        </a>
                    </motion.div>
                </motion.div>

                {/* Scroll Indicator */}
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30"
                >
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                        <span className="text-xs uppercase tracking-widest">Scroll</span>
                        <ArrowDown className="w-4 h-4" />
                    </div>
                </motion.div>
            </section>

            {/* ===== SERVICES SECTION - "Signature Approach" ===== */}
            <section id="services" className="py-32 px-6 bg-white relative overflow-hidden">
                {/* Subtle Background Number */}
                <div className="absolute top-20 right-0 text-[20rem] font-bold text-slate-50 leading-none select-none pointer-events-none -mr-20"
                    style={{ fontFamily: "'Playfair Display', serif" }}>
                    01
                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        className="text-left mb-20 max-w-2xl"
                    >
                        <span className="text-sm uppercase tracking-[0.3em] text-amber-700 font-bold">My Signature Approach</span>
                        <h2
                            className="text-5xl md:text-6xl font-bold text-slate-900 mt-6 mb-6 leading-tight"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                            Elevating the standard of real estate.
                        </h2>
                        <p className="text-lg text-slate-500 leading-relaxed">
                            Buying or selling a home is more than a transaction—it's a life-changing experience. I combine market intelligence with creative storytelling to deliver results that move you.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                icon: TrendingUp,
                                title: "Selling Your Home",
                                type: 'selling' as ServiceType,
                                desc: "Strategic pricing, high-end presentation, and targeted exposure designed to attract qualified buyers and maximize your final sale price without unnecessary delays."
                            },
                            {
                                icon: Home,
                                title: "Buying a Home",
                                type: 'buying' as ServiceType,
                                desc: "From sourcing off-market opportunities to negotiating from a position of strength, I help you secure the right home at the right terms without overpaying."
                            },
                            {
                                icon: BarChart2,
                                title: "Home Valuation",
                                type: 'valuation' as ServiceType,
                                desc: "A data-backed valuation that goes beyond online estimates, factoring in timing, buyer demand, and local market dynamics to determine what your home can realistically command."
                            }
                        ].map((service, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ delay: i * 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                                className="group relative p-10 bg-slate-50 rounded-[2rem] hover:bg-slate-900 transition-colors duration-500 overflow-hidden"
                            >
                                {/* Hover Gradient Blob */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl -mr-32 -mt-32 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                                <div className="relative z-10">
                                    <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-8 shadow-sm group-hover:bg-amber-700 transition-colors duration-500">
                                        <service.icon className="w-7 h-7 text-amber-700 group-hover:text-white transition-colors duration-500" />
                                    </div>

                                    <h3
                                        className="text-2xl font-bold mb-4 text-slate-900 group-hover:text-white transition-colors duration-500"
                                        style={{ fontFamily: "'Playfair Display', serif" }}
                                    >
                                        {service.title}
                                    </h3>

                                    <p className="text-slate-500 leading-relaxed group-hover:text-slate-300 transition-colors duration-500">
                                        {service.desc}
                                    </p>

                                    <button
                                        onClick={() => setActiveModal(service.type)}
                                        className="mt-8 pt-8 border-t border-slate-200 group-hover:border-slate-800 transition-colors duration-500 flex items-center gap-2 text-sm font-bold text-amber-700 group-hover:text-amber-500 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-100 bg-transparent cursor-pointer"
                                    >
                                        Get Started <ArrowDown className="w-4 h-4 -rotate-90" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== ABOUT SECTION (Modern Split) ===== */}
            <section id="about" className="py-24 md:py-32 px-6 bg-slate-50 relative overflow-hidden">
                {/* Decorative Background Text */}
                <div className="absolute top-20 left-0 opacity-[0.03] pointer-events-none select-none overflow-hidden w-full">
                    <span
                        className="text-[12rem] md:text-[20rem] font-bold text-slate-900 leading-none -ml-20"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                        About
                    </span>
                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="grid md:grid-cols-12 gap-12 lg:gap-24 items-start">
                        {/* LEFT COLUMN: Headshot & Quick Info (Sticky on Desktop) */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="md:col-span-5 lg:col-span-4 md:sticky md:top-32"
                        >
                            {/* Headshot Card */}
                            <div className="relative mb-8 group perspective-1000 max-w-xs mx-auto md:max-w-none">
                                <div className="absolute -inset-3 bg-gradient-to-tr from-amber-500/20 to-transparent rounded-[2rem] -rotate-2 group-hover:rotate-0 transition-transform duration-500"></div>
                                <div className="relative rounded-[1.5rem] overflow-hidden shadow-2xl aspect-[3/4] bg-white">
                                    {agent.headshot_url ? (
                                        <img
                                            src={agent.headshot_url}
                                            alt={agent.full_name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300 text-8xl font-serif">
                                            {agent.full_name[0]}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Extended Info Card */}
                            <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-100 space-y-5">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                                        <Phone className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-0.5">Mobile</p>
                                        <a href={`tel:${agent.primary_phone}`} className="font-medium text-slate-900 hover:text-amber-600 transition-colors">
                                            {agent.primary_phone || '—'}
                                        </a>
                                    </div>
                                </div>



                                {agent.office_phone && agent.office_phone !== '(200) 000-0000' && (
                                    <div className="flex items-start gap-4 pt-4 border-t border-slate-100">
                                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0">
                                            <Building className="w-5 h-5 text-slate-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-0.5">Office</p>
                                            <p className="font-medium text-slate-900">{agent.office_phone}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start gap-4 pt-4 border-t border-slate-100">
                                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                                        <Mail className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-0.5">Email</p>
                                        <a href={`mailto:${agent.primary_email}`} className="font-medium text-slate-900 hover:text-amber-600 transition-colors break-all block">
                                            {agent.primary_email || '—'}
                                        </a>
                                    </div>
                                </div>

                                {agent.license_number && (
                                    <div className="flex items-start gap-4 pt-4 border-t border-slate-100">
                                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0">
                                            <BadgeCheck className="w-5 h-5 text-slate-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-0.5">License #</p>
                                            <p className="font-medium text-slate-900">{agent.license_number}</p>
                                        </div>
                                    </div>
                                )}

                                {agent.office_address && (
                                    <div className="flex items-start gap-4 pt-4 border-t border-slate-100">
                                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0">
                                            <MapPin className="w-5 h-5 text-slate-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-0.5">Office Address</p>
                                            <p className="font-medium text-slate-900 text-sm leading-snug">{agent.office_address}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* RIGHT COLUMN: Bio & Narrative */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                            className="md:col-span-7 lg:col-span-8"
                        >
                            <div className="mb-10">
                                <span className="text-amber-600 font-bold tracking-[0.2em] text-sm uppercase flex items-center gap-3 mb-4">
                                    <span className="w-10 h-[1px] bg-amber-600"></span>
                                    About {agent.full_name.split(' ')[0]}
                                </span>
                                <h2
                                    className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 leading-[0.9]"
                                    style={{ fontFamily: "'Playfair Display', serif" }}
                                >
                                    Real estate<br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-700 to-amber-500">redefined.</span>
                                </h2>
                            </div>

                            <div className="prose prose-lg prose-slate text-slate-600 leading-relaxed text-lg max-w-none">
                                {agent.bio && !agent.bio.toLowerCase().trim().startsWith('yes, i would like more information from coldwell banker') ? (
                                    agent.bio.split('\n').map((paragraph, idx) => (
                                        paragraph.trim().length > 0 && (
                                            <p key={idx} className="mb-6 text-slate-600">
                                                {paragraph}
                                            </p>
                                        )
                                    ))
                                ) : (
                                    <p className="text-slate-400 italic">No biography available.</p>
                                )}
                            </div>

                            <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-2 gap-8">
                                <div>
                                    <p className="text-slate-900 font-bold text-lg mb-1">{agent.brokerage}</p>
                                    <p className="text-slate-500 text-sm">Brokerage</p>
                                </div>
                                <div>
                                    <p className="text-slate-900 font-bold text-lg mb-1">Local Expert</p>
                                    <p className="text-slate-500 text-sm">Specialization</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ===== TESTIMONIALS SECTION ===== */}
            <section className="py-32 px-6 bg-slate-50 relative overflow-hidden">
                <div className="max-w-5xl mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <span className="text-sm uppercase tracking-[0.3em] text-amber-700 font-semibold">Testimonials</span>
                        <h2
                            className="text-4xl md:text-5xl font-bold text-slate-900 mt-4"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                            Client Stories
                        </h2>
                    </motion.div>

                    {/* Scrolling Marquee Container */}
                    <div className="relative w-full overflow-hidden mask-linear-fade">
                        {/* Left/Right Fade Masks */}
                        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
                        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />

                        <motion.div
                            className="flex gap-8 w-max"
                            animate={{ x: "-50%" }}
                            transition={{
                                duration: 40,
                                repeat: Infinity,
                                ease: "linear",
                                repeatType: "loop"
                            }}
                        >
                            {/* Duplicate items for seamless loop */}
                            {[...[
                                { quote: `${agent.full_name.split(' ')[0]} was incredible to work with. The attention to detail and market knowledge made selling our home effortless.`, name: "James Peterson", location: "Dallas, TX", initials: "JP" },
                                { quote: `We found our dream home thanks to ${agent.full_name}'s persistence and dedication. Highly recommended!`, name: "Sarah Mitchell", location: "Frisco, TX", initials: "SM" },
                                { quote: "Professional, knowledgeable, and always available. The best real estate experience we've ever had.", name: "Michael Chen", location: "Plano, TX", initials: "MC" },
                                { quote: "Truly went above and beyond to ensure we got the best deal possible.", name: "Emily Rodriguez", location: "Fort Worth, TX", initials: "ER" }
                            ], ...[
                                { quote: `${agent.full_name.split(' ')[0]} was incredible to work with. The attention to detail and market knowledge made selling our home effortless.`, name: "James Peterson", location: "Dallas, TX", initials: "JP" },
                                { quote: `We found our dream home thanks to ${agent.full_name}'s persistence and dedication. Highly recommended!`, name: "Sarah Mitchell", location: "Frisco, TX", initials: "SM" },
                                { quote: "Professional, knowledgeable, and always available. The best real estate experience we've ever had.", name: "Michael Chen", location: "Plano, TX", initials: "MC" },
                                { quote: "Truly went above and beyond to ensure we got the best deal possible.", name: "Emily Rodriguez", location: "Fort Worth, TX", initials: "ER" }
                            ]].map((testimonial, i) => (
                                <motion.div
                                    key={i}
                                    whileHover={{ scale: 1.02, y: -5 }}
                                    className="w-[400px] p-8 bg-white rounded-3xl shadow-sm border border-slate-100 flex-shrink-0 relative group hover:shadow-xl transition-all duration-300"
                                >
                                    <span
                                        className="absolute top-6 left-6 text-6xl text-amber-500/10 font-serif leading-none group-hover:text-amber-500/20 transition-colors"
                                        style={{ fontFamily: "'Playfair Display', serif" }}
                                    >
                                        "
                                    </span>
                                    <p className="text-slate-600 leading-relaxed mb-6 relative z-10 pt-6 italic">
                                        {testimonial.quote}
                                    </p>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm group-hover:bg-amber-100 group-hover:text-amber-700 transition-colors">
                                            {testimonial.initials}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900">{testimonial.name}</p>
                                            <p className="text-sm text-slate-500">{testimonial.location}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ===== CONTACT SECTION - REDESIGNED (Light Theme) ===== */}
            <section id="contact" className="py-24 px-6 bg-white relative overflow-hidden">
                {/* Decorative Background Text */}
                <div className="absolute top-20 right-0 opacity-[0.03] pointer-events-none select-none overflow-hidden w-full text-right">
                    <span
                        className="text-[12rem] md:text-[20rem] font-bold text-slate-900 leading-none -mr-20"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                        Contact
                    </span>
                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <span className="text-sm uppercase tracking-[0.3em] text-amber-700 font-semibold">Ready to Connect?</span>
                        <h2
                            className="text-5xl md:text-6xl font-bold text-slate-900 mt-4"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                            Let's Talk
                        </h2>
                    </motion.div>

                    <div className="grid lg:grid-cols-2 gap-12 items-start">
                        {/* LEFT COLUMN: Contact Form */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="relative"
                        >
                            <ContactForm
                                agentId={agent.id}
                                agentName={agent.full_name}
                            />
                        </motion.div>

                        {/* RIGHT COLUMN: Map & Info */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                            className="space-y-8"
                        >
                            {/* Google Map Embed */}
                            <div className="relative h-80 w-full rounded-3xl overflow-hidden shadow-lg border border-slate-100 group">
                                <iframe
                                    title="Office Location"
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    scrolling="no"
                                    marginHeight={0}
                                    marginWidth={0}
                                    src={`https://maps.google.com/maps?q=${encodeURIComponent(agent.office_address || `${agent.city}, ${agent.state}`)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                                    className="opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                                />
                            </div>

                            {/* Contact Info Cards */}
                            <div className="grid sm:grid-cols-2 gap-4">
                                <a href={`mailto:${agent.primary_email}`} className="group p-6 bg-slate-50 hover:bg-white hover:shadow-md rounded-2xl border border-slate-100 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Email</p>
                                            <p className="text-slate-900 font-medium truncate">{agent.primary_email || '—'}</p>
                                        </div>
                                    </div>
                                </a>

                                <a href={`tel:${agent.primary_phone}`} className="group p-6 bg-slate-50 hover:bg-white hover:shadow-md rounded-2xl border border-slate-100 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                            <Phone className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Phone</p>
                                            <p className="text-slate-900 font-medium">{agent.primary_phone || '—'}</p>
                                        </div>
                                    </div>
                                </a>

                                <div className="group p-6 bg-slate-50 hover:bg-white hover:shadow-md rounded-2xl border border-slate-100 sm:col-span-2 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Office</p>
                                            <p className="text-slate-900 font-medium">{agent.office_address || `${agent.city}, ${agent.state}`}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Social Links */}
                            <div className="flex gap-4 pt-4">
                                {agent.linkedin_url && (
                                    <a href={agent.linkedin_url} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-amber-600 hover:text-white shadow-sm hover:shadow-md transition-all border border-slate-100">
                                        <Linkedin className="w-5 h-5" />
                                    </a>
                                )}
                                {agent.facebook_url && (
                                    <a href={agent.facebook_url} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-amber-600 hover:text-white shadow-sm hover:shadow-md transition-all border border-slate-100">
                                        <Facebook className="w-5 h-5" />
                                    </a>
                                )}
                                {agent.instagram_url && (
                                    <a href={agent.instagram_url} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-amber-600 hover:text-white shadow-sm hover:shadow-md transition-all border border-slate-100">
                                        <Instagram className="w-5 h-5" />
                                    </a>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ===== FOOTER ===== */}
            <footer className="bg-slate-950 text-slate-400 py-20 border-t border-slate-900">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                        {/* Brand */}
                        <div className="space-y-6">
                            <h3 className="text-3xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                                {agent.full_name}
                            </h3>
                            {agent.license_number && (
                                <p className="text-slate-500 text-sm font-medium border-l-2 border-amber-700 pl-3">
                                    License #: {agent.license_number}
                                </p>
                            )}
                            <p className="leading-relaxed">
                                {agent.bio ? agent.bio.slice(0, 150) + (agent.bio.length > 150 ? '...' : '') : 'Dedicated to providing exceptional real estate services tailored to your unique needs.'}
                            </p>
                            <div className="flex gap-4 pt-2">
                                {agent.linkedin_url && (
                                    <a href={agent.linkedin_url} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white hover:bg-amber-600 transition-colors border border-slate-800">
                                        <Linkedin className="w-4 h-4" />
                                    </a>
                                )}
                                {agent.facebook_url && (
                                    <a href={agent.facebook_url} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white hover:bg-amber-600 transition-colors border border-slate-800">
                                        <Facebook className="w-4 h-4" />
                                    </a>
                                )}
                                {agent.instagram_url && (
                                    <a href={agent.instagram_url} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white hover:bg-amber-600 transition-colors border border-slate-800">
                                        <Instagram className="w-4 h-4" />
                                    </a>
                                )}
                                {agent.twitter_url && (
                                    <a href={agent.twitter_url} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white hover:bg-amber-600 transition-colors border border-slate-800">
                                        <Twitter className="w-4 h-4" />
                                    </a>
                                )}
                                {agent.youtube_url && (
                                    <a href={agent.youtube_url} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white hover:bg-amber-600 transition-colors border border-slate-800">
                                        <Youtube className="w-4 h-4" />
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Navigation */}
                        <div>
                            <h4 className="text-white font-bold uppercase tracking-wider mb-6">Explore</h4>
                            <ul className="space-y-3">
                                <li><a href="#hero" className="hover:text-amber-500 transition-colors">Home</a></li>
                                <li><a href="#about" className="hover:text-amber-500 transition-colors">About</a></li>
                                <li><a href="#services" className="hover:text-amber-500 transition-colors">Services</a></li>
                                <li><a href="#contact" className="hover:text-amber-500 transition-colors">Contact</a></li>
                            </ul>
                        </div>

                        {/* Contact */}
                        <div>
                            <h4 className="text-white font-bold uppercase tracking-wider mb-6">Visit Us</h4>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <span>{agent.office_address || `${agent.city}, ${agent.state}`}</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Phone className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                    <a href={`tel:${agent.primary_phone}`} className="hover:text-amber-500 transition-colors">{agent.primary_phone}</a>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Mail className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                    <a href={`mailto:${agent.primary_email}`} className="hover:text-amber-500 transition-colors truncate">{agent.primary_email}</a>
                                </li>
                            </ul>
                        </div>

                        {/* Brokerage */}
                        <div>
                            <h4 className="text-white font-bold uppercase tracking-wider mb-6">Brokerage</h4>
                            {agent.brokerage_logo_url ? (
                                <div className="bg-white p-4 rounded-xl inline-block mb-6">
                                    <img src={agent.brokerage_logo_url} alt={agent.brokerage} className="h-16 md:h-20 object-contain" />
                                </div>
                            ) : (
                                <div className="text-2xl font-bold text-white mb-6">{agent.brokerage}</div>
                            )}
                            <p className="text-sm mb-4 font-medium text-slate-300">{agent.office_name}</p>
                            <div className="space-y-2 text-sm">
                                <p className="text-slate-500">&copy; {new Date().getFullYear()} {agent.full_name}.</p>
                                <p className="text-slate-600 text-xs mt-4">All rights reserved. Powered by RealEstateLeadAI.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Service Modal */}
            <ServiceModal
                isOpen={activeModal !== null}
                onClose={() => setActiveModal(null)}
                serviceType={activeModal || 'selling'}
                agentId={agent.id}
                agentName={agent.full_name}
            />

            {/* Booking Modal */}
            <BookingModal
                isOpen={bookingOpen}
                onClose={() => setBookingOpen(false)}
                agentId={agent.id}
                agentName={agent.full_name}
            />
        </div>
    )
}
