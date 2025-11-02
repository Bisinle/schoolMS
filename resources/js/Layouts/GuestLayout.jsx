import { Link } from '@inertiajs/react';
import { School } from 'lucide-react';

export default function GuestLayout({ children }) {
    return (
        <div className="min-h-screen flex">
            {/* Left Side - Branding (Hidden on mobile, shown on desktop) */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0b1a34] via-[#1e3a5f] to-[#0b1a34] relative overflow-hidden">
                {/* Animated Background Blobs */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-orange rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '700ms' }}></div>
                </div>
                
                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center items-center w-full px-12 text-white">
                    <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl mb-8">
                        <School className="w-20 h-20 text-orange" />
                    </div>
                    <h1 className="text-5xl font-bold mb-4 text-center">
                        School Management System
                    </h1>
                    <p className="text-xl text-gray-300 text-center max-w-md mb-12">
                        Streamline your school operations with our comprehensive management platform
                    </p>
                    
                    {/* Features Grid */}
                    <div className="grid grid-cols-3 gap-8 text-center">
                        <div>
                            <div className="text-4xl font-bold text-orange mb-2">500+</div>
                            <div className="text-sm text-gray-300">Students</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-orange mb-2">50+</div>
                            <div className="text-sm text-gray-300">Teachers</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-orange mb-2">15+</div>
                            <div className="text-sm text-gray-300">Grades</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form Content */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8 py-12">
                {children}
            </div>
        </div>
    );
}