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
    Zap,
    Phone,
    Mail,
    MapPin,
    Menu,
    X
} from 'lucide-react';
import { useState } from 'react';

import screenshot1 from '../Images/app-screenshot1.png';
import screenshot2 from '../Images/app-screenshot2.png';
import screenshot3 from '../Images/app-screenshot3.png';
import screenshot4 from '../Images/app-screenshot4.png';
import screenshot5 from '../Images/app-screenshot5.png';
import screenshot6 from '../Images/app-screenshot6.png';
import screenshot7 from '../Images/app-screenshot7.png';
import screenshot8 from '../Images/app-screenshot8.png';
import screenshot9 from '../Images/app-screenshot9.png';
import screenshot10 from '../Images/app-screenshot10.png';
import screenshot11 from '../Images/app-screenshot11.png';
import screenshot12 from '../Images/app-screenshot12.png';
import screenshot13 from '../Images/app-screenshot13.png';

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
        'Fee Management: Invoicing, Payments & Balance Tracking',
        'Examination & Results: Scheduling, Grading & Report Cards',
        'Teacher & Staff Management with Role-Based Access',
        'Attendance Tracking with Detailed Reports',
        'Quran Memorization Tracking (Islamic Schools)',
        'Document Management System',
        'Guardian Portal: View Attendance, Results & Fees',
        'Multi-Payment Methods: Cash, M-Pesa, Bank Transfer, Cheque',
        'Custom School Branding (Logo & School Information)',
        'Super Admin Dashboard for Multi-School Management',
        'User Impersonation for Support & Training',
        'Cloud Hosted with Automatic Backups'
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5 }
        }
    };

    return (
        <>
            <Head title="SchoolMS - Comprehensive School Management System" />
            
            <div className="min-h-screen bg-white">
                <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-sm z-50 border-b border-gray-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16 lg:h-20">
                            <Link href="/" className="flex items-center space-x-3">
                                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                                    <School className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
                                </div>
                                <div>
                                    <span className="text-xl lg:text-2xl font-bold text-gray-900">SchoolMS</span>
                                    <div className="text-xs text-gray-500 font-medium">School Management System</div>
                                </div>
                            </Link>

                            <div className="hidden md:flex items-center space-x-8">
                                <a href="#features" className="text-gray-700 hover:text-orange-600 font-medium transition-colors">Features</a>
                                <a href="#pricing" className="text-gray-700 hover:text-orange-600 font-medium transition-colors">Pricing</a>
                                <a href="#contact" className="text-gray-700 hover:text-orange-600 font-medium transition-colors">Contact</a>
                                <Link href="/login" className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-orange-500/50 transition-all duration-300">
                                    Login
                                </Link>
                            </div>

                            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
                                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>

                        {mobileMenuOpen && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:hidden py-4 border-t border-gray-100">
                                <div className="flex flex-col space-y-4">
                                    <a href="#features" className="text-gray-700 hover:text-orange-600 font-medium">Features</a>
                                    <a href="#pricing" className="text-gray-700 hover:text-orange-600 font-medium">Pricing</a>
                                    <a href="#contact" className="text-gray-700 hover:text-orange-600 font-medium">Contact</a>
                                    <Link href="/login" className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg text-center">
                                        Login
                                    </Link>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </nav>

                <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-orange-50 via-white to-orange-50">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
                                <div className="inline-flex items-center px-4 py-2 bg-orange-100 rounded-full mb-6">
                                    <Zap className="w-4 h-4 text-orange-600 mr-2" />
                                    <span className="text-orange-600 font-semibold text-sm">One System. Total School Control.</span>
                                </div>

                                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                                    SchoolMS: Comprehensive School Management System
                                </h1>

                                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                                    An all-in-one school management system designed to simplify academic, administrative, and communication processes.
                                    Manage everything from student records and exam results to fee tracking and Quran memorization - all in one powerful platform.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                                    <Link href="/login" className="group px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:shadow-xl hover:shadow-orange-500/50 transition-all duration-300 flex items-center justify-center">
                                        <span>Get Started</span>
                                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                    <a href="#contact" className="px-8 py-4 bg-white text-gray-700 font-semibold rounded-lg border-2 border-gray-200 hover:border-orange-500 hover:text-orange-600 transition-all duration-300 flex items-center justify-center">
                                        Request Demo
                                    </a>
                                </div>

                                <div className="flex flex-wrap gap-6">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                        <span className="text-sm text-gray-600 font-medium">Cloud Hosted</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                        <span className="text-sm text-gray-600 font-medium">M-Pesa Integrated</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                        <span className="text-sm text-gray-600 font-medium">24/7 Support</span>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative">
                                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                                    <img src={screenshot2} alt="SchoolMS Dashboard" className="w-full h-auto" />
                                </div>
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.8 }} className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl p-4 border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                            <CheckCircle2 className="w-6 h-6 text-orange-600" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">All-in-One</div>
                                            <div className="text-sm text-gray-600">Complete Solution</div>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
                    <div className="max-w-7xl mx-auto">
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
                            <div className="inline-flex items-center px-4 py-2 bg-orange-100 rounded-full mb-4">
                                <BookOpen className="w-4 h-4 text-orange-600 mr-2" />
                                <span className="text-orange-600 font-semibold text-sm">KEY FEATURES</span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                                Comprehensive Tools to Simplify School Management
                            </h2>
                            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                                Powerful features built to manage every aspect of your school efficiently
                            </p>
                        </motion.div>

                        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {coreModules.map((module, index) => (
                                <motion.div key={index} variants={itemVariants} whileHover={{ y: -5 }} className="bg-white rounded-xl p-6 border border-gray-200 hover:border-orange-500 hover:shadow-xl transition-all duration-300">
                                    <div className="w-14 h-14 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                                        <module.icon className="w-7 h-7 text-orange-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3">{module.title}</h3>
                                    <p className="text-gray-600 leading-relaxed">{module.description}</p>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white">
                    <div className="max-w-7xl mx-auto">
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                                See SchoolMS In Action
                            </h2>
                            <p className="text-lg text-gray-600">
                                Explore our intuitive interface designed to make school management effortless
                            </p>
                        </motion.div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { img: screenshot3, title: 'Grades & Classes', desc: 'Comprehensive academic tracking' },
                                { img: screenshot6, title: 'Attendance Tracking', desc: 'Easy attendance management' },
                                { img: screenshot8, title: 'Student Reports', desc: 'Detailed performance analytics' },
                                { img: screenshot4, title: 'Document Management', desc: 'Centralized document storage' },
                                { img: screenshot5, title: 'Dashboard Overview', desc: 'Real-time insights' }
                            ].map((screenshot, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    whileHover={{ y: -10, scale: 1.02 }}
                                    className="group relative rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 bg-white"
                                >
                                    <div className="aspect-video overflow-hidden bg-gray-100">
                                        <img 
                                            src={screenshot.img} 
                                            alt={screenshot.title} 
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                    
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    
                                    <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                        <h3 className="text-xl font-bold text-white mb-1 drop-shadow-lg">
                                            {screenshot.title}
                                        </h3>
                                        <p className="text-sm text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                                            {screenshot.desc}
                                        </p>
                                    </div>

                                    <div className="absolute top-4 right-4 w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-150">
                                        <ArrowRight className="w-5 h-5 text-white" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
                    <div className="max-w-4xl mx-auto">
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-12">
                            <div className="inline-flex items-center px-4 py-2 bg-orange-100 rounded-full mb-4">
                                <DollarSign className="w-4 h-4 text-orange-600 mr-2" />
                                <span className="text-orange-600 font-semibold text-sm">PRICING</span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                                Simple, Transparent Pricing
                            </h2>
                            <p className="text-lg text-gray-600">
                                Everything you need to run your school efficiently
                            </p>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }} className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-8 lg:p-12 border-2 border-orange-500 shadow-2xl">
                            <div className="text-center mb-8">
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">SchoolMS Complete Plan</h3>
                                <div className="flex items-end justify-center mb-2">
                                    <span className="text-5xl font-bold text-orange-600">KSh 150</span>
                                    <span className="text-gray-600 font-medium ml-2 mb-2">/student/month</span>
                                </div>
                                <p className="text-gray-600">Pay only for active students - Simple & Affordable</p>
                            </div>

                            <div className="mb-8">
                                <h4 className="font-bold text-gray-900 mb-4 text-lg">Features Included In Plan:</h4>
                                <div className="space-y-3">
                                    {features.map((feature, index) => (
                                        <div key={index} className="flex items-start gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                            <span className="text-gray-700">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <a href="#contact" className="flex-1 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:shadow-xl hover:shadow-orange-500/50 transition-all duration-300 text-center">
                                    Buy Now
                                </a>
                                <a href="#contact" className="flex-1 px-8 py-4 bg-white text-gray-700 font-semibold rounded-lg border-2 border-gray-200 hover:border-orange-500 hover:text-orange-600 transition-all duration-300 text-center">
                                    Contact Us
                                </a>
                            </div>
                        </motion.div>
                    </div>
                </section>

                <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 to-gray-800">
                    <div className="max-w-7xl mx-auto">
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-12">
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                                Ready to Simplify School Management?
                            </h2>
                            <p className="text-lg text-gray-300">
                                Fill out the form below to Book a Live Demo Session
                            </p>
                        </motion.div>

                        <div className="grid lg:grid-cols-2 gap-12">
                            <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="bg-white rounded-xl p-8">
                                <form className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                                        <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                                        <input type="email" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                                        <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                                        <textarea rows="4" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" required></textarea>
                                    </div>
                                    <button type="submit" className="w-full px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:shadow-xl hover:shadow-orange-500/50 transition-all duration-300">
                                        Request Demo
                                    </button>
                                </form>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="space-y-8">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Mail className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-1">Email</h3>
                                        <a href="mailto:info@schoolms.com" className="text-gray-300 hover:text-orange-400 transition-colors">
                                            info@schoolms.com
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Phone className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-1">Call Us On</h3>
                                        <p className="text-gray-300">+254 700 000 000</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <MessageSquare className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-1">WhatsApp</h3>
                                        <p className="text-gray-300">+254 700 000 000</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <MapPin className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-1">Location</h3>
                                        <p className="text-gray-300">Nairobi, Kenya</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                                    <School className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <span className="text-xl font-bold">SchoolMS</span>
                                    <div className="text-xs text-gray-400">School Management System</div>
                                </div>
                            </div>
                            
                            <div className="text-gray-400 text-sm text-center md:text-right">
                                <p>© {new Date().getFullYear()} SchoolMS. All rights reserved.</p>
                                <p className="mt-1">Empowering Education Through Technology</p>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}