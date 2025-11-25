import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Eye, Edit, Trash2, Users, BookOpen, Tag, Archive, RefreshCw } from 'lucide-react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import useFilters from '@/Hooks/useFilters';
import { SearchInput, FilterSelect, FilterBar } from '@/Components/Filters';
import { Badge } from '@/Components/UI';

export default function GradesIndex({ grades, filters: initialFilters = {}, auth }) {
    const { school } = usePage().props;
    const isMadrasah = school?.school_type === 'madrasah';

    // Use the new useFilters hook
    const { filters, updateFilter, clearFilters } = useFilters({
        route: '/grades',
        initialFilters: {
            search: initialFilters.search || '',
            level: initialFilters.level || '',
            show_archived: initialFilters.show_archived || '',
        },
    });

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showUnarchiveModal, setShowUnarchiveModal] = useState(false);
    const [selectedGrade, setSelectedGrade] = useState(null);

    const confirmDelete = (grade) => {
        setSelectedGrade(grade);
        setShowDeleteModal(true);
    };

    const confirmUnarchive = (grade) => {
        setSelectedGrade(grade);
        setShowUnarchiveModal(true);
    };

    const isUnassignedGrade = (grade) => {
        return grade.code === 'UNASSIGNED' || grade.name === 'Unassigned';
    };

    const isArchivedGrade = (grade) => {
        return grade.deleted_at !== null;
    };

    const handleDelete = () => {
        if (selectedGrade) {
            router.delete(route('grades.destroy', selectedGrade.id), {
                onSuccess: () => {
                    setShowDeleteModal(false);
                    setSelectedGrade(null);
                },
                onError: (errors) => {
                    // Keep modal open to show error
                    console.error('Delete error:', errors);
                },
            });
        }
    };

    const handleUnarchive = () => {
        if (selectedGrade) {
            router.post(route('grades.restore', selectedGrade.id), {}, {
                onSuccess: () => {
                    setShowUnarchiveModal(false);
                    setSelectedGrade(null);
                },
                onError: (errors) => {
                    console.error('Unarchive error:', errors);
                },
            });
        }
    };

    const getLevelBadgeColor = (level) => {
        const colors = {
            'ECD': 'bg-purple-100 text-purple-800',
            'LOWER PRIMARY': 'bg-blue-100 text-blue-800',
            'UPPER PRIMARY': 'bg-green-100 text-green-800',
            'JUNIOR SECONDARY': 'bg-orange-100 text-orange-800',
        };
        return colors[level] || 'bg-gray-100 text-gray-800';
    };

    return (
        <AuthenticatedLayout header="Grades Management">
            <Head title="Grades" />

            <div className="space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex items-center space-x-3">
                        <BookOpen className="w-6 sm:w-8 h-6 sm:h-8 text-orange" />
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Grades</h2>
                            <p className="text-xs sm:text-sm text-gray-600">
                                Manage grades and class levels
                            </p>
                        </div>
                    </div>

                    {/* Search and Filter - Refactored with FilterBar */}
                    <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                        <div className="flex-1 w-full lg:max-w-3xl">
                            <FilterBar onClear={clearFilters} gridCols={isMadrasah ? "2" : "3"}>
                                <SearchInput
                                    value={filters.search}
                                    onChange={(e) => updateFilter('search', e.target.value)}
                                    placeholder="Search grades..."
                                />
                                {!isMadrasah && (
                                    <FilterSelect
                                        value={filters.level}
                                        onChange={(e) => updateFilter('level', e.target.value)}
                                        options={[
                                            { value: 'ECD', label: 'ECD' },
                                            { value: 'LOWER PRIMARY', label: 'Lower Primary' },
                                            { value: 'UPPER PRIMARY', label: 'Upper Primary' },
                                            { value: 'JUNIOR SECONDARY', label: 'Junior Secondary' }
                                        ]}
                                        allLabel="All Levels"
                                        hideLabel
                                    />
                                )}
                                <FilterSelect
                                    value={filters.show_archived}
                                    onChange={(e) => updateFilter('show_archived', e.target.value)}
                                    options={[
                                        { value: 'true', label: 'All (Including Archived)' },
                                        { value: 'only', label: 'Archived Only' }
                                    ]}
                                    allLabel="Active Only"
                                    hideLabel
                                />
                            </FilterBar>
                        </div>

                        {auth.user.role === 'admin' && (
                            <Link
                                href={route('grades.create')}
                                className="inline-flex items-center justify-center px-6 py-3 bg-orange text-white text-sm font-medium rounded-lg hover:bg-orange-dark transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Add Grade
                            </Link>
                        )}
                    </div>
                </div>

                {/* Grades Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
                    {grades.length > 0 ? (
                        grades.map((grade) => {
                            const isUnassigned = isUnassignedGrade(grade);
                            const isArchived = isArchivedGrade(grade);
                            const hasHistoricalData = grade.students_count > 0 || grade.exams_count > 0;

                            return (
                                <div
                                key={grade.id}
                                className={`rounded-xl border-2 overflow-hidden transition-all duration-300 ${
                                    isArchived
                                        ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-300 shadow-md hover:shadow-xl hover:border-red-400'
                                        : isUnassigned
                                        ? 'bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-300 shadow-md hover:shadow-xl hover:border-amber-400'
                                        : 'bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-sm hover:shadow-lg hover:border-blue-300'
                                }`}
                            >
                                {/* Card Header */}
                                <div className={`p-4 md:p-5 border-b ${
                                    isArchived ? 'border-red-200/60' : isUnassigned ? 'border-gray-300/60' : 'border-gray-200/60'
                                }`}>
                                    <div className="flex items-start justify-between mb-2.5">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1.5 truncate">
                                                {grade.name}
                                            </h3>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {grade.code && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100/80 text-gray-600 border border-gray-200/50">
                                                        <Tag className="w-3 h-3 mr-1" />
                                                        {grade.code}
                                                    </span>
                                                )}
                                                {!isMadrasah && grade.level && (
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getLevelBadgeColor(grade.level)}`}>
                                                        {grade.level}
                                                    </span>
                                                )}
                                                {isUnassigned && (
                                                    <Badge variant="secondary" value="System" size="sm" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 ml-2">
                                            <Badge
                                                variant="status"
                                                value={grade.status}
                                                size="sm"
                                            />
                                            {grade.deleted_at && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100/80 text-gray-700 border border-gray-200/50">
                                                    <Archive className="w-3 h-3 mr-1" />
                                                    Archived
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-3 text-sm flex-wrap">
                                        <div className="flex items-center text-blue-600 bg-blue-50/80 px-2.5 py-1 rounded border border-blue-200/50">
                                            <Users className="w-3.5 h-3.5 mr-1.5" />
                                            <span className="font-semibold text-xs md:text-sm">
                                                {grade.students_count}
                                            </span>
                                            <span className="ml-1 text-xs font-medium hidden sm:inline">
                                                student{grade.students_count !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <div className="flex items-center text-green-600 bg-green-50/80 px-2.5 py-1 rounded border border-green-200/50">
                                            <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                                            <span className="font-semibold text-xs md:text-sm">
                                                {grade.subjects_count}
                                            </span>
                                            <span className="ml-1 text-xs font-medium hidden sm:inline">
                                                subject{grade.subjects_count !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="p-3 md:p-4">
                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        {/* Archived Grade - Show only Unarchive button */}
                                        {isArchived && auth.user.role === 'admin' ? (
                                            <button
                                                onClick={() => confirmUnarchive(grade)}
                                                className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs md:text-sm font-medium text-green-600 bg-green-50/80 border border-green-200/50 rounded hover:bg-green-100 transition-colors"
                                            >
                                                <RefreshCw className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5" />
                                                <span>Unarchive Class</span>
                                            </button>
                                        ) : (
                                            <>
                                                {/* Normal Grade - Show View, Edit, Delete */}
                                                <Link
                                                    href={`/grades/${grade.id}`}
                                                    className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs md:text-sm font-medium text-blue-600 bg-blue-50/80 border border-blue-200/50 rounded hover:bg-blue-100 transition-colors"
                                                >
                                                    <Eye className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5" />
                                                    <span className="hidden sm:inline">View</span>
                                                </Link>
                                                {auth.user.role === 'admin' && !isUnassigned && (
                                                    <>
                                                        <Link
                                                            href={`/grades/${grade.id}/edit`}
                                                            className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs md:text-sm font-medium text-orange bg-orange-50/80 border border-orange-200/50 rounded hover:bg-orange-100 transition-colors"
                                                        >
                                                            <Edit className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5" />
                                                            <span className="hidden sm:inline">Edit</span>
                                                        </Link>
                                                        <button
                                                            onClick={() => confirmDelete(grade)}
                                                            className="inline-flex items-center justify-center px-3 py-2 text-xs md:text-sm font-medium text-red-600 bg-red-50/80 border border-red-200/50 rounded hover:bg-red-100 transition-colors"
                                                            title={hasHistoricalData ? "Archive grade" : "Delete grade"}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                                        </button>
                                                    </>
                                                )}
                                                {isUnassigned && (
                                                    <div className="flex-1 text-center text-xs md:text-sm text-gray-600 bg-gray-100/80 border border-gray-200/50 rounded px-3 py-2 font-medium">
                                                        System grade - Protected
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                        })
                    ) : (
                        <div className="col-span-full">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                                <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No grades found</h3>
                                <p className="text-gray-600 mb-6">
                                    {filters.search || filters.level ? 'Try adjusting your filters' : 'Get started by creating your first grade'}
                                </p>
                                {auth.user.role === 'admin' && !filters.search && !filters.level && (
                                    <Link
                                        href={route('grades.create')}
                                        className="inline-flex items-center px-6 py-3 bg-orange text-white text-sm font-medium rounded-lg hover:bg-orange-dark transition-colors"
                                    >
                                        <Plus className="w-5 h-5 mr-2" />
                                        Add First Grade
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete/Archive Confirmation Modal */}
            <ConfirmationModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title={
                    selectedGrade?.students_count > 0 || selectedGrade?.exams_count > 0
                        ? "Archive Grade"
                        : "Delete Grade"
                }
                message={
                    selectedGrade?.students_count > 0 ? (
                        <div className="space-y-3">
                            <p>You are about to archive <strong>{selectedGrade?.name}</strong>.</p>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 md:p-4">
                                <p className="text-xs md:text-sm text-yellow-800">
                                    ⚠️ This grade has <strong>{selectedGrade?.students_count} student(s)</strong> enrolled.
                                </p>
                                <p className="text-xs md:text-sm text-yellow-800 mt-2">
                                    All students will be automatically moved to the <strong>"Unassigned"</strong> grade.
                                </p>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
                                <p className="text-xs md:text-sm text-blue-800">
                                    ℹ️ Historical exam and attendance records will be preserved.
                                </p>
                            </div>
                            <p className="text-xs md:text-sm text-gray-600">
                                The grade will be archived and can be restored later if needed.
                            </p>
                        </div>
                    ) : selectedGrade?.exams_count > 0 ? (
                        <div className="space-y-3">
                            <p>You are about to archive <strong>{selectedGrade?.name}</strong>.</p>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
                                <p className="text-xs md:text-sm text-blue-800">
                                    ℹ️ This grade has historical exam or attendance records that will be preserved.
                                </p>
                            </div>
                            <p className="text-xs md:text-sm text-gray-600">
                                The grade will be archived and can be restored later if needed.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p>Are you sure you want to permanently delete <strong>{selectedGrade?.name}</strong>?</p>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4">
                                <p className="text-xs md:text-sm text-red-800">
                                    ⚠️ This action cannot be undone. The grade will be permanently deleted.
                                </p>
                            </div>
                            <p className="text-xs md:text-sm text-gray-600">
                                This grade has no students, exams, or attendance records.
                            </p>
                        </div>
                    )
                }
                confirmText={
                    selectedGrade?.students_count > 0 || selectedGrade?.exams_count > 0
                        ? "Archive Grade"
                        : "Delete Permanently"
                }
                type={
                    selectedGrade?.students_count > 0 || selectedGrade?.exams_count > 0
                        ? "warning"
                        : "danger"
                }
            />

            {/* Unarchive Confirmation Modal */}
            <ConfirmationModal
                show={showUnarchiveModal}
                onClose={() => setShowUnarchiveModal(false)}
                onConfirm={handleUnarchive}
                title="Unarchive Grade"
                message={
                    <div className="space-y-3">
                        <p>Are you sure you want to unarchive <strong>{selectedGrade?.name}</strong>?</p>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 md:p-4">
                            <p className="text-xs md:text-sm text-green-800">
                                ✓ This will restore the grade and set its status to <strong>active</strong>.
                            </p>
                        </div>
                        <p className="text-xs md:text-sm text-gray-600">
                            The grade will be available for use again.
                        </p>
                    </div>
                }
                confirmText="Unarchive Grade"
                type="success"
            />
        </AuthenticatedLayout>
    );
}