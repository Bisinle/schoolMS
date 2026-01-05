import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { AlertTriangle, X, Lock, Trash2 } from 'lucide-react';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import { router } from '@inertiajs/react';
import axios from 'axios';

export default function BulkDeletePeriodsModal({
    show = false,
    onClose,
    levels = {},
}) {
    const [selectedLevel, setSelectedLevel] = useState('');
    const [password, setPassword] = useState('');
    const [preview, setPreview] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState(null);

    // Reset state when modal closes
    useEffect(() => {
        if (!show) {
            setSelectedLevel('');
            setPassword('');
            setPreview(null);
            setError(null);
        }
    }, [show]);

    // Fetch preview when level is selected
    useEffect(() => {
        if (selectedLevel) {
            setLoadingPreview(true);
            setError(null);

            axios.post('/blueprints/bulk-delete-preview', { level: selectedLevel })
                .then(response => {
                    setPreview(response.data);
                    setLoadingPreview(false);
                })
                .catch(err => {
                    console.error('Failed to fetch preview:', err);
                    setError('Failed to load preview');
                    setLoadingPreview(false);
                });
        } else {
            setPreview(null);
        }
    }, [selectedLevel]);

    const handleConfirm = () => {
        if (!selectedLevel || !password) {
            setError('Please select a level and enter your password');
            return;
        }

        setIsDeleting(true);
        setError(null);

        router.post('/blueprints/bulk-delete-by-level', {
            level: selectedLevel,
            password: password,
        }, {
            onSuccess: () => {
                onClose();
            },
            onError: (errors) => {
                setError(errors.password || errors.error || 'Failed to delete periods');
                setIsDeleting(false);
            },
        });
    };

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
                                {/* Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                                            <Trash2 className="h-6 w-6 text-red-600" />
                                        </div>
                                        <Dialog.Title as="h3" className="ml-3 text-lg font-medium leading-6 text-gray-900">
                                            Bulk Delete Periods
                                        </Dialog.Title>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="text-gray-400 hover:text-gray-500"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* Warning Message */}
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex">
                                        <AlertTriangle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
                                        <p className="text-sm text-red-800">
                                            <strong>Warning:</strong> This action cannot be undone! All periods, templates, and slots for the selected level will be permanently deleted.
                                        </p>
                                    </div>
                                </div>

                                {/* Level Selection */}
                                <div className="mb-4">
                                    <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Level
                                    </label>
                                    <select
                                        id="level"
                                        value={selectedLevel}
                                        onChange={(e) => setSelectedLevel(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange focus:ring-orange sm:text-sm"
                                        disabled={isDeleting}
                                    >
                                        <option value="">-- Select a level --</option>
                                        {Object.entries(levels).map(([key, name]) => (
                                            <option key={key} value={key}>{name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Preview */}
                                {loadingPreview && (
                                    <div className="mb-4 p-4 bg-gray-50 rounded-lg text-center">
                                        <p className="text-sm text-gray-600">Loading preview...</p>
                                    </div>
                                )}

                                {preview && !loadingPreview && (
                                    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <p className="text-sm font-medium text-gray-900 mb-2">You are about to delete:</p>
                                        <ul className="text-sm text-gray-700 space-y-1">
                                            <li>• <strong>{preview.periods_count}</strong> periods for {preview.level} level</li>
                                            <li>• <strong>{preview.templates_count}</strong> timetable templates</li>
                                            <li>• <strong>{preview.slots_count}</strong> timetable slots</li>
                                        </ul>

                                        {preview.templates && preview.templates.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-yellow-300">
                                                <p className="text-xs font-medium text-gray-700 mb-1">Affected Templates:</p>
                                                <ul className="text-xs text-gray-600 space-y-0.5">
                                                    {preview.templates.map((template) => (
                                                        <li key={template.id}>
                                                            - {template.name} ({template.grade_name}, {template.term_name})
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Password Input */}
                                {selectedLevel && preview && (
                                    <div className="mb-4">
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                            <Lock className="inline h-4 w-4 mr-1" />
                                            Enter your password to confirm
                                        </label>
                                        <TextInput
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="mt-1 block w-full"
                                            placeholder="Your password"
                                            disabled={isDeleting}
                                            autoComplete="current-password"
                                        />
                                    </div>
                                )}

                                {/* Error Message */}
                                {error && (
                                    <InputError message={error} className="mb-4" />
                                )}

                                {/* Actions */}
                                <div className="mt-6 flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        disabled={isDeleting}
                                        className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange focus:ring-offset-2 disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleConfirm}
                                        disabled={!selectedLevel || !password || isDeleting || loadingPreview}
                                        className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isDeleting ? 'Deleting...' : 'Delete Everything'}
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

