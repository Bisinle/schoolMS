import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { Plus, Eye, Edit, Trash2, BookOpen, Tag, AlertCircle, X } from 'lucide-react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import { shouldShowAcademicSubjects } from '@/Utils/subjectFilters';
import useFilters from '@/Hooks/useFilters';
import useCumulativeLoading from '@/Hooks/useCumulativeLoading';
import { SearchInput, FilterSelect, FilterBar } from '@/Components/Filters';
import { SwipeableListItem, ExpandableCard, MobileListContainer } from '@/Components/Mobile';
import { Badge } from '@/Components/UI';
import LoadMoreButton from '@/Components/Pagination/LoadMoreButton';
import Pagination from '@/Components/Pagination/Pagination';

// Mobile List Item Component - Refactored with new components
function MobileSubjectItem({ subject, auth, onDelete }) {
    const getCategoryColor = (category) => {
        const colors = {
            'academic': 'from-blue-500 to-blue-600',
            'islamic': 'from-green-500 to-green-600',
            'arts': 'from-purple-500 to-purple-600',
            'core': 'from-blue-500 to-blue-600',
            'elective': 'from-green-500 to-green-600',
            'co-curricular': 'from-purple-500 to-purple-600',
        };
        return colors[category] || 'from-gray-500 to-gray-600';
    };

    const isAdmin = auth.user.role === 'admin';

    // Build swipe actions - only show edit/delete for admins
    const primaryActions = [
        { icon: Eye, label: 'View', href: `/subjects/${subject.id}` },
        ...(isAdmin ? [{ icon: Edit, label: 'Edit', href: `/subjects/${subject.id}/edit` }] : []),
    ];

    const secondaryActions = isAdmin ? [
        { icon: Trash2, label: 'Delete', onClick: () => onDelete(subject) },
    ] : [];

    return (
        <SwipeableListItem
            primaryActions={primaryActions}
            secondaryActions={secondaryActions}
        >
            <ExpandableCard
                header={
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className={`flex-shrink-0 w-14 h-14 bg-gradient-to-br ${getCategoryColor(subject.category)} rounded-2xl flex items-center justify-center text-white font-black shadow-lg text-xl`}>
                            {subject.name.charAt(0).toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-black text-gray-900 truncate leading-tight">
                                {subject.name}
                            </h3>
                            <p className="text-sm text-gray-600 capitalize mt-1">{subject.category}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant="info" value={subject.code} size="sm" />
                            </div>
                        </div>
                    </div>
                }
            >

                {/* Expanded Details */}
                <div className="space-y-4">
                    {/* Info Grid */}
                    <div className="space-y-3 text-sm">
                        <div className="flex items-start gap-3">
                            <Tag className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <span className="text-xs text-gray-500 block">Category</span>
                                <span className="font-semibold text-gray-900 capitalize">{subject.category}</span>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <BookOpen className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <span className="text-xs text-gray-500 block">Subject Code</span>
                                <span className="font-semibold text-gray-900">{subject.code}</span>
                            </div>
                        </div>
                        {subject.description && (
                            <div className="flex items-start gap-3">
                                <BookOpen className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <span className="text-xs text-gray-500 block">Description</span>
                                    <span className="font-medium text-gray-900">{subject.description}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                        <Link
                            href={`/subjects/${subject.id}`}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl font-bold text-sm hover:bg-blue-100 transition-colors active:scale-95"
                        >
                            <Eye className="w-4 h-4" />
                            View
                        </Link>
                        <Link
                            href={`/subjects/${subject.id}/edit`}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-50 text-orange-700 rounded-xl font-bold text-sm hover:bg-orange-100 transition-colors active:scale-95"
                        >
                            <Edit className="w-4 h-4" />
                            Edit
                        </Link>
                        <button
                            onClick={() => onDelete(subject)}
                            className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-700 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors active:scale-95"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete Subject
                        </button>
                    </div>
                </div>
            </ExpandableCard>
        </SwipeableListItem>
    );
}

export default function SubjectsIndex({ subjects, filters: initialFilters = {}, auth }) {
    const { school, flash } = usePage().props;
    const error = flash?.error;
    const showAcademicSubjects = shouldShowAcademicSubjects(school?.school_type);

    // Show error modal when error exists
    const [showErrorModal, setShowErrorModal] = useState(false);
    const errorShownRef = useRef(null);

    useEffect(() => {
        // Only show modal if we have a new error (different from the last one we showed)
        if (error && JSON.stringify(error) !== errorShownRef.current) {
            setShowErrorModal(true);
            errorShownRef.current = JSON.stringify(error);
        }
    }, [error]);

    const handleCloseErrorModal = () => {
        setShowErrorModal(false);
    };

    // Use the new useFilters hook
    const { filters, updateFilter, clearFilters } = useFilters({
        route: '/subjects',
        initialFilters: {
            search: initialFilters.search || '',
            category: initialFilters.category || '',
        },
    });

    // Cumulative loading for mobile view
    const {
        items: allSubjects,
        isLoadingMore,
        handleLoadMore
    } = useCumulativeLoading(subjects, filters, 'subjects.index', 'subjects');

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState(null);

    const confirmDelete = (subject) => {
        setSelectedSubject(subject);
        setShowDeleteModal(true);
    };

    const handleDelete = () => {
        if (selectedSubject) {
            router.delete(`/subjects/${selectedSubject.id}`, {
                onFinish: () => {
                    setShowDeleteModal(false);
                    setSelectedSubject(null);
                },
            });
        }
    };

    return (
        <AuthenticatedLayout header="Subjects Management">
            <Head title="Subjects" />

            <div className="space-y-6">
                {/* Header Actions - Refactored with FilterBar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex-1 w-full sm:max-w-2xl">
                        <FilterBar onClear={clearFilters} gridCols="2">
                            <SearchInput
                                value={filters.search}
                                onChange={(e) => updateFilter('search', e.target.value)}
                                placeholder="Search subjects..."
                            />
                            <FilterSelect
                                value={filters.category}
                                onChange={(e) => updateFilter('category', e.target.value)}
                                options={[
                                    ...(showAcademicSubjects ? [{ value: 'academic', label: 'Academic' }] : []),
                                    { value: 'islamic', label: 'Islamic' },
                                    { value: 'arts', label: 'Arts' }
                                ]}
                                allLabel="All Categories"
                                hideLabel
                            />
                        </FilterBar>
                    </div>

                    {auth.user.role === 'admin' && (
                        <Link
                            href={route('subjects.create')}
                            className="inline-flex items-center px-4 py-2.5 bg-orange text-white text-sm font-medium rounded-lg hover:bg-orange-dark transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Add Subject
                        </Link>
                    )}
                </div>



                {/* Mobile List View - Refactored with MobileListContainer */}
                <div className="block md:hidden">
                    <MobileListContainer
                        emptyState={{
                            icon: BookOpen,
                            title: 'No subjects found',
                            message: filters.search || filters.category ? 'Try adjusting your filters' : 'Get started by adding a new subject',
                        }}
                    >
                        {allSubjects && allSubjects.length > 0 && allSubjects.map((subject) => (
                            <MobileSubjectItem
                                key={subject.id}
                                subject={subject}
                                auth={auth}
                                onDelete={confirmDelete}
                            />
                        ))}
                    </MobileListContainer>

                    {subjects.data && subjects.data.length > 0 && (
                        <LoadMoreButton
                            currentCount={allSubjects.length}
                            totalCount={subjects.total}
                            isLoading={isLoadingMore}
                            onLoadMore={handleLoadMore}
                            itemName="subjects"
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
                                        Subject Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Code
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Grades
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
                                {subjects.data.length > 0 ? (
                                    subjects.data.map((subject) => (
                                        <tr key={subject.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <BookOpen className="w-5 h-5 text-orange mr-2" />
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {subject.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {subject.code || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge
                                                    variant={
                                                        subject.category === 'academic' ? 'info' :
                                                        subject.category === 'islamic' ? 'success' :
                                                        'warning'
                                                    }
                                                    value={
                                                        subject.category === 'academic' ? 'Academic' :
                                                        subject.category === 'islamic' ? 'Islamic' :
                                                        'Arts'
                                                    }
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {subject.grades_count} grade(s)
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge variant="status" value={subject.status} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                                                <Link
                                                    href={`/subjects/${subject.id}`}
                                                    className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                                {auth.user.role === 'admin' && (
                                                    <>
                                                        <Link
                                                            href={`/subjects/${subject.id}/edit`}
                                                            className="inline-flex items-center text-orange hover:text-orange-dark transition-colors"
                                                            title="Edit Subject"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Link>
                                                        <button
                                                            onClick={() => confirmDelete(subject)}
                                                            className="inline-flex items-center text-red-600 hover:text-red-800 transition-colors"
                                                            title="Delete Subject"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                            <p className="text-lg font-medium">No subjects found</p>
                                            <p className="text-sm mt-1">
                                                {filters.search || filters.category ? 'Try adjusting your filters' : 'Get started by adding a new subject'}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Desktop Pagination */}
                    {subjects.data.length > 0 && (
                        <Pagination
                            links={subjects.links}
                            currentPage={subjects.current_page}
                            lastPage={subjects.last_page}
                            total={subjects.total}
                            from={subjects.from}
                            to={subjects.to}
                        />
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Subject"
                message={`Are you sure you want to delete ${selectedSubject?.name}? This action cannot be undone.`}
                confirmText="Delete"
                type="danger"
            />

            {/* Error Modal - Subject Cannot Be Deleted */}
            {showErrorModal && error && (error.type === 'exams' || error.type === 'timetable_slots') && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-red-50">
                            <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                                    <AlertCircle className="h-6 w-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Cannot Delete Subject</h3>
                                    <p className="text-sm text-red-800 mt-1">
                                        The subject <strong>"{error.subject_name}"</strong> is currently being used
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleCloseErrorModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Exams Error */}
                            {error.type === 'exams' && error.exams_using_subject && (
                                <div>
                                    <p className="text-sm text-gray-700 mb-4">
                                        This subject is currently being used in <strong>{error.exams_using_subject.length} exam{error.exams_using_subject.length !== 1 ? 's' : ''}</strong> and cannot be deleted.
                                    </p>

                                    <div className="mb-4">
                                        <p className="text-sm font-semibold text-gray-900 mb-3">Exams using this subject:</p>
                                        <div className="space-y-2">
                                            {error.exams_using_subject.map((exam) => (
                                                <Link
                                                    key={exam.id}
                                                    href={exam.url}
                                                    className="block p-4 bg-gray-50 rounded-lg hover:bg-red-50 transition-colors border border-gray-200 hover:border-red-300 shadow-sm"
                                                    onClick={handleCloseErrorModal}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{exam.name}</p>
                                                            <p className="text-sm text-gray-600 mt-0.5">
                                                                {exam.grade} • {exam.date}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-0.5">
                                                                {exam.academic_year} • Term {exam.term}
                                                            </p>
                                                        </div>
                                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-sm font-semibold text-blue-900 mb-1">📝 What you need to do:</p>
                                        <p className="text-sm text-blue-800">
                                            Click on each exam above and either delete the exam or assign it to a different subject. Once all exams are removed or reassigned, you'll be able to delete this subject.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Timetable Slots Error */}
                            {error.type === 'timetable_slots' && error.templates_using_subject && (
                                <div>
                                    <p className="text-sm text-gray-700 mb-4">
                                        This subject is currently being used in <strong>{error.templates_using_subject.length} timetable schedule{error.templates_using_subject.length !== 1 ? 's' : ''}</strong> and cannot be deleted.
                                    </p>

                                    <div className="mb-4">
                                        <p className="text-sm font-semibold text-gray-900 mb-3">Timetables using this subject:</p>
                                        <div className="space-y-2">
                                            {error.templates_using_subject.map((template) => (
                                                <Link
                                                    key={template.id}
                                                    href={template.url}
                                                    className="block p-4 bg-gray-50 rounded-lg hover:bg-red-50 transition-colors border border-gray-200 hover:border-red-300 shadow-sm"
                                                    onClick={handleCloseErrorModal}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-gray-900">{template.name}</p>
                                                            <p className="text-sm text-gray-600 mt-0.5">
                                                                {template.grade} • {template.term} • <span className="capitalize">{template.status}</span>
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-sm font-medium text-gray-500">
                                                                {template.slots_count} slot{template.slots_count !== 1 ? 's' : ''}
                                                            </span>
                                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-sm font-semibold text-blue-900 mb-1">📝 What you need to do:</p>
                                        <p className="text-sm text-blue-800">
                                            Click on each timetable above and remove or replace this subject from all time slots. Once the subject is no longer used in any timetable, you'll be able to delete it.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
                            <button
                                onClick={handleCloseErrorModal}
                                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}