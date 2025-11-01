import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft, Save, FileText, Users, Calendar, BookOpen } from 'lucide-react';

export default function ExamsShow({ exam, resultsCount, totalStudents, auth }) {
    return (
        <AuthenticatedLayout header={exam.name}>
            <Head title={exam.name} />

            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header Actions */}
                <div className="flex justify-between items-center">
                    <Link
                        href="/exams"
                        className="inline-flex items-center px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to List
                    </Link>
                    {(auth.user.role === 'admin' || auth.user.role === 'teacher') && (
                        <div className="flex gap-2">
                            <Link
                                href={`/exams/${exam.id}/results`}
                                className="inline-flex items-center px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                Enter Marks
                            </Link>
                            <Link
                                href={`/exams/${exam.id}/edit`}
                                className="inline-flex items-center px-4 py-2 text-sm text-white bg-orange rounded-lg hover:bg-orange-dark transition-colors"
                            >
                                Edit Exam
                            </Link>
                        </div>
                    )}
                </div>

                {/* Exam Details Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center">
                            <FileText className="w-6 h-6 text-orange mr-3" />
                            <h2 className="text-lg font-semibold text-gray-900">Exam Details</h2>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                    exam.exam_type === 'opening' ? 'bg-blue-100 text-blue-800' :
                                    exam.exam_type === 'midterm' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                }`}>
                                    {exam.exam_type === 'opening' ? 'Opening' :
                                     exam.exam_type === 'midterm' ? 'Mid-Term' : 'End-Term'}
                                </span>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Term</p>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                    Term {exam.term}
                                </span>
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
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <Users className="w-6 h-6 text-orange mr-3" />
                                <h2 className="text-lg font-semibold text-gray-900">Results Progress</h2>
                            </div>
                            {(auth.user.role === 'admin' || auth.user.role === 'teacher') && (
                                <Link
                                    href={`/exams/${exam.id}/results`}
                                    className="inline-flex items-center px-3 py-2 text-sm text-white bg-orange rounded-lg hover:bg-orange-dark transition-colors"
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    {resultsCount > 0 ? 'View/Edit Marks' : 'Enter Marks'}
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{resultsCount}</p>
                                <p className="text-sm text-gray-600">Results Entered</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
                                <p className="text-sm text-gray-600">Total Students</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {totalStudents > 0 ? Math.round((resultsCount / totalStudents) * 100) : 0}%
                                </p>
                                <p className="text-sm text-gray-600">Completion</p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                                className="bg-orange h-full transition-all duration-500"
                                style={{
                                    width: `${totalStudents > 0 ? (resultsCount / totalStudents) * 100 : 0}%`
                                }}
                            ></div>
                        </div>

                        <p className="text-sm text-gray-600 mt-3">
                            {resultsCount === 0 && 'No marks entered yet. Click "Enter Marks" to get started.'}
                            {resultsCount > 0 && resultsCount < totalStudents && `${totalStudents - resultsCount} student(s) still pending.`}
                            {resultsCount === totalStudents && totalStudents > 0 && '✓ All marks entered!'}
                        </p>
                    </div>
                </div>

                {/* Student Results Preview */}
                {exam.results && exam.results.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <div className="flex items-center">
                                <FileText className="w-6 h-6 text-orange mr-3" />
                                <h2 className="text-lg font-semibold text-gray-900">Recent Results</h2>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
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
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    result.marks >= 90 ? 'bg-green-100 text-green-800' :
                                                    result.marks >= 75 ? 'bg-blue-100 text-blue-800' :
                                                    result.marks >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {result.rubric}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {exam.results.length > 10 && (
                            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 text-center">
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