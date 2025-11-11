import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import ConfirmationModal from './ConfirmationModal';

export default function ImpersonateButton({ user, className = '' }) {
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleImpersonate = () => {
        setIsLoading(true);
        
        router.get(
            route('impersonate', user.id), // 🆕 Changed route name
            {},
            {
                preserveState: false,
                preserveScroll: false,
                onSuccess: () => {
                    setShowModal(false);
                    setIsLoading(false);
                },
                onError: (errors) => {
                    console.error('Impersonation error:', errors);
                    setIsLoading(false);
                    setShowModal(false);
                }
            }
        );
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className={`flex items-center w-full px-4 py-2 text-left text-sm text-purple-600 hover:bg-purple-50 transition-colors ${className}`}
                title="Login as this user"
            >
                <svg 
                    className="w-4 h-4 mr-2" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" 
                    />
                </svg>
                Login As User
            </button>

            <ConfirmationModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onConfirm={handleImpersonate}
                title="Confirm User Impersonation"
                message={
                    <div className="space-y-3">
                        <p>You are about to login as:</p>
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <p className="font-semibold text-purple-900">{user.name}</p>
                            <p className="text-sm text-purple-700 mt-1">
                                Role: <span className="font-medium">{user.role}</span>
                            </p>
                            <p className="text-sm text-purple-600 mt-1">{user.email}</p>
                        </div>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-sm text-yellow-800">
                                ⚠️ You will see the system exactly as this user sees it. 
                                An orange banner will appear at the top allowing you to exit back to admin mode.
                            </p>
                        </div>
                    </div>
                }
                confirmText={isLoading ? "Logging in..." : "Yes, Login As User"}
                confirmButtonClass="bg-purple-600 hover:bg-purple-700"
                isLoading={isLoading}
            />
        </>
    );
}