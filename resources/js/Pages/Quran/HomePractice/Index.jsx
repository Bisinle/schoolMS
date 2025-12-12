import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Calendar, Clock, BookOpen, User, Trash2 } from 'lucide-react';

export default function Index({ auth, practices, students, filters }) {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedPractice, setSelectedPractice] = useState(null);

    const handleDelete = (practice) => {
        setSelectedPractice(practice);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (selectedPractice) {
            router.delete(`/quran-home-practice/${selectedPractice.id}`, {
                onSuccess: () => {
                    setShowDeleteModal(false);
                    setSelectedPractice(null);
                }
            });
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

    const isGuardian = auth.user.role === 'guardian';

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Home Practice" />

            <div className="py-6 sm:py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
                                {isGuardian ? 'My Children\'s Practice' : 'Home Practice Logs'}
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">
                                {isGuardian 
                                    ? 'Track your children\'s Quran practice at home'
                                    : 'View student home practice logs'
                                }
                            </p>
                        </div>

                        {isGuardian && (
                            <Link
                                href="/quran-home-practice/create"
                                className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-orange text-white text-sm sm:text-base font-semibold rounded-lg hover:bg-orange-dark transition-colors shadow-lg"
                            >
                                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                                Log Practice
                            </Link>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Student Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Student
                                </label>
                                <select
                                    value={filters.student_id || ''}
                                    onChange={(e) => router.get('/quran-home-practice', { 
                                        ...filters, 
                                        student_id: e.target.value 
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-orange"
                                >
                                    <option value="">All Students</option>
                                    {students.map(student => (
                                        <option key={student.id} value={student.id}>
                                            {student.first_name} {student.last_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Practice Type Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Type
                                </label>
                                <select
                                    value={filters.practice_type || ''}
                                    onChange={(e) => router.get('/quran-home-practice', { 
                                        ...filters, 
                                        practice_type: e.target.value 
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-orange"
                                >
                                    <option value="">All Types</option>
                                    <option value="memorize">Memorization</option>
                                    <option value="revise">Revision</option>
                                    <option value="read">Reading</option>
                                </select>
                            </div>

                            {/* Date From */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    From Date
                                </label>
                                <input
                                    type="date"
                                    value={filters.date_from || ''}
                                    onChange={(e) => router.get('/quran-home-practice', { 
                                        ...filters, 
                                        date_from: e.target.value 
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-orange"
                                />
                            </div>

                            {/* Date To */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    To Date
                                </label>
                                <input
                                    type="date"
                                    value={filters.date_to || ''}
                                    onChange={(e) => router.get('/quran-home-practice', { 
                                        ...filters, 
                                        date_to: e.target.value 
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-orange"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Practice List */}
                    <div className="space-y-4">
                        {practices.data.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                                <p className="text-gray-500">No practice logs found.</p>
                            </div>
                        ) : (
                            practices.data.map((practice) => (
                                <div
                                    key={practice.id}
                                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        {/* Student Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-orange to-orange-dark rounded-full flex items-center justify-center">
                                                    <User className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900">
                                                        {practice.student.first_name} {practice.student.last_name}
                                                    </h3>
                                                    <p className="text-xs text-gray-500">
                                                        {practice.student.grade?.name || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Practice Details */}
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <span className={`
                                                        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                                                        ${getTypeBadge(practice.practice_type)}
                                                    `}>
                                                        {practice.practice_type_label}
                                                    </span>
                                                    <span className="text-gray-600">•</span>
                                                    <Clock className="w-4 h-4 text-gray-500" />
                                                    <span className="text-gray-700 font-medium">
                                                        {practice.formatted_duration}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{new Date(practice.practice_date).toLocaleDateString()}</span>
                                                    <span className="text-gray-400">
                                                        ({practice.days_ago} days ago)
                                                    </span>
                                                </div>

                                                {practice.has_surah_range && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                                        <BookOpen className="w-4 h-4" />
                                                        <span>
                                                            Surah {practice.surah_from}:{practice.verse_from} -
                                                            Surah {practice.surah_to}:{practice.verse_to}
                                                        </span>
                                                    </div>
                                                )}

                                                {practice.notes && (
                                                    <p className="text-sm text-gray-600 italic mt-2">
                                                        "{practice.notes}"
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        {isGuardian && (
                                            <div className="flex flex-col gap-2">
                                                <Link
                                                    href={`/quran-home-practice/${practice.id}/edit`}
                                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(practice)}
                                                    className="text-sm text-red-600 hover:text-red-800 font-medium"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    {practices.links && practices.links.length > 3 && (
                        <div className="mt-6 flex justify-center gap-2">
                            {practices.links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url || '#'}
                                    className={`
                                        px-4 py-2 rounded-lg text-sm font-medium transition-colors
                                        ${link.active
                                            ? 'bg-orange text-white'
                                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                        }
                                        ${!link.url && 'opacity-50 cursor-not-allowed'}
                                    `}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                            Delete Practice Log?
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete this practice log? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}


