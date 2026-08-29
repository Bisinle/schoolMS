import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, BookOpen, Eye, Edit, Trash2, Calendar, User, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import useFilters from '@/Hooks/useFilters';
import { SearchInput, FilterSelect, FilterBar } from '@/Components/Filters';
import { SwipeableListItem, ExpandableCard, MobileListContainer } from '@/Components/Mobile';
import { useState } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import usePermissions from '@/Hooks/usePermissions';

const STATUS_BADGES = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'graded': 'bg-green-100 text-green-800',
    'absent': 'bg-red-100 text-red-800',
    'not_prepared': 'bg-pink-100 text-pink-800',
};

const STATUS_LABELS = {
    'pending': 'Pending',
    'graded': 'Graded',
    'absent': 'Absent',
    'not_prepared': 'Not Prepared',
};

const READING_TYPE_BADGES = {
    'new_learning': 'bg-blue-100 text-blue-800',
    'revision': 'bg-green-100 text-green-800',
    'subac': 'bg-purple-100 text-purple-800',
};

const getStatusIcon = (status) => {
    if (status === 'graded') return CheckCircle;
    if (status === 'absent') return XCircle;
    if (status === 'not_prepared') return AlertTriangle;
    return Clock;
};

// Mobile Homework Item Component
function MobileHomeworkItem({ homework, auth }) {
    const { can } = usePermissions();
    const StatusIcon = getStatusIcon(homework.status);

    // quran-homework.update alone is enough here (no ownership check
    // needed): QuranHomeworkController::index() already scopes a
    // teacher's query to their own records server-side, so every homework
    // a teacher sees in this list is already theirs.
    const primaryActions = [
        { icon: Eye, label: 'View', href: `/quran-homework/${homework.id}`, color: 'indigo' },
        ...(can('quran-homework.update') ? [
            { icon: Edit, label: 'Edit', href: `/quran-homework/${homework.id}/edit`, color: 'green' }
        ] : []),
    ];

    const secondaryActions = can('quran-homework.update') ? [
        {
            icon: Trash2,
            label: 'Delete',
            onClick: () => {
                if (confirm('Are you sure you want to delete this homework?')) {
                    router.delete(`/quran-homework/${homework.id}`);
                }
            },
            color: 'red'
        },
    ] : [];

    // Header content
    const header = (
        <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-gray-900 truncate leading-tight">
                    {homework.student.first_name} {homework.student.last_name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <span className="truncate">{homework.student.admission_number}</span>
                    <span>•</span>
                    <span className="truncate">{homework.student.grade?.name || 'No Grade'}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap mt-2">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg">
                        <Calendar className="w-3.5 h-3.5" />
                        Assigned: {new Date(homework.assigned_date).toLocaleDateString()}
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${STATUS_BADGES[homework.status] || 'bg-gray-100 text-gray-800'}`}>
                        <StatusIcon className="w-3 h-3" />
                        {STATUS_LABELS[homework.status] || homework.status_label}
                    </span>
                </div>
            </div>
        </div>
    );

    // Expanded content
    const expandedContent = (
        <div className="space-y-3">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200/50 shadow-sm">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange/10 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-orange" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                            {homework.reading_type_label}
                        </div>
                        <div className="text-sm font-bold text-gray-900">
                            Surah {homework.surah_from} - {homework.surah_to}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                            Verses {homework.verse_from} - {homework.verse_to}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
                <User className="w-3.5 h-3.5" />
                <span>Assigned by: {homework.teacher.name}</span>
            </div>
        </div>
    );

    return (
        <SwipeableListItem
            primaryActions={primaryActions}
            secondaryActions={secondaryActions}
        >
            <ExpandableCard
                header={header}
                expandedContent={expandedContent}
            />
        </SwipeableListItem>
    );
}

export default function Index({ homework, students, filters: initialFilters = {} }) {
    const { filters, updateFilter, clearFilters } = useFilters({
        route: '/quran-homework',
        initialFilters: {
            status: initialFilters.status || '',
            student_id: initialFilters.student_id || '',
            reading_type: initialFilters.reading_type || '',
        },
    });

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [homeworkToDelete, setHomeworkToDelete] = useState(null);

    const handleDelete = (id) => {
        setHomeworkToDelete(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (homeworkToDelete) {
            router.delete(`/quran-homework/${homeworkToDelete}`, {
                onSuccess: () => {
                    setShowDeleteModal(false);
                    setHomeworkToDelete(null);
                }
            });
        }
    };

    return (
        <AuthenticatedLayout header="Quran Homework">
            <Head title="Quran Homework" />

            <div className="py-6 sm:py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center space-x-3">
                            <BookOpen className="w-8 h-8 text-orange" />
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Quran Homework</h2>
                                <p className="text-sm text-gray-600">Manage homework assignments</p>
                            </div>
                        </div>
                        <Link
                            href="/quran-homework/create"
                            className="inline-flex items-center px-4 py-2 bg-orange text-white text-sm font-bold rounded-lg hover:bg-orange-dark transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Assign Homework
                        </Link>
                    </div>

                    {/* Filters */}
                    <FilterBar onReset={clearFilters}>
                        <FilterSelect
                            label="Status"
                            value={filters.status}
                            onChange={(e) => updateFilter('status', e.target.value)}
                            options={[
                                { value: '', label: 'All Statuses' },
                                { value: 'pending', label: 'Pending' },
                                { value: 'graded', label: 'Graded' },
                                { value: 'absent', label: 'Absent' },
                                { value: 'not_prepared', label: 'Not Prepared' },
                            ]}
                        />
                        <FilterSelect
                            label="Student"
                            value={filters.student_id}
                            onChange={(e) => updateFilter('student_id', e.target.value)}
                            options={[
                                { value: '', label: 'All Students' },
                                ...students.map(s => ({
                                    value: s.id,
                                    label: `${s.first_name} ${s.last_name} (${s.admission_number})`
                                }))
                            ]}
                        />
                        <FilterSelect
                            label="Reading Type"
                            value={filters.reading_type}
                            onChange={(e) => updateFilter('reading_type', e.target.value)}
                            options={[
                                { value: '', label: 'All Types' },
                                { value: 'new_learning', label: 'New Learning' },
                                { value: 'revision', label: 'Revision' },
                                { value: 'subac', label: 'Subac' },
                            ]}
                        />
                    </FilterBar>

                    {/* Mobile View */}
                    <div className="md:hidden">
                        <MobileListContainer>
                            {homework.data.length > 0 ? (
                                homework.data.map((hw) => (
                                    <MobileHomeworkItem
                                        key={hw.id}
                                        homework={hw}
                                        auth={usePage().props.auth}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-12">
                                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600">No homework assignments found</p>
                                </div>
                            )}
                        </MobileListContainer>
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Student
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Assignment
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Assigned Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {homework.data.length > 0 ? (
                                    homework.data.map((hw) => {
                                        const StatusIcon = getStatusIcon(hw.status);
                                        return (
                                        <tr key={hw.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {hw.student.first_name} {hw.student.last_name}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {hw.student.admission_number} • {hw.student.grade?.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${READING_TYPE_BADGES[hw.reading_type] || 'bg-gray-100 text-gray-800'}`}>
                                                    {hw.reading_type_label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">
                                                    Surah {hw.surah_from}-{hw.surah_to}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Verses {hw.verse_from}-{hw.verse_to}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {new Date(hw.assigned_date).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${STATUS_BADGES[hw.status] || 'bg-gray-100 text-gray-800'}`}>
                                                    <StatusIcon className="w-3.5 h-3.5" />
                                                    {STATUS_LABELS[hw.status] || hw.status_label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={`/quran-homework/${hw.id}`}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Link>
                                                    <Link
                                                        href={`/quran-homework/${hw.id}/edit`}
                                                        className="text-green-600 hover:text-green-900"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(hw.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center">
                                            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-600">No homework assignments found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {homework.links && homework.links.length > 3 && (
                        <div className="mt-6 flex justify-center">
                            <nav className="flex items-center gap-2">
                                {homework.links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url || '#'}
                                        className={`px-3 py-2 text-sm rounded-lg ${
                                            link.active
                                                ? 'bg-orange text-white font-bold'
                                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                        } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </nav>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                title="Delete Homework"
                message="Are you sure you want to delete this homework assignment? This action cannot be undone."
            />
        </AuthenticatedLayout>
    );
}
