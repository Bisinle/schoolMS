import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Edit, Trash2, BookOpen, Calendar, User, Book, FileText, TrendingUp, Star, AlertCircle, Eye } from 'lucide-react';
import { useState } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import PageImagePreview from '../Shared/PageImagePreview';

export default function QuranTrackingShow({ tracking, studentStats, auth }) {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const isGuardian = auth.user.role === 'guardian';

    const handleDelete = () => {
        router.delete(`/quran-tracking/${tracking.id}`, {
            onSuccess: () => {
                router.visit('/quran-tracking');
            },
        });
    };

    const getReadingTypeBadge = (type) => {
        const badges = {
            'new_learning': 'bg-blue-100 text-blue-800',
            'revision': 'bg-green-100 text-green-800',
            'subac': 'bg-purple-100 text-purple-800',
        };
        return badges[type] || 'bg-gray-100 text-gray-800';
    };

    const getDifficultyBadge = (difficulty) => {
        const badges = {
            'very_well': 'bg-green-100 text-green-800',
            'middle': 'bg-yellow-100 text-yellow-800',
            'difficult': 'bg-red-100 text-red-800',
        };
        return badges[difficulty] || 'bg-gray-100 text-gray-800';
    };

    const renderStars = (rating) => {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`w-5 h-5 ${
                            star <= rating
                                ? 'fill-orange text-orange'
                                : 'fill-gray-200 text-gray-200'
                        }`}
                    />
                ))}
                <span className="ml-2 text-sm font-medium text-gray-700">{rating}/5</span>
            </div>
        );
    };

    const getPerformanceLevel = (avgRating) => {
        if (avgRating >= 4.5) return { label: 'Excellent', color: 'bg-green-100 text-green-800' };
        if (avgRating >= 3.5) return { label: 'Very Good', color: 'bg-blue-100 text-blue-800' };
        if (avgRating >= 2.5) return { label: 'Good', color: 'bg-yellow-100 text-yellow-800' };
        if (avgRating >= 1.5) return { label: 'Fair', color: 'bg-orange-100 text-orange-800' };
        return { label: 'Needs Improvement', color: 'bg-red-100 text-red-800' };
    };

    return (
        <AuthenticatedLayout header="Quran Tracking Details">
            <Head title="Quran Tracking Details" />

            <div className="py-6 sm:py-8">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 sm:mb-8">
                        <Link
                            href={isGuardian ? "/guardian/quran-tracking" : "/quran-tracking"}
                            className="inline-flex items-center text-sm text-gray-600 hover:text-orange transition-colors mb-4"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Quran Tracking
                        </Link>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <BookOpen className="w-8 h-8 text-orange" />
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Tracking Details</h2>
                                    <p className="text-sm text-gray-600">
                                        {tracking.student.first_name} {tracking.student.last_name} - {new Date(tracking.date).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {(auth.user.role === 'admin' || auth.user.id === tracking.teacher_id) && (
                                <div className="flex gap-2">
                                    <Link
                                        href={`/quran-tracking/${tracking.id}/edit`}
                                        className="inline-flex items-center px-4 py-2 bg-orange text-white text-sm font-medium rounded-lg hover:bg-orange-dark transition-colors"
                                    >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => setShowDeleteModal(true)}
                                        className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Details */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Reading Information */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                    <Book className="w-5 h-5 mr-2 text-orange" />
                                    Reading Information
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">Date</label>
                                        <div className="flex items-center text-gray-900">
                                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                            {new Date(tracking.date).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">Reading Type</label>
                                        <span className={`inline-flex px-3 py-1 text-xs leading-5 font-bold rounded-full ${getReadingTypeBadge(tracking.reading_type)}`}>
                                            {tracking.reading_type_label}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">Surah Range</label>
                                        <div className="text-gray-900 font-medium">
                                            {tracking.surah_name}
                                        </div>
                                        {tracking.surah_name_arabic && (
                                            <div className="text-sm text-gray-500">{tracking.surah_name_arabic}</div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">Verses</label>
                                        <div className="text-gray-900 font-medium">
                                            {tracking.verse_from} - {tracking.verse_to}
                                        </div>
                                        <div className="text-sm text-gray-500">{tracking.calculated_total_verses || tracking.total_verses} verses</div>
                                    </div>
                                    {tracking.page_from && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 mb-1">Pages</label>
                                            <div className="text-gray-900 font-medium">
                                                {tracking.page_from} - {tracking.page_to || tracking.page_from}
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">Difficulty</label>
                                        <span className={`inline-flex px-3 py-1 text-xs leading-5 font-bold rounded-full ${getDifficultyBadge(tracking.difficulty)}`}>
                                            {tracking.difficulty_label}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Teacher & Notes */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                    <User className="w-5 h-5 mr-2 text-orange" />
                                    Teacher & Notes
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">Teacher</label>
                                        <div className="text-gray-900 font-medium">{tracking.teacher.name}</div>
                                    </div>
                                    {tracking.notes && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 mb-1">General Notes</label>
                                            <div className="text-gray-900 bg-gray-50 rounded-lg p-4">
                                                {tracking.notes}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Assessment Details */}
                            {tracking.assessment && (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                        <Star className="w-5 h-5 mr-2 text-orange" />
                                        Detailed Assessment
                                    </h3>
                                    <div className="space-y-6">
                                        {/* Performance Level Badge */}
                                        {tracking.assessment.average_rating && (
                                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-600 mb-1">Overall Performance</div>
                                                    <div className="text-2xl font-bold text-gray-900">
                                                        {tracking.assessment.average_rating}/5
                                                    </div>
                                                </div>
                                                <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-full ${getPerformanceLevel(tracking.assessment.average_rating).color}`}>
                                                    {tracking.assessment.performance_level}
                                                </span>
                                            </div>
                                        )}

                                        {/* Ratings Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {tracking.assessment.fluency_rating && (
                                                <div className="p-4 bg-gray-50 rounded-lg">
                                                    <label className="block text-sm font-medium text-gray-600 mb-2">
                                                        Fluency Rating
                                                    </label>
                                                    {renderStars(tracking.assessment.fluency_rating)}
                                                </div>
                                            )}
                                            {tracking.assessment.tajweed_rating && (
                                                <div className="p-4 bg-gray-50 rounded-lg">
                                                    <label className="block text-sm font-medium text-gray-600 mb-2">
                                                        Tajweed Rating
                                                    </label>
                                                    {renderStars(tracking.assessment.tajweed_rating)}
                                                </div>
                                            )}
                                        </div>

                                        {/* Mistakes Count */}
                                        {tracking.assessment.mistakes_count !== null && tracking.assessment.mistakes_count !== undefined && (
                                            <div className="p-4 bg-gray-50 rounded-lg">
                                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                                    Number of Mistakes
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <AlertCircle className={`w-5 h-5 ${
                                                        tracking.assessment.mistakes_count === 0
                                                            ? 'text-green-600'
                                                            : tracking.assessment.mistakes_count <= 3
                                                            ? 'text-yellow-600'
                                                            : 'text-red-600'
                                                    }`} />
                                                    <span className="text-2xl font-bold text-gray-900">
                                                        {tracking.assessment.mistakes_count}
                                                    </span>
                                                    <span className="text-sm text-gray-600">
                                                        {tracking.assessment.mistakes_count === 0
                                                            ? 'Perfect!'
                                                            : tracking.assessment.mistakes_count === 1
                                                            ? 'mistake'
                                                            : 'mistakes'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Assessment Notes */}
                                        {tracking.assessment.assessment_notes && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                                    Assessment Notes
                                                </label>
                                                <div className="text-gray-900 bg-blue-50 border border-blue-100 rounded-lg p-4">
                                                    {tracking.assessment.assessment_notes}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Quran Page Images Section */}
                            {tracking.page_from && tracking.page_to && (
                                <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
                                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-orange" />
                                        Quran Pages
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Starting Page */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                                Page {tracking.page_from}
                                            </h4>
                                            <PageImagePreview
                                                pageNumber={tracking.page_from}
                                                quality="medium"
                                                className="w-full"
                                            />
                                        </div>

                                        {/* Ending Page (if different) */}
                                        {tracking.page_from !== tracking.page_to && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                                    Page {tracking.page_to}
                                                </h4>
                                                <PageImagePreview
                                                    pageNumber={tracking.page_to}
                                                    quality="medium"
                                                    className="w-full"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Page Range Summary */}
                                    {Math.abs(tracking.page_to - tracking.page_from) > 0 && (
                                        <div className="mt-4 p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-700 font-medium">Total Pages Covered:</span>
                                                <span className="font-bold text-orange text-lg">
                                                    {Math.abs(tracking.page_to - tracking.page_from) + 1} {Math.abs(tracking.page_to - tracking.page_from) + 1 === 1 ? 'page' : 'pages'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Student Progress Stats */}
                        <div className="lg:col-span-1">
                            <div className="bg-gradient-to-br from-orange to-orange-dark rounded-2xl shadow-lg p-6 text-white sticky top-6">
                                <h3 className="text-lg font-bold mb-4 flex items-center">
                                    <TrendingUp className="w-5 h-5 mr-2" />
                                    Student Progress
                                </h3>
                                <div className="space-y-4">
                                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                                        <div className="text-sm opacity-90 mb-1">Total Sessions</div>
                                        <div className="text-3xl font-bold">{studentStats.total_sessions || 0}</div>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                                        <div className="text-sm opacity-90 mb-1">Total Verses</div>
                                        <div className="text-3xl font-bold">{studentStats.total_verses || 0}</div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                                            <div className="text-xs opacity-90 mb-1">New</div>
                                            <div className="text-xl font-bold">{studentStats.new_learning_count || 0}</div>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                                            <div className="text-xs opacity-90 mb-1">Revision</div>
                                            <div className="text-xl font-bold">{studentStats.revision_count || 0}</div>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                                            <div className="text-xs opacity-90 mb-1">Subac</div>
                                            <div className="text-xl font-bold">{studentStats.subac_count || 0}</div>
                                        </div>
                                    </div>
                                    <Link
                                        href={`/quran-tracking/student/${tracking.student_id}/report`}
                                        className="block w-full text-center bg-white text-orange font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        View All Sessions
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Tracking Record"
                message="Are you sure you want to delete this tracking record? This action cannot be undone."
            />
        </AuthenticatedLayout>
    );
}

