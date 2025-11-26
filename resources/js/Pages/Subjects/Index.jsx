import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Eye, Edit, Trash2, BookOpen, Tag } from 'lucide-react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import { shouldShowAcademicSubjects } from '@/Utils/subjectFilters';
import useFilters from '@/Hooks/useFilters';
import { SearchInput, FilterSelect, FilterBar } from '@/Components/Filters';
import { SwipeableListItem, ExpandableCard, MobileListContainer } from '@/Components/Mobile';
import { Badge } from '@/Components/UI';

// Mobile List Item Component - Refactored with new components
function MobileSubjectItem({ subject, auth, onDelete }) {
    const getCategoryColor = (category) => {
        const colors = {
            'core': 'from-blue-500 to-blue-600',
            'elective': 'from-green-500 to-green-600',
            'co-curricular': 'from-purple-500 to-purple-600',
        };
        return colors[category] || 'from-gray-500 to-gray-600';
    };

    // Build swipe actions
    const primaryActions = [
        { icon: Eye, label: 'View', href: `/subjects/${subject.id}` },
        { icon: Edit, label: 'Edit', href: `/subjects/${subject.id}/edit` },
    ];

    const secondaryActions = [
        { icon: Trash2, label: 'Delete', onClick: () => onDelete(subject) },
    ];

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
    const { school } = usePage().props;
    const showAcademicSubjects = shouldShowAcademicSubjects(school?.school_type);

    // Use the new useFilters hook
    const { filters, updateFilter, clearFilters } = useFilters({
        route: '/subjects',
        initialFilters: {
            search: initialFilters.search || '',
            category: initialFilters.category || '',
        },
    });

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState(null);

    const confirmDelete = (subject) => {
        setSelectedSubject(subject);
        setShowDeleteModal(true);
    };

    const handleDelete = () => {
        if (selectedSubject) {
            router.delete(`/subjects/${selectedSubject.id}`, {
                onSuccess: () => {
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
                                    { value: 'islamic', label: 'Islamic' }
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
                        {subjects.data.length > 0 && subjects.data.map((subject) => (
                            <MobileSubjectItem
                                key={subject.id}
                                subject={subject}
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
                                                    variant={subject.category === 'academic' ? 'info' : 'success'}
                                                    value={subject.category === 'academic' ? 'Academic' : 'Islamic'}
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
                                                {search || category ? 'Try adjusting your filters' : 'Get started by adding a new subject'}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {subjects.data.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{subjects.from}</span> to{' '}
                                    <span className="font-medium">{subjects.to}</span> of{' '}
                                    <span className="font-medium">{subjects.total}</span> results
                                </div>
                                <div className="flex gap-2">
                                    {subjects.links.map((link, index) => (
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
                title="Delete Subject"
                message={`Are you sure you want to delete ${selectedSubject?.name}? This action cannot be undone.`}
                confirmText="Delete"
                type="danger"
            />
        </AuthenticatedLayout>
    );
}