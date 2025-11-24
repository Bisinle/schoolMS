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
        onSwipedRight: () => setSwipeAction('secondary'),
        trackMouse: false,
        preventScrollOnSwipe: false,
        delta: 60,
    });

    const getReadingTypeBadge = (type) => {
        const badges = {
            'new_learning': 'bg-emerald-100 text-emerald-700 border border-emerald-200',
            'revision': 'bg-blue-100 text-blue-700 border border-blue-200',
            'subac': 'bg-orange-100 text-orange-700 border border-orange-200',
        };
        return badges[type] || 'bg-gray-100 text-gray-700 border border-gray-200';
    };

    const getDifficultyBadge = (difficulty) => {
        const badges = {
            'very_well': 'bg-emerald-100 text-emerald-700 border border-emerald-200',
            'middle': 'bg-amber-100 text-amber-700 border border-amber-200',
            'difficult': 'bg-rose-100 text-rose-700 border border-rose-200',
        };
        return badges[difficulty] || 'bg-gray-100 text-gray-700 border border-gray-200';
    };

    return (
        <div className="relative overflow-hidden">
            {/* Swipe Actions Background - Primary (View & Edit) */}
            {swipeAction === 'primary' && student.latest_tracking && (
                <div className="absolute inset-0 bg-gradient-to-l from-blue-500 to-indigo-600 flex items-center justify-end px-4 gap-2 z-10">
                    <SwipeActionButton
                        icon={<Eye className="w-5 h-5 text-white" />}
                        href={`/quran-tracking/${student.latest_tracking.id}`}
                        onClick={() => setSwipeAction(null)}
                    />
                    {(auth.user.role === 'admin' || auth.user.role === 'teacher') && (
                        <SwipeActionButton
                            icon={<Edit className="w-5 h-5 text-white" />}
                            href={`/quran-tracking/${student.latest_tracking.id}/edit`}
                            onClick={() => setSwipeAction(null)}
                        />
                    )}
                </div>
            )}
            {/* Swipe Actions Background - Secondary (Report) */}
            {swipeAction === 'secondary' && student.latest_tracking && (
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-start px-4 gap-2 z-10">
                    <SwipeActionButton
                        icon={<FileText className="w-5 h-5 text-white" />}
                        href={`/quran-tracking/student/${student.id}/report`}
                        onClick={() => setSwipeAction(null)}
                    />
                </div>
            )}

            {/* Main Content */}
            <div
                {...handlers}
                className={`relative bg-white transition-transform duration-300 z-20 ${
                    swipeAction === 'primary' ? '-translate-x-24' : swipeAction === 'secondary' ? 'translate-x-16' : ''
                }`}
                onClick={() => {
                    if (swipeAction) {
                        setSwipeAction(null);
                    }
                }}
            >
                {/* Summary Row */}
                <div
                    className="p-5 cursor-pointer active:bg-gray-50 transition-colors"
                    onClick={() => {
                        if (!swipeAction) {
                            setIsExpanded(!isExpanded);
                        }
                    }}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-sm">
                                    <User className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-bold text-gray-900 truncate leading-tight">
                                        {student.first_name} {student.last_name}
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                        <span className="truncate">{student.admission_number}</span>
                                        <span>•</span>
                                        <span className="truncate">{student.grade?.name || 'No Grade'}</span>
                                    </div>
                                </div>
                                <Link
                                    href={`/quran-tracking/create?student_id=${student.id}`}
                                    className="flex-shrink-0 px-3 py-2 bg-orange text-white text-xs font-bold rounded-lg hover:bg-orange-dark transition-colors shadow-sm"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Plus className="w-4 h-4" />
                                </Link>
                            </div>

                            {student.latest_tracking && (
                                <div className="flex items-center gap-2 flex-wrap ml-13">
                                    <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(student.latest_tracking.date).toLocaleDateString()}
                                    </div>
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${getReadingTypeBadge(student.latest_tracking.reading_type)}`}>
                                        {student.latest_tracking.reading_type_label}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex-shrink-0 pt-2">
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
                    <div className="px-5 pb-5 space-y-3 border-t border-gray-100 pt-4">
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200/50 shadow-sm">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-orange/10 rounded-lg flex items-center justify-center">
                                    <Book className="w-4 h-4 text-orange" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-gray-900">
                                        {student.latest_tracking.surah_name}
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">
                                        Verses {student.latest_tracking.verse_from}-{student.latest_tracking.verse_to} • {student.latest_tracking.calculated_total_verses} verses
                                    </div>
                                </div>
                            </div>
                        </div>

                        {student.latest_tracking.difficulty && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Performance:</span>
                                <span className={`inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-lg ${getDifficultyBadge(student.latest_tracking.difficulty)}`}>
                                    {student.latest_tracking.difficulty === 'very_well' ? '😊 Very Well' :
                                     student.latest_tracking.difficulty === 'middle' ? '😐 Middle' : '😓 Difficult'}
                                </span>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 pt-2">
                            <Link
                                href={`/quran-tracking/${student.latest_tracking.id}`}
                                className="px-4 py-3 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                            >
                                <Eye className="w-4 h-4" />
                                View
                            </Link>
                            <Link
                                href={`/quran-tracking/student/${student.id}/report`}
                                className="px-4 py-3 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                            >
                                <FileText className="w-4 h-4" />
                                Report
                            </Link>
                        </div>
                    </div>
                )}

                {/* No Tracking Message */}
                {isExpanded && !student.latest_tracking && (
                    <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                        <div className="text-center py-6 text-sm text-gray-400 italic bg-gray-50 rounded-xl border border-gray-200/50">
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
            'new_learning': 'bg-emerald-100 text-emerald-700 border border-emerald-200',
            'revision': 'bg-blue-100 text-blue-700 border border-blue-200',
            'subac': 'bg-orange-100 text-orange-700 border border-orange-200',
        };
        return badges[type] || 'bg-gray-100 text-gray-700 border border-gray-200';
    };

    return (
        <AuthenticatedLayout header="Quran Tracking">
            <Head title="Quran Tracking" />

            <div className="py-6 sm:py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900">Quran Tracking</h2>
                                <p className="text-sm text-gray-600 font-medium">
                                    Track student Quran memorization progress
                                </p>
                            </div>
                        </div>
                        {(auth.user.role === 'admin' || auth.user.role === 'teacher') && (
                            <Link
                                href="/quran-tracking/create"
                                className="inline-flex items-center justify-center px-6 py-3 bg-orange text-white text-sm font-bold rounded-xl hover:bg-orange-dark transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Add Tracking
                            </Link>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-2xl shadow-md border border-gray-200/50 p-6 mb-6">
                        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Search</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search students..."
                                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange focus:border-orange transition-all font-medium"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Grade</label>
                                <select
                                    value={gradeId}
                                    onChange={handleGradeChange}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange focus:border-orange transition-all font-medium"
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
                                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Reading Type</label>
                                <select
                                    value={readingType}
                                    onChange={handleReadingTypeChange}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange focus:border-orange transition-all font-medium"
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
                            <div className="hidden lg:block bg-white rounded-2xl shadow-md border border-gray-200/50 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gradient-to-r from-gray-100 to-gray-50">
                                            <tr>
                                                <th className="px-4 xl:px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">
                                                    Student
                                                </th>
                                                <th className="px-4 xl:px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">
                                                    Grade
                                                </th>
                                                <th className="px-4 xl:px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">
                                                    Latest Tracking
                                                </th>
                                                <th className="px-4 xl:px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">
                                                    Type
                                                </th>
                                                <th className="px-4 xl:px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">
                                                    Surah & Verses
                                                </th>
                                                <th className="px-4 xl:px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {students.data.map((student) => (
                                                <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-4 xl:px-6 py-4">
                                                        <div className="flex items-center min-w-0">
                                                            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mr-3 shadow-sm">
                                                                <User className="w-5 h-5 text-white" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="text-sm font-bold text-gray-900 truncate">
                                                                    {student.first_name} {student.last_name}
                                                                </div>
                                                                <div className="text-xs text-gray-500 truncate font-medium">
                                                                    {student.admission_number}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 xl:px-6 py-4">
                                                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
                                                            {student.grade ? student.grade.name : 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 xl:px-6 py-4">
                                                        {student.latest_tracking ? (
                                                            <div className="flex items-center text-sm text-gray-900 font-medium">
                                                                <Calendar className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                                                                <span className="whitespace-nowrap">
                                                                    {new Date(student.latest_tracking.date).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-gray-400 italic">No tracking yet</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 xl:px-6 py-4">
                                                        {student.latest_tracking ? (
                                                            <span className={`inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap ${getReadingTypeBadge(student.latest_tracking.reading_type)}`}>
                                                                {student.latest_tracking.reading_type_label}
                                                            </span>
                                                        ) : (
                                                            <span className="text-sm text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 xl:px-6 py-4">
                                                        {student.latest_tracking ? (
                                                            <div className="min-w-0">
                                                                <div className="text-sm font-bold text-gray-900 truncate">
                                                                    {student.latest_tracking.surah_name}
                                                                </div>
                                                                <div className="text-xs text-gray-500 whitespace-nowrap font-medium">
                                                                    Verses {student.latest_tracking.verse_from}-{student.latest_tracking.verse_to} ({student.latest_tracking.calculated_total_verses})
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 xl:px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <Link
                                                                href={`/quran-tracking/create?student_id=${student.id}`}
                                                                className="inline-flex items-center px-3 py-2 bg-orange text-white text-xs font-bold rounded-lg hover:bg-orange-dark transition-all duration-200 whitespace-nowrap shadow-sm hover:shadow-md"
                                                                title="Add Tracking"
                                                            >
                                                                <Plus className="w-4 h-4 xl:mr-1" />
                                                                <span className="hidden xl:inline">Add</span>
                                                            </Link>
                                                            {student.latest_tracking && (
                                                                <>
                                                                    <Link
                                                                        href={`/quran-tracking/${student.latest_tracking.id}`}
                                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                        title="View Details"
                                                                    >
                                                                        <Eye className="w-4 h-4" />
                                                                    </Link>
                                                                    <Link
                                                                        href={`/quran-tracking/student/${student.id}/report`}
                                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                        title="View Report"
                                                                    >
                                                                        <FileText className="w-4 h-4" />
                                                                    </Link>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Tablet Card View */}
                            <div className="hidden md:block lg:hidden bg-white rounded-2xl shadow-md border border-gray-200/50 overflow-hidden divide-y divide-gray-200">
                                {students.data.map((student) => (
                                    <div key={student.id} className="p-5 hover:bg-gray-50/50 transition-colors">
                                        <div className="flex items-start justify-between gap-4 mb-4">
                                            <div className="flex items-center min-w-0 flex-1">
                                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mr-3 shadow-md">
                                                    <User className="w-6 h-6 text-white" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-base font-bold text-gray-900 truncate">
                                                        {student.first_name} {student.last_name}
                                                    </h3>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 font-medium">
                                                        <span>{student.admission_number}</span>
                                                        <span>•</span>
                                                        <span className="truncate">{student.grade?.name || 'No Grade'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Link
                                                href={`/quran-tracking/create?student_id=${student.id}`}
                                                className="flex-shrink-0 inline-flex items-center px-4 py-2 bg-orange text-white text-xs font-bold rounded-lg hover:bg-orange-dark transition-all duration-200 shadow-sm hover:shadow-md"
                                            >
                                                <Plus className="w-4 h-4 mr-1" />
                                                Add
                                            </Link>
                                        </div>

                                        {student.latest_tracking ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3 text-xs flex-wrap">
                                                    <div className="flex items-center text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg font-medium">
                                                        <Calendar className="w-3.5 h-3.5 mr-1.5" />
                                                        {new Date(student.latest_tracking.date).toLocaleDateString()}
                                                    </div>
                                                    <span className={`inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-lg ${getReadingTypeBadge(student.latest_tracking.reading_type)}`}>
                                                        {student.latest_tracking.reading_type_label}
                                                    </span>
                                                </div>

                                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200/50 shadow-sm">
                                                    <div className="text-sm font-bold text-gray-900">
                                                        {student.latest_tracking.surah_name}
                                                    </div>
                                                    <div className="text-xs text-gray-600 mt-1 font-medium">
                                                        Verses {student.latest_tracking.verse_from}-{student.latest_tracking.verse_to} ({student.latest_tracking.calculated_total_verses} verses)
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 pt-1">
                                                    <Link
                                                        href={`/quran-tracking/${student.latest_tracking.id}`}
                                                        className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                                                    >
                                                        <Eye className="w-4 h-4 mr-1.5" />
                                                        View
                                                    </Link>
                                                    <Link
                                                        href={`/quran-tracking/student/${student.id}/report`}
                                                        className="inline-flex items-center justify-center px-4 py-2.5 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md"
                                                    >
                                                        <FileText className="w-4 h-4 mr-1.5" />
                                                        Report
                                                    </Link>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-4 text-sm text-gray-400 italic bg-gray-50 rounded-xl border border-gray-200/50">
                                                No tracking records yet
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Mobile List View */}
                            <div className="md:hidden bg-white rounded-2xl shadow-md border border-gray-200/50 overflow-hidden divide-y divide-gray-200">
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
                                <div className="mt-6 bg-white rounded-2xl shadow-md border border-gray-200/50 px-6 py-4">
                                    <div className="flex flex-wrap gap-2">
                                        {students.links.map((link, index) => (
                                            <Link
                                                key={index}
                                                href={link.url || '#'}
                                                className={`px-4 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${
                                                    link.active
                                                        ? 'bg-orange text-white shadow-md'
                                                        : link.url
                                                        ? 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
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
                        <div className="bg-white rounded-2xl shadow-md border border-gray-200/50 p-12 text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <BookOpen className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">No students found</h3>
                            <p className="text-gray-600 mb-6 font-medium">
                                {search || gradeId || readingType
                                    ? 'Try adjusting your filters to see more students'
                                    : 'No students found in your assigned classes'}
                            </p>
                            {(auth.user.role === 'admin' || auth.user.role === 'teacher') && !search && !gradeId && (
                                <Link
                                    href="/quran-tracking/create"
                                    className="inline-flex items-center px-6 py-3 bg-orange text-white text-sm font-bold rounded-xl hover:bg-orange-dark transition-all duration-200 shadow-md hover:shadow-lg"
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