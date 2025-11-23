import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmationModal({
    show = false,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger', // danger, warning, info
    confirmButtonClass = '', // Custom button class to override default
    isLoading = false,
}) {
    const colors = {
        danger: {
            icon: 'text-red-600',
            iconBg: 'bg-red-100',
            button: 'bg-red-600 hover:bg-red-700',
        },
        warning: {
            icon: 'text-orange',
            iconBg: 'bg-orange-100',
            button: 'bg-orange hover:bg-orange-dark',
        },
        info: {
            icon: 'text-blue-600',
            iconBg: 'bg-blue-100',
            button: 'bg-blue-600 hover:bg-blue-700',
        },
    };

    const colorScheme = colors[type] || colors.danger;

    return (
        <Transition appear show={show} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex items-start">
                                    <div className={`flex-shrink-0 ${colorScheme.iconBg} rounded-full p-3`}>
                                        <AlertTriangle className={`w-6 h-6 ${colorScheme.icon}`} />
                                    </div>
                                    <div className="ml-4 flex-1">
                                        <Dialog.Title
                                            as="h3"
                                            className="text-lg font-semibold leading-6 text-navy"
                                        >
                                            {title}
                                        </Dialog.Title>
                                        <div className="mt-2">
                                            <div className="text-sm text-gray-600">
                                                {message}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="flex-shrink-0 text-gray-400 hover:text-gray-500 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                                        onClick={onClose}
                                    >
                                        {cancelText}
                                    </button>
                                    <button
                                        type="button"
                                        className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg transition-all ${
                                            confirmButtonClass || colorScheme.button
                                        }`}
                                        onClick={onConfirm}
                                        disabled={isLoading}
                                    >
                                        {confirmText}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}