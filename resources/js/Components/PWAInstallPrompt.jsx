import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        }
        
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('pwa-dismissed', Date.now());
    };

    // Don't show if dismissed recently (within 7 days)
    useEffect(() => {
        const dismissed = localStorage.getItem('pwa-dismissed');
        if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) {
            setShowPrompt(false);
        }
    }, []);

    if (!showPrompt || !deferredPrompt) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-slide-up">
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-12 h-12 bg-orange rounded-lg flex items-center justify-center">
                        <Download className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-navy mb-1">
                            Install SchoolMS
                        </h3>
                        <p className="text-xs text-gray-600 mb-3">
                            Install our app for quick access and offline functionality
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={handleInstall}
                                className="flex-1 px-3 py-2 bg-orange text-white text-xs font-semibold rounded-lg hover:bg-orange-dark transition-colors"
                            >
                                Install
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="px-3 py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Not Now
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}