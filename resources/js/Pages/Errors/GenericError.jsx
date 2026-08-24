import { Link, router, Head } from '@inertiajs/react';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';

export default function GenericError({ status, title, message, showRetry = true, showDashboard = true }) {
    return (
        <>
            <Head title={`${status} - ${title}`} />

            <div className="min-h-screen bg-gradient-to-br from-[#0b1a34] to-[#1a2f5a] flex items-center justify-center px-4">
                <div className="max-w-2xl w-full text-center">
                    <div className="flex justify-center mb-8">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl">
                            <AlertTriangle className="w-14 h-14 text-[#0b1a34]" />
                        </div>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-9xl font-bold text-white mb-4 tracking-tight">
                            {status}
                        </h1>
                        <div className="h-1 w-32 bg-orange mx-auto mb-6 rounded-full"></div>
                        <h2 className="text-3xl font-semibold text-white mb-4">
                            {title}
                        </h2>
                        <p className="text-xl text-gray-300 mb-2">
                            {message}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
                        {showRetry && (
                            <button
                                onClick={() => router.reload()}
                                className="inline-flex items-center px-6 py-3 bg-white text-[#0b1a34] font-semibold rounded-lg hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                <RefreshCw className="w-5 h-5 mr-2" />
                                Try Again
                            </button>
                        )}

                        {showDashboard && (
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center px-6 py-3 bg-orange text-white font-semibold rounded-lg hover:bg-orange-dark transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                <Home className="w-5 h-5 mr-2" />
                                Go to Dashboard
                            </Link>
                        )}
                    </div>

                    <div className="mt-16">
                        <p className="text-sm text-gray-400">
                            © {new Date().getFullYear()} School Management System. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
