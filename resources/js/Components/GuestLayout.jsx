import { School, Users, BookOpen, DollarSign, BarChart2, ShieldCheck, GraduationCap } from 'lucide-react';

const features = [
    {
        icon: Users,
        title: 'Student & Guardian Management',
        description: 'Complete records for every student and their guardians in one place.',
    },
    {
        icon: BookOpen,
        title: 'Academics & Attendance',
        description: 'Track results, report cards, timetables, and daily attendance.',
    },
    {
        icon: DollarSign,
        title: 'Fee & Invoice Management',
        description: 'Generate invoices, record payments, and monitor collection rates.',
    },
    {
        icon: BarChart2,
        title: 'Insights & Reports',
        description: 'Clear visibility into academic performance and financial trends.',
    },
];

const dotGrid = {
    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
    backgroundSize: '32px 32px',
};

export default function GuestLayout({ children }) {
    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-slate-950">

            {/* ── Mobile / Tablet hero banner (hidden on lg+) ── */}
            <div className="lg:hidden relative overflow-hidden flex-shrink-0"
                 style={{ background: 'linear-gradient(135deg, #0b1a34 0%, #0f2850 60%, #1a1a2e 100%)' }}>
                <div className="absolute inset-0" style={dotGrid} />
                {/* Decorative blobs */}
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-orange-500 rounded-full opacity-10 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500 rounded-full opacity-10 blur-3xl pointer-events-none" />

                <div className="relative z-10 px-5 sm:px-10 py-8 sm:py-10">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-11 h-11 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-900/40 flex-shrink-0">
                            <School className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-white font-bold text-base leading-tight tracking-tight">School Management</p>
                            <p className="text-orange-400 text-[10px] font-bold uppercase tracking-[0.18em]">System</p>
                        </div>
                    </div>
                    {/* Tagline */}
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug mb-2">
                        Everything your school<br className="hidden xs:block" /> needs,{' '}
                        <span className="text-orange-400">in one place.</span>
                    </h1>
                    <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-md">
                        A modern platform built to simplify administration and keep every stakeholder informed.
                    </p>
                </div>
            </div>

            {/* ── Desktop left branding panel (lg+) ── */}
            <div className="hidden lg:flex lg:w-[48%] xl:w-[52%] relative overflow-hidden flex-col justify-between"
                 style={{ background: 'linear-gradient(150deg, #0b1a34 0%, #0d2147 55%, #111827 100%)' }}>

                <div className="absolute inset-0" style={dotGrid} />
                {/* Decorative blobs */}
                <div className="absolute -top-24 -left-24 w-96 h-96 xl:w-[30rem] xl:h-[30rem] bg-orange-500 rounded-full opacity-[0.08] blur-3xl pointer-events-none" />
                <div className="absolute top-1/2 -translate-y-1/2 right-0 w-64 h-64 xl:w-80 xl:h-80 bg-blue-600 rounded-full opacity-[0.07] blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 left-1/4 w-72 h-72 bg-indigo-600 rounded-full opacity-[0.07] blur-3xl pointer-events-none" />

                {/* Vertical accent line */}
                <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent" />

                {/* Top — Logo + headline */}
                <div className="relative z-10 px-10 xl:px-14 2xl:px-18 pt-12 xl:pt-16 2xl:pt-20">
                    {/* Logo */}
                    <div className="flex items-center gap-4 mb-10 xl:mb-12">
                        <div className="w-14 h-14 xl:w-16 xl:h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-900/40 flex-shrink-0">
                            <School className="w-8 h-8 xl:w-9 xl:h-9 text-white" />
                        </div>
                        <div>
                            <p className="text-white font-bold text-xl xl:text-2xl leading-tight tracking-tight">School Management</p>
                            <p className="text-orange-400 text-xs xl:text-sm font-bold uppercase tracking-[0.18em]">System</p>
                        </div>
                    </div>

                    {/* Headline */}
                    <h1 className="text-4xl xl:text-5xl 2xl:text-6xl font-extrabold text-white leading-tight mb-4 xl:mb-5">
                        Everything your<br />school needs,
                        <br />
                        <span className="text-transparent bg-clip-text"
                              style={{ backgroundImage: 'linear-gradient(90deg, #fb923c, #f97316)' }}>
                            in one place.
                        </span>
                    </h1>

                    {/* Sub-headline */}
                    <p className="text-slate-400 text-base xl:text-lg max-w-sm xl:max-w-md leading-relaxed">
                        A modern platform built to simplify administration, improve accountability, and keep every stakeholder informed.
                    </p>
                </div>

                {/* Middle — Feature cards */}
                <div className="relative z-10 px-10 xl:px-14 2xl:px-18 py-8 xl:py-10 grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-5">
                    {features.map(({ icon: Icon, title, description }) => (
                        <div key={title}
                             className="flex items-start gap-3.5 p-4 xl:p-4.5 rounded-2xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] transition-colors">
                            <div className="w-9 h-9 xl:w-10 xl:h-10 bg-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Icon className="w-4.5 h-4.5 xl:w-5 xl:h-5 text-orange-400" />
                            </div>
                            <div>
                                <p className="text-white text-sm xl:text-base font-semibold leading-snug">{title}</p>
                                <p className="text-slate-400 text-xs xl:text-sm leading-relaxed mt-0.5">{description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom — trust badge + stat strip */}
                <div className="relative z-10 px-10 xl:px-14 2xl:px-18 pb-10 xl:pb-12 space-y-4">
                    {/* Divider */}
                    <div className="h-px bg-white/10" />
                    <div className="flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            <span className="text-slate-400 text-xs xl:text-sm">Secure, role-based access</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-blue-400 flex-shrink-0" />
                            <span className="text-slate-400 text-xs xl:text-sm">Built for schools &amp; madrasahs</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Form area ── */}
            <div className="flex-1 flex items-start lg:items-center justify-center overflow-y-auto"
                 style={{ background: 'linear-gradient(160deg, #f8fafc 0%, #f1f5f9 100%)' }}>
                <div className="w-full max-w-md px-4 sm:px-8 lg:px-10 py-8 sm:py-10 lg:py-12">
                    {children}
                </div>
            </div>

        </div>
    );
}
