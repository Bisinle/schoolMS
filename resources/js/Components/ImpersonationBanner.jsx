import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import ConfirmationModal from './ConfirmationModal';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function ImpersonationBanner({ user, originalAdmin, isVisible, onToggle }) {
    const [showExitModal, setShowExitModal] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    const handleLeave = () => {
        setIsLeaving(true);
        
        router.get(
            route('impersonate.leave'),
            {},
            {
                preserveState: false,
                preserveScroll: false,
                onSuccess: () => {
                    setShowExitModal(false);
                    setIsLeaving(false);
                },
                onError: () => {
                    setIsLeaving(false);
                    setShowExitModal(false);
                }
            }
        );
    };

    return (
        <>
            {/* 🆕 Mobile Toggle Button - Above everything */}
            <button
                onClick={onToggle}
                className={`md:hidden fixed z-[60] left-1/2 transform -translate-x-1/2 transition-all duration-300 ${
                    isVisible ? 'top-[3.5rem]' : 'top-0'
                } bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded-b-lg shadow-lg flex items-center space-x-2 text-xs font-semibold`}
                aria-label={isVisible ? "Hide impersonation banner" : "Show impersonation banner"}
            >
                <span className="animate-pulse text-[8px]">●</span>
                <span>{isVisible ? 'Hide' : 'Show'}</span>
                {isVisible ? (
                    <ChevronUp className="w-3 h-3" />
                ) : (
                    <ChevronDown className="w-3 h-3" />
                )}
            </button>

            {/* Banner - Slides up/down on mobile, always visible on desktop */}
            <div className={`fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg transition-transform duration-300 ${
                isVisible ? 'translate-y-0' : 'md:translate-y-0 -translate-y-full'
            }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14">
                        {/* Left side - Info */}
                        <div className="flex items-center space-x-2 md:space-x-4">
                            <div className="flex items-center space-x-1 md:space-x-2">
                                <svg 
                                    className="w-4 h-4 md:w-5 md:h-5 text-white animate-pulse" 
                                    fill="currentColor" 
                                    viewBox="0 0 20 20"
                                >
                                    <path 
                                        fillRule="evenodd" 
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
                                        clipRule="evenodd" 
                                    />
                                </svg>
                                <span className="text-white font-semibold text-xs md:text-sm">
                                    IMPERSONATION
                                </span>
                            </div>
                            
                            <div className="hidden sm:block h-6 w-px bg-orange-300"></div>
                            
                            <div className="hidden sm:flex items-center space-x-2 text-white text-sm">
                                <span className="opacity-90">Viewing as:</span>
                                <span className="font-bold">{user.name}</span>
                                <span className="opacity-75">•</span>
                                <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-medium">
                                    {user.role}
                                </span>
                            </div>
                        </div>

                        {/* Right side - Exit button */}
                        <button
                            onClick={() => setShowExitModal(true)}
                            className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-white text-orange-600 rounded-md hover:bg-orange-50 transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg"
                        >
                            <svg 
                                className="w-4 h-4" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M6 18L18 6M6 6l12 12" 
                                />
                            </svg>
                            <span>Exit & Return to Admin</span>
                        </button>

                        {/* Mobile - Compact exit button */}
                        <button
                            onClick={() => setShowExitModal(true)}
                            className="sm:hidden px-2 py-1 bg-white text-orange-600 rounded font-semibold text-xs hover:bg-orange-50"
                        >
                            Exit
                        </button>
                    </div>

                    {/* Mobile - Expanded user info row */}
                    <div className="sm:hidden px-4 pb-2 border-t border-orange-400">
                        <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center space-x-2 text-white text-xs">
                                <span className="opacity-90">As:</span>
                                <span className="font-bold truncate max-w-[120px]">{user.name}</span>
                            </div>
                            <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-medium text-white">
                                {user.role}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Exit Confirmation Modal */}
            <ConfirmationModal
                show={showExitModal}
                onClose={() => setShowExitModal(false)}
                onConfirm={handleLeave}
                title="Exit Impersonation Mode"
                message={
                    <div className="space-y-3">
                        <div>You are currently viewing the system as:</div>
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <p className="font-semibold text-orange-900">{user.name}</p>
                            <p className="text-sm text-orange-700 mt-1">
                                Role: <span className="font-medium">{user.role}</span>
                            </p>
                        </div>
                        <p className="text-gray-700">
                            Do you want to return to your admin account?
                        </p>
                    </div>
                }
                confirmText={isLeaving ? "Exiting..." : "Yes, Exit Impersonation"}
                confirmButtonClass="bg-orange-600 hover:bg-orange-700"
                cancelText="Stay as User"
                isLoading={isLeaving}
            />
        </>
    );
}
