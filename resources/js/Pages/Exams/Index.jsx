import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, FileText, ChevronDown, ChevronUp, BookOpen, GraduationCap, Clock } from 'lucide-react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import { useSwipeable } from 'react-swipeable';
import SwipeActionButton from '@/Components/SwipeActionButton';

// Mobile List Item Component
function MobileExamItem({ exam, auth, onDelete, getExamTypeBadge }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [swipeAction, setSwipeAction] = useState(null);

    const handlers = useSwipeable({
        onSwipedLeft: () => setSwipeAction('primary'),
        onSwipedRight: () => setSwipeAction('secondary'),
        onSwiping: () => {},
        trackMouse: false,
        preventScrollOnSwipe: false,
        delta: 60,
    });

    const typeBadge = getExamTypeBadge(exam.exam_type);

    return (
        <div className="relative bg-white border-b border-gray-200 overflow-hidden">
            {/* Swipe Actions Background */}
            {swipeAction === 'primary' && (
                <div className="absolute inset-0 bg-gradient-to-l from-blue-500 to-indigo-600 flex items-center justify-end px-4 gap-2 z-10">
                    <SwipeActionButton
                        icon={<Eye className="w-5 h-5 text-white" />}
                        href={`/exams/${exam.id}`}
                        onClick={() => setSwipeAction(null)}
                    />
                    <SwipeActionButton
                        icon={<Edit className="w-5 h-5 text-white" />}
                        href={`/exams/${exam.id}/edit`}
                        onClick={() => setSwipeAction(null)}
                    />
                </div>
            )}
            {swipeAction === 'secondary' && (
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-start px-4 gap-2 z-10">
                    <SwipeActionButton
                        icon={<Trash2 className="w-5 h-5 text-white" />}
                        onClick={() => {
                            onDelete(exam);
                            setSwipeAction(null);
                        }}
                    />
                </div>
            )}

            {/* Main Content */}
            <div
                {...handlers}
                className={`relative bg-white transition-transform duration-300 z-20 ${
                    swipeAction === 'primary' ? '-translate-x-32' :
                    swipeAction === 'secondary' ? 'translate-x-20' : ''
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
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg">
                                <FileText className="w-7 h-7" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-black text-gray-900 truncate leading-tight">
                                    {exam.title}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">{exam.subject?.name}</p>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${typeBadge.class}`}>
                                        {typeBadge.label}
                                    </span>
                                    <span className="px-2 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-700">
                                        Term {exam.term}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button className="flex-shrink-0 p-1">
                            {isExpanded ? (
                                <ChevronUp className="w-6 h-6 text-gray-400" />
                            ) : (
                                <ChevronDown className="w-6 h-6 text-gray-400" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                    <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
                        {/* Info Grid */}
                        <div className="space-y-3 text-sm">
                            <div className="flex items-start gap-3">
                                <GraduationCap className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <span className="text-xs text-gray-500 block">Grade</span>
                                    <span className="font-semibold text-gray-900">{exam.grade?.name}</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <BookOpen className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <span className="text-xs text-gray-500 block">Subject</span>
                                    <span className="font-semibold text-gray-900">{exam.subject?.name}</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <span className="text-xs text-gray-500 block">Exam Date</span>
                                    <span className="font-semibold text-gray-900">
                                        {new Date(exam.exam_date).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <span className="text-xs text-gray-500 block">Academic Year</span>
                                    <span className="font-semibold text-gray-900">{exam.academic_year}</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                            <Link
                                href={`/exams/${exam.id}`}
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl font-bold text-sm hover:bg-blue-100 transition-colors active:scale-95"
                            >
                                <Eye className="w-4 h-4" />
                                View
                            </Link>
                            <Link
                                href={`/exams/${exam.id}/edit`}
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-50 text-orange-700 rounded-xl font-bold text-sm hover:bg-orange-100 transition-colors active:scale-95"
                            >
                                <Edit className="w-4 h-4" />
                                Edit
                            </Link>
                            <button
                                onClick={() => onDelete(exam)}
                                className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-700 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors active:scale-95"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Exam
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ExamsIndex({ exams, grades, filters, auth }) {
    const [search, setSearch] = useState(filters.search || '');
    const [gradeId, setGradeId] = useState(filters.grade_id || '');
    const [term, setTerm] = useState(filters.term || '');
    const [academicYear, setAcademicYear] = useState(filters.academic_year || '');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedExam, setSelectedExam] = useState(null);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/exams', { search, grade_id: gradeId, term, academic_year: academicYear }, { preserveState: true });
    };

    const handleFilterChange = (filterType, value) => {
        const newFilters = {
            search,
            grade_id: filterType === 'grade' ? value : gradeId,
            term: filterType === 'term' ? value : term,
            academic_year: filterType === 'year' ? value : academicYear,
        };
        
        if (filterType === 'grade') setGradeId(value);
        if (filterType === 'term') setTerm(value);
        if (filterType === 'year') setAcademicYear(value);

        router.get('/exams', newFilters, { preserveState: true });
    };

    const confirmDelete = (exam) => {
        setSelectedExam(exam);
        setShowDeleteModal(true);
    };

    const handleDelete = () => {
        if (selectedExam) {
            router.delete(`/exams/${selectedExam.id}`, {
                onSuccess: () => {
                    setShowDeleteModal(false);
                    setSelectedExam(null);
                },
            });
        }
    };

    const getExamTypeBadge = (type) => {
        const badges = {
            opening: 'bg-blue-100 text-blue-800',
            midterm: 'bg-yellow-100 text-yellow-800',
            end_term: 'bg-green-100 text-green-800',
        };
        const labels = {
            opening: 'Opening',
            midterm: 'Midterm',
            end_term: 'End-Term',
        };
        return { class: badges[type], label: labels[type] };
    };

    return (
        <AuthenticatedLayout header="Exams Management">
            <Head title="Exams" />

            <div className="space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    {/* Search and Filters */}
                    <form onSubmit={handleSearch} className="flex-1 w-full flex flex-wrap gap-2">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search exams..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                            />
                        </div>
                        <select
                            value={gradeId}
                            onChange={(e) => handleFilterChange('grade', e.target.value)}
                            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                        >
                            <option value="">All Grades</option>
                            {grades.map((grade) => (
                                <option key={grade.id} value={grade.id}>
                                    {grade.name}
                                </option>
                            ))}
                        </select>
                        <select
                            value={term}
                            onChange={(e) => handleFilterChange('term', e.target.value)}
                            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                        >
                            <option value="">All Terms</option>
                            <option value="1">Term 1</option>
                            <option value="2">Term 2</option>
                            <option value="3">Term 3</option>
                        </select>
                        <input
                            type="number"
                            value={academicYear}
                            onChange={(e) => handleFilterChange('year', e.target.value)}
                            placeholder="Year"
                            className="w-24 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                        />
                    </form>

                    <Link
                        href="/exams/create"
                        className="inline-flex items-center px-4 py-2.5 bg-orange text-white text-sm font-medium rounded-lg hover:bg-orange-dark transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Schedule Exam
                    </Link>
                </div>

                {/* Mobile List View */}
                <div className="block md:hidden bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {exams.data.length > 0 ? (
                        exams.data.map((exam) => (
                            <MobileExamItem
                                key={exam.id}
                                exam={exam}
                                auth={auth}
                                onDelete={confirmDelete}
                                getExamTypeBadge={getExamTypeBadge}
                            />
                        ))
                    ) : (
                        <div className="px-6 py-12 text-center">
                            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">No exams found</p>
                        </div>
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Exam Details
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Grade
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Subject
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Term/Year
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {exams.data.length > 0 ? (
                                    exams.data.map((exam) => {
                                        const badge = getExamTypeBadge(exam.exam_type);
                                        return (
                                            <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <FileText className="w-5 h-5 text-orange mr-2 flex-shrink-0" />
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {exam.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {exam.grade?.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {exam.subject?.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.class}`}>
                                                        {badge.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    Term {exam.term} / {exam.academic_year}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    <div className="flex items-center">
                                                        <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                                                        {new Date(exam.exam_date).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                                                    <Link
                                                        href={`/exams/${exam.id}`}
                                                        className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Link>
                                                    <Link
                                                        href={`/exams/${exam.id}/edit`}
                                                        className="inline-flex items-center text-orange hover:text-orange-dark transition-colors"
                                                        title="Edit Exam"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Link>
                                                    {auth.user.role === 'admin' && (
                                                        <button
                                                            onClick={() => confirmDelete(exam)}
                                                            className="inline-flex items-center text-red-600 hover:text-red-800 transition-colors"
                                                            title="Delete Exam"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                            <p className="text-lg font-medium">No exams found</p>
                                            <p className="text-sm mt-1">
                                                {search || gradeId || term || academicYear ? 'Try adjusting your filters' : 'Get started by scheduling a new exam'}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {exams.data.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{exams.from}</span> to{' '}
                                    <span className="font-medium">{exams.to}</span> of{' '}
                                    <span className="font-medium">{exams.total}</span> results
                                </div>
                                <div className="flex gap-2">
                                    {exams.links.map((link, index) => (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                                                link.active
                                                    ? 'bg-orange text-white shadow-sm'
                                                    : link.url
                                                    ? 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                            preserveState
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Exam"
                message={`Are you sure you want to delete ${selectedExam?.name}? This action cannot be undone.`}
                confirmText="Delete"
                type="danger"
            />
        </AuthenticatedLayout>
    );
}