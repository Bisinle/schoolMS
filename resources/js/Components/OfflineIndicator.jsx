import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export default function OfflineIndicator() {
    const [isOnline, setIsOnline] = useState(
        typeof navigator !== 'undefined' ? navigator.onLine : true
    );
    const [showReconnected, setShowReconnected] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowReconnected(true);
            setTimeout(() => setShowReconnected(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowReconnected(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline && !showReconnected) return null;

    return (
        <div
            className={`fixed top-0 left-0 right-0 px-4 py-3 text-center z-50 transition-all duration-300 ${
                isOnline
                    ? 'bg-green-500 text-white'
                    : 'bg-yellow-500 text-white'
            }`}
        >
            {isOnline ? (
                <div className="flex items-center justify-center gap-2">
                    <Wifi className="w-5 h-5" />
                    <span className="font-medium">Back online!</span>
                </div>
            ) : (
                <div className="flex items-center justify-center gap-2">
                    <WifiOff className="w-5 h-5" />
                    <span className="font-medium">
                        You're offline. Some features may be limited.
                    </span>
                </div>
            )}
        </div>
    );
}

