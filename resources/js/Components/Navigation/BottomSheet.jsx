import { Fragment, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { X } from 'lucide-react';
import { Transition } from '@headlessui/react';

/**
 * Bottom Sheet / Drawer Component
 * Slides up from bottom with backdrop
 * 
 * @param {Object} props
 * @param {boolean} props.show - Whether to show the sheet
 * @param {Function} props.onClose - Callback when sheet is closed
 * @param {string} props.title - Sheet title
 * @param {ReactNode} props.children - Sheet content
 * @param {number} props.maxHeight - Max height percentage (default: 85)
 */
export default function BottomSheet({ 
    show = false, 
    onClose, 
    title = 'More', 
    children,
    maxHeight = 85 
}) {
    // Prevent body scroll when sheet is open
    useEffect(() => {
        if (show) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [show]);

    return (
        <Transition show={show} as={Fragment}>
            <div className="fixed inset-0 z-50 md:hidden">
                {/* Backdrop */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div 
                        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
                        onClick={onClose}
                    />
                </Transition.Child>

                {/* Sheet */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="translate-y-full"
                    enterTo="translate-y-0"
                    leave="ease-in duration-200"
                    leaveFrom="translate-y-0"
                    leaveTo="translate-y-full"
                >
                    <div 
                        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl"
                        style={{ maxHeight: `${maxHeight}vh` }}
                    >
                        {/* Handle bar */}
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100 active:scale-95"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto px-6 py-4" style={{ maxHeight: `${maxHeight - 20}vh` }}>
                            {children}
                        </div>
                    </div>
                </Transition.Child>
            </div>
        </Transition>
    );
}

/**
 * Bottom Sheet Menu Item Component
 * Pre-styled menu item for use inside BottomSheet
 */
export function BottomSheetMenuItem({ icon: Icon, label, href, onClick, badge, className = '' }) {
    const content = (
        <div className={`flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors ${className}`}>
            <div className="flex-shrink-0">
                <Icon className="w-6 h-6 text-gray-600" />
            </div>
            <span className="flex-1 text-base font-medium text-gray-900">{label}</span>
            {badge && badge > 0 && (
                <span className="flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold text-white bg-red-500 rounded-full">
                    {badge > 99 ? '99+' : badge}
                </span>
            )}
        </div>
    );

    if (href) {
        return (
            <Link href={href} className="block">
                {content}
            </Link>
        );
    }

    return (
        <button onClick={onClick} className="w-full text-left">
            {content}
        </button>
    );
}

/**
 * Bottom Sheet Section Component
 * Groups menu items with a header
 */
export function BottomSheetSection({ title, children }) {
    return (
        <div className="mb-6">
            {title && (
                <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {title}
                </h3>
            )}
            <div className="space-y-1">
                {children}
            </div>
        </div>
    );
}

