import { Head, Link } from '@inertiajs/react';
import { School, CheckCircle, Calendar, Mail, ArrowRight } from 'lucide-react';

export default function DemoSuccess() {
    return (
        <>
            <Head title="Demo Booking Confirmed" />
            
            <div className="min-h-screen bg-gray-50">
                {/* Header/Navigation */}
                <nav className="bg-white shadow-sm sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                                <div className="w-10 h-10 bg-[#0b1a34] rounded-full flex items-center justify-center">
                                    <School className="w-6 h-6 text-orange" />
                                </div>
                                <span className="text-xl font-bold text-[#0b1a34]">SchoolMS</span>
                            </Link>
                            <Link
                                href="/login"
                                className="inline-flex items-center px-6 py-2 bg-orange text-white font-semibold rounded-lg hover:bg-orange-dark transition-all shadow-md hover:shadow-lg"
                            >
                                Login
                            </Link>
                        </div>
                    </div>
                </nav>

                {/* Main Content */}
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-12 text-center">
                        {/* Success Icon */}
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </div>

                        {/* Success Message */}
                        <h1 className="text-3xl md:text-4xl font-bold text-[#0b1a34] mb-4">
                            Demo Booking Confirmed!
                        </h1>
                        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                            Thank you for your interest in SchoolMS. We've received your demo request and will contact you shortly to confirm the details.
                        </p>

                        {/* Info Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                            <div className="bg-blue-50 rounded-lg p-6 text-left">
                                <div className="flex items-center mb-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                        <Mail className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <h3 className="font-semibold text-[#0b1a34]">Check Your Email</h3>
                                </div>
                                <p className="text-sm text-gray-600">
                                    We've sent a confirmation email with all the details. Please check your inbox (and spam folder).
                                </p>
                            </div>

                            <div className="bg-orange-50 rounded-lg p-6 text-left">
                                <div className="flex items-center mb-3">
                                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                                        <Calendar className="w-5 h-5 text-orange" />
                                    </div>
                                    <h3 className="font-semibold text-[#0b1a34]">What's Next?</h3>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Our team will reach out within 24 hours to confirm your preferred date and time.
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/"
                                className="inline-flex items-center px-8 py-3 bg-orange text-white font-semibold rounded-lg hover:bg-orange-dark transition-all shadow-lg hover:shadow-xl"
                            >
                                Back to Home
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Link>
                            <Link
                                href="/login"
                                className="inline-flex items-center px-8 py-3 bg-white text-[#0b1a34] font-semibold rounded-lg border-2 border-gray-300 hover:border-orange hover:text-orange transition-all"
                            >
                                Login to Platform
                            </Link>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-8 text-center">
                        <p className="text-gray-600">
                            Have questions? Contact us at{' '}
                            <a href="mailto:bisinleabdi@gmail.com" className="text-orange hover:text-orange-dark font-semibold">
                                bisinleabdi@gmail.com
                            </a>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <footer className="bg-[#0b1a34] text-white py-8 mt-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col md:flex-row justify-between items-center">
                            <div className="flex items-center space-x-3 mb-4 md:mb-0">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                                    <School className="w-6 h-6 text-orange" />
                                </div>
                                <span className="text-xl font-bold">SchoolMS</span>
                            </div>
                            <div className="text-gray-400 text-sm">
                                © {new Date().getFullYear()} SchoolMS. All rights reserved.
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}

