import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useMemo, useCallback } from 'react';
import { Plus, Users, Eye, Edit, Trash2, FileText, Mail, Phone, User, Calendar, GraduationCap } from 'lucide-react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import GenerateReportModal from '@/Components/Students/GenerateReportModal';
import useFilters from '@/Hooks/useFilters';
import { SearchInput, FilterSelect, FilterBar } from '@/Components/Filters';
import { SwipeableListItem, ExpandableCard, MobileListContainer } from '@/Components/Mobile';
import { Badge } from '@/Components/UI';

// Mobile List Item Component - Refactored with new components
function MobileStudentItem({ student, auth, onDelete, onGenerateReport }) {
    // Build swipe actions based on user role
    const primaryActions = [
        { icon: Eye, label: 'View', href: `/students/${student.id}` },
    ];

    if (auth.user.role === 'admin') {
        primaryActions.push(
            { icon: Edit, label: 'Edit', href: `/students/${student.id}/edit` },
            { icon: Trash2, label: 'Delete', onClick: () => onDelete(student) }
        );
    }

    const secondaryActions = [
        { icon: FileText, label: 'Report', onClick: () => onGenerateReport(student) },
    ];

    return (
        <SwipeableListItem
            primaryActions={primaryActions}
            secondaryActions={secondaryActions}
        >
            <ExpandableCard
                header={
                    <div className="flex-1 min-w-0">
                        {/* Top Row: Admission Number & Status */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <Badge variant="primary" value={student.admission_number} size="sm" />
                            <Badge variant="status" value={student.status} size="sm" />
                        </div>

                        {/* Student Name */}
                        <h3 className="text-base font-bold text-gray-900 truncate mb-2">
                            {student.first_name} {student.last_name}
                        </h3>

                        {/* Grade & Gender */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                <GraduationCap className="w-3.5 h-3.5 text-gray-400" />
                                <span className="font-medium">{student.grade?.name || 'No Grade'}</span>
                            </div>
                            <span className="text-gray-300">•</span>
                            <span className="text-xs text-gray-600 capitalize">{student.gender}</span>
                        </div>
                    </div>
                }
            >
                {/* Expanded Details */}
                <div className="px-4 pb-4 pt-3 space-y-3">
                    {/* Info Grid */}
                    <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-center gap-2.5 text-sm">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                                <Calendar className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 mb-0.5">Date of Birth</p>
                                <p className="text-sm font-medium text-gray-900">
                                    {new Date(student.date_of_birth).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        {student.guardian && (
                            <>
                                <div className="flex items-center gap-2.5 text-sm">
                                    <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                                        <Users className="w-4 h-4 text-purple-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-500 mb-0.5">Guardian</p>
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {student.guardian.user?.name}
                                        </p>
                                    </div>
                                </div>

                                {student.guardian.phone_number && (
                                    <div className="flex items-center gap-2.5 text-sm">
                                        <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                                            <Phone className="w-4 h-4 text-green-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                                            <p className="text-sm font-medium text-gray-900">
                                                {student.guardian.phone_number}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                        <Link
                            href={`/students/${student.id}`}
                            className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-xs font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow active:scale-95"
                        >
                            <Eye className="w-3.5 h-3.5" />
                            View
                        </Link>
                        {auth.user.role === 'admin' && (
                            <Link
                                href={`/students/${student.id}/edit`}
                                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg text-xs font-semibold hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-sm hover:shadow active:scale-95"
                            >
                                <Edit className="w-3.5 h-3.5" />
                                Edit
                            </Link>
                        )}
                        <button
                            onClick={() => onGenerateReport(student)}
                            className={`flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg text-xs font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-sm hover:shadow active:scale-95 ${
                                auth.user.role === 'admin' ? '' : 'col-span-2'
                            }`}
                        >
                            <FileText className="w-3.5 h-3.5" />
                            Report
                        </button>

                        {auth.user.role === 'admin' && (
                            <button
                                onClick={() => onDelete(student)}
                                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg text-xs font-semibold hover:from-red-700 hover:to-red-800 transition-all shadow-sm hover:shadow active:scale-95"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                            </button>
                        )}
                    </div>
                </div>
            </ExpandableCard>
        </SwipeableListItem>
    );
}

export default function StudentsIndex({ students, grades, filters: initialFilters = {}, auth }) {
    // Use the new useFilters hook
    const { filters, updateFilter, clearFilters } = useFilters({
        route: '/students',
        initialFilters: {
            search: initialFilters.search || '',
            grade_id: initialFilters.grade_id || '',
            gender: initialFilters.gender || '',
            status: initialFilters.status || '',
        },
    });

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedStudentForReport, setSelectedStudentForReport] = useState(null);

    // Memoize filter options that don't change
    const gradeOptions = useMemo(() =>
        grades.map(g => ({ value: g.id, label: g.name })),
        [grades]
    );

    const genderOptions = useMemo(() => [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
    ], []);

    const statusOptions = useMemo(() => [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
    ], []);

    // Memoize handlers passed to child components
    const confirmDelete = useCallback((student) => {
        setSelectedStudent(student);
        setShowDeleteModal(true);
    }, []);

    const handleDelete = useCallback(() => {
        if (selectedStudent) {
            router.delete(`/students/${selectedStudent.id}`, {
                onSuccess: () => {
                    setShowDeleteModal(false);
                    setSelectedStudent(null);
                },
            });
        }
    }, [selectedStudent]);

    const handleGenerateReport = useCallback((student) => {
        setSelectedStudentForReport(student);
        setShowReportModal(true);
    }, []);

    return (
        <AuthenticatedLayout header="Students">
            <Head title="Students" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex items-center space-x-3">
                        <Users className="w-8 h-8 text-orange" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Students</h2>
                            <p className="text-sm text-gray-600">Manage student records and information</p>
                        </div>
                    </div>

                    {auth.user.role === 'admin' && (
                        <Link
                            href={route('students.create')}
                            className="inline-flex items-center px-6 py-3 bg-orange text-white rounded-lg hover:bg-orange-dark transition-colors shadow-md hover:shadow-lg"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Add Student
                        </Link>
                    )}
                </div>

                {/* Filters - Refactored with new components */}
                <FilterBar onClear={clearFilters} gridCols="4">
                    <SearchInput
                        value={filters.search}
                        onChange={(e) => updateFilter('search', e.target.value)}
                        placeholder="Search students..."
                    />

                    <FilterSelect
                        value={filters.grade_id}
                        onChange={(e) => updateFilter('grade_id', e.target.value)}
                        options={gradeOptions}
                        allLabel="All Grades"
                        hideLabel
                    />

                    <FilterSelect
                        value={filters.gender}
                        onChange={(e) => updateFilter('gender', e.target.value)}
                        options={genderOptions}
                        allLabel="All Genders"
                        hideLabel
                    />

                    <FilterSelect
                        value={filters.status}
                        onChange={(e) => updateFilter('status', e.target.value)}
                        options={statusOptions}
                        allLabel="All Status"
                        hideLabel
                    />
                </FilterBar>

                {/* Mobile List View - Refactored with MobileListContainer */}
                <div className="block md:hidden">
                    <MobileListContainer
                        emptyState={{
                            icon: Users,
                            title: 'No students found',
                            message: 'Try adjusting your filters',
                        }}
                    >
                        {students.data && students.data.length > 0 && students.data.map((student) => (
                            <MobileStudentItem
                                key={student.id}
                                student={student}
                                auth={auth}
                                onDelete={confirmDelete}
                                onGenerateReport={handleGenerateReport}
                            />
                        ))}
                    </MobileListContainer>
                </div>

                {/* Desktop Table View - UNCHANGED */}
                <div className="hidden md:block">
                    {/* Your existing StudentsTable component or table markup */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                {/* Keep your existing desktop table exactly as it is */}
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Admission No</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Grade</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Gender</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {students.data && students.data.map((student) => (
                                        <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-navy">
                                                {student.admission_number}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {student.first_name} {student.last_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {student.grade?.name || 'No Grade'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                                                {student.gender}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge variant="status" value={student.status} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                                <Link
                                                    href={`/students/${student.id}`}
                                                    className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                                {auth.user.role === 'admin' && (
                                                    <>
                                                        <Link
                                                            href={`/students/${student.id}/edit`}
                                                            className="inline-flex items-center text-orange hover:text-orange-dark transition-colors"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Link>
                                                        <button
                                                            onClick={() => confirmDelete(student)}
                                                            className="inline-flex items-center text-red-600 hover:text-red-800 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Student"
                message={`Are you sure you want to delete ${selectedStudent?.first_name} ${selectedStudent?.last_name}? This action cannot be undone.`}
                confirmText="Delete"
                type="danger"
            />

            <GenerateReportModal
                student={selectedStudentForReport}
                show={showReportModal}
                onClose={() => setShowReportModal(false)}
            />
        </AuthenticatedLayout>
    );
}