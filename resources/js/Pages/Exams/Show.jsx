import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft, Save, FileText, Users, Calendar, BookOpen, Edit, TrendingUp, AlertCircle } from 'lucide-react';
import { Badge } from '@/Components/UI';
import Avatar from '@/Components/Avatar';

export default function ExamsShow({ exam, resultsCount, totalStudents, unmarkedStudents, auth }) {
    // Helper function to get exam type badge variant
    const getExamTypeBadgeVariant = (type) => {
        const variants = {
            opening: 'info',
            midterm: 'warning',
            end_term: 'success',
        };
        return variants[type] || 'secondary';
    };

    // Helper function to get rubric color
    const getRubricColor = (marks) => {
        if (marks >= 90) return 'bg-green-100 text-green-800';
        if (marks >= 75) return 'bg-blue-100 text-blue-800';
        if (marks >= 50) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };

    return (
        <AuthenticatedLayout header={
            <span className="block truncate">
                <span className="hidden md:inline">{exam.name}</span>
                <span className="md:hidden">Exam Details</span>
            </span>
        }>
            <Head title={exam.name} />

            <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                    <Link
                        href="/exams"
                        className="inline-flex items-center justify-center px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to List
                    </Link>
                    {(auth.user.role === 'admin' || auth.user.role === 'teacher') && (
                        <div className="flex flex-col md:flex-row gap-2">
                            <Link
                                href={`/exams/${exam.id}/results`}
                                className="inline-flex items-center justify-center px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                Enter Marks
                            </Link>
                            <Link
                                href={`/exams/${exam.id}/edit`}
                                className="inline-flex items-center justify-center px-4 py-2 text-sm text-white bg-orange rounded-lg hover:bg-orange-dark transition-colors"
                            >
                                <Edit className="w-4 h-4 mr-2" />
                                <span className="hidden md:inline">Edit Exam</span>
                                <span className="md:hidden">Edit</span>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Exam Details Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center">
                            <FileText className="w-5 h-5 md:w-6 md:h-6 text-orange mr-2 md:mr-3" />
                            <h2 className="text-base md:text-lg font-semibold text-gray-900">Exam Details</h2>
                        </div>
                    </div>

                    <div className="p-4 md:p-6">
                        {/* Mobile: Compact view with badges */}
                        <div className="md:hidden space-y-3">
                            <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Exam Name</p>
                                <p className="text-sm font-semibold text-gray-900">{exam.name}</p>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="primary" value={exam.grade?.name} size="sm" />
                                <Badge variant="secondary" value={exam.subject?.name} size="sm" />
                                <Badge
                                    variant={getExamTypeBadgeVariant(exam.exam_type)}
                                    value={exam.exam_type === 'opening' ? 'Opening' : exam.exam_type === 'midterm' ? 'Mid-Term' : 'End-Term'}
                                    size="sm"
                                />
                                <Badge variant="info" value={`Term ${exam.term}`} size="sm" />
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 mb-1">Exam Date</p>
                                    <p className="text-sm text-gray-900">
                                        {new Date(exam.exam_date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 mb-1">Academic Year</p>
                                    <p className="text-sm text-gray-900">{exam.academic_year}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Created By</p>
                                <p className="text-sm text-gray-900">{exam.creator?.name}</p>
                            </div>
                        </div>

                        {/* Desktop: Grid view */}
                        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Exam Name</p>
                                <p className="text-base font-semibold text-gray-900">{exam.name}</p>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Grade</p>
                                <div className="flex items-center">
                                    <Users className="w-4 h-4 text-gray-400 mr-2" />
                                    <p className="text-base text-gray-900">{exam.grade?.name}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Subject</p>
                                <div className="flex items-center">
                                    <BookOpen className="w-4 h-4 text-gray-400 mr-2" />
                                    <p className="text-base text-gray-900">{exam.subject?.name}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Exam Type</p>
                                <Badge
                                    variant={getExamTypeBadgeVariant(exam.exam_type)}
                                    value={exam.exam_type === 'opening' ? 'Opening' : exam.exam_type === 'midterm' ? 'Mid-Term' : 'End-Term'}
                                />
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Term</p>
                                <Badge variant="info" value={`Term ${exam.term}`} />
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Academic Year</p>
                                <p className="text-base text-gray-900">{exam.academic_year}</p>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Exam Date</p>
                                <div className="flex items-center">
                                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                    <p className="text-base text-gray-900">
                                        {new Date(exam.exam_date).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Created By</p>
                                <p className="text-base text-gray-900">{exam.creator?.name}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results Progress Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div className="flex items-center">
                                <Users className="w-5 h-5 md:w-6 md:h-6 text-orange mr-2 md:mr-3" />
                                <h2 className="text-base md:text-lg font-semibold text-gray-900">Results Progress</h2>
                            </div>
                            {(auth.user.role === 'admin' || auth.user.role === 'teacher') && (
                                <Link
                                    href={`/exams/${exam.id}/results`}
                                    className="inline-flex items-center justify-center px-3 py-2 text-sm text-white bg-orange rounded-lg hover:bg-orange-dark transition-colors"
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    {resultsCount > 0 ? 'View/Edit' : 'Enter Marks'}
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="p-4 md:p-6">
                        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-4">
                            <div className="text-center md:text-left">
                                <p className="text-xl md:text-2xl font-bold text-gray-900">{resultsCount}</p>
                                <p className="text-xs md:text-sm text-gray-600">Results</p>
                            </div>
                            <div className="text-center md:text-left">
                                <p className="text-xl md:text-2xl font-bold text-gray-900">{totalStudents}</p>
                                <p className="text-xs md:text-sm text-gray-600">Students</p>
                            </div>
                            <div className="text-center md:text-left">
                                <p className="text-xl md:text-2xl font-bold text-gray-900">
                                    {totalStudents > 0 ? Math.round((resultsCount / totalStudents) * 100) : 0}%
                                </p>
                                <p className="text-xs md:text-sm text-gray-600">Complete</p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2 md:h-3 overflow-hidden">
                            <div
                                className="bg-orange h-full transition-all duration-500"
                                style={{
                                    width: `${totalStudents > 0 ? (resultsCount / totalStudents) * 100 : 0}%`
                                }}
                            ></div>
                        </div>

                        <p className="text-xs md:text-sm text-gray-600 mt-2 md:mt-3">
                            {resultsCount === 0 && 'No marks entered yet.'}
                            {resultsCount > 0 && resultsCount < totalStudents && `${totalStudents - resultsCount} student(s) pending.`}
                            {resultsCount === totalStudents && totalStudents > 0 && '✓ All marks entered!'}
                        </p>
                    </div>
                </div>

                {/* Unmarked Students */}
                {unmarkedStudents && unmarkedStudents.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
                        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-red-200 bg-red-50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-red-500 mr-2 md:mr-3" />
                                    <h2 className="text-base md:text-lg font-semibold text-red-800">
                                        Students Without Marks ({unmarkedStudents.length})
                                    </h2>
                                </div>
                                {(auth.user.role === 'admin' || auth.user.role === 'teacher') && (
                                    <Link
                                        href={`/exams/${exam.id}/results`}
                                        className="inline-flex items-center px-3 py-1.5 text-xs text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        <FileText className="w-3 h-3 mr-1.5" />
                                        Enter Marks
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Mobile — stacked list */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {unmarkedStudents.map((student) => (
                                <div key={student.id} className="px-4 py-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{student.full_name}</p>
                                        <p className="text-xs text-gray-500">{student.admission_number}</p>
                                    </div>
                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">No mark</span>
                                </div>
                            ))}
                        </div>

                        {/* Desktop — table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">#</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Student</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Admission No.</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {unmarkedStudents.map((student, index) => (
                                        <tr key={student.id} className="hover:bg-red-50">
                                            <td className="px-6 py-3 text-sm text-gray-500">{index + 1}</td>
                                            <td className="px-6 py-3 text-sm font-medium text-gray-900">{student.full_name}</td>
                                            <td className="px-6 py-3 text-sm text-gray-600">{student.admission_number}</td>
                                            <td className="px-6 py-3">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                    No mark entered
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Student Results Preview */}
                {exam.results && exam.results.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 bg-gray-50">
                            <div className="flex items-center">
                                <FileText className="w-5 h-5 md:w-6 md:h-6 text-orange mr-2 md:mr-3" />
                                <h2 className="text-base md:text-lg font-semibold text-gray-900">Recent Results</h2>
                            </div>
                        </div>

                        {/* Mobile View - Cards */}
                        <div className="md:hidden divide-y divide-gray-200">
                            {exam.results.slice(0, 10).map((result) => (
                                <div key={result.id} className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Avatar
                                                    name={`${result.student?.first_name} ${result.student?.last_name}`}
                                                    imagePath={result.student?.profile_picture}
                                                    size="sm"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                                        {result.student?.first_name} {result.student?.last_name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {result.student?.admission_number}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right ml-3">
                                            <p className="text-xl font-bold text-orange">{result.marks}%</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRubricColor(result.marks)}`}>
                                            {result.rubric}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop View - Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                            Student
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                            Admission No.
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                            Marks
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                            Rubric
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {exam.results.slice(0, 10).map((result) => (
                                        <tr key={result.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {result.student?.first_name} {result.student?.last_name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {result.student?.admission_number}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-lg font-semibold text-gray-900">
                                                    {result.marks}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRubricColor(result.marks)}`}>
                                                    {result.rubric}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {exam.results.length > 10 && (
                            <div className="px-4 md:px-6 py-3 md:py-4 border-t border-gray-200 bg-gray-50 text-center">
                                <Link
                                    href={`/exams/${exam.id}/results`}
                                    className="text-sm text-orange hover:text-orange-dark font-medium"
                                >
                                    View all {exam.results.length} results →
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}