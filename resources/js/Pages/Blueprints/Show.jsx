import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ClockIcon, CheckCircleIcon, XCircleIcon, SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function BlueprintsShow({ auth, blueprint }) {
    const [generationStatus, setGenerationStatus] = useState(null);
    const [loadingGeneration, setLoadingGeneration] = useState(false);
    const [confirmModal, setConfirmModal] = useState({
        show: false,
        title: '',
        message: '',
        onConfirm: () => {},
        type: 'info',
        confirmText: 'Confirm'
    });

    // Fetch generation status
    useEffect(() => {
        fetch(`/blueprints/${blueprint.id}/generation-status`)
            .then(res => res.json())
            .then(data => setGenerationStatus(data))
            .catch(err => console.error('Failed to fetch generation status:', err));
    }, [blueprint.id]);

    const handleGeneratePeriods = () => {
        setConfirmModal({
            show: true,
            title: 'Generate Timetable Periods',
            message: 'Generate timetable periods from this blueprint? This will create period records that can be used in timetables.',
            confirmText: 'Generate',
            type: 'info',
            onConfirm: () => {
                setLoadingGeneration(true);
                router.post(`/blueprints/${blueprint.id}/generate-periods`, {}, {
                    onFinish: () => {
                        setLoadingGeneration(false);
                        // Refresh generation status
                        fetch(`/blueprints/${blueprint.id}/generation-status`)
                            .then(res => res.json())
                            .then(data => setGenerationStatus(data));
                    }
                });
                setConfirmModal(prev => ({ ...prev, show: false }));
            }
        });
    };

    const handleRegeneratePeriods = () => {
        setConfirmModal({
            show: true,
            title: 'Regenerate Timetable Periods',
            message: 'Regenerate timetable periods from this blueprint? This will update existing periods to match the current blueprint configuration.',
            confirmText: 'Regenerate',
            type: 'warning',
            onConfirm: () => {
                setLoadingGeneration(true);
                router.post(`/blueprints/${blueprint.id}/regenerate-periods`, {}, {
                    onFinish: () => {
                        setLoadingGeneration(false);
                        // Refresh generation status
                        fetch(`/blueprints/${blueprint.id}/generation-status`)
                            .then(res => res.json())
                            .then(data => setGenerationStatus(data));
                    }
                });
                setConfirmModal(prev => ({ ...prev, show: false }));
            }
        });
    };
    const formatTime = (time) => {
        if (!time) return '';
        const parts = time.split(':');
        return `${parts[0]}:${parts[1]}`;
    };

    const getPeriodTypeLabel = (type) => {
        const labels = {
            'lesson': 'Lesson',
            'short_break': 'Short Break',
            'lunch': 'Lunch Break',
            'prayer': 'Prayer Break',
            'sports': 'Sports Block',
            'activity': 'Activity',
            'homework': 'Homework',
        };
        return labels[type] || type;
    };

    const getPriorityBandLabel = (band) => {
        const labels = {
            'morning_high': 'Morning (Fresh Mind)',
            'neutral': 'Neutral (Mid-day)',
            'afternoon_low': 'Afternoon (Low Energy)',
        };
        return labels[band] || '-';
    };

    const getPeriodTypeColor = (type) => {
        const colors = {
            'lesson': 'bg-blue-100 text-blue-800',
            'short_break': 'bg-green-100 text-green-800',
            'lunch': 'bg-orange-100 text-orange-800',
            'prayer': 'bg-purple-100 text-purple-800',
            'sports': 'bg-yellow-100 text-yellow-800',
            'activity': 'bg-pink-100 text-pink-800',
            'homework': 'bg-teal-100 text-teal-800',
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={blueprint.name} />

            <div className="py-6 sm:py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6">
                        <Link
                            href="/blueprints"
                            className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block"
                        >
                            ← Back to Blueprints
                        </Link>
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-navy">{blueprint.name}</h1>
                                <p className="mt-1 text-sm text-gray-600">
                                    {blueprint.description || 'No description provided'}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {blueprint.is_active && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                                        Active
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Inactive Blueprint Warning */}
                    {!blueprint.is_active && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                            <div className="flex items-start">
                                <XCircleIcon className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                                <div>
                                    <h3 className="text-sm font-semibold text-yellow-900 mb-1">Blueprint Inactive</h3>
                                    <p className="text-sm text-yellow-800">
                                        This blueprint is currently inactive. You must activate it before you can generate or regenerate periods.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Generation Action Card */}
                    {generationStatus && (
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 mb-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-navy mb-2">
                                        {generationStatus.has_generated ? 'Periods Generated' : 'Generate Timetable Periods'}
                                    </h3>
                                    <p className="text-sm text-gray-700 mb-4">
                                        {generationStatus.has_generated ? (
                                            <>
                                                <span className="font-medium text-green-700">{generationStatus.generated_count} periods</span> have been generated from this blueprint.
                                                You can regenerate them to update with any blueprint changes.
                                            </>
                                        ) : (
                                            <>
                                                Generate <span className="font-medium text-blue-700">{blueprint.periods.length} timetable periods</span> from this blueprint
                                                to use them in your timetable templates.
                                            </>
                                        )}
                                    </p>
                                    {generationStatus.has_generated && (
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                            <span>Periods are ready to use in timetables</span>
                                        </div>
                                    )}
                                    {!blueprint.is_active && (
                                        <div className="flex items-center gap-2 text-xs text-yellow-700 mt-2">
                                            <XCircleIcon className="w-4 h-4 text-yellow-600" />
                                            <span>Activate blueprint to generate periods</span>
                                        </div>
                                    )}
                                </div>
                                <div className="ml-4">
                                    {!generationStatus.has_generated ? (
                                        <button
                                            onClick={handleGeneratePeriods}
                                            disabled={loadingGeneration || blueprint.periods.length === 0 || !blueprint.is_active}
                                            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                            title={
                                                !blueprint.is_active
                                                    ? 'Blueprint must be active to generate periods'
                                                    : blueprint.periods.length === 0
                                                        ? 'Add periods to blueprint first'
                                                        : 'Generate timetable periods'
                                            }
                                        >
                                            {loadingGeneration ? (
                                                <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                                            ) : (
                                                <SparklesIcon className="w-5 h-5 mr-2" />
                                            )}
                                            Generate Periods
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleRegeneratePeriods}
                                            disabled={loadingGeneration || !blueprint.is_active}
                                            className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                            title={
                                                !blueprint.is_active
                                                    ? 'Blueprint must be active to regenerate periods'
                                                    : 'Regenerate timetable periods'
                                            }
                                        >
                                            {loadingGeneration ? (
                                                <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                                            ) : (
                                                <ArrowPathIcon className="w-5 h-5 mr-2" />
                                            )}
                                            Regenerate Periods
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Blueprint Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                        <div className="bg-gradient-to-r from-navy to-navy-light px-6 py-4">
                            <h2 className="text-lg font-semibold text-white">Blueprint Information</h2>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">School Hours</p>
                                <p className="text-lg font-semibold text-navy">
                                    {formatTime(blueprint.start_time)} - {formatTime(blueprint.end_time)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Periods</p>
                                <p className="text-lg font-semibold text-navy">{blueprint.periods.length}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Lesson Periods</p>
                                <p className="text-lg font-semibold text-navy">
                                    {blueprint.periods.filter(p => p.is_teachable).length}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Status</p>
                                <p className="text-lg font-semibold text-navy">
                                    {blueprint.is_active ? 'Active' : 'Inactive'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Periods */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-navy to-navy-light px-6 py-4">
                            <h2 className="text-lg font-semibold text-white">Period Schedule</h2>
                        </div>
                        <div className="p-6 space-y-3">
                            {blueprint.periods.map((period, index) => (
                                <div key={period.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-navy text-white text-sm font-semibold">
                                                {index + 1}
                                            </span>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPeriodTypeColor(period.period_type)}`}>
                                                        {getPeriodTypeLabel(period.period_type)}
                                                    </span>
                                                    <span className="text-sm text-gray-600">
                                                        {period.duration_minutes} minutes
                                                    </span>
                                                </div>
                                                <div className="flex items-center text-sm text-gray-700">
                                                    <ClockIcon className="w-4 h-4 mr-1 text-gray-400" />
                                                    {formatTime(period.start_time)} - {formatTime(period.end_time)}
                                                </div>
                                                {period.is_teachable && period.priority_band && (
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        Priority: {getPriorityBandLabel(period.priority_band)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            <ConfirmationModal
                show={confirmModal.show}
                onClose={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                type={confirmModal.type}
                isLoading={loadingGeneration}
            />
        </AuthenticatedLayout>
    );
}

