import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { School, Calendar, Clock, Mail, User, Building, MessageSquare, ArrowLeft, CheckCircle2, Phone } from 'lucide-react';
import InputError from '@/Components/InputError';
import SiteFooter from '@/Components/SiteFooter';

// A fine dot-grid, matched to Home.jsx's texture so the two pages read as
// one system rather than two different eras of design.
const dotGrid = {
    backgroundImage: 'radial-gradient(rgba(11,26,52,0.14) 1px, transparent 1px)',
    backgroundSize: '22px 22px',
};

const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

function Eyebrow({ children }) {
    return (
        <div className="flex items-center gap-3 mb-5">
            <span className="h-px w-8 bg-orange-dark/40" />
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-orange-dark">{children}</span>
        </div>
    );
}

function FieldIcon({ icon: Icon }) {
    return (
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-navy/35 group-focus-within:text-orange-dark transition-colors" />
        </div>
    );
}

const inputClass =
    'block w-full pl-11 pr-4 py-3 border border-navy/15 rounded-md focus:ring-2 focus:ring-orange-dark/30 focus:border-orange-dark transition-colors font-medium text-navy placeholder:text-navy/30 hover:border-navy/25';

const whatToExpect = [
    "A personalized 30-minute demo tailored to your school's needs",
    'Live walkthrough of all key features and modules',
    'Q&A session with our product experts',
    'Custom pricing and implementation timeline discussion',
];

export default function DemoBooking() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        school_name: '',
        date: '',
        time: '',
        message: '',
    });

    const timeSlots = [
        '09:00 AM',
        '10:00 AM',
        '11:00 AM',
        '12:00 PM',
        '01:00 PM',
        '02:00 PM',
        '03:00 PM',
        '04:00 PM',
        '05:00 PM',
    ];

    // Calculate minimum date (2 days from today)
    const getMinDate = () => {
        const today = new Date();
        today.setDate(today.getDate() + 2);
        return today.toISOString().split('T')[0];
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('demo.booking.submit'));
    };

    return (
        <>
            <Head title="Book a Demo" />

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

                            <div className="flex items-center gap-6">
                                <Link
                                    href="/"
                                    className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-navy/70 hover:text-navy transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to home
                                </Link>
                                <Link
                                    href="/login"
                                    className="px-5 py-2.5 bg-navy text-white text-sm font-semibold rounded-md hover:bg-navy-light transition-colors"
                                >
                                    Login
                                </Link>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* ---------------------------------------------------------------- Content */}
                <section className="relative pt-32 pb-24 px-6 bg-cream overflow-hidden">
                    <div className="absolute inset-0" style={dotGrid} />
                    <div className="absolute -top-24 right-0 w-[36rem] h-[36rem] rounded-full bg-orange/10 blur-3xl" />

                    <div className="max-w-6xl mx-auto relative">
                        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 items-start">
                            {/* Left column - copy + form */}
                            <div>
                                <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                                    <Eyebrow>Free Personalized Demo</Eyebrow>
                                    <h1 className="font-display text-4xl sm:text-5xl font-medium leading-[1.1] text-navy mb-5">
                                        Book your free
                                        <span className="block text-orange-dark italic">demo today.</span>
                                    </h1>
                                    <p className="text-lg text-navy/70 leading-relaxed mb-10 max-w-lg">
                                        Schedule a personalized demo and discover how SchoolMS can transform your
                                        school management.
                                    </p>
                                </motion.div>

                                <motion.div
                                    initial="hidden"
                                    animate="visible"
                                    variants={fadeUp}
                                    className="bg-white rounded-lg shadow-sm border border-navy/10 p-6 sm:p-8"
                                >
                                    <form onSubmit={submit} className="space-y-6">
                                        {/* Name Field */}
                                        <div className="group">
                                            <label htmlFor="name" className="block text-sm font-semibold text-navy mb-2">
                                                Full Name <span className="text-orange-dark">*</span>
                                            </label>
                                            <div className="relative">
                                                <FieldIcon icon={User} />
                                                <input
                                                    id="name"
                                                    type="text"
                                                    value={data.name}
                                                    onChange={(e) => setData('name', e.target.value)}
                                                    className={inputClass}
                                                    placeholder="John Doe"
                                                    required
                                                />
                                            </div>
                                            <InputError message={errors.name} className="mt-2" />
                                        </div>

                                        {/* Email Field */}
                                        <div className="group">
                                            <label htmlFor="email" className="block text-sm font-semibold text-navy mb-2">
                                                Email Address <span className="text-orange-dark">*</span>
                                            </label>
                                            <div className="relative">
                                                <FieldIcon icon={Mail} />
                                                <input
                                                    id="email"
                                                    type="email"
                                                    value={data.email}
                                                    onChange={(e) => setData('email', e.target.value)}
                                                    className={inputClass}
                                                    placeholder="john@example.com"
                                                    required
                                                />
                                            </div>
                                            <InputError message={errors.email} className="mt-2" />
                                        </div>

                                        {/* Phone Field */}
                                        <div className="group">
                                            <label htmlFor="phone" className="block text-sm font-semibold text-navy mb-2">
                                                Phone Number <span className="text-orange-dark">*</span>
                                            </label>
                                            <div className="relative">
                                                <FieldIcon icon={Phone} />
                                                <input
                                                    id="phone"
                                                    type="tel"
                                                    value={data.phone}
                                                    onChange={(e) => setData('phone', e.target.value)}
                                                    className={inputClass}
                                                    placeholder="+254 700 000 000"
                                                    required
                                                />
                                            </div>
                                            <InputError message={errors.phone} className="mt-2" />
                                        </div>

                                        {/* School Name Field */}
                                        <div className="group">
                                            <label htmlFor="school_name" className="block text-sm font-semibold text-navy mb-2">
                                                School Name <span className="text-orange-dark">*</span>
                                            </label>
                                            <div className="relative">
                                                <FieldIcon icon={Building} />
                                                <input
                                                    id="school_name"
                                                    type="text"
                                                    value={data.school_name}
                                                    onChange={(e) => setData('school_name', e.target.value)}
                                                    className={inputClass}
                                                    placeholder="ABC International School"
                                                    required
                                                />
                                            </div>
                                            <InputError message={errors.school_name} className="mt-2" />
                                        </div>

                                        {/* Date and Time Fields */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="group">
                                                <label htmlFor="date" className="block text-sm font-semibold text-navy mb-2">
                                                    Preferred Date <span className="text-orange-dark">*</span>
                                                </label>
                                                <div className="relative">
                                                    <FieldIcon icon={Calendar} />
                                                    <input
                                                        id="date"
                                                        type="date"
                                                        value={data.date}
                                                        onChange={(e) => setData('date', e.target.value)}
                                                        min={getMinDate()}
                                                        className={inputClass}
                                                        required
                                                    />
                                                </div>
                                                <p className="mt-1.5 text-xs text-navy/50">Minimum 2 days advance booking required</p>
                                                <InputError message={errors.date} className="mt-2" />
                                            </div>

                                            <div className="group">
                                                <label htmlFor="time" className="block text-sm font-semibold text-navy mb-2">
                                                    Preferred Time <span className="text-orange-dark">*</span>
                                                </label>
                                                <div className="relative">
                                                    <FieldIcon icon={Clock} />
                                                    <select
                                                        id="time"
                                                        value={data.time}
                                                        onChange={(e) => setData('time', e.target.value)}
                                                        className={`${inputClass} appearance-none cursor-pointer`}
                                                        required
                                                    >
                                                        <option value="">Select a time</option>
                                                        {timeSlots.map((slot) => (
                                                            <option key={slot} value={slot}>
                                                                {slot}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <InputError message={errors.time} className="mt-2" />
                                            </div>
                                        </div>

                                        {/* Message Field */}
                                        <div className="group">
                                            <label htmlFor="message" className="block text-sm font-semibold text-navy mb-2">
                                                Additional Message <span className="text-navy/40 text-xs font-normal">(Optional)</span>
                                            </label>
                                            <div className="relative">
                                                <div className="absolute top-3.5 left-0 pl-4 pointer-events-none">
                                                    <MessageSquare className="h-5 w-5 text-navy/35 group-focus-within:text-orange-dark transition-colors" />
                                                </div>
                                                <textarea
                                                    id="message"
                                                    value={data.message}
                                                    onChange={(e) => setData('message', e.target.value)}
                                                    rows="4"
                                                    className={`${inputClass} resize-none`}
                                                    placeholder="Tell us about your school and what you'd like to see in the demo..."
                                                />
                                            </div>
                                            <InputError message={errors.message} className="mt-2" />
                                        </div>

                                        {/* Submit Button */}
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="w-full flex items-center justify-center gap-2.5 px-8 py-3.5 bg-orange-dark text-white font-semibold rounded-md hover:bg-orange transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Calendar className="w-5 h-5" />
                                            {processing ? 'Submitting...' : 'Schedule My Demo'}
                                        </button>
                                    </form>
                                </motion.div>
                            </div>

                            {/* Right column - what to expect */}
                            <motion.div
                                initial="hidden"
                                animate="visible"
                                variants={fadeUp}
                            >
                                <div className="bg-navy rounded-lg p-8 sm:p-10">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-11 h-11 rounded-md bg-orange-dark/20 flex items-center justify-center">
                                            <Clock className="w-5 h-5 text-orange" />
                                        </div>
                                        <h3 className="font-display text-2xl font-medium text-white">What to expect</h3>
                                    </div>
                                    <ul className="space-y-5">
                                        {whatToExpect.map((item) => (
                                            <li key={item} className="flex items-start gap-3">
                                                <CheckCircle2 className="w-5 h-5 text-orange flex-shrink-0 mt-0.5" />
                                                <span className="text-white/75 leading-relaxed">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* ---------------------------------------------------------------- Footer */}
                <SiteFooter />
            </div>
        </>
    );
}
