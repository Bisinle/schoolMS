import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, FileText } from 'lucide-react';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function ExamsIndex({ exams, grades, filters, auth }) {
    const [search, setSearch] = useState(filters.search || '');
    const [gradeId, setGradeId] = useState(filters.grade_id || '');
    const [term, setTerm] = useState(filters.term || '');
    const [academicYear, setAcademicYear] = useState(filters.academic_year || '');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedExam, setSelectedExam] = useState(null);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/exams', { search, grade_id: gradeId, term, academic_year: academicYear }, { preserveState: true });
    };

    const handleFilterChange = (filterType, value) => {
        const newFilters = {
            search,
            grade_id: filterType === 'grade' ? value : gradeId,
            term: filterType === 'term' ? value : term,
            academic_year: filterType === 'year' ? value : academicYear,
        };
        
        if (filterType === 'grade') setGradeId(value);
        if (filterType === 'term') setTerm(value);
        if (filterType === 'year') setAcademicYear(value);

        router.get('/exams', newFilters, { preserveState: true });
    };

    const confirmDelete = (exam) => {
        setSelectedExam(exam);
        setShowDeleteModal(true);
    };

    const handleDelete = () => {
        if (selectedExam) {
            router.delete(`/exams/${selectedExam.id}`, {
                onSuccess: () => {
                    setShowDeleteModal(false);
                    setSelectedExam(null);
                },
            });
        }
    };

    const getExamTypeBadge = (type) => {
        const badges = {
            opening: 'bg-blue-100 text-blue-800',
            midterm: 'bg-yellow-100 text-yellow-800',
            end_term: 'bg-green-100 text-green-800',
        };
        const labels = {
            opening: 'Opening',
            midterm: 'Midterm',
            end_term: 'End-Term',
        };
        return { class: badges[type], label: labels[type] };
    };

    return (
        <AuthenticatedLayout header="Exams Management">
            <Head title="Exams" />

            <div className="space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    {/* Search and Filters */}
                    <form onSubmit={handleSearch} className="flex-1 w-full flex flex-wrap gap-2">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search exams..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                            />
                        </div>
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
                        <select
                            value={term}
                            onChange={(e) => handleFilterChange('term', e.target.value)}
                            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                        >
                            <option value="">All Terms</option>
                            <option value="1">Term 1</option>
                            <option value="2">Term 2</option>
                            <option value="3">Term 3</option>
                        </select>
                        <input
                            type="number"
                            value={academicYear}
                            onChange={(e) => handleFilterChange('year', e.target.value)}
                            placeholder="Year"
                            className="w-24 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                        />
                    </form>

                    <Link
                        href="/exams/create"
                        className="inline-flex items-center px-4 py-2.5 bg-orange text-white text-sm font-medium rounded-lg hover:bg-orange-dark transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Schedule Exam
                    </Link>
                </div>

                {/* Exams Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Exam Details
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Grade
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Subject
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Term/Year
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {exams.data.length > 0 ? (
                                    exams.data.map((exam) => {
                                        const badge = getExamTypeBadge(exam.exam_type);
                                        return (
                                            <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <FileText className="w-5 h-5 text-orange mr-2 flex-shrink-0" />
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {exam.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {exam.grade?.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {exam.subject?.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.class}`}>
                                                        {badge.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    Term {exam.term} / {exam.academic_year}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    <div className="flex items-center">
                                                        <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                                                        {new Date(exam.exam_date).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                                                    <Link
                                                        href={`/exams/${exam.id}`}
                                                        className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Link>
                                                    <Link
                                                        href={`/exams/${exam.id}/edit`}
                                                        className="inline-flex items-center text-orange hover:text-orange-dark transition-colors"
                                                        title="Edit Exam"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Link>
                                                    {auth.user.role === 'admin' && (
                                                        <button
                                                            onClick={() => confirmDelete(exam)}
                                                            className="inline-flex items-center text-red-600 hover:text-red-800 transition-colors"
                                                            title="Delete Exam"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                            <p className="text-lg font-medium">No exams found</p>
                                            <p className="text-sm mt-1">
                                                {search || gradeId || term || academicYear ? 'Try adjusting your filters' : 'Get started by scheduling a new exam'}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {exams.data.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{exams.from}</span> to{' '}
                                    <span className="font-medium">{exams.to}</span> of{' '}
                                    <span className="font-medium">{exams.total}</span> results
                                </div>
                                <div className="flex gap-2">
                                    {exams.links.map((link, index) => (
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
                title="Delete Exam"
                message={`Are you sure you want to delete ${selectedExam?.name}? This action cannot be undone.`}
                confirmText="Delete"
                type="danger"
            />
        </AuthenticatedLayout>
    );
}