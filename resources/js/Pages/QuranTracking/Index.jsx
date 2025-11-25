import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Plus, BookOpen, Eye, Edit, Calendar, User, Book, FileText } from 'lucide-react';
import useFilters from '@/Hooks/useFilters';
import { SearchInput, FilterSelect, FilterBar } from '@/Components/Filters';
import { SwipeableListItem, ExpandableCard, MobileListContainer } from '@/Components/Mobile';
import { Badge } from '@/Components/UI';

// Mobile List Item Component - Refactored with new components
function MobileQuranTrackingItem({ student, auth }) {
    // Helper to get reading type badge variant
    const getReadingTypeBadge = (type) => {
        const variants = {
            'new_learning': 'success',
            'revision': 'info',
            'subac': 'secondary',
        };
        return variants[type] || 'secondary';
    };

    // Helper to get difficulty badge variant
    const getDifficultyBadge = (difficulty) => {
        const variants = {
            'very_well': 'success',
            'middle': 'warning',
            'difficult': 'danger',
        };
        return variants[difficulty] || 'secondary';
    };

    // Define swipe actions
    const primaryActions = student.latest_tracking ? [
        { icon: Eye, label: 'View', color: 'blue', href: `/quran-tracking/${student.latest_tracking.id}` },
        ...(auth.user.role === 'admin' || auth.user.role === 'teacher' ? [
            { icon: Edit, label: 'Edit', color: 'indigo', href: `/quran-tracking/${student.latest_tracking.id}/edit` }
        ] : []),
    ] : [];

    const secondaryActions = student.latest_tracking ? [
        { icon: FileText, label: 'Report', color: 'green', href: `/quran-tracking/student/${student.id}/report` },
    ] : [];

    // Header content for the card
    const header = (
        <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-gray-900 truncate leading-tight">
                    {student.first_name} {student.last_name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <span className="truncate">{student.admission_number}</span>
                    <span>•</span>
                    <span className="truncate">{student.grade?.name || 'No Grade'}</span>
                </div>
                {student.latest_tracking && (
                    <div className="flex items-center gap-2 flex-wrap mt-2">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(student.latest_tracking.date).toLocaleDateString()}
                        </div>
                        <Badge
                            variant={getReadingTypeBadge(student.latest_tracking.reading_type)}
                            value={student.latest_tracking.reading_type_label}
                            size="sm"
                        />
                    </div>
                )}
            </div>
            <Link
                href={`/quran-tracking/create?student_id=${student.id}`}
                className="flex-shrink-0 px-3 py-2 bg-orange text-white text-xs font-bold rounded-lg hover:bg-orange-dark transition-colors shadow-sm"
                onClick={(e) => e.stopPropagation()}
            >
                <Plus className="w-4 h-4" />
            </Link>
        </div>
    );

    // Expanded content
    const expandedContent = student.latest_tracking ? (
        <div className="space-y-3">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200/50 shadow-sm">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange/10 rounded-lg flex items-center justify-center">
                        <Book className="w-4 h-4 text-orange" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-gray-900">
                            {student.latest_tracking.surah_name}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                            Verses {student.latest_tracking.verse_from}-{student.latest_tracking.verse_to} • {student.latest_tracking.calculated_total_verses} verses
                        </div>
                    </div>
                </div>
            </div>

            {student.latest_tracking.difficulty && (
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Performance:</span>
                    <Badge
                        variant={getDifficultyBadge(student.latest_tracking.difficulty)}
                        value={
                            student.latest_tracking.difficulty === 'very_well' ? '😊 Very Well' :
                            student.latest_tracking.difficulty === 'middle' ? '😐 Middle' : '😓 Difficult'
                        }
                        size="sm"
                    />
                </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                    href={`/quran-tracking/${student.latest_tracking.id}`}
                    className="px-4 py-3 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                >
                    <Eye className="w-4 h-4" />
                    View
                </Link>
                <Link
                    href={`/quran-tracking/student/${student.id}/report`}
                    className="px-4 py-3 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                >
                    <FileText className="w-4 h-4" />
                    Report
                </Link>
            </div>
        </div>
    ) : (
        <div className="text-center py-6 text-sm text-gray-400 italic bg-gray-50 rounded-xl border border-gray-200/50">
            No tracking records yet
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

export default function QuranTrackingIndex({ students, grades, filters: initialFilters = {}, auth }) {
    // Use the new useFilters hook
    const { filters, updateFilter, clearFilters } = useFilters({
        route: '/quran-tracking',
        initialFilters: {
            search: initialFilters.search || '',
            grade_id: initialFilters.grade_id || '',
            reading_type: initialFilters.reading_type || '',
        },
    });

    // Helper to get reading type badge variant
    const getReadingTypeBadge = (type) => {
        const variants = {
            'new_learning': 'success',
            'revision': 'info',
            'subac': 'secondary',
        };
        return variants[type] || 'secondary';
    };

    return (
        <AuthenticatedLayout header="Quran Tracking">
            <Head title="Quran Tracking" />

            <div className="py-6 sm:py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900">Quran Tracking</h2>
                                <p className="text-sm text-gray-600 font-medium">
                                    Track student Quran memorization progress
                                </p>
                            </div>
                        </div>
                        {(auth.user.role === 'admin' || auth.user.role === 'teacher') && (
                            <Link
                                href="/quran-tracking/create"
                                className="inline-flex items-center justify-center px-6 py-3 bg-orange text-white text-sm font-bold rounded-xl hover:bg-orange-dark transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Add Tracking
                            </Link>
                        )}
                    </div>

                    {/* Filters - Refactored with FilterBar */}
                    <div className="bg-white rounded-2xl shadow-md border border-gray-200/50 p-6 mb-6">
                        <FilterBar onClear={clearFilters} gridCols="3">
                            <SearchInput
                                value={filters.search}
                                onChange={(e) => updateFilter('search', e.target.value)}
                                placeholder="Search students..."
                            />
                            <FilterSelect
                                value={filters.grade_id}
                                onChange={(e) => updateFilter('grade_id', e.target.value)}
                                options={grades.map(grade => ({ value: grade.id, label: grade.name }))}
                                allLabel="All Grades"
                                hideLabel
                            />
                            <FilterSelect
                                value={filters.reading_type}
                                onChange={(e) => updateFilter('reading_type', e.target.value)}
                                options={[
                                    { value: 'new_learning', label: 'New Learning' },
                                    { value: 'revision', label: 'Revision' },
                                    { value: 'subac', label: 'Subac' }
                                ]}
                                allLabel="All Types"
                                hideLabel
                            />
                        </FilterBar>
                    </div>

                    {/* Student List with Latest Tracking */}
                    {students.data.length > 0 ? (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden lg:block bg-white rounded-2xl shadow-md border border-gray-200/50 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gradient-to-r from-gray-100 to-gray-50">
                                            <tr>
                                                <th className="px-4 xl:px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">
                                                    Student
                                                </th>
                                                <th className="px-4 xl:px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">
                                                    Grade
                                                </th>
                                                <th className="px-4 xl:px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">
                                                    Latest Tracking
                                                </th>
                                                <th className="px-4 xl:px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">
                                                    Type
                                                </th>
                                                <th className="px-4 xl:px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">
                                                    Surah & Verses
                                                </th>
                                                <th className="px-4 xl:px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {students.data.map((student) => (
                                                <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-4 xl:px-6 py-4">
                                                        <div className="flex items-center min-w-0">
                                                            {/* <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mr-3 shadow-sm">
                                                                <User className="w-5 h-5 text-white" />
                                                            </div> */}
                                                            <div className="min-w-0">
                                                                <div className="text-sm font-bold text-gray-900 truncate">
                                                                    {student.first_name} {student.last_name}
                                                                </div>
                                                                <div className="text-xs text-gray-500 truncate font-medium">
                                                                    {student.admission_number}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 xl:px-6 py-4">
                                                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
                                                            {student.grade ? student.grade.code : 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 xl:px-6 py-4">
                                                        {student.latest_tracking ? (
                                                            <div className="flex items-center text-sm text-gray-900 font-medium">
                                                                <Calendar className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                                                                <span className="whitespace-nowrap">
                                                                    {new Date(student.latest_tracking.date).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-gray-400 italic">No tracking yet</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 xl:px-6 py-4">
                                                        {student.latest_tracking ? (
                                                            <Badge
                                                                variant={getReadingTypeBadge(student.latest_tracking.reading_type)}
                                                                value={student.latest_tracking.reading_type_label}
                                                                size="sm"
                                                            />
                                                        ) : (
                                                            <span className="text-sm text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 xl:px-6 py-4">
                                                        {student.latest_tracking ? (
                                                            <div className="min-w-0">
                                                                <div className="text-sm font-bold text-gray-900 truncate">
                                                                    {student.latest_tracking.surah_name}
                                                                </div>
                                                                <div className="text-xs text-gray-500 whitespace-nowrap font-medium">
                                                                    Verses {student.latest_tracking.verse_from}-{student.latest_tracking.verse_to} ({student.latest_tracking.calculated_total_verses})
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 xl:px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <Link
                                                                href={`/quran-tracking/create?student_id=${student.id}`}
                                                                className="inline-flex items-center px-3 py-2 bg-orange text-white text-xs font-bold rounded-lg hover:bg-orange-dark transition-all duration-200 whitespace-nowrap shadow-sm hover:shadow-md"
                                                                title="Add Tracking"
                                                            >
                                                                <Plus className="w-4 h-4 xl:mr-1" />
                                                                <span className="hidden xl:inline">Add</span>
                                                            </Link>
                                                            {student.latest_tracking && (
                                                                <>
                                                                    <Link
                                                                        href={`/quran-tracking/${student.latest_tracking.id}`}
                                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                        title="View Details"
                                                                    >
                                                                        <Eye className="w-4 h-4" />
                                                                    </Link>
                                                                    <Link
                                                                        href={`/quran-tracking/student/${student.id}/report`}
                                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                        title="View Report"
                                                                    >
                                                                        <FileText className="w-4 h-4" />
                                                                    </Link>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Tablet Card View */}
                            <div className="hidden md:block lg:hidden bg-white rounded-2xl shadow-md border border-gray-200/50 overflow-hidden divide-y divide-gray-200">
                                {students.data.map((student) => (
                                    <div key={student.id} className="p-5 hover:bg-gray-50/50 transition-colors">
                                        <div className="flex items-start justify-between gap-4 mb-4">
                                            <div className="flex items-center min-w-0 flex-1">
                                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mr-3 shadow-md">
                                                    <User className="w-6 h-6 text-white" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-base font-bold text-gray-900 truncate">
                                                        {student.first_name} {student.last_name}
                                                    </h3>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 font-medium">
                                                        <span>{student.admission_number}</span>
                                                        <span>•</span>
                                                        <span className="truncate">{student.grade?.name || 'No Grade'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Link
                                                href={`/quran-tracking/create?student_id=${student.id}`}
                                                className="flex-shrink-0 inline-flex items-center px-4 py-2 bg-orange text-white text-xs font-bold rounded-lg hover:bg-orange-dark transition-all duration-200 shadow-sm hover:shadow-md"
                                            >
                                                <Plus className="w-4 h-4 mr-1" />
                                                Add
                                            </Link>
                                        </div>

                                        {student.latest_tracking ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3 text-xs flex-wrap">
                                                    <div className="flex items-center text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg font-medium">
                                                        <Calendar className="w-3.5 h-3.5 mr-1.5" />
                                                        {new Date(student.latest_tracking.date).toLocaleDateString()}
                                                    </div>
                                                    <Badge
                                                        variant={getReadingTypeBadge(student.latest_tracking.reading_type)}
                                                        value={student.latest_tracking.reading_type_label}
                                                        size="sm"
                                                    />
                                                </div>

                                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200/50 shadow-sm">
                                                    <div className="text-sm font-bold text-gray-900">
                                                        {student.latest_tracking.surah_name}
                                                    </div>
                                                    <div className="text-xs text-gray-600 mt-1 font-medium">
                                                        Verses {student.latest_tracking.verse_from}-{student.latest_tracking.verse_to} ({student.latest_tracking.calculated_total_verses} verses)
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 pt-1">
                                                    <Link
                                                        href={`/quran-tracking/${student.latest_tracking.id}`}
                                                        className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                                                    >
                                                        <Eye className="w-4 h-4 mr-1.5" />
                                                        View
                                                    </Link>
                                                    <Link
                                                        href={`/quran-tracking/student/${student.id}/report`}
                                                        className="inline-flex items-center justify-center px-4 py-2.5 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md"
                                                    >
                                                        <FileText className="w-4 h-4 mr-1.5" />
                                                        Report
                                                    </Link>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-4 text-sm text-gray-400 italic bg-gray-50 rounded-xl border border-gray-200/50">
                                                No tracking records yet
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Mobile List View - Refactored with MobileListContainer */}
                            <div className="md:hidden">
                                <MobileListContainer
                                    emptyState={{
                                        icon: BookOpen,
                                        title: 'No students found',
                                        message: filters.search || filters.grade_id || filters.reading_type ? 'Try adjusting your filters' : 'No students found in your assigned classes',
                                    }}
                                >
                                    {students.data.length > 0 && students.data.map((student) => (
                                        <MobileQuranTrackingItem
                                            key={student.id}
                                            student={student}
                                            auth={auth}
                                        />
                                    ))}
                                </MobileListContainer>
                            </div>

                            {/* Pagination */}
                            {students.links.length > 3 && (
                                <div className="mt-6 bg-white rounded-2xl shadow-md border border-gray-200/50 px-6 py-4">
                                    <div className="flex flex-wrap gap-2">
                                        {students.links.map((link, index) => (
                                            <Link
                                                key={index}
                                                href={link.url || '#'}
                                                className={`px-4 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${
                                                    link.active
                                                        ? 'bg-orange text-white shadow-md'
                                                        : link.url
                                                        ? 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-md border border-gray-200/50 p-12 text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <BookOpen className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">No students found</h3>
                            <p className="text-gray-600 mb-6 font-medium">
                                {filters.search || filters.grade_id || filters.reading_type
                                    ? 'Try adjusting your filters to see more students'
                                    : 'No students found in your assigned classes'}
                            </p>
                            {(auth.user.role === 'admin' || auth.user.role === 'teacher') && !filters.search && !filters.grade_id && (
                                <Link
                                    href="/quran-tracking/create"
                                    className="inline-flex items-center px-6 py-3 bg-orange text-white text-sm font-bold rounded-xl hover:bg-orange-dark transition-all duration-200 shadow-md hover:shadow-lg"
                                >
                                    <Plus className="w-5 h-5 mr-2" />
                                    Add Tracking
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}