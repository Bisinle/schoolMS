import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    School,
    Users,
    UserCheck,
    DollarSign,
    FileText,
    ClipboardCheck,
    Shield,
    MessageSquare,
    Calendar,
    BookOpen,
    BarChart3,
    CheckCircle2,
    ArrowRight,
    Menu,
    X,
    Smartphone,
    CheckCircle,
    Clock
} from 'lucide-react';
import { useState } from 'react';

import screenshot1 from '../Images/app-screenshot1.png';
import screenshot2 from '../Images/app-screenshot2.png';
import screenshot3 from '../Images/app-screenshot3.png';
import screenshot4 from '../Images/app-screenshot4.png';
import screenshot5 from '../Images/app-screenshot5.png';
import screenshot6 from '../Images/app-screenshot6.png';
import screenshot8 from '../Images/app-screenshot8.png';
import screenshot9 from '../Images/app-screenshot9.png';
import screenshot10 from '../Images/app-screenshot10.png';
import screenshot11 from '../Images/app-screenshot11.png';
import screenshot12 from '../Images/app-screenshot12.png';
import screenshot13 from '../Images/app-screenshot13.png';

// A fine dot-grid, used instead of the animated colour-blob backgrounds - a
// static, low-contrast texture reads as an intentional surface rather than a
// decorative effect.
const dotGrid = {
    backgroundImage: 'radial-gradient(rgba(11,26,52,0.14) 1px, transparent 1px)',
    backgroundSize: '22px 22px',
};

const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

function Eyebrow({ children, tone = 'orange' }) {
    const toneClass = tone === 'orange' ? 'text-orange-dark' : 'text-white/70';
    const ruleClass = tone === 'orange' ? 'bg-orange-dark/40' : 'bg-white/30';
    return (
        <div className="flex items-center gap-3 mb-5">
            <span className={`h-px w-8 ${ruleClass}`} />
            <span className={`text-xs font-semibold tracking-[0.2em] uppercase ${toneClass}`}>{children}</span>
        </div>
    );
}

export default function Home() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const coreModules = [
        {
            icon: Users,
            title: 'Student Information Management',
            description: 'Complete student registration with admission numbers, profiles, grade assignments, and guardian linkage. Track enrollment status and maintain comprehensive student records.'
        },
        {
            icon: Calendar,
            title: 'Academic Structure Management',
            description: 'Manages academic years, terms, grades/classes, and subjects. Organize your school structure with flexible grade levels and subject assignments for comprehensive academic tracking.'
        },
        {
            icon: ClipboardCheck,
            title: 'Automated Timetable Generation',
            description: 'Create weekly timetables with automated slot generation based on curriculum rules. Set sessions per week for each subject, manage day blueprints, and distribute lessons evenly across working days.'
        },
        {
            icon: DollarSign,
            title: 'Fee Management & Invoicing',
            description: 'Create fee structures (tuition, transport, universal fees), generate guardian invoices, track payments with multiple methods (Cash, M-Pesa, Bank Transfer, Cheque), and monitor balances.'
        },
        {
            icon: FileText,
            title: 'Examination & Results Management',
            description: 'Schedule exams (Opening, Mid-Term, End-Term), record student results, generate report cards with automated grading, and track academic performance across terms.'
        },
        {
            icon: UserCheck,
            title: 'Teacher & Staff Management',
            description: 'Register teachers and staff, manage user accounts with role-based access (Admin, Teacher, Guardian, Accountant, etc.), assign subjects and grades, and track employee information.'
        },
        {
            icon: MessageSquare,
            title: 'Guardian Portal & Communication',
            description: 'Dedicated guardian portal to view children\'s attendance, exam results, fee balances, and invoices. Guardians can download reports and track their children\'s academic progress.'
        },
        {
            icon: ClipboardCheck,
            title: 'Attendance Tracking',
            description: 'Daily student attendance recording with present/absent/late status. Generate attendance reports, monitor patterns, and guardians can view their children\'s attendance history.'
        },
        {
            icon: BookOpen,
            title: 'Quran Tracking (Islamic Schools)',
            description: 'Track Quran memorization progress with page ranges, automatic calculation of pages/surahs/juz memorized, homework assignments, home practice logging, and progress schedules.'
        },
        {
            icon: Shield,
            title: 'Document Management',
            description: 'Upload and organize documents by categories for students, teachers, guardians, and school-wide files. Secure document storage with access control and easy retrieval.'
        }
    ];

    const features = [
        'Student & Guardian Management with Complete Profiles',
        'Academic Structure: Years, Terms, Grades & Subjects',
        'Automated Timetable Generation with Curriculum Management',
        'Fee Management: Invoicing, Payments & Balance Tracking',
        'Examination & Results: Scheduling, Grading & Report Cards',
        'Teacher & Staff Management with Role-Based Access',
        'Attendance Tracking with Detailed Reports',
        'Quran Memorization Tracking (Perfect for Madrasahs)',
        'Quran Homework & Home Practice Logging',
        'Islamic Studies & Dual Curriculum Support',
        'Document Management System',
        'Guardian Portal: View Attendance, Results, Fees & Quran Progress',
        'Multi-Payment Methods: Cash, M-Pesa, Bank Transfer, Cheque',
        'Custom School Branding (Logo & School Information)',
        'Cloud Hosted with Automatic Backups'
    ];

    const madrasahFeatures = [
        {
            icon: BookOpen,
            title: 'Quran Memorization Tracking',
            description: "Track student progress in Quran memorization with page ranges, automatic calculation of surahs and juz completed. Monitor each student's journey in hifdh."
        },
        {
            icon: ClipboardCheck,
            title: 'Quran Homework & Practice',
            description: 'Assign Quran homework with specific page ranges and due dates. Track home practice sessions and monitor daily Quran recitation progress.'
        },
        {
            icon: Calendar,
            title: 'Quran Progress Schedules',
            description: 'Create and manage Quran memorization schedules for students. Set goals, track milestones, and generate progress reports for parents.'
        },
        {
            icon: BarChart3,
            title: 'Guardian Quran Portal',
            description: "Parents can view their children's Quran memorization progress, homework assignments, and practice logs through the dedicated guardian portal."
        },
        {
            icon: FileText,
            title: 'Islamic Studies Integration',
            description: 'Manage both secular and Islamic curriculum seamlessly. Track performance in Quran, Hadith, Fiqh, and other Islamic subjects alongside regular academics.'
        },
        {
            icon: Shield,
            title: 'Dual Curriculum Support',
            description: 'Perfect for schools offering both national curriculum (CBC, IGCSE, etc.) and Islamic/Madrasah curriculum. Manage both systems in one platform.'
        }
    ];

    const showcaseScreenshots = [
        { img: screenshot5, title: 'Dashboard Overview', desc: 'Real-time insights', big: true },
        { img: screenshot3, title: 'Grades & Classes', desc: 'Comprehensive academic tracking' },
        { img: screenshot6, title: 'Attendance Tracking', desc: 'Easy attendance management' },
        { img: screenshot8, title: 'Student Reports', desc: 'Detailed performance analytics' },
        { img: screenshot4, title: 'Document Management', desc: 'Centralized document storage' },
    ];

    const mobileScreenshots = [
        { img: screenshot9, label: 'Analytics' },
        { img: screenshot10, label: 'Dashboard' },
        { img: screenshot11, label: 'Report Card' },
        { img: screenshot12, label: 'Documents' },
        { img: screenshot13, label: 'Students per Grade' }
    ];

    return (
        <>
            <Head title="SchoolMS - Comprehensive School Management System" />

            <div className="min-h-screen bg-white font-sans text-navy">
                {/* ---------------------------------------------------------------- Nav */}
                <nav className="fixed top-0 left-0 right-0 z-50 bg-cream/95 backdrop-blur-sm border-b border-navy/10">
                    <div className="max-w-6xl mx-auto px-6">
                        <div className="flex justify-between items-center h-18 py-4">
                            <Link href="/" className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-navy rounded-md flex items-center justify-center">
                                    <School className="w-5 h-5 text-orange" />
                                </div>
                                <span className="text-lg font-display font-semibold tracking-tight text-navy">SchoolMS</span>
                            </Link>

                            <div className="hidden md:flex items-center gap-10">
                                <a href="#features" className="text-sm font-medium text-navy/70 hover:text-navy transition-colors">Features</a>
                                <a href="#pricing" className="text-sm font-medium text-navy/70 hover:text-navy transition-colors">Pricing</a>
                                <Link href="/demo-booking" className="text-sm font-medium text-navy/70 hover:text-navy transition-colors">Contact</Link>
                                <Link
                                    href="/login"
                                    className="px-5 py-2.5 bg-navy text-white text-sm font-semibold rounded-md hover:bg-navy-light transition-colors"
                                >
                                    Login
                                </Link>
                            </div>

                            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 -mr-2 text-navy">
                                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>

                        {mobileMenuOpen && (
                            <div className="md:hidden py-4 border-t border-navy/10 flex flex-col gap-4">
                                <a href="#features" className="text-navy/70 font-medium">Features</a>
                                <a href="#pricing" className="text-navy/70 font-medium">Pricing</a>
                                <Link href="/demo-booking" className="text-navy/70 font-medium">Contact</Link>
                                <Link href="/login" className="px-5 py-2.5 bg-navy text-white text-sm font-semibold rounded-md text-center">
                                    Login
                                </Link>
                            </div>
                        )}
                    </div>
                </nav>

                {/* ---------------------------------------------------------------- Hero */}
                <section className="relative pt-32 pb-24 px-6 bg-cream overflow-hidden">
                    <div className="absolute inset-0" style={dotGrid} />
                    <div className="absolute -top-24 right-0 w-[36rem] h-[36rem] rounded-full bg-orange/10 blur-3xl" />

                    <div className="max-w-6xl mx-auto relative">
                        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-16 items-center">
                            <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                                <Eyebrow>For Regular Schools &amp; Madrasahs</Eyebrow>

                                <h1 className="font-display text-5xl sm:text-6xl lg:text-[4.25rem] font-medium leading-[1.05] text-navy mb-6">
                                    Run your school on
                                    <span className="block text-orange-dark italic">one considered system.</span>
                                </h1>

                                <p className="text-lg text-navy/65 leading-relaxed mb-9 max-w-lg">
                                    An all-in-one management system built for both regular schools and madrasahs.
                                    Student records, exam results, fee tracking, and Quran memorization tracking — in one platform.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4 mb-10">
                                    <Link
                                        href="/login"
                                        className="group px-7 py-3.5 bg-orange-dark text-white font-semibold rounded-md hover:bg-orange transition-colors flex items-center justify-center"
                                    >
                                        <span>Get Started</span>
                                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                    <Link
                                        href="/demo-booking"
                                        className="px-7 py-3.5 bg-transparent text-navy font-semibold rounded-md border border-navy/25 hover:border-navy transition-colors flex items-center justify-center"
                                    >
                                        Request a Demo
                                    </Link>
                                </div>

                                <div className="flex flex-wrap gap-x-8 gap-y-3">
                                    {['Cloud Hosted', 'M-Pesa Integrated', '24/7 Support'].map((item) => (
                                        <div key={item} className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-orange-dark" />
                                            <span className="text-sm text-navy/60 font-medium">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.15 }}
                                className="relative"
                            >
                                <div className="rounded-xl overflow-hidden border border-navy/10 shadow-2xl shadow-navy/10 bg-white">
                                    <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-navy-dark border-b border-white/5">
                                        <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                                        <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                                        <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                                    </div>
                                    <img src={screenshot2} alt="SchoolMS Dashboard" className="w-full h-auto" />
                                </div>
                                <div className="absolute -bottom-6 -left-6 bg-navy rounded-lg shadow-xl px-5 py-4 hidden sm:block">
                                    <div className="text-2xl font-display font-semibold text-white">10+</div>
                                    <div className="text-xs text-white/60 font-medium">Modules, one platform</div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* ---------------------------------------------------------------- Features */}
                <section id="features" className="py-24 px-6 bg-white scroll-mt-16">
                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeUp}
                            className="max-w-2xl mb-16"
                        >
                            <Eyebrow>Key Features</Eyebrow>
                            <h2 className="font-display text-3xl sm:text-4xl font-medium text-navy mb-4">
                                Every tool a school office actually needs
                            </h2>
                            <p className="text-lg text-navy/60">
                                Built to manage every aspect of your school efficiently, from admissions to report cards.
                            </p>
                        </motion.div>

                        <div className="grid md:grid-cols-2 gap-x-12 gap-y-10">
                            {coreModules.map((module, index) => (
                                <motion.div
                                    key={index}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                    variants={fadeUp}
                                    transition={{ duration: 0.4, delay: (index % 2) * 0.05 }}
                                    className="flex gap-5 pt-6 border-t border-navy/10"
                                >
                                    <div className="w-11 h-11 rounded-md border border-navy/10 bg-cream flex items-center justify-center flex-shrink-0">
                                        <module.icon className="w-5 h-5 text-orange-dark" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold text-navy mb-1.5">{module.title}</h3>
                                        <p className="text-sm text-navy/60 leading-relaxed">{module.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ---------------------------------------------------------------- Madrasah-specific (dark chapter) */}
                <section className="py-24 px-6 bg-navy-dark relative overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.07]" style={dotGrid} />

                    <div className="max-w-6xl mx-auto relative">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeUp}
                            className="max-w-2xl mb-16"
                        >
                            <Eyebrow tone="dark">Perfect for Madrasahs</Eyebrow>
                            <h2 className="font-display text-3xl sm:text-4xl font-medium text-white mb-4">
                                Built for Islamic schools &amp; madrasahs
                            </h2>
                            <p className="text-lg text-white/60">
                                Specialized features to track Quran memorization and Islamic studies, alongside modern school management.
                            </p>
                        </motion.div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                            {madrasahFeatures.map((item, index) => (
                                <motion.div
                                    key={index}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                    variants={fadeUp}
                                    transition={{ duration: 0.4, delay: (index % 3) * 0.06 }}
                                    className="bg-white/[0.04] border border-white/10 rounded-lg p-7 hover:border-orange/40 transition-colors"
                                >
                                    <div className="w-11 h-11 rounded-md bg-orange-dark/20 flex items-center justify-center mb-5">
                                        <item.icon className="w-5 h-5 text-orange" />
                                    </div>
                                    <h3 className="text-base font-semibold text-white mb-2">{item.title}</h3>
                                    <p className="text-sm text-white/55 leading-relaxed">{item.description}</p>
                                </motion.div>
                            ))}
                        </div>

                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeUp}
                            className="bg-orange-dark rounded-xl p-8 lg:p-10 flex flex-col lg:flex-row items-center justify-between gap-6"
                        >
                            <div>
                                <h3 className="text-xl font-display font-semibold text-white mb-2">
                                    Perfect for both regular schools &amp; madrasahs
                                </h3>
                                <p className="text-white/80 max-w-xl">
                                    Whether you run a regular school, an Islamic school, or a madrasah, SchoolMS has the features you need.
                                </p>
                            </div>
                            <Link
                                href="/demo-booking"
                                className="flex-shrink-0 inline-flex items-center px-6 py-3.5 bg-white text-orange-dark font-semibold rounded-md hover:bg-cream transition-colors"
                            >
                                <span>Schedule a Demo</span>
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                        </motion.div>
                    </div>
                </section>

                {/* ---------------------------------------------------------------- Screenshot showcase */}
                <section className="py-24 px-6 bg-cream">
                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeUp}
                            className="max-w-2xl mb-16"
                        >
                            <Eyebrow>In Action</Eyebrow>
                            <h2 className="font-display text-3xl sm:text-4xl font-medium text-navy mb-4">
                                See SchoolMS at work
                            </h2>
                            <p className="text-lg text-navy/60">
                                An interface designed to make school management effortless.
                            </p>
                        </motion.div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 lg:auto-rows-[220px]">
                            {showcaseScreenshots.map((screenshot, index) => (
                                <motion.div
                                    key={index}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                    variants={fadeUp}
                                    transition={{ duration: 0.4, delay: index * 0.05 }}
                                    className={`group relative rounded-lg overflow-hidden border border-navy/10 hover:border-orange-dark/50 transition-colors bg-white ${screenshot.big ? 'lg:col-span-2 lg:row-span-2' : ''}`}
                                >
                                    <div className="w-full h-full overflow-hidden bg-navy/5">
                                        <img
                                            src={screenshot.img}
                                            alt={screenshot.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-dark/90 to-transparent p-4">
                                        <h3 className="text-white font-semibold text-sm">{screenshot.title}</h3>
                                        <p className="text-white/70 text-xs">{screenshot.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ---------------------------------------------------------------- Responsive / mobile */}
                <section className="py-24 px-6 bg-white">
                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeUp}
                            className="max-w-2xl mb-16"
                        >
                            <Eyebrow>Works on Every Device</Eyebrow>
                            <h2 className="font-display text-3xl sm:text-4xl font-medium text-navy mb-4">
                                Fully responsive, everywhere
                            </h2>
                            <p className="text-lg text-navy/60">
                                Access SchoolMS from anywhere — optimized for desktop, tablet, and mobile devices.
                            </p>
                        </motion.div>

                        <div className="bg-cream rounded-2xl border border-navy/10 p-6 sm:p-10">
                            <div className="flex items-center gap-3 mb-8">
                                <Smartphone className="w-5 h-5 text-orange-dark" />
                                <span className="text-sm font-semibold text-navy">Mobile optimized, every screen</span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                {mobileScreenshots.map((screenshot, index) => (
                                    <motion.div
                                        key={index}
                                        initial="hidden"
                                        whileInView="visible"
                                        viewport={{ once: true }}
                                        variants={fadeUp}
                                        transition={{ duration: 0.4, delay: index * 0.06 }}
                                        className="group"
                                    >
                                        <div className="bg-navy-dark p-1.5 rounded-xl border border-navy/10 group-hover:border-orange-dark/50 transition-colors">
                                            <div className="aspect-[9/19] overflow-hidden rounded-lg bg-white relative">
                                                <img
                                                    src={screenshot.img}
                                                    alt={screenshot.label}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-xs text-navy/60 font-medium text-center mt-2">{screenshot.label}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ---------------------------------------------------------------- Pricing */}
                <section id="pricing" className="py-24 px-6 bg-cream scroll-mt-16">
                    <div className="max-w-5xl mx-auto">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeUp}
                            className="text-center max-w-xl mx-auto mb-14"
                        >
                            <div className="flex items-center justify-center gap-3 mb-5">
                                <span className="h-px w-8 bg-orange-dark/40" />
                                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-orange-dark">Pricing</span>
                                <span className="h-px w-8 bg-orange-dark/40" />
                            </div>
                            <h2 className="font-display text-3xl sm:text-4xl font-medium text-navy mb-4">
                                Simple, transparent pricing
                            </h2>
                            <p className="text-lg text-navy/60">
                                Everything you need to run your school efficiently — one plan, no surprises.
                            </p>
                        </motion.div>

                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeUp}
                            className="bg-navy-dark rounded-2xl overflow-hidden grid lg:grid-cols-[0.85fr_1.15fr]"
                        >
                            {/* Price column */}
                            <div className="p-8 sm:p-10 lg:border-r border-white/10">
                                <p className="text-white/50 text-sm font-semibold tracking-wide uppercase mb-1">SchoolMS</p>
                                <p className="text-white/70 text-sm mb-8">Simple · Scalable · Affordable</p>

                                <div className="mb-6">
                                    <div className="flex items-end gap-2">
                                        <span className="text-5xl font-display font-semibold text-white">KES 5,000</span>
                                    </div>
                                    <p className="text-white/50 text-sm mt-1">per month, up to 50 active users</p>
                                    <p className="text-white/35 text-xs">(students · teachers · admin · staff · parents)</p>
                                </div>

                                <div className="space-y-3 border-t border-white/10 pt-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-white/60">Above 50 users</span>
                                        <span className="text-white font-medium">+ KES 100 / user</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-white/60">Annual plan</span>
                                        <span className="text-orange font-medium">1 month free</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 mt-8">
                                    <Link
                                        href="/demo-booking"
                                        className="px-6 py-3.5 bg-orange-dark text-white font-semibold rounded-md hover:bg-orange transition-colors text-center"
                                    >
                                        Buy Now
                                    </Link>
                                    <Link
                                        href="/demo-booking"
                                        className="px-6 py-3.5 bg-transparent text-white font-semibold rounded-md border border-white/20 hover:border-white/50 transition-colors text-center"
                                    >
                                        Request a Demo
                                    </Link>
                                </div>
                            </div>

                            {/* Features column */}
                            <div className="p-8 sm:p-10 bg-white/[0.02]">
                                <h4 className="text-white font-semibold mb-5">Included in every plan</h4>
                                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3.5">
                                    {features.map((feature, index) => (
                                        <div key={index} className="flex items-start gap-2.5">
                                            <CheckCircle2 className="w-4 h-4 text-orange flex-shrink-0 mt-0.5" />
                                            <span className="text-sm text-white/70 leading-snug">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* ---------------------------------------------------------------- Demo booking CTA */}
                <section className="py-24 px-6 bg-navy-dark relative overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.07]" style={dotGrid} />

                    <div className="max-w-6xl mx-auto relative">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeUp}
                            className="max-w-2xl mb-14"
                        >
                            <Eyebrow tone="dark">Free Personalized Demo</Eyebrow>
                            <h2 className="font-display text-3xl sm:text-4xl font-medium text-white mb-4">
                                Book your free demo today
                            </h2>
                            <p className="text-lg text-white/60">
                                See SchoolMS in action with a personalized demo tailored to your school. No commitment required.
                            </p>
                        </motion.div>

                        <div className="grid lg:grid-cols-2 gap-6">
                            <motion.div
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                variants={fadeUp}
                                className="bg-white/[0.04] border border-white/10 rounded-xl p-8 sm:p-10"
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <Clock className="w-5 h-5 text-orange" />
                                    <h3 className="text-lg font-semibold text-white">What to expect</h3>
                                </div>
                                <ul className="space-y-4">
                                    {[
                                        "A personalized 30-minute demo tailored to your school's needs",
                                        'Live walkthrough of all key features and modules',
                                        'Q&A session with our product experts',
                                        'Custom pricing and implementation timeline discussion',
                                    ].map((item) => (
                                        <li key={item} className="flex items-start gap-3">
                                            <CheckCircle className="w-4 h-4 text-orange flex-shrink-0 mt-1" />
                                            <span className="text-white/70 text-sm leading-relaxed">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>

                            <motion.div
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                variants={fadeUp}
                                className="bg-orange-dark rounded-xl p-8 sm:p-10 flex flex-col justify-center"
                            >
                                <Calendar className="w-8 h-8 text-white mb-5" />
                                <h3 className="text-2xl font-display font-semibold text-white mb-3">Ready to get started?</h3>
                                <p className="text-white/80 mb-8 leading-relaxed">
                                    Schedule your free personalized demo and see how SchoolMS can transform your school's management.
                                </p>
                                <Link
                                    href="/demo-booking"
                                    className="group inline-flex items-center justify-center px-6 py-3.5 bg-white text-orange-dark font-semibold rounded-md hover:bg-cream transition-colors"
                                >
                                    <span>Schedule Your Free Demo</span>
                                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <p className="text-white/50 text-xs mt-4 text-center">No credit card required · 30-minute session</p>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* ---------------------------------------------------------------- Footer */}
                <footer className="bg-navy py-10 px-6">
                    <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-white/10 rounded-md flex items-center justify-center">
                                <School className="w-5 h-5 text-orange" />
                            </div>
                            <span className="text-white font-display font-semibold">SchoolMS</span>
                        </div>
                        <p className="text-white/40 text-sm text-center md:text-right">
                            © {new Date().getFullYear()} SchoolMS. Empowering education through technology.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
