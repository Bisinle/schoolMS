import { School, Users, BookOpen, DollarSign, BarChart2, ShieldCheck } from 'lucide-react';

const features = [
    {
        icon: Users,
        title: 'Student & Guardian Management',
        description: 'Maintain complete records for every student and their guardians in one place.',
    },
    {
        icon: BookOpen,
        title: 'Academics & Attendance',
        description: 'Track results, report cards, timetables, and daily attendance effortlessly.',
    },
    {
        icon: DollarSign,
        title: 'Fee & Invoice Management',
        description: 'Generate invoices, record payments, and monitor collection rates by term.',
    },
    {
        icon: BarChart2,
        title: 'Insights & Reports',
        description: 'Get clear visibility into academic performance and financial trends.',
    },
];

const dotGrid = {
    backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
    backgroundSize: '28px 28px',
};

export default function GuestLayout({ children }) {
    return (
        <div className="min-h-screen flex flex-col lg:flex-row">

            {/* ── Mobile / Tablet top header (visible below lg) ── */}
            <div className="lg:hidden bg-[#0b1a34] relative overflow-hidden flex-shrink-0">
                <div className="absolute inset-0 opacity-[0.06]" style={dotGrid} />
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-orange-500 rounded-full opacity-10 blur-3xl" />
                <div className="relative z-10 flex items-center gap-3 px-5 py-4 sm:px-8 sm:py-5">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                        <School className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <p className="text-white font-bold text-base sm:text-lg leading-tight">School Management</p>
                        <p className="text-orange-400 text-[10px] font-semibold uppercase tracking-widest">System</p>
                    </div>
                </div>
            </div>

            {/* ── Desktop left branding panel (visible at lg+) ── */}
            <div className="hidden lg:flex lg:w-[52%] bg-[#0b1a34] relative overflow-hidden flex-col justify-between">

                <div className="absolute inset-0 opacity-[0.06]" style={dotGrid} />
                <div className="absolute top-[-80px] left-[-80px] w-80 h-80 xl:w-[28rem] xl:h-[28rem] bg-orange-500 rounded-full opacity-10 blur-3xl" />
                <div className="absolute bottom-[-80px] right-[-60px] w-72 h-72 xl:w-96 xl:h-96 bg-blue-500 rounded-full opacity-10 blur-3xl" />

                {/* Top — Logo + headline */}
                <div className="relative z-10 px-10 xl:px-16 2xl:px-20 pt-12 xl:pt-16 2xl:pt-20">

                    {/* Logo pill */}
                    <div className="flex items-center gap-4 xl:gap-5 mb-10 xl:mb-14">
                        <div className="w-14 h-14 xl:w-16 xl:h-16 2xl:w-20 2xl:h-20 bg-orange-500 rounded-xl xl:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                            <School className="w-8 h-8 xl:w-9 xl:h-9 2xl:w-11 2xl:h-11 text-white" />
                        </div>
                        <div>
                            <p className="text-white font-bold text-xl xl:text-2xl 2xl:text-3xl leading-tight">School Management</p>
                            <p className="text-orange-400 text-sm xl:text-base font-semibold uppercase tracking-widest">System</p>
                        </div>
                    </div>

                    {/* Headline */}
                    <h1 className="text-5xl xl:text-6xl 2xl:text-7xl font-extrabold text-white leading-tight mb-4 xl:mb-6">
                        Everything your school<br />
                        needs,{' '}
                        <span className="text-orange-400">in one place.</span>
                    </h1>

                    {/* Sub-headline */}
                    <p className="text-gray-400 text-lg xl:text-xl 2xl:text-2xl max-w-md xl:max-w-lg leading-relaxed">
                        A modern platform built to simplify administration, improve accountability, and keep every stakeholder informed.
                    </p>
                </div>

                {/* Middle — Feature list */}
                <div className="relative z-10 px-10 xl:px-16 2xl:px-20 py-10 xl:py-12 2xl:py-14 grid grid-cols-1 xl:grid-cols-2 gap-5 xl:gap-6">
                    {features.map(({ icon: Icon, title, description }) => (
                        <div key={title} className="flex items-start gap-4">
                            <div className="w-10 h-10 xl:w-11 xl:h-11 bg-white/10 rounded-lg xl:rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Icon className="w-5 h-5 xl:w-5 xl:h-5 text-orange-400" />
                            </div>
                            <div>
                                <p className="text-white text-base xl:text-lg font-semibold">{title}</p>
                                <p className="text-gray-400 text-sm xl:text-base leading-relaxed mt-1">{description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom — trust badge */}
                <div className="relative z-10 px-10 xl:px-16 2xl:px-20 pb-10 xl:pb-12">
                    <div className="flex items-center gap-2 text-gray-500 text-sm xl:text-base">
                        <ShieldCheck className="w-4 h-4 xl:w-5 xl:h-5 text-green-500 flex-shrink-0" />
                        <span>Secure, role-based access for admins, teachers &amp; guardians</span>
                    </div>
                </div>
            </div>

            {/* ── Form area (all screen sizes) ── */}
            <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50">
                <div className="flex min-h-full items-start sm:items-center justify-center px-4 sm:px-8 lg:px-14 py-8 sm:py-10 lg:py-12">
                    <div className="w-full max-w-md">{children}</div>
                </div>
            </div>

        </div>
    );
}
