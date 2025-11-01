import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Search, FileText, Users, Eye } from 'lucide-react';

export default function ReportsIndex({ students, grades, filters = {}, isGuardian, currentYear, auth }) {
    const [search, setSearch] = useState(filters.search || '');
    const [gradeId, setGradeId] = useState(filters.grade_id || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/reports', { search, grade_id: gradeId }, { preserveState: true });
    };

    const handleFilterChange = (filterType, value) => {
        if (filterType === 'grade') {
            setGradeId(value);
            router.get('/reports', { search, grade_id: value }, { preserveState: true });
        }
    };

    return (
        <AuthenticatedLayout header="Student Reports">
            <Head title="Reports" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex items-center space-x-3">
                        <FileText className="w-8 h-8 text-orange" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Student Reports</h2>
                            <p className="text-sm text-gray-600">
                                {isGuardian 
                                    ? 'View your children\'s academic reports'
                                    : 'Access and manage student academic reports'}
                            </p>
                        </div>
                    </div>

                    {/* Search and Filters (only for non-guardians) */}
                    {!isGuardian && (
                        <form onSubmit={handleSearch} className="flex gap-2 w-full lg:w-auto">
                            <div className="relative flex-1 lg:w-64">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search students..."
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                />
                            </div>
                            {grades && (
                                <select
                                    value={gradeId}
                                    onChange={(e) => handleFilterChange('grade', e.target.value)}
                                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                >
                                    <option value="">All Grades</option>
                                    {grades.map((grade) => (
                                        <option key={grade.id} value={grade.id}>
                                            {grade.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </form>
                    )}
                </div>

                {/* Students Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(isGuardian ? students : students.data).map((student) => (
                        <div
                            key={student.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200"
                        >
                            {/* Card Header */}
                            <div className="p-6 bg-gradient-to-r from-orange to-orange-dark">
                                <div className="flex items-center space-x-4">
                                    <div className="flex-shrink-0 h-16 w-16 rounded-full bg-white flex items-center justify-center text-orange font-bold text-xl">
                                        {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-bold text-white truncate">
                                            {student.first_name} {student.last_name}
                                        </h3>
                                        <p className="text-sm text-white/80">{student.admission_number}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-6 space-y-3">
                                <div className="flex items-center text-sm">
                                    <Users className="w-4 h-4 text-gray-400 mr-2" />
                                    <span className="text-gray-600">{student.grade?.name || 'N/A'}</span>
                                </div>

                                {!isGuardian && student.guardian?.user && (
                                    <div className="flex items-center text-sm">
                                        <Users className="w-4 h-4 text-gray-400 mr-2" />
                                        <span className="text-gray-600">Guardian: {student.guardian.user.name}</span>
                                    </div>
                                )}

                                {/* Report Links */}
                                <div className="pt-4 space-y-2">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        View Reports
                                    </p>
                                    <div className="grid grid-cols-3 gap-2">
                                        <Link
                                            href={`/reports/students/${student.id}?term=1&academic_year=${currentYear}`}
                                            className="flex flex-col items-center p-3 border-2 border-gray-200 rounded-lg hover:border-orange hover:bg-orange-50 transition-all group"
                                        >
                                            <FileText className="w-5 h-5 text-gray-400 group-hover:text-orange mb-1" />
                                            <span className="text-xs font-medium text-gray-600 group-hover:text-orange">
                                                Term 1
                                            </span>
                                        </Link>
                                        <Link
                                            href={`/reports/students/${student.id}?term=2&academic_year=${currentYear}`}
                                            className="flex flex-col items-center p-3 border-2 border-gray-200 rounded-lg hover:border-orange hover:bg-orange-50 transition-all group"
                                        >
                                            <FileText className="w-5 h-5 text-gray-400 group-hover:text-orange mb-1" />
                                            <span className="text-xs font-medium text-gray-600 group-hover:text-orange">
                                                Term 2
                                            </span>
                                        </Link>
                                        <Link
                                            href={`/reports/students/${student.id}?term=3&academic_year=${currentYear}`}
                                            className="flex flex-col items-center p-3 border-2 border-gray-200 rounded-lg hover:border-orange hover:bg-orange-50 transition-all group"
                                        >
                                            <FileText className="w-5 h-5 text-gray-400 group-hover:text-orange mb-1" />
                                            <span className="text-xs font-medium text-gray-600 group-hover:text-orange">
                                                Term 3
                                            </span>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Empty State */}
                    {((isGuardian && students.length === 0) || (!isGuardian && students.data.length === 0)) && (
                        <div className="col-span-full">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                                <p className="text-gray-600">
                                    {search || gradeId 
                                        ? 'Try adjusting your filters' 
                                        : isGuardian 
                                        ? 'No students are assigned to your account'
                                        : 'No students available to view reports'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Pagination (only for non-guardians) */}
                {!isGuardian && students.data.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-4">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="text-sm text-gray-700">
                                Showing <span className="font-medium">{students.from}</span> to{' '}
                                <span className="font-medium">{students.to}</span> of{' '}
                                <span className="font-medium">{students.total}</span> results
                            </div>
                            <div className="flex gap-2">
                                {students.links.map((link, index) => (
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
        </AuthenticatedLayout>
    );
}