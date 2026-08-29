import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Eye, Edit, Trash2, Calendar, FileText, BookOpen, GraduationCap, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import useFilters from '@/Hooks/useFilters';
import useCumulativeLoading from '@/Hooks/useCumulativeLoading';
import { SearchInput, FilterSelect, FilterBar } from '@/Components/Filters';
import { SwipeableListItem, ExpandableCard, MobileListContainer } from '@/Components/Mobile';
import { Badge } from '@/Components/UI';
import LoadMoreButton from '@/Components/Pagination/LoadMoreButton';
import Pagination from '@/Components/Pagination/Pagination';
import usePermissions from '@/Hooks/usePermissions';

// Helper to get exam type badge variant
function getExamTypeBadgeVariant(type) {
    const variants = {
        opening: 'info',
        midterm: 'warning',
        end_term: 'success',
    };
    return variants[type] || 'secondary';
}

// Helper to get exam type label
function getExamTypeLabel(type) {
    const labels = {
        opening: 'Opening',
        midterm: 'Midterm',
        end_term: 'End-Term',
    };
    return labels[type] || type;
}

// Mobile List Item Component - Refactored with new components
function MobileExamItem({ exam, auth, onDelete }) {
    const { can } = usePermissions();
    // exams.update is held by both admin and teacher, but ExamPolicy::update()
    // scopes teacher to exams they created — mirror that exactly so the
    // button doesn't show for exams a teacher can't actually edit.
    const canEditExam = can('exams.update') && (auth.user.role === 'admin' || exam.created_by === auth.user.id);

    // Define swipe actions
    const primaryActions = [
        { icon: Eye, label: 'View', href: `/exams/${exam.id}` },
    ];

    if (canEditExam) {
        primaryActions.push({ icon: Edit, label: 'Edit', href: `/exams/${exam.id}/edit` });
    }

    const secondaryActions = can('exams.delete') ? [
        { icon: Trash2, label: 'Delete', onClick: () => onDelete(exam) },
    ] : [];

    // Get completion status
    const completionStats = exam.completion_stats || {};
    const isComplete = completionStats.is_complete;
    const isPartial = completionStats.is_partial;
    const isNotStarted = completionStats.is_not_started;
    const completionRate = completionStats.completion_rate || 0;

    // Determine icon background color based on completion status
    const iconBgClass = isComplete
        ? 'bg-gradient-to-br from-green-500 to-emerald-600'
        : isPartial
        ? 'bg-gradient-to-br from-orange-500 to-amber-600'
        : 'bg-gradient-to-br from-red-500 to-rose-600';

    // Header content with Badge component
    const header = (
        <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className={`flex-shrink-0 w-14 h-14 ${iconBgClass} rounded-2xl flex items-center justify-center text-white font-black shadow-lg relative`}>
                <FileText className="w-7 h-7" />
                {/* Completion indicator badge */}
                {isComplete && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                        <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                )}
                {isPartial && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange rounded-full flex items-center justify-center border-2 border-white">
                        <AlertCircle className="w-3 h-3 text-white" />
                    </div>
                )}
                {isNotStarted && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
                        <XCircle className="w-3 h-3 text-white" />
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-gray-900 leading-tight mb-1">
                    {exam.grade?.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2">{exam.subject?.name}</p>
                <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                        variant={getExamTypeBadgeVariant(exam.exam_type)}
                        value={getExamTypeLabel(exam.exam_type)}
                        size="sm"
                    />
                    <Badge
                        variant="secondary"
                        value={`Term ${exam.term}`}
                        size="sm"
                    />
                    {/* Completion status badge */}
                    {isComplete ? (
                        <span className="inline-flex items-center justify-center rounded-full font-semibold px-2.5 py-1 text-xs bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                            ✓ Fully Marked
                        </span>
                    ) : isPartial ? (
                        <span className="inline-flex items-center justify-center rounded-full font-semibold px-2.5 py-1 text-xs bg-gradient-to-r from-orange-500 to-amber-600 text-white">
                            {completionRate}% Marked
                        </span>
                    ) : (
                        <span className="inline-flex items-center justify-center rounded-full font-semibold px-2.5 py-1 text-xs bg-gradient-to-r from-red-500 to-rose-600 text-white">
                            Not Marked
                        </span>
                    )}
                </div>
            </div>
        </div>
    );

    // Expanded content
    const expandedContent = (
        <div className="space-y-4">
            {/* Completion Progress Bar */}
            {completionStats.total_students > 0 && (
                <div className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-600">Marking Progress</span>
                        <span className="text-xs font-bold text-gray-900">{completionRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mb-2">
                        <div
                            className={`h-full transition-all duration-500 ${
                                isComplete ? 'bg-green-500' : isPartial ? 'bg-orange' : 'bg-red-500'
                            }`}
                            style={{ width: `${completionRate}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-gray-600">
                        {completionStats.marked_students} of {completionStats.total_students} students marked
                    </p>
                </div>
            )}

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
            <div className={`grid ${(canEditExam || can('exams.delete')) ? 'grid-cols-2' : 'grid-cols-1'} gap-3 pt-4 border-t border-gray-100`}>
                <Link
                    href={`/exams/${exam.id}`}
                    className={`flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl font-bold text-sm hover:bg-blue-100 transition-colors active:scale-95 ${!(canEditExam || can('exams.delete')) ? 'col-span-1' : ''}`}
                >
                    <Eye className="w-4 h-4" />
                    View
                </Link>
                {canEditExam && (
                    <Link
                        href={`/exams/${exam.id}/edit`}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-50 text-orange-700 rounded-xl font-bold text-sm hover:bg-orange-100 transition-colors active:scale-95"
                    >
                        <Edit className="w-4 h-4" />
                        Edit
                    </Link>
                )}
                {can('exams.delete') && (
                    <button
                        onClick={() => onDelete(exam)}
                        className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-700 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors active:scale-95"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete Exam
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <SwipeableListItem
            primaryActions={primaryActions}
            secondaryActions={secondaryActions}
        >
            <ExpandableCard header={header}>
                {expandedContent}
            </ExpandableCard>
        </SwipeableListItem>
    );
}

export default function ExamsIndex({ exams, grades, filters: initialFilters = {}, auth }) {
    const { can } = usePermissions();
    // Use the new useFilters hook
    const { filters, updateFilter, clearFilters } = useFilters({
        route: '/exams',
        initialFilters: {
            search: initialFilters.search || '',
            grade_id: initialFilters.grade_id || '',
            term: initialFilters.term || '',
            academic_year: initialFilters.academic_year || '',
            exam_type: initialFilters.exam_type || '',
            completion_status: initialFilters.completion_status || '',
        },
    });

    // Cumulative loading for mobile view
    const {
        items: allExams,
        isLoadingMore,
        handleLoadMore
    } = useCumulativeLoading(exams, filters, 'exams.index', 'exams');

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedExam, setSelectedExam] = useState(null);

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

    return (
        <AuthenticatedLayout header="Exams Management">
            <Head title="Exams" />

            <div className="space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex items-center space-x-3">
                        <FileText className="w-8 h-8 text-orange" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Exams</h2>
                            <p className="text-sm text-gray-600">
                                Manage and schedule examinations
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/exams/create"
                        className="inline-flex items-center px-6 py-3 bg-orange text-white rounded-lg hover:bg-orange-dark transition-colors shadow-md hover:shadow-lg"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Schedule Exam
                    </Link>
                </div>

                {/* Filters - Refactored with FilterBar */}
                <FilterBar onClear={clearFilters} gridCols="6">
                    <SearchInput
                        value={filters.search}
                        onChange={(e) => updateFilter('search', e.target.value)}
                        placeholder="Search exams..."
                        hideLabel
                    />
                    <FilterSelect
                        value={filters.grade_id}
                        onChange={(e) => updateFilter('grade_id', e.target.value)}
                        options={grades.map(grade => ({ value: grade.id, label: grade.name }))}
                        allLabel="All Grades"
                        hideLabel
                    />
                    <FilterSelect
                        value={filters.term}
                        onChange={(e) => updateFilter('term', e.target.value)}
                        options={[
                            { value: '1', label: 'Term 1' },
                            { value: '2', label: 'Term 2' },
                            { value: '3', label: 'Term 3' }
                        ]}
                        allLabel="All Terms"
                        hideLabel
                    />
                    <FilterSelect
                        value={filters.exam_type}
                        onChange={(e) => updateFilter('exam_type', e.target.value)}
                        options={[
                            { value: 'opening', label: 'Opening' },
                            { value: 'midterm', label: 'Midterm' },
                            { value: 'end_term', label: 'End-Term' }
                        ]}
                        allLabel="All Types"
                        hideLabel
                    />
                    <div>
                        <input
                            type="number"
                            value={filters.academic_year}
                            onChange={(e) => updateFilter('academic_year', e.target.value)}
                            placeholder="Academic Year"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                        />
                    </div>
                    <FilterSelect
                        value={filters.completion_status}
                        onChange={(e) => updateFilter('completion_status', e.target.value)}
                        options={[
                            { value: 'complete', label: '✓ Fully Marked' },
                            { value: 'partial', label: 'Partially Marked' },
                            { value: 'not_started', label: 'Not Marked' }
                        ]}
                        allLabel="All Statuses"
                        hideLabel
                    />
                </FilterBar>

                {/* Mobile List View - Refactored with MobileListContainer */}
                <div className="block md:hidden">
                    <MobileListContainer
                        emptyState={{
                            icon: FileText,
                            title: 'No exams found',
                            message: filters.search || filters.grade_id || filters.term || filters.academic_year || filters.exam_type || filters.completion_status ? 'Try adjusting your filters' : 'Schedule your first exam',
                            action: {
                                label: 'Schedule Exam',
                                href: '/exams/create',
                                icon: Plus,
                            }
                        }}
                    >
                        {allExams && allExams.length > 0 && allExams.map((exam) => (
                            <MobileExamItem
                                key={exam.id}
                                exam={exam}
                                auth={auth}
                                onDelete={confirmDelete}
                            />
                        ))}
                    </MobileListContainer>

                    {exams.data && exams.data.length > 0 && (
                        <LoadMoreButton
                            currentCount={allExams.length}
                            totalCount={exams.total}
                            isLoading={isLoadingMore}
                            onLoadMore={handleLoadMore}
                            itemName="exams"
                        />
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
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {exams.data.length > 0 ? (
                                    exams.data.map((exam) => (
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
                                                <Badge
                                                    variant={getExamTypeBadgeVariant(exam.exam_type)}
                                                    value={getExamTypeLabel(exam.exam_type)}
                                                    size="sm"
                                                />
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
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {(() => {
                                                    const completionStats = exam.completion_stats || {};
                                                    const isComplete = completionStats.is_complete;
                                                    const isPartial = completionStats.is_partial;
                                                    const completionRate = completionStats.completion_rate || 0;

                                                    if (isComplete) {
                                                        return (
                                                            <span className="inline-flex items-center justify-center rounded-full font-semibold px-2.5 py-1 text-xs bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                                                                ✓ Fully Marked
                                                            </span>
                                                        );
                                                    } else if (isPartial) {
                                                        return (
                                                            <span className="inline-flex items-center justify-center rounded-full font-semibold px-2.5 py-1 text-xs bg-gradient-to-r from-orange-500 to-amber-600 text-white">
                                                                {completionRate}% Marked
                                                            </span>
                                                        );
                                                    } else {
                                                        return (
                                                            <span className="inline-flex items-center justify-center rounded-full font-semibold px-2.5 py-1 text-xs bg-gradient-to-r from-red-500 to-rose-600 text-white">
                                                                Not Marked
                                                            </span>
                                                        );
                                                    }
                                                })()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                                                <Link
                                                    href={`/exams/${exam.id}`}
                                                    className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                                {can('exams.update') && (auth.user.role === 'admin' || exam.created_by === auth.user.id) && (
                                                    <Link
                                                        href={`/exams/${exam.id}/edit`}
                                                        className="inline-flex items-center text-orange hover:text-orange-dark transition-colors"
                                                        title="Edit Exam"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Link>
                                                )}
                                                {can('exams.delete') && (
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
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                            <p className="text-lg font-medium">No exams found</p>
                                            <p className="text-sm mt-1">
                                                {filters.search || filters.grade_id || filters.term || filters.academic_year || filters.exam_type || filters.completion_status ? 'Try adjusting your filters' : 'Get started by scheduling a new exam'}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Desktop Pagination */}
                    {exams.data.length > 0 && (
                        <Pagination
                            links={exams.links}
                            currentPage={exams.current_page}
                            lastPage={exams.last_page}
                            total={exams.total}
                            from={exams.from}
                            to={exams.to}
                        />
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