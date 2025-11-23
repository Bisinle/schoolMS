import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, BookOpen, Search, Filter, Eye, Edit, Trash2, Calendar, User, Book, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import { useSwipeable } from 'react-swipeable';
import SwipeActionButton from '@/Components/SwipeActionButton';

// Mobile List Item Component
function MobileQuranTrackingItem({ student, auth }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [swipeAction, setSwipeAction] = useState(null);

    const handlers = useSwipeable({
        onSwipedLeft: () => setSwipeAction('primary'),
        onSwipedRight: () => setSwipeAction(null),
        onSwiping: () => {},
        trackMouse: false,
        preventScrollOnSwipe: false,
        delta: 60,
    });

    const getReadingTypeBadge = (type) => {
        const badges = {
            'new_learning': 'bg-green-100 text-green-800',
            'revision': 'bg-blue-100 text-blue-800',
            'subac': 'bg-orange-100 text-orange-800',
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

    return (
        <div className="relative bg-white border-b border-gray-200 overflow-hidden">
            {/* Swipe Actions Background */}
            {swipeAction === 'primary' && student.latest_tracking && (
                <div className="absolute inset-0 bg-gradient-to-l from-blue-500 to-indigo-600 flex items-center justify-end px-4 gap-2 z-10">
                    <SwipeActionButton
                        icon={<Edit className="w-5 h-5 text-white" />}
                        href={`/quran-tracking/${student.latest_tracking.id}/edit`}
                        onClick={() => setSwipeAction(null)}
                    />
                </div>
            )}

            {/* Main Content */}
            <div
                {...handlers}
                className={`relative bg-white transition-transform duration-300 z-20 ${
                    swipeAction === 'primary' ? '-translate-x-24' : ''
                }`}
                onClick={() => {
                    if (swipeAction) {
                        setSwipeAction(null);
                    }
                }}
            >
                {/* Summary Row */}
                <div
                    className="p-4 cursor-pointer active:bg-gray-50 transition-colors"
                    onClick={() => {
                        if (!swipeAction) {
                            setIsExpanded(!isExpanded);
                        }
                    }}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-base font-bold text-gray-900 truncate">
                                    {student.first_name} {student.last_name}
                                </h3>
                                <Link
                                    href={`/quran-tracking/create?student_id=${student.id}`}
                                    className="px-2.5 py-1 bg-orange text-white text-xs font-medium rounded-md hover:bg-orange-dark transition-colors flex items-center gap-1 flex-shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Plus className="w-3 h-3" />
                                    Add
                                </Link>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                <span>{student.admission_number}</span>
                                <span>•</span>
                                <span>{student.grade?.name || 'No Grade'}</span>
                            </div>

                            {student.latest_tracking && (
                                <div className="flex items-center gap-2 flex-wrap">
                                    <div className="flex items-center gap-1 text-xs text-gray-600">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(student.latest_tracking.date).toLocaleDateString()}
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getReadingTypeBadge(student.latest_tracking.reading_type)}`}>
                                        {student.latest_tracking.reading_type_label}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex-shrink-0">
                            {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && student.latest_tracking && (
                    <div className="px-4 pb-4 space-y-2.5 border-t border-gray-100 pt-3">
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-2.5">
                            <div className="text-sm font-semibold text-gray-900 mb-0.5">
                                {student.latest_tracking.surah_name}
                            </div>
                            <div className="text-xs text-gray-600">
                                Verses {student.latest_tracking.verse_from} - {student.latest_tracking.verse_to} ({student.latest_tracking.calculated_total_verses} verses)
                            </div>
                        </div>

                        {student.latest_tracking.difficulty && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Performance:</span>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getDifficultyBadge(student.latest_tracking.difficulty)}`}>
                                    {student.latest_tracking.difficulty === 'very_well' ? '😊 Very Well' :
                                     student.latest_tracking.difficulty === 'middle' ? '😐 Middle' : '😓 Difficult'}
                                </span>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 pt-1">
                            <Link
                                href={`/quran-tracking/${student.latest_tracking.id}`}
                                className="px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5"
                            >
                                <Eye className="w-3.5 h-3.5" />
                                View
                            </Link>
                            <Link
                                href={`/quran-tracking/student/${student.id}/report`}
                                className="px-3 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5"
                            >
                                <FileText className="w-3.5 h-3.5" />
                                Report
                            </Link>
                        </div>
                    </div>
                )}

                {/* No Tracking Message */}
                {isExpanded && !student.latest_tracking && (
                    <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                        <div className="text-center py-3 text-xs text-gray-400 italic">
                            No tracking records yet
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function QuranTrackingIndex({ students, grades, filters = {}, auth }) {
    const [search, setSearch] = useState(filters.search || '');
    const [gradeId, setGradeId] = useState(filters.grade_id || '');
    const [readingType, setReadingType] = useState(filters.reading_type || '');

    const handleSearch = (e) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = () => {
        router.get('/quran-tracking', { search, grade_id: gradeId, reading_type: readingType }, { preserveState: true, preserveScroll: true });
    };

    const handleGradeChange = (e) => {
        const newGradeId = e.target.value;
        setGradeId(newGradeId);
        router.get('/quran-tracking', { search, grade_id: newGradeId, reading_type: readingType }, { preserveState: true, preserveScroll: true });
    };

    const handleReadingTypeChange = (e) => {
        const newReadingType = e.target.value;
        setReadingType(newReadingType);
        router.get('/quran-tracking', { search, grade_id: gradeId, reading_type: newReadingType }, { preserveState: true, preserveScroll: true });
    };

    const getReadingTypeBadge = (type) => {
        const badges = {
            'new_learning': 'bg-green-100 text-green-800',
            'revision': 'bg-blue-100 text-blue-800',
            'subac': 'bg-orange-100 text-orange-800',
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

    return (
        <AuthenticatedLayout header="Quran Tracking">
            <Head title="Quran Tracking" />

            <div className="py-6 sm:py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center space-x-3">
                            <BookOpen className="w-8 h-8 text-orange" />
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Quran Tracking</h2>
                                <p className="text-sm text-gray-600">
                                    Track student Quran memorization progress
                                </p>
                            </div>
                        </div>
                        {(auth.user.role === 'admin' || auth.user.role === 'teacher') && (
                            <Link
                                href="/quran-tracking/create"
                                className="inline-flex items-center px-6 py-3 bg-orange text-white text-sm font-medium rounded-lg hover:bg-orange-dark transition-colors"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Add Tracking
                            </Link>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search students..."
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
                                <select
                                    value={gradeId}
                                    onChange={handleGradeChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                                >
                                    <option value="">All Grades</option>
                                    {grades.map((grade) => (
                                        <option key={grade.id} value={grade.id}>
                                            {grade.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Reading Type</label>
                                <select
                                    value={readingType}
                                    onChange={handleReadingTypeChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                                >
                                    <option value="">All Types</option>
                                    <option value="new_learning">New Learning</option>
                                    <option value="revision">Revision</option>
                                    <option value="subac">Subac</option>
                                </select>
                            </div>
                        </form>
                    </div>

                    {/* Student List with Latest Tracking */}
                    {students.data.length > 0 ? (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                    Student
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                    Grade
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                    Latest Tracking
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                    Type
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                    Surah & Verses
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {students.data.map((student) => (
                                                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <User className="w-5 h-5 text-gray-400 mr-2" />
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {student.first_name} {student.last_name}
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    {student.admission_number}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {student.grade ? student.grade.name : 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {student.latest_tracking ? (
                                                            <div className="flex items-center text-sm text-gray-900">
                                                                <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                                                {new Date(student.latest_tracking.date).toLocaleDateString()}
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-gray-400 italic">No tracking yet</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {student.latest_tracking ? (
                                                            <span className={`inline-flex px-3 py-1 text-xs leading-5 font-bold rounded-full ${getReadingTypeBadge(student.latest_tracking.reading_type)}`}>
                                                                {student.latest_tracking.reading_type_label}
                                                            </span>
                                                        ) : (
                                                            <span className="text-sm text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {student.latest_tracking ? (
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {student.latest_tracking.surah_name}
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    Verses {student.latest_tracking.verse_from} - {student.latest_tracking.verse_to} ({student.latest_tracking.calculated_total_verses} verses)
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <Link
                                                                href={`/quran-tracking/create?student_id=${student.id}`}
                                                                className="inline-flex items-center px-3 py-1.5 bg-orange text-white text-xs font-medium rounded-lg hover:bg-orange-dark transition-colors"
                                                            >
                                                                <Plus className="w-4 h-4 mr-1" />
                                                                Add Tracking
                                                            </Link>
                                                            {student.latest_tracking && (
                                                                <Link
                                                                    href={`/quran-tracking/${student.latest_tracking.id}`}
                                                                    className="text-blue-600 hover:text-blue-900 transition-colors"
                                                                >
                                                                    <Eye className="w-5 h-5" />
                                                                </Link>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Mobile List View */}
                            <div className="md:hidden bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                {students.data.map((student) => (
                                    <MobileQuranTrackingItem
                                        key={student.id}
                                        student={student}
                                        auth={auth}
                                    />
                                ))}
                            </div>

                            {/* Pagination */}
                            {students.links.length > 3 && (
                                <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-4">
                                    <div className="flex flex-wrap gap-2">
                                        {students.links.map((link, index) => (
                                            <Link
                                                key={index}
                                                href={link.url || '#'}
                                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                                    link.active
                                                        ? 'bg-orange text-white'
                                                        : link.url
                                                        ? 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                            <p className="text-gray-600 mb-6">
                                {search || gradeId || readingType
                                    ? 'Try adjusting your filters to see more students'
                                    : 'No students found in your assigned classes'}
                            </p>
                            {(auth.user.role === 'admin' || auth.user.role === 'teacher') && !search && !gradeId && (
                                <Link
                                    href="/quran-tracking/create"
                                    className="inline-flex items-center px-6 py-3 bg-orange text-white text-sm font-medium rounded-lg hover:bg-orange-dark transition-colors"
                                >
                                    <Plus className="w-5 h-5 mr-2" />
                                    Add Tracking
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}