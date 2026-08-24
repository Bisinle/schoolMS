// resources/js/Components/ErrorBoundary.jsx
//
// Last line of defense for an uncaught React render exception. Uses a
// hard window.location.reload() / window.location.href on its actions
// (not a soft Inertia router call) because a caught render error means
// the in-memory React tree/state is already corrupted — a soft retry
// would re-render the same broken state.

import { Component } from 'react';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        // eslint-disable-next-line no-console
        console.error('ErrorBoundary caught a render error:', error, info);
    }

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0b1a34] to-[#1a2f5a] flex items-center justify-center px-4">
                <div className="max-w-2xl w-full text-center">
                    <div className="flex justify-center mb-8">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl">
                            <AlertTriangle className="w-14 h-14 text-[#0b1a34]" />
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-3xl font-semibold text-white mb-4">
                            Something Went Wrong
                        </h2>
                        <p className="text-xl text-gray-300 mb-2">
                            The application ran into a problem. Reloading usually fixes this.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
                        <button
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center px-6 py-3 bg-white text-[#0b1a34] font-semibold rounded-lg hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            <RefreshCw className="w-5 h-5 mr-2" />
                            Reload
                        </button>

                        <a
                            href="/dashboard"
                            className="inline-flex items-center px-6 py-3 bg-orange text-white font-semibold rounded-lg hover:bg-orange-dark transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            <Home className="w-5 h-5 mr-2" />
                            Go to Dashboard
                        </a>
                    </div>
                </div>
            </div>
        );
    }
}
