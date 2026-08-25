import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useMemo, useCallback } from 'react';
import { Plus, Upload, Users, Eye, Edit, Trash2, FileText, Mail, Phone, User, Calendar, GraduationCap, UserX, UserCheck, CheckCircle, AlertCircle } from 'lucide-react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import GenerateReportModal from '@/Components/Students/GenerateReportModal';
import StudentImportModal from '@/Components/Students/StudentImportModal';
import useFilters from '@/Hooks/useFilters';
import useCumulativeLoading from '@/Hooks/useCumulativeLoading';
import { SearchInput, FilterSelect, FilterBar } from '@/Components/Filters';
import { SwipeableListItem, ExpandableCard, MobileListContainer } from '@/Components/Mobile';
import { Badge } from '@/Components/UI';
import Avatar from '@/Components/Avatar';
import LoadMoreButton from '@/Components/Pagination/LoadMoreButton';
import Pagination from '@/Components/Pagination/Pagination';

// Mobile List Item Component - Refactored with new components
function MobileStudentItem({ student, auth, onDelete, onDeactivate, onReactivate, onGenerateReport }) {
    const isInactive = student.status === 'inactive';

    // Build swipe actions based on user role
    const primaryActions = [
        { icon: Eye, label: 'View', href: `/students/${student.id}` },
    ];

    if (auth.user.role === 'admin') {
        primaryActions.push(
            { icon: Edit, label: 'Edit', href: `/students/${student.id}/edit` },
        );
        if (isInactive) {
            primaryActions.push({ icon: UserCheck, label: 'Reactivate', onClick: () => onReactivate(student) });
        } else {
            primaryActions.push({ icon: UserX, label: 'Deactivate', onClick: () => onDeactivate(student) });
        }
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
                    <div className={`flex items-start gap-3 flex-1 min-w-0 ${isInactive ? 'opacity-70' : ''}`}>
                        {/* Avatar */}
                        <Avatar
                            name={`${student.first_name} ${student.last_name}`}
                            imageUrl={student.profile_picture_url}
                            size="md"
                        />

                        <div className="flex-1 min-w-0">
                            {/* Top Row: Admission Number & Status */}
                            <div className="flex items-center justify-between gap-2 mb-2">
                                <Badge variant="primary" value={student.admission_number} size="sm" />
                                <Badge variant="status" value={student.status} size="sm" />
                            </div>

                            {/* Student Name */}
                            <h3 className={`text-base font-bold truncate mb-2 ${isInactive ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
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
                                    {student.date_of_birth
                                        ? (() => {
                                              const [y, m, d] = student.date_of_birth.slice(0, 10).split('-').map(Number);
                                              return new Date(y, m - 1, d).toLocaleDateString();
                                          })()
                                        : 'N/A'}
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

export default function StudentsIndex({ students, grades, filters: initialFilters = {}, auth, importResults }) {
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
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [showReactivateModal, setShowReactivateModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedStudentForReport, setSelectedStudentForReport] = useState(null);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showResultsBanner, setShowResultsBanner] = useState(!!importResults);

    // Cumulative loading for mobile view
    const {
        items: allStudents,
        isLoadingMore,
        handleLoadMore
    } = useCumulativeLoading(students, filters, 'students.index', 'students');

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

    const confirmDeactivate = useCallback((student) => {
        setSelectedStudent(student);
        setShowDeactivateModal(true);
    }, []);

    const handleDeactivate = useCallback(() => {
        if (selectedStudent) {
            router.patch(`/students/${selectedStudent.id}/deactivate`, {}, {
                onSuccess: () => {
                    setShowDeactivateModal(false);
                    setSelectedStudent(null);
                },
            });
        }
    }, [selectedStudent]);

    const confirmReactivate = useCallback((student) => {
        setSelectedStudent(student);
        setShowReactivateModal(true);
    }, []);

    const handleReactivate = useCallback(() => {
        if (selectedStudent) {
            router.patch(`/students/${selectedStudent.id}/reactivate`, {}, {
                onSuccess: () => {
                    setShowReactivateModal(false);
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
        <AuthenticatedLayout header="All Students">
            <Head title="Students" />

            <div className="space-y-6">
                {/* Import Results Banner */}
                {importResults && showResultsBanner && (
                    <div className={`rounded-xl border p-4 flex items-start gap-3 ${
                        importResults.failed === 0 && importResults.skipped === 0
                            ? 'bg-green-50 border-green-200'
                            : 'bg-yellow-50 border-yellow-200'
                    }`}>
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 text-sm">
                            <p className="font-semibold text-gray-800">
                                Import complete — {importResults.imported} student{importResults.imported !== 1 ? 's' : ''} imported
                                {importResults.skipped > 0 && `, ${importResults.skipped} skipped (duplicate)`}
                                {importResults.failed > 0 && `, ${importResults.failed} failed`}
                            </p>
                            {importResults.errors && importResults.errors.length > 0 && (
                                <ul className="mt-2 space-y-0.5">
                                    {importResults.errors.map((err, i) => (
                                        <li key={i} className="flex items-start gap-1 text-xs text-yellow-800">
                                            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                            Row {err.row} ({err.name}): {err.reason}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <button onClick={() => setShowResultsBanner(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
                    </div>
                )}

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
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowImportModal(true)}
                                className="inline-flex items-center px-4 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Bulk Import
                            </button>
                            <Link
                                href={route('students.create')}
                                className="inline-flex items-center px-6 py-3 bg-orange text-white rounded-lg hover:bg-orange-dark transition-colors shadow-md hover:shadow-lg"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Add Student
                            </Link>
                        </div>
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
                        {allStudents && allStudents.length > 0 && allStudents.map((student) => (
                            <MobileStudentItem
                                key={student.id}
                                student={student}
                                auth={auth}
                                onDelete={confirmDelete}
                                onDeactivate={confirmDeactivate}
                                onReactivate={confirmReactivate}
                                onGenerateReport={handleGenerateReport}
                            />
                        ))}
                    </MobileListContainer>

                    {/* Load More Button for Mobile */}
                    {allStudents && allStudents.length > 0 && (
                        <LoadMoreButton
                            currentCount={allStudents.length}
                            totalCount={students.total}
                            isLoading={isLoadingMore}
                            onLoadMore={handleLoadMore}
                            itemName="students"
                        />
                    )}
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
                                    {students.data && students.data.map((student) => {
                                        const inactive = student.status === 'inactive';
                                        return (
                                        <tr key={student.id} className={`hover:bg-gray-50 transition-colors ${inactive ? 'bg-gray-50/60' : ''}`}>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${inactive ? 'text-gray-400' : 'text-navy'}`}>
                                                {student.admission_number}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                <div className={`flex items-center gap-3 ${inactive ? 'opacity-60' : ''}`}>
                                                    <Avatar
                                                        name={`${student.first_name} ${student.last_name}`}
                                                        imageUrl={student.profile_picture_url}
                                                        size="sm"
                                                    />
                                                    <span className={inactive ? 'line-through text-gray-400' : ''}>
                                                        {student.first_name} {student.last_name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${inactive ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {student.grade?.name || 'No Grade'}
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm capitalize ${inactive ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {student.gender}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge variant="status" value={student.status} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                                <Link
                                                    href={`/students/${student.id}`}
                                                    className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                                                    title="View"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                                {auth.user.role === 'admin' && (
                                                    <>
                                                        <Link
                                                            href={`/students/${student.id}/edit`}
                                                            className="inline-flex items-center text-orange hover:text-orange-dark transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Link>
                                                        {inactive ? (
                                                            <button
                                                                onClick={() => confirmReactivate(student)}
                                                                className="inline-flex items-center text-green-600 hover:text-green-800 transition-colors"
                                                                title="Reactivate student"
                                                            >
                                                                <UserCheck className="w-4 h-4" />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => confirmDeactivate(student)}
                                                                className="inline-flex items-center text-amber-600 hover:text-amber-800 transition-colors"
                                                                title="Deactivate student"
                                                            >
                                                                <UserX className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination for Desktop */}
                        <Pagination
                            links={students.links}
                            currentPage={students.current_page}
                            lastPage={students.last_page}
                            total={students.total}
                            from={students.from}
                            to={students.to}
                        />
                    </div>
                </div>
            </div>

            {/* Delete (hard) — kept for admin use if needed */}
            <ConfirmationModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Student"
                message={`Are you sure you want to permanently delete ${selectedStudent?.first_name} ${selectedStudent?.last_name}? This action cannot be undone.`}
                confirmText="Delete"
                type="danger"
            />

            {/* Deactivate */}
            <ConfirmationModal
                show={showDeactivateModal}
                onClose={() => setShowDeactivateModal(false)}
                onConfirm={handleDeactivate}
                title="Deactivate Student"
                message={`This will mark ${selectedStudent?.first_name} ${selectedStudent?.last_name} as inactive. All their attendance, exam results and reports are kept and can still be reviewed. You can reactivate them at any time.`}
                confirmText="Deactivate"
                type="warning"
            />

            {/* Reactivate */}
            <ConfirmationModal
                show={showReactivateModal}
                onClose={() => setShowReactivateModal(false)}
                onConfirm={handleReactivate}
                title="Reactivate Student"
                message={`Reactivate ${selectedStudent?.first_name} ${selectedStudent?.last_name} and mark them as active again?`}
                confirmText="Reactivate"
                type="success"
            />

            <GenerateReportModal
                student={selectedStudentForReport}
                show={showReportModal}
                onClose={() => setShowReportModal(false)}
            />

            <StudentImportModal
                show={showImportModal}
                onClose={() => setShowImportModal(false)}
            />
        </AuthenticatedLayout>
    );
}