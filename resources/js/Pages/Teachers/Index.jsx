import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useCallback } from 'react';
import { Plus, Eye, Edit, Trash2, BookOpen, Mail, Phone, User, GraduationCap } from 'lucide-react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import useFilters from '@/Hooks/useFilters';
import { SearchInput } from '@/Components/Filters';
import { SwipeableListItem, ExpandableCard, MobileListContainer } from '@/Components/Mobile';
import { Badge } from '@/Components/UI';

// Mobile List Item Component - Refactored with new components
function MobileTeacherItem({ teacher, auth, onDelete }) {
    // Build swipe actions
    const primaryActions = [
        { icon: Eye, label: 'View', color: 'blue', href: `/teachers/${teacher.id}` },
        { icon: Edit, label: 'Edit', color: 'indigo', href: `/teachers/${teacher.id}/edit` },
        { icon: Trash2, label: 'Delete', color: 'red', onClick: () => onDelete(teacher) },
    ];

    const secondaryActions = teacher.user?.phone ? [
        { icon: Phone, label: 'Call', color: 'green', href: `tel:${teacher.user.phone}` },
    ] : [];

    return (
        <SwipeableListItem
            primaryActions={primaryActions}
            secondaryActions={secondaryActions}
        >
            <ExpandableCard
                header={
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            {/* Employee Number Badge */}
                            <div className="mb-2">
                                <Badge variant="primary" value={teacher.employee_number} size="sm" />
                            </div>

                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-base font-bold text-gray-900 truncate">
                                    {teacher.user?.name}
                                </h3>
                                <Badge
                                    variant="status"
                                    value={teacher.status}
                                    size="sm"
                                    className="flex-shrink-0 ml-2"
                                />
                            </div>

                            <div className="flex items-center gap-2 flex-wrap mb-2">
                                <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-blue-100 text-blue-700">
                                    {teacher.subject_specialization || 'No Subject'}
                                </span>
                                {teacher.grades && teacher.grades.length > 0 && (
                                    <>
                                        <span className="text-gray-400">•</span>
                                        <span className="text-xs text-gray-500">
                                            {teacher.grades.length} class{teacher.grades.length !== 1 ? 'es' : ''}
                                        </span>
                                    </>
                                )}
                            </div>

                            {/* Additional Info in Summary */}
                            <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500">
                                {teacher.user?.email && (
                                    <div className="flex items-center gap-1">
                                        <Mail className="w-3 h-3" />
                                        <span className="truncate max-w-[150px]">{teacher.user.email}</span>
                                    </div>
                                )}
                                {teacher.user?.phone && (
                                    <>
                                        {teacher.user?.email && <span className="text-gray-400">•</span>}
                                        <div className="flex items-center gap-1">
                                            <Phone className="w-3 h-3" />
                                            <span>{teacher.user.phone}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                }
            >

                {/* Expanded Details */}
                <div className="space-y-3">
                    <div className="bg-white rounded-lg p-3 border border-gray-200 space-y-2">
                        {teacher.gender && (
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="text-xs text-gray-600 capitalize">{teacher.gender}</span>
                            </div>
                        )}

                        {teacher.date_of_birth && (
                            <div className="flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="text-xs text-gray-600">
                                    DOB: {new Date(teacher.date_of_birth).toLocaleDateString()}
                                </span>
                            </div>
                        )}

                        {teacher.qualification && (
                            <div className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="text-xs text-gray-600">{teacher.qualification}</span>
                            </div>
                        )}

                        {teacher.hire_date && (
                            <div className="flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="text-xs text-gray-600">
                                    Hired: {new Date(teacher.hire_date).toLocaleDateString()}
                                </span>
                            </div>
                        )}

                        {teacher.grades && teacher.grades.length > 0 && (
                            <div className="flex items-start gap-2 border-t border-gray-100 mt-2 pt-2">
                                <GraduationCap className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-gray-500 mb-1">Assigned Classes:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {teacher.grades.map((grade) => (
                                            <span
                                                key={grade.id}
                                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                    grade.pivot.is_class_teacher
                                                        ? 'bg-orange-600 text-white'
                                                        : 'bg-orange-100 text-orange-700'
                                                }`}
                                            >
                                                {grade.name}
                                                {grade.pivot.is_class_teacher && ' ★'}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                        <Link
                            href={`/teachers/${teacher.id}`}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                        >
                            <Eye className="w-3.5 h-3.5" />
                            View
                        </Link>
                        <Link
                            href={`/teachers/${teacher.id}/edit`}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors"
                        >
                            <Edit className="w-3.5 h-3.5" />
                            Edit
                        </Link>

                        {teacher.user?.email && (
                            <a
                                href={`mailto:${teacher.user.email}`}
                                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                            >
                                <Mail className="w-3.5 h-3.5" />
                                Email
                            </a>
                        )}

                        <button
                            onClick={() => onDelete(teacher)}
                            className={`flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors ${
                                teacher.user?.email ? '' : 'col-span-2'
                            }`}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                        </button>
                    </div>
                </div>
            </ExpandableCard>
        </SwipeableListItem>
    );
}

export default function TeachersIndex({ teachers, filters: initialFilters = {}, auth }) {
    // Use the new useFilters hook
    const { filters, updateFilter } = useFilters({
        route: '/teachers',
        initialFilters: {
            search: initialFilters.search || '',
        },
    });

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState(null);

    // Memoize handlers passed to child components
    const confirmDelete = useCallback((teacher) => {
        setSelectedTeacher(teacher);
        setShowDeleteModal(true);
    }, []);

    const handleDelete = useCallback(() => {
        if (selectedTeacher) {
            router.delete(`/teachers/${selectedTeacher.id}`, {
                onSuccess: () => {
                    setShowDeleteModal(false);
                    setSelectedTeacher(null);
                },
            });
        }
    }, [selectedTeacher]);

    return (
        <AuthenticatedLayout header="Teachers Management">
            <Head title="Teachers" />

            <div className="space-y-6">
                {/* Header Actions - Refactored with SearchInput */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex-1 w-full sm:max-w-md">
                        <SearchInput
                            value={filters.search}
                            onChange={(e) => updateFilter('search', e.target.value)}
                            placeholder="Search teachers..."
                        />
                    </div>

                    <Link
                        href={route('teachers.create')}
                        className="inline-flex items-center px-4 py-2.5 bg-orange text-white text-sm font-medium rounded-lg hover:bg-orange-dark transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Teacher
                    </Link>
                </div>

                {/* Mobile List View - Refactored with MobileListContainer */}
                <div className="block md:hidden">
                    <MobileListContainer
                        emptyState={{
                            icon: GraduationCap,
                            title: 'No teachers found',
                            message: 'Try adjusting your search',
                        }}
                    >
                        {teachers.data && teachers.data.length > 0 && teachers.data.map((teacher) => (
                            <MobileTeacherItem
                                key={teacher.id}
                                teacher={teacher}
                                auth={auth}
                                onDelete={confirmDelete}
                            />
                        ))}
                    </MobileListContainer>
                </div>

                {/* Desktop Table View - UNCHANGED */}
                <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Employee No.
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Subject
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Assigned Grades
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
                                {teachers.data.map((teacher) => (
                                    <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-navy">
                                            {teacher.employee_number}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {teacher.user?.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {teacher.user?.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {teacher.subject_specialization || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {teacher.grades && teacher.grades.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {teacher.grades.map((grade) => (
                                                        <span
                                                            key={grade.id}
                                                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                                grade.pivot.is_class_teacher
                                                                    ? 'bg-orange text-white'
                                                                    : 'bg-orange bg-opacity-10 text-orange'
                                                            }`}
                                                        >
                                                            <BookOpen className="w-3 h-3 mr-1" />
                                                            {grade.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic">None</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge variant="status" value={teacher.status} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                            <Link
                                                href={`/teachers/${teacher.id}`}
                                                className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                            <Link
                                                href={`/teachers/${teacher.id}/edit`}
                                                className="inline-flex items-center text-orange hover:text-orange-dark transition-colors"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => confirmDelete(teacher)}
                                                className="inline-flex items-center text-red-600 hover:text-red-800 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="text-sm text-gray-700">
                                Showing <span className="font-medium">{teachers.from}</span> to{' '}
                                <span className="font-medium">{teachers.to}</span> of{' '}
                                <span className="font-medium">{teachers.total}</span> results
                            </div>
                            <div className="flex gap-2">
                                {teachers.links.map((link, index) => (
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
                </div>
            </div>

            <ConfirmationModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Teacher"
                message={`Are you sure you want to delete ${selectedTeacher?.user?.name}? This action cannot be undone.`}
                confirmText="Delete"
                type="danger"
            />
        </AuthenticatedLayout>
    );
}