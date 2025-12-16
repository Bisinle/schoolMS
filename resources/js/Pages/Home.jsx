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
        'Quran Memorization Tracking (Perfect for Madrasahs)',
        'Quran Homework & Home Practice Logging',
        'Islamic Studies & Dual Curriculum Support',
        'Document Management System',
        'Guardian Portal: View Attendance, Results, Fees & Quran Progress',
        'Multi-Payment Methods: Cash, M-Pesa, Bank Transfer, Cheque',
        'Custom School Branding (Logo & School Information)',
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
                                <Link href="/demo-booking" className="text-gray-700 hover:text-orange-600 font-medium transition-colors">Contact</Link>
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
                                    <Link href="/demo-booking" className="text-gray-700 hover:text-orange-600 font-medium">Contact</Link>
                                    <Link href="/login" className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg text-center">
                                        Login
                                    </Link>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </nav>

                <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-orange-50 via-white to-orange-50 relative overflow-hidden">
                    {/* Animated Mesh Gradient */}
                    <div className="absolute inset-0 opacity-30">
                        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500 rounded-full mix-blend-screen filter blur-3xl animate-blob"></div>
                        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-2000"></div>
                        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-4000"></div>
                    </div>

                    <div className="max-w-7xl mx-auto relative z-10">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
                                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-100 to-amber-100 rounded-full mb-6 border border-orange-200">
                                    <BookOpen className="w-4 h-4 text-orange-600 mr-2" />
                                    <span className="text-gray-800 font-bold text-sm">For Regular Schools & Madrasahs (Islamic Schools)</span>
                                </div>

                                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                                    Complete Management System for
                                    <span className="  block mt-2 bg-gradient-to-r from-orange-600 to-orange-600 bg-clip-text text-transparent">
                                        Schools & Madrasahs
                                    </span>
                                </h1>

                                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                                    An all-in-one management system designed for both <span className="font-bold text-orange-600">regular schools</span> and <span className="font-bold text-orange-600">madrasahs (Islamic schools)</span>.
                                    Manage student records, exam results, fee tracking, <span className="font-bold text-orange-600">Quran memorization tracking</span>, and more - all in one powerful platform.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                                    <Link href="/login" className="group px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:shadow-xl hover:shadow-orange-500/50 transition-all duration-300 flex items-center justify-center">
                                        <span>Get Started</span>
                                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                    <Link href="/demo-booking" className="px-8 py-4 bg-white text-gray-700 font-semibold rounded-lg border-2 border-gray-200 hover:border-orange-500 hover:text-orange-600 transition-all duration-300 flex items-center justify-center">
                                        Request Demo
                                    </Link>
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

                <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
                    {/* Animated Mesh Gradient */}
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-400 rounded-full mix-blend-screen filter blur-3xl animate-blob"></div>
                        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-purple-400 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-2000"></div>
                    </div>

                    <div className="max-w-7xl mx-auto relative z-10">
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

                {/* Madrasah-Specific Features Section */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-orange-50 via-white to-orange-50 relative overflow-hidden">
                    {/* Animated Background */}
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-orange-400 rounded-full mix-blend-screen filter blur-3xl animate-blob"></div>
                        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-amber-400 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-2000"></div>
                    </div>

                    <div className="max-w-7xl mx-auto relative z-10">
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
                            <div className="inline-flex items-center px-4 py-2 bg-orange-100 rounded-full mb-4 border border-orange-200">
                                <BookOpen className="w-4 h-4 text-orange-600 mr-2" />
                                <span className="text-orange-700 font-semibold text-sm">PERFECT FOR MADRASAHS</span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                                Built for Islamic Schools & Madrasahs
                            </h2>
                            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                                Specialized features designed specifically for madrasahs and Islamic schools to track Quran memorization, Islamic studies, and maintain traditional values alongside modern management.
                            </p>
                        </motion.div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-orange-100 hover:border-orange-300">
                                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-6">
                                    <BookOpen className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Quran Memorization Tracking</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Track student progress in Quran memorization with page ranges, automatic calculation of surahs and juz completed. Monitor each student's journey in hifdh.
                                </p>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-orange-100 hover:border-orange-300">
                                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-6">
                                    <ClipboardCheck className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Quran Homework & Practice</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Assign Quran homework with specific page ranges and due dates. Track home practice sessions and monitor daily Quran recitation progress.
                                </p>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-orange-100 hover:border-orange-300">
                                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-6">
                                    <Calendar className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Quran Progress Schedules</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Create and manage Quran memorization schedules for students. Set goals, track milestones, and generate progress reports for parents.
                                </p>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-orange-100 hover:border-orange-300">
                                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-6">
                                    <BarChart3 className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Guardian Quran Portal</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Parents can view their children's Quran memorization progress, homework assignments, and practice logs through the dedicated guardian portal.
                                </p>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.4 }} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-orange-100 hover:border-orange-300">
                                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-6">
                                    <FileText className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Islamic Studies Integration</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Manage both secular and Islamic curriculum seamlessly. Track performance in Quran, Hadith, Fiqh, and other Islamic subjects alongside regular academics.
                                </p>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.5 }} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-orange-100 hover:border-orange-300">
                                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-6">
                                    <Shield className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Dual Curriculum Support</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Perfect for schools offering both national curriculum (CBC, IGCSE, etc.) and Islamic/Madrasah curriculum. Manage both systems in one platform.
                                </p>
                            </motion.div>
                        </div>

                        {/* Call to Action */}
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.6 }} className="mt-16 text-center">
                            <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-2xl p-8 lg:p-12 shadow-2xl">
                                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                                    Perfect for Both Regular Schools & Madrasahs
                                </h3>
                                <p className="text-orange-50 text-lg mb-8 max-w-2xl mx-auto">
                                    Whether you run a regular school, an Islamic school, or a madrasah, SchoolMS has all the features you need to manage your institution effectively.
                                </p>
                                <Link href="/demo-booking" className="inline-flex items-center px-8 py-4 bg-white text-orange-700 font-bold rounded-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                                    <span>Schedule a Demo for Your School</span>
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Link>
                            </div>
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

                {/* Fully Responsive Section */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
                    {/* Animated Background */}
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-screen filter blur-3xl animate-blob"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-2000"></div>
                    </div>

                    <div className="max-w-7xl mx-auto relative z-10">
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
                            <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full mb-4 border border-blue-200">
                                <Smartphone className="w-4 h-4 text-blue-600 mr-2" />
                                <span className="text-blue-700 font-semibold text-sm">WORKS ON ALL DEVICES</span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                                Fully Responsive Design
                            </h2>
                            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                                Access SchoolMS from anywhere, on any device. Our platform is optimized for desktop, tablet, and mobile devices.
                            </p>
                        </motion.div>

                        <div className="max-w-5xl mx-auto">
                            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8">
                                <div className="flex items-center mb-6">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                                        <Smartphone className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-gray-900">Mobile Optimized</h3>
                                        <p className="text-sm text-gray-600 font-medium">Works perfectly on all devices</p>
                                    </div>
                                </div>

                                {/* Mobile Screenshots Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                                    {[
                                        { img: screenshot9, label: 'Analytics' },
                                        { img: screenshot10, label: 'Dashboard' },
                                        { img: screenshot11, label: 'Report Card' },
                                        { img: screenshot12, label: 'Documents' },
                                        { img: screenshot13, label: 'Students per Grade' }
                                    ].map((screenshot, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.5, delay: index * 0.1 }}
                                            className="group relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105"
                                        >
                                            {/* Mobile Phone Frame Effect */}
                                            <div className="relative bg-gray-900 p-2 rounded-2xl">
                                                <div className="relative aspect-[9/19] overflow-hidden rounded-xl bg-white">
                                                    <img
                                                        src={screenshot.img}
                                                        alt={screenshot.label}
                                                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                                    />

                                                    {/* Gradient Overlay */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b1a34]/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                                    {/* Label on Hover */}
                                                    <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                                                        <p className="text-white text-xs font-bold text-center">{screenshot.label}</p>
                                                    </div>
                                                </div>

                                                {/* Phone Notch */}
                                                <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-16 h-4 bg-gray-900 rounded-full"></div>
                                            </div>

                                            {/* Glow Effect */}
                                            <div className="absolute inset-0 border-2 border-transparent group-hover:border-orange-500/50 rounded-2xl transition-colors duration-500 pointer-events-none"></div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Responsive Badge */}
                                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
                                    <p className="text-sm text-gray-700 font-bold text-center">
                                        <span className="text-blue-600">✓</span> Optimized for Desktop, Tablet & Mobile
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
                    {/* Animated Mesh Gradient */}
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-400 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-2000"></div>
                        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-400 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-4000"></div>
                    </div>

                    <div className="max-w-4xl mx-auto relative z-10">
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

                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }} className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-6 sm:p-8 lg:p-12 border-2 border-orange-500 shadow-2xl">
                            <div className="text-center mb-6 sm:mb-8">
                                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">SchoolMS Complete Plan</h3>
                                <div className="flex flex-col sm:flex-row items-center sm:items-end justify-center mb-3 sm:mb-4 gap-1 sm:gap-0">
                                    <span className="text-4xl sm:text-5xl lg:text-6xl font-bold text-orange-600">KSh 180</span>
                                    <span className="text-base sm:text-lg text-gray-600 font-medium sm:ml-2 sm:mb-2">/student/month</span>
                                </div>
                                <p className="text-sm sm:text-base lg:text-lg text-gray-600 px-4">Pay only for active students - Simple & Affordable</p>
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
                                <Link href="/demo-booking" className="flex-1 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:shadow-xl hover:shadow-orange-500/50 transition-all duration-300 text-center">
                                    Buy Now
                                </Link>
                                <Link href="/demo-booking" className="flex-1 px-8 py-4 bg-white text-gray-700 font-semibold rounded-lg border-2 border-gray-200 hover:border-orange-500 hover:text-orange-600 transition-all duration-300 text-center">
                                    Request Demo
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Book Your Free Demo Section */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-orange-50 via-white to-orange-50 relative overflow-hidden">
                    {/* Animated Background */}
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-orange-400 rounded-full mix-blend-screen filter blur-3xl animate-blob"></div>
                        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-pink-400 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-2000"></div>
                    </div>

                    <div className="max-w-7xl mx-auto relative z-10">
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
                            <div className="inline-flex items-center px-4 py-2 bg-orange-100 rounded-full mb-4 border border-orange-200">
                                <Calendar className="w-4 h-4 text-orange-600 mr-2" />
                                <span className="text-orange-700 font-semibold text-sm">FREE PERSONALIZED DEMO</span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                                Book Your Free Demo Today
                            </h2>
                            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                                See SchoolMS in action with a personalized demo tailored to your school's needs. No commitment required.
                            </p>
                        </motion.div>

                        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                            {/* What to Expect Box */}
                            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8">
                                <div className="flex items-center mb-6">
                                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-600 rounded-xl flex items-center justify-center mr-4">
                                        <Clock className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-900">What to Expect</h3>
                                </div>
                                <ul className="space-y-4">
                                    <li className="flex items-start group">
                                        <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mr-3 mt-0.5 group-hover:scale-110 transition-transform">
                                            <CheckCircle className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-gray-700 font-medium leading-relaxed">A personalized 30-minute demo tailored to your school's needs</span>
                                    </li>
                                    <li className="flex items-start group">
                                        <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mr-3 mt-0.5 group-hover:scale-110 transition-transform">
                                            <CheckCircle className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-gray-700 font-medium leading-relaxed">Live walkthrough of all key features and modules</span>
                                    </li>
                                    <li className="flex items-start group">
                                        <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mr-3 mt-0.5 group-hover:scale-110 transition-transform">
                                            <CheckCircle className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-gray-700 font-medium leading-relaxed">Q&A session with our product experts</span>
                                    </li>
                                    <li className="flex items-start group">
                                        <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mr-3 mt-0.5 group-hover:scale-110 transition-transform">
                                            <CheckCircle className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-gray-700 font-medium leading-relaxed">Custom pricing and implementation timeline discussion</span>
                                    </li>
                                </ul>
                            </motion.div>

                            {/* CTA Box */}
                            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="bg-gradient-to-br from-orange-600 to-orange-500 rounded-3xl shadow-2xl p-8 sm:p-10 flex flex-col justify-center">
                                <div className="text-center text-white">
                                    <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mx-auto mb-6">
                                        <Calendar className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-3xl font-black mb-4">Ready to Get Started?</h3>
                                    <p className="text-orange-50 text-lg mb-8 leading-relaxed">
                                        Schedule your free personalized demo today and discover how SchoolMS can transform your school management.
                                    </p>
                                    <Link
                                        href="/demo-booking"
                                        className="inline-flex items-center px-8 py-4 bg-white text-orange-700 font-bold rounded-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group"
                                    >
                                        <span>Schedule Your Free Demo</span>
                                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                    <p className="text-orange-100 text-sm mt-4">
                                        No credit card required • 30-minute session
                                    </p>
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

            {/* Custom Animations */}
            <style jsx>{`
                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    25% { transform: translate(20px, -50px) scale(1.1); }
                    50% { transform: translate(-20px, 20px) scale(0.9); }
                    75% { transform: translate(50px, 50px) scale(1.05); }
                }

                .animate-blob {
                    animation: blob 7s infinite;
                }

                .animation-delay-2000 {
                    animation-delay: 2s;
                }

                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </>
    );
}