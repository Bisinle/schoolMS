import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Calendar, Clock, BookOpen, User, Edit, Trash2, FileText } from 'lucide-react';

export default function Show({ auth, practice }) {
    const isGuardian = auth.user.role === 'guardian';
    const canEdit = isGuardian && practice.guardian_id === auth.user.guardian?.id;

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this practice log?')) {
            router.delete(`/quran-home-practice/${practice.id}`);
        }
    };

    const getTypeBadge = (type) => {
        const badges = {
            memorize: 'bg-purple-100 text-purple-800',
            revise: 'bg-blue-100 text-blue-800',
            read: 'bg-green-100 text-green-800',
        };
        return badges[type] || 'bg-gray-100 text-gray-800';
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Practice Details" />

            <div className="py-6 sm:py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
                                Practice Details
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Home practice session information
                            </p>
                        </div>

                        {canEdit && (
                            <div className="flex gap-2">
                                <Link
                                    href={`/quran-home-practice/${practice.id}/edit`}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <Edit className="w-4 h-4" />
                                    Edit
                                </Link>
                                <button
                                    onClick={handleDelete}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Student Info Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Student Information</h2>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-orange to-orange-dark rounded-full flex items-center justify-center">
                                <User className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">
                                    {practice.student.first_name} {practice.student.last_name}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {practice.student.grade?.name || 'N/A'}
                                </p>
                                {practice.guardian && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Guardian: {practice.guardian.user.name}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Practice Details Card */}
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl shadow-sm border border-orange-200/50 p-6 mb-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Practice Details</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Practice Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    Practice Type
                                </label>
                                <span className={`
                                    inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold
                                    ${getTypeBadge(practice.practice_type)}
                                `}>
                                    {practice.practice_type_label}
                                </span>
                            </div>

                            {/* Duration */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    Duration
                                </label>
                                <div className="flex items-center gap-2 text-gray-900">
                                    <Clock className="w-5 h-5 text-orange" />
                                    <span className="font-semibold">{practice.formatted_duration}</span>
                                    <span className="text-sm text-gray-500">
                                        ({practice.duration_minutes} minutes)
                                    </span>
                                </div>
                            </div>

                            {/* Practice Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    Practice Date
                                </label>
                                <div className="flex items-center gap-2 text-gray-900">
                                    <Calendar className="w-5 h-5 text-orange" />
                                    <span className="font-semibold">
                                        {new Date(practice.practice_date).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {practice.days_ago} days ago
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Surah/Verse Range Card (if provided) */}
                    {practice.has_surah_range && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Surah & Verse Range</h2>
                            <div className="flex items-center gap-2 text-gray-900">
                                <BookOpen className="w-5 h-5 text-orange" />
                                <span className="font-semibold">
                                    Surah {practice.surah_from}:{practice.verse_from} - 
                                    Surah {practice.surah_to}:{practice.verse_to}
                                </span>
                            </div>
                            {practice.has_page_range && (
                                <p className="text-sm text-gray-600 mt-2">
                                    Pages: {practice.page_from} - {practice.page_to}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Notes Card (if provided) */}
                    {practice.notes && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-orange" />
                                Notes
                            </h2>
                            <p className="text-gray-700 whitespace-pre-wrap">{practice.notes}</p>
                        </div>
                    )}

                    {/* Back Button */}
                    <div className="mt-6">
                        <Link
                            href="/quran-home-practice"
                            className="inline-flex items-center text-orange hover:text-orange-dark font-medium"
                        >
                            ← Back to Practice Logs
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

