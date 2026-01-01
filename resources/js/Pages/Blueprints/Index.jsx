import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PlusIcon, PencilIcon, TrashIcon, CheckCircleIcon, XCircleIcon, ClockIcon, ArrowPathIcon, SparklesIcon } from '@heroicons/react/24/outline';

export default function BlueprintsIndex({ auth, blueprints, levels, filters }) {
    const [generationStatus, setGenerationStatus] = useState({});
    const [loadingGeneration, setLoadingGeneration] = useState({});

    // Fetch generation status for all blueprints
    useEffect(() => {
        blueprints.forEach(blueprint => {
            fetch(`/blueprints/${blueprint.id}/generation-status`)
                .then(res => res.json())
                .then(data => {
                    setGenerationStatus(prev => ({
                        ...prev,
                        [blueprint.id]: data
                    }));
                })
                .catch(err => console.error('Failed to fetch generation status:', err));
        });
    }, [blueprints]);

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this blueprint? This action cannot be undone.')) {
            router.delete(`/blueprints/${id}`);
        }
    };

    const handleToggleActive = (id) => {
        router.post(`/blueprints/${id}/toggle-active`);
    };

    const handleGeneratePeriods = (id) => {
        if (confirm('Generate timetable periods from this blueprint? This will create period records that can be used in timetables.')) {
            setLoadingGeneration(prev => ({ ...prev, [id]: true }));
            router.post(`/blueprints/${id}/generate-periods`, {}, {
                onFinish: () => {
                    setLoadingGeneration(prev => ({ ...prev, [id]: false }));
                    // Refresh generation status
                    fetch(`/blueprints/${id}/generation-status`)
                        .then(res => res.json())
                        .then(data => {
                            setGenerationStatus(prev => ({
                                ...prev,
                                [id]: data
                            }));
                        });
                }
            });
        }
    };

    const handleRegeneratePeriods = (id) => {
        if (confirm('Regenerate timetable periods from this blueprint? This will update existing periods to match the current blueprint configuration.')) {
            setLoadingGeneration(prev => ({ ...prev, [id]: true }));
            router.post(`/blueprints/${id}/regenerate-periods`, {}, {
                onFinish: () => {
                    setLoadingGeneration(prev => ({ ...prev, [id]: false }));
                    // Refresh generation status
                    fetch(`/blueprints/${id}/generation-status`)
                        .then(res => res.json())
                        .then(data => {
                            setGenerationStatus(prev => ({
                                ...prev,
                                [id]: data
                            }));
                        });
                }
            });
        }
    };

    const groupedBlueprints = Object.keys(levels).reduce((acc, levelKey) => {
        acc[levelKey] = blueprints.filter(b => b.level === levelKey);
        return acc;
    }, {});

    const formatTime = (time) => {
        if (!time) return '';
        // Handle both HH:mm:ss and HH:mm formats
        const parts = time.split(':');
        return `${parts[0]}:${parts[1]}`;
    };

    const getLessonCount = (periods) => {
        return periods.filter(p => p.is_teachable).length;
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Day Blueprints" />

            <div className="py-6 sm:py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 sm:mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-navy">Day Blueprints</h1>
                                <p className="mt-1 text-sm text-gray-600">
                                    Define the daily structure for each school level
                                </p>
                            </div>
                            <Link
                                href="/blueprints/create"
                                className="inline-flex items-center justify-center px-4 py-2 bg-orange hover:bg-orange-dark text-white font-medium rounded-lg transition-colors duration-200 shadow-sm"
                            >
                                <PlusIcon className="w-5 h-5 mr-2" />
                                Create Blueprint
                            </Link>
                        </div>
                    </div>

                    {/* Info Banner */}
                    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <ClockIcon className="h-5 w-5 text-blue-400" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-blue-800">About Day Blueprints</h3>
                                <div className="mt-2 text-sm text-blue-700">
                                    <p>Blueprints define the daily schedule structure for each level (ECD, Lower Primary, etc.). Each blueprint includes lesson periods, breaks, and other activities. Only one blueprint can be active per level at a time.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Blueprints by Level */}
                    <div className="space-y-6">
                        {Object.entries(levels).map(([levelKey, levelName]) => {
                            const levelBlueprints = groupedBlueprints[levelKey] || [];
                            const activeBlueprint = levelBlueprints.find(b => b.is_active);

                            return (
                                <div key={levelKey} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="bg-gradient-to-r from-navy to-navy-light px-6 py-4">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-lg font-semibold text-white">{levelName}</h2>
                                            {activeBlueprint && (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <CheckCircleIcon className="w-4 h-4 mr-1" />
                                                    Active Blueprint
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        {levelBlueprints.length === 0 ? (
                                            <div className="text-center py-8">
                                                <p className="text-gray-500 mb-4">No blueprint defined for this level</p>
                                                <Link
                                                    href="/blueprints/create"
                                                    className="inline-flex items-center px-4 py-2 bg-orange hover:bg-orange-dark text-white font-medium rounded-lg transition-colors"
                                                >
                                                    <PlusIcon className="w-4 h-4 mr-2" />
                                                    Create Blueprint
                                                </Link>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {levelBlueprints.map((blueprint) => (
                                                    <div
                                                        key={blueprint.id}
                                                        className={`border rounded-lg p-4 ${
                                                            blueprint.is_active
                                                                ? 'border-green-300 bg-green-50'
                                                                : 'border-gray-200 bg-gray-50'
                                                        }`}
                                                    >
                                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <h3 className="text-lg font-semibold text-navy">
                                                                        {blueprint.name}
                                                                    </h3>
                                                                    {blueprint.is_active && (
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                                            Active
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {blueprint.description && (
                                                                    <p className="text-sm text-gray-600 mb-3">{blueprint.description}</p>
                                                                )}
                                                                <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                                                                    <div className="flex items-center">
                                                                        <ClockIcon className="w-4 h-4 mr-1 text-gray-400" />
                                                                        <span>{formatTime(blueprint.start_time)} - {formatTime(blueprint.end_time)}</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-medium">{getLessonCount(blueprint.periods)}</span> lesson periods
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-medium">{blueprint.periods.length}</span> total periods
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-col sm:flex-row gap-2">
                                                                {/* Generation Status & Button */}
                                                                {generationStatus[blueprint.id] && (
                                                                    <>
                                                                        {!generationStatus[blueprint.id].has_generated ? (
                                                                            <button
                                                                                onClick={() => handleGeneratePeriods(blueprint.id)}
                                                                                disabled={loadingGeneration[blueprint.id] || blueprint.periods.length === 0}
                                                                                className="inline-flex items-center justify-center px-3 py-2 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                                                title={blueprint.periods.length === 0 ? 'Add periods to blueprint first' : 'Generate timetable periods'}
                                                                            >
                                                                                {loadingGeneration[blueprint.id] ? (
                                                                                    <ArrowPathIcon className="w-4 h-4 mr-1 animate-spin" />
                                                                                ) : (
                                                                                    <SparklesIcon className="w-4 h-4 mr-1" />
                                                                                )}
                                                                                Generate Periods
                                                                            </button>
                                                                        ) : (
                                                                            <button
                                                                                onClick={() => handleRegeneratePeriods(blueprint.id)}
                                                                                disabled={loadingGeneration[blueprint.id]}
                                                                                className="inline-flex items-center justify-center px-3 py-2 border border-purple-300 rounded-lg text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                                                title={`${generationStatus[blueprint.id].generated_count} periods generated`}
                                                                            >
                                                                                {loadingGeneration[blueprint.id] ? (
                                                                                    <ArrowPathIcon className="w-4 h-4 mr-1 animate-spin" />
                                                                                ) : (
                                                                                    <ArrowPathIcon className="w-4 h-4 mr-1" />
                                                                                )}
                                                                                Regenerate ({generationStatus[blueprint.id].generated_count})
                                                                            </button>
                                                                        )}
                                                                    </>
                                                                )}

                                                                <Link
                                                                    href={`/blueprints/${blueprint.id}/edit`}
                                                                    className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                                                                >
                                                                    <PencilIcon className="w-4 h-4 mr-1" />
                                                                    Edit
                                                                </Link>
                                                                {!blueprint.is_active && (
                                                                    <button
                                                                        onClick={() => handleToggleActive(blueprint.id)}
                                                                        className="inline-flex items-center justify-center px-3 py-2 border border-green-300 rounded-lg text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                                                                    >
                                                                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                                                                        Activate
                                                                    </button>
                                                                )}
                                                                {blueprint.is_active && (
                                                                    <button
                                                                        onClick={() => handleToggleActive(blueprint.id)}
                                                                        className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                                                                    >
                                                                        <XCircleIcon className="w-4 h-4 mr-1" />
                                                                        Deactivate
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleDelete(blueprint.id)}
                                                                    className="inline-flex items-center justify-center px-3 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                                                                >
                                                                    <TrashIcon className="w-4 h-4 mr-1" />
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Empty State */}
                    {blueprints.length === 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                            <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No blueprints</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Get started by creating a day blueprint for your first level.
                            </p>
                            <div className="mt-6">
                                <Link
                                    href="/blueprints/create"
                                    className="inline-flex items-center px-4 py-2 bg-orange hover:bg-orange-dark text-white font-medium rounded-lg transition-colors"
                                >
                                    <PlusIcon className="w-5 h-5 mr-2" />
                                    Create Blueprint
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}


