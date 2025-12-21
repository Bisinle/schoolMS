import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { School, Calendar, Clock, Mail, User, Building, MessageSquare, ArrowLeft, Sparkles, CheckCircle, Smartphone, Phone } from 'lucide-react';
import InputError from '@/Components/InputError';

// Import mobile screenshots
import screenshot8 from '../Images/app-screenshot8.png';
import screenshot9 from '../Images/app-screenshot9.png';
import screenshot10 from '../Images/app-screenshot10.png';
import screenshot11 from '../Images/app-screenshot11.png';
import screenshot12 from '../Images/app-screenshot12.png';
import screenshot13 from '../Images/app-screenshot13.png';

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
            
            <div className="min-h-screen relative overflow-hidden">
                {/* Animated Background */}
                <div className="fixed inset-0 z-0">
                    {/* Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#ffffff] via-[#f1f2f4] to-[#f2f2f4]"></div>

                    {/* Animated Mesh Gradient */}
                    <div className="absolute inset-0 opacity-30">
                        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500 rounded-full mix-blend-screen filter blur-3xl animate-blob"></div>
                        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-2000"></div>
                        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-4000"></div>
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

                {/* Header/Navigation */}
                <nav className="bg-white/90 backdrop-blur-xl shadow-lg sticky top-0 z-50 border-b border-gray-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-20">
                            <Link href="/" className="flex items-center space-x-3 group">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                                    <div className="relative w-12 h-12 bg-gradient-to-br from-[#0b1a34] to-[#1a2f5a] rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                                        <School className="w-6 h-6 text-orange-500" />
                                    </div>
                                </div>
                                <div>
                                    <span className="text-2xl font-black bg-gradient-to-r from-[#0b1a34] to-[#1a2f5a] bg-clip-text text-transparent">SchoolMS</span>
                                    <div className="text-xs text-gray-500 font-medium -mt-1">Smart Management</div>
                                </div>
                            </Link>
                            <div className="flex items-center space-x-3 sm:space-x-4">
                                <Link
                                    href="/"
                                    className="group inline-flex items-center px-4 py-2 text-sm font-bold text-gray-700 hover:text-orange-600 transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                                    <span className="hidden sm:inline">Back to Home</span>
                                    <span className="sm:hidden">Back</span>
                                </Link>
                                <Link
                                    href="/login"
                                    className="inline-flex items-center px-4 sm:px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-orange-500/50 transition-all hover:scale-105"
                                >
                                    Login
                                </Link>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                        {/* Left Column - Form */}
                        <div className="order-1 lg:order-1">
                            {/* Header */}
                            <div className="mb-8 sm:mb-10">
                                <div className="inline-flex items-center px-4 py-2 bg-orange-500/20 backdrop-blur-sm border border-orange-500/30 rounded-full mb-6 animate-fade-in-down">
                                    <Sparkles className="w-4 h-4 text-orange-600 mr-2 animate-pulse" />
                                    <span className="text-orange-600 font-bold text-sm">FREE PERSONALIZED DEMO</span>
                                </div>
                                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0b1a34] mb-4 leading-tight animate-fade-in">
                                    Book Your Free
                                    <span className="block mt-2 bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                                        Demo Today
                                    </span>
                                </h1>
                                <p className="text-lg sm:text-xl text-gray-700 leading-relaxed animate-fade-in-up animation-delay-200">
                                    Schedule a personalized demo and discover how SchoolMS can transform your school management.
                                </p>
                            </div>

                            {/* Form Card */}
                            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8 lg:p-10 animate-fade-in-up animation-delay-400">
                                <form onSubmit={submit} className="space-y-6">
                                    {/* Name Field */}
                                    <div className="group">
                                        <label htmlFor="name" className="block text-sm font-bold text-gray-800 mb-2">
                                            Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <User className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                                            </div>
                                            <input
                                                id="name"
                                                type="text"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                className="block w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all font-medium hover:border-gray-300"
                                                placeholder="John Doe"
                                                required
                                            />
                                        </div>
                                        <InputError message={errors.name} className="mt-2" />
                                    </div>

                                    {/* Email Field */}
                                    <div className="group">
                                        <label htmlFor="email" className="block text-sm font-bold text-gray-800 mb-2">
                                            Email Address <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                                            </div>
                                            <input
                                                id="email"
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                className="block w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all font-medium hover:border-gray-300"
                                                placeholder="john@example.com"
                                                required
                                            />
                                        </div>
                                        <InputError message={errors.email} className="mt-2" />
                                    </div>

                                    {/* Phone Field */}
                                    <div className="group">
                                        <label htmlFor="phone" className="block text-sm font-bold text-gray-800 mb-2">
                                            Phone Number <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Phone className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                                            </div>
                                            <input
                                                id="phone"
                                                type="tel"
                                                value={data.phone}
                                                onChange={(e) => setData('phone', e.target.value)}
                                                className="block w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all font-medium hover:border-gray-300"
                                                placeholder="+254 700 000 000"
                                                required
                                            />
                                        </div>
                                        <InputError message={errors.phone} className="mt-2" />
                                    </div>

                                    {/* School Name Field */}
                                    <div className="group">
                                        <label htmlFor="school_name" className="block text-sm font-bold text-gray-800 mb-2">
                                            School Name <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Building className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                                            </div>
                                            <input
                                                id="school_name"
                                                type="text"
                                                value={data.school_name}
                                                onChange={(e) => setData('school_name', e.target.value)}
                                                className="block w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all font-medium hover:border-gray-300"
                                                placeholder="ABC International School"
                                            />
                                        </div>
                                        <InputError message={errors.school_name} className="mt-2" />
                                    </div>

                                    {/* Date and Time Fields */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {/* Date Field */}
                                        <div className="group">
                                            <label htmlFor="date" className="block text-sm font-bold text-gray-800 mb-2">
                                                Preferred Date <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <Calendar className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                                                </div>
                                                <input
                                                    id="date"
                                                    type="date"
                                                    value={data.date}
                                                    onChange={(e) => setData('date', e.target.value)}
                                                    min={getMinDate()}
                                                    className="block w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all font-medium hover:border-gray-300"
                                                    required
                                                />
                                            </div>
                                            <p className="mt-1 text-xs text-gray-500">Minimum 2 days advance booking required</p>
                                            <InputError message={errors.date} className="mt-2" />
                                        </div>

                                        {/* Time Field */}
                                        <div className="group">
                                            <label htmlFor="time" className="block text-sm font-bold text-gray-800 mb-2">
                                                Preferred Time <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <Clock className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                                                </div>
                                                <select
                                                    id="time"
                                                    value={data.time}
                                                    onChange={(e) => setData('time', e.target.value)}
                                                    className="block w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all appearance-none font-medium hover:border-gray-300 cursor-pointer"
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
                                        <label htmlFor="message" className="block text-sm font-bold text-gray-800 mb-2">
                                            Additional Message <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute top-4 left-4 pointer-events-none">
                                                <MessageSquare className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                                            </div>
                                            <textarea
                                                id="message"
                                                value={data.message}
                                                onChange={(e) => setData('message', e.target.value)}
                                                rows="4"
                                                className="block w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none font-medium hover:border-gray-300"
                                                placeholder="Tell us about your school and what you'd like to see in the demo..."
                                            />
                                        </div>
                                        <InputError message={errors.message} className="mt-2" />
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="group relative w-full flex items-center justify-center px-8 py-4 bg-gradient-to-r from-orange-500 via-orange-600 to-pink-600 text-white font-black rounded-xl overflow-hidden transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-orange-500/50 hover:shadow-orange-500/70 hover:scale-105 text-lg"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-orange-600 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                        <Calendar className="w-6 h-6 mr-3 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                                        <span className="relative z-10">{processing ? 'Submitting...' : 'Schedule My Demo'}</span>
                                        
                                        {/* Shine Effect */}
                                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"></div>
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Right Column - Info & Screenshots */}
                        <div className="order-2 lg:order-2 space-y-8">
                            {/* What to Expect Box */}
                            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8 animate-fade-in-up animation-delay-600">
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
                            </div>

                            {/* Screenshots Box */}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="bg-gradient-to-br from-[#0b1a34] via-[#1a2f5a] to-[#0b1a34] text-white py-12 mt-16 relative z-10 border-t border-white/10">
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
                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    25% { transform: translate(20px, -50px) scale(1.1); }
                    50% { transform: translate(-20px, 20px) scale(0.9); }
                    75% { transform: translate(50px, 30px) scale(1.05); }
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
                
                .animate-blob {
                    animation: blob 7s infinite;
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