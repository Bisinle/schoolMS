import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, BookOpen, Eye, Edit, Trash2, Calendar, User, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import useFilters from '@/Hooks/useFilters';
import { SearchInput, FilterSelect, FilterBar } from '@/Components/Filters';
import { SwipeableListItem, ExpandableCard, MobileListContainer } from '@/Components/Mobile';
import { Badge } from '@/Components/UI';
import { useState } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';

// Mobile Homework Item Component
function MobileHomeworkItem({ homework, auth }) {
    const getStatusBadge = (status) => {
        const variants = {
            'completed': 'success',
            'overdue': 'danger',
            'pending': 'warning',
        };
        return variants[status] || 'secondary';
    };

    const getStatusIcon = (status) => {
        if (status === 'completed') return CheckCircle;
        if (status === 'overdue') return AlertCircle;
        return Clock;
    };

    const StatusIcon = getStatusIcon(homework.status_badge);

    // Define swipe actions
    const primaryActions = [
        { icon: Eye, label: 'View', href: `/quran-homework/${homework.id}`, color: 'indigo' },
        ...(auth.user.role === 'admin' || auth.user.role === 'teacher' ? [
            { icon: Edit, label: 'Edit', href: `/quran-homework/${homework.id}/edit`, color: 'green' }
        ] : []),
    ];

    const secondaryActions = auth.user.role === 'admin' || auth.user.role === 'teacher' ? [
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
                        Due: {new Date(homework.due_date).toLocaleDateString()}
                    </div>
                    <Badge
                        variant={getStatusBadge(homework.status_badge)}
                        value={homework.status_badge}
                        size="sm"
                        icon={StatusIcon}
                    />
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
                            {homework.homework_type_label}
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

            {homework.teacher_instructions && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <div className="text-xs font-semibold text-blue-900 mb-1">Instructions:</div>
                    <div className="text-xs text-blue-800">{homework.teacher_instructions}</div>
                </div>
            )}

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
            homework_type: initialFilters.homework_type || '',
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

    const getStatusBadge = (status) => {
        const badges = {
            'completed': 'bg-green-100 text-green-800',
            'overdue': 'bg-red-100 text-red-800',
            'pending': 'bg-yellow-100 text-yellow-800',
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    };

    const getTypeBadge = (type) => {
        const badges = {
            'memorize': 'bg-purple-100 text-purple-800',
            'revise': 'bg-blue-100 text-blue-800',
            'read': 'bg-green-100 text-green-800',
        };
        return badges[type] || 'bg-gray-100 text-gray-800';
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
                                { value: 'completed', label: 'Completed' },
                                { value: 'overdue', label: 'Overdue' },
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
                            label="Type"
                            value={filters.homework_type}
                            onChange={(e) => updateFilter('homework_type', e.target.value)}
                            options={[
                                { value: '', label: 'All Types' },
                                { value: 'memorize', label: 'Memorization' },
                                { value: 'revise', label: 'Revision' },
                                { value: 'read', label: 'Reading' },
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
                                        Due Date
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
                                    homework.data.map((hw) => (
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
                                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getTypeBadge(hw.homework_type)}`}>
                                                    {hw.homework_type_label}
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
                                                    {new Date(hw.due_date).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusBadge(hw.status_badge)}`}>
                                                    {hw.status_badge}
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
                                    ))
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

