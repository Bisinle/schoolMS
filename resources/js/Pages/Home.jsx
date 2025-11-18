import { Head, Link } from '@inertiajs/react';
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
    Sparkles,
    TrendingUp,
    Zap
} from 'lucide-react';

// Import screenshots
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
    const features = [
        {
            icon: Users,
            title: 'Students Management',
            description: 'Comprehensive student profiles, enrollment tracking, and academic records management.',
            gradient: 'from-blue-500 to-cyan-500'
        },
        {
            icon: UserCheck,
            title: 'Teacher & Staff Management',
            description: 'Manage faculty profiles, assignments, schedules, and performance tracking.',
            gradient: 'from-purple-500 to-pink-500'
        },
        {
            icon: DollarSign,
            title: 'Billing & Payments',
            description: 'Automated fee collection, payment tracking, and financial reporting.',
            gradient: 'from-green-500 to-emerald-500'
        },
        {
            icon: FileText,
            title: 'Exams & Results',
            description: 'Create exams, record results, generate report cards, and track academic progress.',
            gradient: 'from-orange-500 to-red-500'
        },
        {
            icon: ClipboardCheck,
            title: 'Attendance',
            description: 'Real-time attendance tracking for students and staff with detailed reports.',
            gradient: 'from-yellow-500 to-orange-500'
        },
        {
            icon: Shield,
            title: 'User Roles & Permissions',
            description: 'Granular access control for admins, teachers, students, and guardians.',
            gradient: 'from-indigo-500 to-purple-500'
        },
        {
            icon: MessageSquare,
            title: 'Communication Tools',
            description: 'Built-in messaging, notifications, and announcements for seamless communication.',
            gradient: 'from-pink-500 to-rose-500'
        },
    ];

    return (
        <>
            <Head title="Welcome to SchoolMS" />
            
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
                {/* Header/Navigation */}
                <nav className="bg-white/80 backdrop-blur-xl shadow-sm sticky top-0 z-50 border-b border-gray-100">
                    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
                        <div className="flex justify-between items-center h-16 sm:h-20">
                            <div className="flex items-center space-x-2 sm:space-x-3 group cursor-pointer">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl sm:rounded-2xl blur-md sm:blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                                    <div className="relative w-9 h-9 sm:w-12 sm:h-12 bg-gradient-to-br from-[#0b1a34] to-[#1a2f5a] rounded-xl sm:rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                                        <School className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
                                    </div>
                                </div>
                                <div>
                                    <span className="text-base sm:text-2xl font-black bg-gradient-to-r from-[#0b1a34] to-[#1a2f5a] bg-clip-text text-transparent">SchoolMS</span>
                                    <div className="text-[10px] sm:text-xs text-gray-500 font-medium -mt-0.5 sm:-mt-1">Smart Management</div>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <Link
                                    href="/demo-booking"
                                    className="group relative inline-flex items-center px-3 py-2 sm:px-6 sm:py-2.5 lg:px-8 lg:py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-lg sm:rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/50 hover:scale-105 text-xs sm:text-sm lg:text-base"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 relative z-10 group-hover:rotate-12 transition-transform" />
                                    <span className="relative z-10 hidden sm:inline">Book a Demo</span>
                                    <span className="relative z-10 sm:hidden">Demo</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Hero Section with Background Image */}
                <section className="relative min-h-[95vh] flex items-center justify-center overflow-hidden">
                    {/* Animated Background */}
                    <div className="absolute inset-0">
                        {/* Screenshot Background */}
                        <div
                            className="absolute inset-0 bg-cover bg-center scale-110 animate-slow-zoom"
                            style={{backgroundImage: `url(${screenshot2})`}}
                        ></div>

                        {/* Modern Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#0b1a34]/95 via-[#1a2f5a]/90 to-[#0b1a34]/95"></div>

                        {/* Animated Mesh Gradient */}
                        <div className="absolute inset-0 opacity-20">
                            <div className="absolute top-0 -left-4 w-72 h-72 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
                            <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
                            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
                        </div>

                        {/* Grid Pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute inset-0" style={{
                                backgroundImage: `
                                    linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                                    linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
                                `,
                                backgroundSize: '50px 50px'
                            }}></div>
                        </div>
                    </div>

                    {/* Hero Content */}
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-24">
                        <div className="text-center">
                            {/* Animated Badge */}
                            <div className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-orange-500/20 to-pink-500/20 backdrop-blur-xl border border-orange-500/30 rounded-full mb-8 shadow-lg shadow-orange-500/20 animate-fade-in-down">
                                <Sparkles className="w-4 h-4 text-orange-400 mr-2 animate-pulse" />
                                <span className="text-orange-300 font-bold text-sm tracking-wide">Complete School Management Solution</span>
                                <Zap className="w-4 h-4 text-yellow-400 ml-2 animate-pulse" />
                            </div>

                            {/* Main Heading with Gradient */}
                            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight animate-fade-in">
                                <span className="block text-white drop-shadow-2xl">Transform Your</span>
                                <span className="block mt-2 bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient-x">
                                    School Management
                                </span>
                            </h1>

                            {/* Subheading */}
                            <p className="text-xl sm:text-2xl md:text-3xl text-gray-100 mb-4 max-w-4xl mx-auto font-bold tracking-tight animate-fade-in-up animation-delay-200">
                                Streamline Operations • Enhance Learning • Drive Excellence
                            </p>

                            {/* Description */}
                            <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed animate-fade-in-up animation-delay-400">
                                From student enrollment to exam results, attendance tracking to document management—
                                manage your entire school ecosystem with one powerful, intuitive platform.
                            </p>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 animate-fade-in-up animation-delay-600">
                                <Link
                                    href="/demo-booking"
                                    className="group relative inline-flex items-center px-6 py-4 sm:px-10 sm:py-5 bg-gradient-to-r from-orange-500 via-orange-600 to-pink-600 text-white font-black rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-500 text-base sm:text-lg shadow-2xl shadow-orange-500/50 hover:shadow-orange-500/70 hover:scale-105 w-full sm:w-auto justify-center max-w-sm sm:max-w-none"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-orange-600 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                                    <span className="relative z-10">Book a Free Demo</span>
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2 relative z-10 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                    </svg>
                                    
                                    {/* Shine Effect */}
                                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"></div>
                                </Link>
                            </div>

                            {/* Trust Indicators */}
                            <div className="mt-16 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-gray-200 animate-fade-in-up animation-delay-800">
                                <div className="flex items-center gap-3 group cursor-pointer">
                                    <div className="p-2 bg-green-500/20 rounded-lg backdrop-blur-sm group-hover:bg-green-500/30 transition-colors">
                                        <Shield className="w-5 h-5 text-green-400" />
                                    </div>
                                    <span className="text-sm font-semibold">Secure & Reliable</span>
                                </div>
                                <div className="flex items-center gap-3 group cursor-pointer">
                                    <div className="p-2 bg-blue-500/20 rounded-lg backdrop-blur-sm group-hover:bg-blue-500/30 transition-colors">
                                        <Users className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <span className="text-sm font-semibold">Trusted by Schools</span>
                                </div>
                                <div className="flex items-center gap-3 group cursor-pointer">
                                    <div className="p-2 bg-orange-500/20 rounded-lg backdrop-blur-sm group-hover:bg-orange-500/30 transition-colors">
                                        <TrendingUp className="w-5 h-5 text-orange-400" />
                                    </div>
                                    <span className="text-sm font-semibold">Easy to Use</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scroll Indicator */}
                    <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
                        <div className="w-8 h-12 border-2 border-white/40 rounded-full flex items-start justify-center p-2 backdrop-blur-sm">
                            <div className="w-1.5 h-3 bg-white/70 rounded-full animate-scroll"></div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-24 bg-gradient-to-br from-white via-gray-50 to-white relative overflow-hidden">
                    {/* Background Decoration */}
                    <div className="absolute inset-0 opacity-40">
                        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
                        <div className="absolute top-40 right-10 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
                        <div className="absolute bottom-20 left-1/2 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="text-center mb-16">
                            <div className="inline-flex items-center px-4 py-2 bg-orange-100 rounded-full mb-4">
                                <Sparkles className="w-4 h-4 text-orange-600 mr-2" />
                                <span className="text-orange-600 font-bold text-sm">POWERFUL FEATURES</span>
                            </div>
                            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#0b1a34] mb-6">
                                Everything You Need,
                                <span className="block mt-2 bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                                    All in One Place
                                </span>
                            </h2>
                            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto font-medium">
                                Comprehensive tools designed to streamline every aspect of school management
                            </p>
                        </div>

                        {/* Features Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                            {features.map((feature, index) => (
                                <div
                                    key={index}
                                    className="group relative bg-white rounded-2xl p-8 hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden transform hover:-translate-y-2"
                                    style={{
                                        animationDelay: `${index * 100}ms`
                                    }}
                                >
                                    {/* Gradient Background on Hover */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                                    
                                    {/* Icon */}
                                    <div className="relative mb-6">
                                        <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500`}></div>
                                        <div className={`relative w-16 h-16 bg-gradient-to-br ${feature.gradient} bg-opacity-10 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                                            <feature.icon className="w-8 h-8 text-orange-600 group-hover:text-white transition-colors duration-500" />
                                        </div>
                                    </div>
                                    
                                    {/* Content */}
                                    <h3 className="text-xl sm:text-2xl font-black text-[#0b1a34] mb-3 group-hover:text-orange-600 transition-colors duration-300">
                                        {feature.title}
                                    </h3>
                                    <p className="text-gray-600 leading-relaxed font-medium">
                                        {feature.description}
                                    </p>

                                    {/* Corner Accent */}
                                    <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-500`}></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Screenshots Showcase Section */}
                <section className="py-24 bg-gradient-to-br from-gray-900 via-[#0b1a34] to-gray-900 relative overflow-hidden">
                    {/* Animated Background */}
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500 rounded-full mix-blend-screen filter blur-3xl animate-pulse-slow"></div>
                        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl animate-pulse-slow animation-delay-2000"></div>
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="text-center mb-20">
                            <div className="inline-flex items-center px-4 py-2 bg-orange-500/20 backdrop-blur-sm border border-orange-500/30 rounded-full mb-6">
                                <Sparkles className="w-4 h-4 text-orange-400 mr-2" />
                                <span className="text-orange-300 font-bold text-sm">LIVE PREVIEW</span>
                            </div>
                            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6">
                                See SchoolMS
                                <span className="block mt-2 bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
                                    In Action
                                </span>
                            </h2>
                            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto font-medium">
                                Explore our intuitive interface designed to make school management effortless
                            </p>
                        </div>

                        {/* Main Screenshots Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8">
                            {[
                                { img: screenshot2, title: 'Dashboard Overview', desc: 'Real-time insights and analytics' },
                                { img: screenshot3, title: 'Grades & Classes', desc: 'Comprehensive academic tracking' },
                                { img: screenshot6, title: 'Attendance Tracking', desc: 'Easy attendance management' },
                                { img: screenshot8, title: 'Student Reports ', desc: 'Organize classes efficiently' },
                                { img: screenshot4, title: 'Document Management', desc: 'Centralized document storage' },
                            ].map((screenshot, index) => (
                                <div
                                    key={index}
                                    className="group relative overflow-hidden rounded-3xl shadow-2xl hover:shadow-orange-500/20 transition-all duration-500 transform hover:-translate-y-3"
                                >
                                    {/* Image Container */}
                                    <div className="relative aspect-video overflow-hidden bg-gray-800">
                                        <img
                                            src={screenshot.img}
                                            alt={screenshot.title}
                                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                        />
                                        
                                        {/* Gradient Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1a34] via-[#0b1a34]/80 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-500"></div>
                                        
                                        {/* Content Overlay */}
                                        <div className="absolute inset-0 flex flex-col justify-end p-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                            <h3 className="text-xl sm:text-2xl font-black text-white mb-2 transform translate-y-8 group-hover:translate-y-0 transition-transform duration-500">
                                                {screenshot.title}
                                            </h3>
                                            <p className="text-sm text-gray-300 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                                                {screenshot.desc}
                                            </p>
                                        </div>

                                        {/* Border Glow Effect */}
                                        <div className="absolute inset-0 border-2 border-transparent group-hover:border-orange-500/50 rounded-3xl transition-colors duration-500"></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Mobile Screenshots Grid */}
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4">
                            {[
                                { img: screenshot9, label: 'analytics' },
                                { img: screenshot10, label: 'dashboard' },
                                { img: screenshot11, label: 'report card' },
                                { img: screenshot12, label: 'documents' },
                                { img: screenshot13, label: 'students per grade' }
                            ].map((screenshot, index) => (
                                <div
                                    key={index}
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
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Call to Action Section */}
                <section className="relative py-24 overflow-hidden">
                    {/* Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600"></div>
                    
                    {/* Animated Mesh */}
                    <div className="absolute inset-0 opacity-30">
                        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-blob"></div>
                        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-300 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000"></div>
                        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-4000"></div>
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-8">
                            <Sparkles className="w-4 h-4 text-white mr-2 animate-pulse" />
                            <span className="text-white font-bold text-sm">GET STARTED TODAY</span>
                        </div>

                        <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
                            Ready to Transform Your
                            <span className="block mt-2">School Management?</span>
                        </h2>
                        
                        <p className="text-lg sm:text-xl text-white/90 mb-12 max-w-3xl mx-auto font-medium leading-relaxed">
                            Join hundreds of schools already using SchoolMS to streamline their operations
                            and enhance the learning experience.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <Link
                                href="/demo-booking"
                                className="group relative inline-flex items-center px-8 py-4 sm:px-12 sm:py-6 bg-white text-orange-600 font-black rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-500 text-base sm:text-lg shadow-2xl hover:shadow-white/50 hover:scale-110 w-full sm:w-auto justify-center max-w-sm sm:max-w-none"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                                <span className="relative z-10">Book Your Free Demo</span>
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 ml-2 relative z-10 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                </svg>
                                
                                {/* Shine Effect */}
                                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-orange-200/50 to-transparent skew-x-12"></div>
                            </Link>
                        </div>

                        {/* Stats or Trust Badges */}
                        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
                            <div className="text-center">
                                <div className="text-4xl sm:text-5xl font-black text-white mb-2">500+</div>
                                <div className="text-sm text-white/80 font-semibold">Schools Trust Us</div>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl sm:text-5xl font-black text-white mb-2">50K+</div>
                                <div className="text-sm text-white/80 font-semibold">Active Students</div>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl sm:text-5xl font-black text-white mb-2">99.9%</div>
                                <div className="text-sm text-white/80 font-semibold">Uptime</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-gradient-to-br from-[#0b1a34] via-[#1a2f5a] to-[#0b1a34] text-white py-12 relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-5">
                        <div className="absolute inset-0" style={{
                            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                            backgroundSize: '40px 40px'
                        }}></div>
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex items-center space-x-4 group">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                                    <div className="relative w-14 h-14 bg-gradient-to-br from-white to-gray-100 rounded-2xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                        <School className="w-8 h-8 text-orange-600" />
                                    </div>
                                </div>
                                <div>
                                    <span className="text-2xl font-black">SchoolMS</span>
                                    <div className="text-xs text-gray-400 font-medium">Smart School Management</div>
                                </div>
                            </div>
                            
                            <div className="text-gray-400 text-sm font-medium text-center md:text-right">
                                <p>© {new Date().getFullYear()} SchoolMS. All rights reserved.</p>
                                <p className="mt-1 text-xs">Empowering Education Through Technology</p>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>

            {/* Custom Animations */}
            <style jsx>{`
                @keyframes gradient-x {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                
                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    25% { transform: translate(20px, -50px) scale(1.1); }
                    50% { transform: translate(-20px, 20px) scale(0.9); }
                    75% { transform: translate(50px, 30px) scale(1.05); }
                }
                
                @keyframes slow-zoom {
                    0%, 100% { transform: scale(1.1); }
                    50% { transform: scale(1.15); }
                }
                
                @keyframes scroll {
                    0% { transform: translateY(0); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translateY(100%); opacity: 0; }
                }
                
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes fade-in-down {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.2; }
                    50% { opacity: 0.4; }
                }
                
                .animate-gradient-x {
                    background-size: 200% 200%;
                    animation: gradient-x 3s ease infinite;
                }
                
                .animate-blob {
                    animation: blob 7s infinite;
                }
                
                .animate-slow-zoom {
                    animation: slow-zoom 20s ease-in-out infinite;
                }
                
                .animate-scroll {
                    animation: scroll 2s ease-in-out infinite;
                }
                
                .animate-fade-in {
                    animation: fade-in 1s ease-out;
                }
                
                .animate-fade-in-down {
                    animation: fade-in-down 1s ease-out;
                }
                
                .animate-fade-in-up {
                    animation: fade-in-up 1s ease-out;
                }
                
                .animate-pulse-slow {
                    animation: pulse-slow 4s ease-in-out infinite;
                }
                
                .animation-delay-200 {
                    animation-delay: 0.2s;
                }
                
                .animation-delay-400 {
                    animation-delay: 0.4s;
                }
                
                .animation-delay-600 {
                    animation-delay: 0.6s;
                }
                
                .animation-delay-800 {
                    animation-delay: 0.8s;
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