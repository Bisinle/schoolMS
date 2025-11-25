import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Eye, Edit, Trash2, Calendar, FileText, BookOpen, GraduationCap, Clock } from 'lucide-react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import useFilters from '@/Hooks/useFilters';
import { SearchInput, FilterSelect, FilterBar } from '@/Components/Filters';
import { SwipeableListItem, ExpandableCard, MobileListContainer } from '@/Components/Mobile';
import { Badge } from '@/Components/UI';

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
    // Define swipe actions
    const primaryActions = [
        { icon: Eye, label: 'View', color: 'blue', href: `/exams/${exam.id}` },
        { icon: Edit, label: 'Edit', color: 'indigo', href: `/exams/${exam.id}/edit` },
    ];

    const secondaryActions = [
        { icon: Trash2, label: 'Delete', color: 'red', onClick: () => onDelete(exam) },
    ];

    // Header content with Badge component
    const header = (
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
                </div>
            </div>
        </div>
    );

    // Expanded content
    const expandedContent = (
        <div className="space-y-4">
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
    // Use the new useFilters hook
    const { filters, updateFilter, clearFilters } = useFilters({
        route: '/exams',
        initialFilters: {
            search: initialFilters.search || '',
            grade_id: initialFilters.grade_id || '',
            term: initialFilters.term || '',
            academic_year: initialFilters.academic_year || '',
        },
    });

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
                    <Link
                        href="/exams/create"
                        className="inline-flex items-center px-4 py-2.5 bg-orange text-white text-sm font-medium rounded-lg hover:bg-orange-dark transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Schedule Exam
                    </Link>
                </div>

                {/* Filters - Refactored with FilterBar */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <FilterBar onClear={clearFilters} gridCols="4">
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
                        <div>
                            <input
                                type="number"
                                value={filters.academic_year}
                                onChange={(e) => updateFilter('academic_year', e.target.value)}
                                placeholder="Academic Year"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                            />
                        </div>
                    </FilterBar>
                </div>

                {/* Mobile List View - Refactored with MobileListContainer */}
                <div className="block md:hidden">
                    <MobileListContainer
                        emptyState={{
                            icon: FileText,
                            title: 'No exams found',
                            message: filters.search || filters.grade_id || filters.term || filters.academic_year ? 'Try adjusting your filters' : 'Schedule your first exam',
                            action: {
                                label: 'Schedule Exam',
                                href: '/exams/create',
                                icon: Plus,
                            }
                        }}
                    >
                        {exams.data.length > 0 && exams.data.map((exam) => (
                            <MobileExamItem
                                key={exam.id}
                                exam={exam}
                                auth={auth}
                                onDelete={confirmDelete}
                            />
                        ))}
                    </MobileListContainer>
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
                                    ))
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