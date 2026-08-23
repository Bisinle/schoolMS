import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft, Edit, Trash2, BookOpen, Calendar, User, Book, FileText,
    Star, AlertCircle, CheckCircle, Clock, XCircle, AlertTriangle,
} from 'lucide-react';
import { useState } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import QuranPageText from '../Shared/QuranPageText';
import QuranPageTextViewer from '../Shared/QuranPageTextViewer';
import StarRating from '@/Components/UI/StarRating';

const QUALITY_RATING_OPTIONS = [
    { value: 'excellent', label: 'Excellent' },
    { value: 'very_good', label: 'Very Good' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'poor', label: 'Poor' },
];

export default function QuranHomeworkShow({ homework, auth }) {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [fullscreenPage, setFullscreenPage] = useState(null);
    const [markAction, setMarkAction] = useState(null); // 'absent' | 'not_prepared' | null
    const [markNotes, setMarkNotes] = useState('');
    const [markProcessing, setMarkProcessing] = useState(false);

    const isGuardian = auth.user.role === 'guardian';
    const canEdit = auth.user.role === 'admin' || auth.user.id === homework.teacher_id;
    const isPending = homework.status === 'pending';

    const handleDelete = () => {
        router.delete(`/quran-homework/${homework.id}`, {
            onSuccess: () => {
                router.visit('/quran-homework');
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

    const getStatusBadge = (status) => {
        const badges = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'graded': 'bg-green-100 text-green-800',
            'absent': 'bg-red-100 text-red-800',
            'not_prepared': 'bg-pink-100 text-pink-800',
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusIcon = (status) => {
        if (status === 'graded') return CheckCircle;
        if (status === 'absent') return XCircle;
        if (status === 'not_prepared') return AlertTriangle;
        return Clock;
    };

    const StatusIcon = getStatusIcon(homework.status);

    const gradeForm = useForm({
        quality_rating: '',
        subac_participation: false,
        fluency_rating: '',
        tajweed_rating: '',
        mistakes_count: '',
        assessment_notes: '',
    });

    const submitGrade = (e) => {
        e.preventDefault();
        gradeForm.post(`/quran-homework/${homework.id}/grade`);
    };

    const confirmMark = () => {
        setMarkProcessing(true);
        router.post(`/quran-homework/${homework.id}/mark-ungraded`, {
            status: markAction,
            notes: markNotes || null,
        }, {
            onFinish: () => {
                setMarkProcessing(false);
                setMarkAction(null);
                setMarkNotes('');
            },
        });
    };

    return (
        <AuthenticatedLayout header="Homework Details">
            <Head title="Homework Details" />

            <div className="py-6 sm:py-8">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 sm:mb-8">
                        <Link
                            href={isGuardian ? "/guardian/quran-homework" : "/quran-homework"}
                            className="inline-flex items-center text-sm text-gray-600 hover:text-orange transition-colors mb-4"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Homework
                        </Link>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <BookOpen className="w-8 h-8 text-orange" />
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Homework Details</h2>
                                    <p className="text-sm text-gray-600">
                                        {homework.student.first_name} {homework.student.last_name} - {new Date(homework.assigned_date).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {canEdit && (
                                <div className="flex gap-2">
                                    <Link
                                        href={`/quran-homework/${homework.id}/edit`}
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

                    {/* Status Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${getStatusBadge(homework.status)}`}>
                                <StatusIcon className="w-4 h-4" />
                                {homework.status_label}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getReadingTypeBadge(homework.reading_type)}`}>
                                {homework.reading_type_label}
                            </span>
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
                                        <label className="block text-sm font-medium text-gray-500 mb-1">Assigned Date</label>
                                        <div className="flex items-center text-gray-900">
                                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                            {new Date(homework.assigned_date).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">Reading Type</label>
                                        <span className={`inline-flex px-3 py-1 text-xs leading-5 font-bold rounded-full ${getReadingTypeBadge(homework.reading_type)}`}>
                                            {homework.reading_type_label}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">Surah Range</label>
                                        <div className="text-gray-900 font-medium">
                                            {homework.surah_name}
                                        </div>
                                        {homework.surah_name_arabic && (
                                            <div className="text-sm text-gray-500">{homework.surah_name_arabic}</div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">Verses</label>
                                        <div className="text-gray-900 font-medium">
                                            {homework.verse_from} - {homework.verse_to}
                                        </div>
                                        <div className="text-sm text-gray-500">{homework.calculated_total_verses || homework.total_verses} verses</div>
                                    </div>
                                    {homework.page_from && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 mb-1">Pages</label>
                                            <div className="text-gray-900 font-medium">
                                                {homework.page_from} - {homework.page_to || homework.page_from}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Quran Pages (Arabic text) */}
                            {homework.page_from_verses && homework.page_from_verses.length > 0 && (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center">
                                        <Book className="w-5 h-5 mr-2 text-orange" />
                                        Quran Pages
                                    </h3>

                                    <QuranPageText
                                        pageNumber={homework.page_from}
                                        verses={homework.page_from_verses}
                                        highlightVerseKey={homework.starting_verse_reference}
                                        title={`Starting Page (Page ${homework.page_from})`}
                                        onExpand={() => setFullscreenPage(homework.page_from)}
                                    />

                                    {homework.page_to_verses && homework.page_to_verses.length > 0 && (
                                        <QuranPageText
                                            pageNumber={homework.page_to}
                                            verses={homework.page_to_verses}
                                            title={`Ending Page (Page ${homework.page_to})`}
                                            onExpand={() => setFullscreenPage(homework.page_to)}
                                        />
                                    )}

                                    {Math.abs(homework.page_to - homework.page_from) > 0 && (
                                        <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-700 font-medium">Total Pages Covered:</span>
                                                <span className="font-bold text-orange text-lg">
                                                    {Math.abs(homework.page_to - homework.page_from) + 1} {Math.abs(homework.page_to - homework.page_from) + 1 === 1 ? 'page' : 'pages'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Teacher & Notes */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                    <User className="w-5 h-5 mr-2 text-orange" />
                                    Teacher & Notes
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">Teacher</label>
                                        <div className="text-gray-900 font-medium">{homework.teacher.name}</div>
                                    </div>
                                    {homework.notes && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 mb-1">Notes</label>
                                            <div className="text-gray-900 bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">
                                                {homework.notes}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Grade Panel (pending) or Outcome Summary (graded/absent/not_prepared) */}
                            {isPending && canEdit ? (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                        <Star className="w-5 h-5 mr-2 text-orange" />
                                        Grade This Assignment
                                    </h3>

                                    <form onSubmit={submitGrade} className="space-y-6">
                                        {/* Quality Rating */}
                                        <div>
                                            <label htmlFor="quality_rating" className="block text-sm font-medium text-gray-700 mb-2">
                                                Overall Quality <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                id="quality_rating"
                                                value={gradeForm.data.quality_rating}
                                                onChange={(e) => gradeForm.setData('quality_rating', e.target.value)}
                                                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all ${
                                                    gradeForm.errors.quality_rating ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            >
                                                <option value="">Select rating</option>
                                                {QUALITY_RATING_OPTIONS.map((option) => (
                                                    <option key={option.value} value={option.value}>{option.label}</option>
                                                ))}
                                            </select>
                                            {gradeForm.errors.quality_rating && (
                                                <p className="mt-1 text-sm text-red-600">{gradeForm.errors.quality_rating}</p>
                                            )}
                                        </div>

                                        {/* Subac Participation */}
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="subac_participation"
                                                checked={gradeForm.data.subac_participation}
                                                onChange={(e) => gradeForm.setData('subac_participation', e.target.checked)}
                                                className="w-4 h-4 text-orange border-gray-300 rounded focus:ring-orange"
                                            />
                                            <label htmlFor="subac_participation" className="text-sm font-medium text-gray-700">
                                                Participated in Subac (group session)
                                            </label>
                                        </div>

                                        {/* Fluency & Tajweed Ratings */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-gray-100">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                                                    Fluency Rating (Optional)
                                                </label>
                                                <StarRating
                                                    value={gradeForm.data.fluency_rating || 0}
                                                    onChange={(rating) => gradeForm.setData('fluency_rating', rating)}
                                                    size="lg"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                                                    Tajweed Rating (Optional)
                                                </label>
                                                <StarRating
                                                    value={gradeForm.data.tajweed_rating || 0}
                                                    onChange={(rating) => gradeForm.setData('tajweed_rating', rating)}
                                                    size="lg"
                                                />
                                            </div>
                                        </div>

                                        {/* Mistakes Count */}
                                        <div>
                                            <label htmlFor="mistakes_count" className="block text-sm font-medium text-gray-700 mb-2">
                                                Number of Mistakes (Optional)
                                            </label>
                                            <input
                                                type="number"
                                                id="mistakes_count"
                                                value={gradeForm.data.mistakes_count}
                                                onChange={(e) => gradeForm.setData('mistakes_count', e.target.value)}
                                                min="0"
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                                placeholder="0"
                                            />
                                        </div>

                                        {/* Assessment Notes */}
                                        <div>
                                            <label htmlFor="assessment_notes" className="block text-sm font-medium text-gray-700 mb-2">
                                                Assessment Notes (Optional)
                                            </label>
                                            <textarea
                                                id="assessment_notes"
                                                value={gradeForm.data.assessment_notes}
                                                onChange={(e) => gradeForm.setData('assessment_notes', e.target.value)}
                                                rows="3"
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                                placeholder="Specific feedback on fluency, tajweed, or areas for improvement..."
                                            />
                                        </div>

                                        <div className="flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={gradeForm.processing}
                                                className="inline-flex items-center px-6 py-2.5 bg-orange text-white rounded-lg hover:bg-orange-dark transition-colors disabled:opacity-50"
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Save Grade
                                            </button>
                                        </div>
                                    </form>

                                    {/* Mark Absent / Not Prepared — secondary, visually distinct outcomes */}
                                    <div className="mt-6 pt-6 border-t border-gray-200">
                                        <p className="text-sm text-gray-600 mb-3">
                                            Or, if the student did not do the work:
                                        </p>
                                        <div className="flex flex-wrap gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setMarkAction('absent')}
                                                className="inline-flex items-center px-4 py-2 border-2 border-red-300 text-red-700 bg-red-50 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors"
                                            >
                                                <XCircle className="w-4 h-4 mr-2" />
                                                Mark Absent
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setMarkAction('not_prepared')}
                                                className="inline-flex items-center px-4 py-2 border-2 border-pink-300 text-pink-700 bg-pink-50 text-sm font-medium rounded-lg hover:bg-pink-100 transition-colors"
                                            >
                                                <AlertTriangle className="w-4 h-4 mr-2" />
                                                Mark Not Prepared
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                        <Star className="w-5 h-5 mr-2 text-orange" />
                                        Outcome
                                    </h3>

                                    {homework.status === 'graded' ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg">
                                                <div className="text-sm font-medium text-gray-600">Overall Quality</div>
                                                <span className="inline-flex px-4 py-2 text-sm font-bold rounded-full bg-green-100 text-green-800">
                                                    {homework.quality_rating_label}
                                                </span>
                                            </div>

                                            {homework.subac_participation && (
                                                <p className="text-sm text-gray-700">✓ Participated in Subac (group session)</p>
                                            )}

                                            {homework.assessment && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {homework.assessment.fluency_rating && (
                                                        <div className="p-4 bg-gray-50 rounded-lg">
                                                            <label className="block text-sm font-medium text-gray-600 mb-2">Fluency Rating</label>
                                                            <StarRating value={homework.assessment.fluency_rating} readOnly size="md" />
                                                        </div>
                                                    )}
                                                    {homework.assessment.tajweed_rating && (
                                                        <div className="p-4 bg-gray-50 rounded-lg">
                                                            <label className="block text-sm font-medium text-gray-600 mb-2">Tajweed Rating</label>
                                                            <StarRating value={homework.assessment.tajweed_rating} readOnly size="md" />
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {homework.assessment && homework.assessment.mistakes_count !== null && homework.assessment.mistakes_count !== undefined && (
                                                <div className="p-4 bg-gray-50 rounded-lg">
                                                    <label className="block text-sm font-medium text-gray-600 mb-2">Number of Mistakes</label>
                                                    <div className="flex items-center gap-2">
                                                        <AlertCircle className={`w-5 h-5 ${
                                                            homework.assessment.mistakes_count === 0 ? 'text-green-600' :
                                                            homework.assessment.mistakes_count <= 3 ? 'text-yellow-600' : 'text-red-600'
                                                        }`} />
                                                        <span className="text-2xl font-bold text-gray-900">{homework.assessment.mistakes_count}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {homework.assessment && homework.assessment.assessment_notes && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 mb-2">Assessment Notes</label>
                                                    <div className="text-gray-900 bg-blue-50 border border-blue-100 rounded-lg p-4 whitespace-pre-wrap">
                                                        {homework.assessment.assessment_notes}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : homework.status === 'absent' ? (
                                        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                                            <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                                            <div>
                                                <p className="font-semibold text-red-900">Marked Absent</p>
                                                {homework.notes && (
                                                    <p className="text-sm text-red-800 mt-1 whitespace-pre-wrap">{homework.notes}</p>
                                                )}
                                            </div>
                                        </div>
                                    ) : homework.status === 'not_prepared' ? (
                                        <div className="flex items-start gap-3 p-4 bg-pink-50 border border-pink-200 rounded-lg">
                                            <AlertTriangle className="w-6 h-6 text-pink-600 flex-shrink-0" />
                                            <div>
                                                <p className="font-semibold text-pink-900">Marked Not Prepared</p>
                                                {homework.notes && (
                                                    <p className="text-sm text-pink-800 mt-1 whitespace-pre-wrap">{homework.notes}</p>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500">Not yet graded.</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Student Info */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Student</h3>
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-10 h-10 bg-orange/10 rounded-lg flex items-center justify-center">
                                        <User className="w-5 h-5 text-orange" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {homework.student.first_name} {homework.student.last_name}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            {homework.student.admission_number} • {homework.student.grade?.name}
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    href={`/quran-homework/student/${homework.student_id}/report`}
                                    className="block mt-4 text-center text-sm text-orange hover:text-orange-dark font-medium"
                                >
                                    View Full Report →
                                </Link>
                            </div>

                            {/* Schedule Summary */}
                            {homework.schedule && (
                                <div className="bg-gradient-to-br from-orange to-orange-dark rounded-2xl shadow-lg p-6 text-white sticky top-6">
                                    <h3 className="text-sm font-bold uppercase tracking-wide opacity-90 mb-3 flex items-center">
                                        <FileText className="w-4 h-4 mr-2" />
                                        Schedule
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <p>
                                            Surah {homework.schedule.surah_from}:{homework.schedule.verse_from} →
                                            {' '}Surah {homework.schedule.surah_to}:{homework.schedule.verse_to}
                                        </p>
                                        <p className="opacity-90">
                                            {new Date(homework.schedule.start_date).toLocaleDateString()}
                                            {homework.schedule.end_date ? ` – ${new Date(homework.schedule.end_date).toLocaleDateString()}` : ' – Open-ended'}
                                        </p>
                                    </div>
                                    <Link
                                        href={`/quran-schedule/${homework.schedule.id}`}
                                        className="block w-full text-center bg-white text-orange font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors mt-4"
                                    >
                                        View Schedule
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Homework"
                message="Are you sure you want to delete this homework assignment? This action cannot be undone."
            />

            {/* Mark Absent / Not Prepared Confirmation Modal */}
            <ConfirmationModal
                show={markAction !== null}
                onClose={() => { setMarkAction(null); setMarkNotes(''); }}
                onConfirm={confirmMark}
                title={markAction === 'absent' ? 'Mark as Absent' : 'Mark as Not Prepared'}
                message={
                    <div className="space-y-3 text-left">
                        <p>
                            {markAction === 'absent'
                                ? "This marks the student absent for this assignment. No grading will be recorded, and it won't count toward progress."
                                : "This marks the student as having not completed the assignment. No grading will be recorded, and it won't count toward progress."}
                        </p>
                        <textarea
                            value={markNotes}
                            onChange={(e) => setMarkNotes(e.target.value)}
                            rows={2}
                            placeholder="Optional notes..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange focus:border-transparent"
                        />
                    </div>
                }
                confirmText={markAction === 'absent' ? 'Mark Absent' : 'Mark Not Prepared'}
                type="warning"
                isLoading={markProcessing}
            />

            {fullscreenPage && (
                <QuranPageTextViewer pageNumber={fullscreenPage} onClose={() => setFullscreenPage(null)} />
            )}
        </AuthenticatedLayout>
    );
}
