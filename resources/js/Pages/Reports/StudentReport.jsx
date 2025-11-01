import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft, Download, Lock, Unlock, Save, User, Calendar, FileText } from 'lucide-react';

export default function StudentReport({ 
    student, 
    term, 
    academicYear, 
    reportData, 
    canEditTeacherComment, 
    canEditHeadteacherComment,
    isGuardian 
}) {
    const [selectedYear, setSelectedYear] = useState(academicYear);
    const [selectedTerm, setSelectedTerm] = useState(term);
    const [showTeacherCommentForm, setShowTeacherCommentForm] = useState(false);
    const [showHeadteacherCommentForm, setShowHeadteacherCommentForm] = useState(false);

    const { data: teacherData, setData: setTeacherData, post: postTeacher, processing: processingTeacher } = useForm({
        comment_type: 'teacher',
        term: term,
        academic_year: academicYear,
        comment: reportData.comments?.teacher_comment || '',
    });

    const { data: headteacherData, setData: setHeadteacherData, post: postHeadteacher, processing: processingHeadteacher } = useForm({
        comment_type: 'headteacher',
        term: term,
        academic_year: academicYear,
        comment: reportData.comments?.headteacher_comment || '',
    });

    const handleTermYearChange = () => {
        router.get(`/reports/students/${student.id}`, {
            term: selectedTerm,
            academic_year: selectedYear
        });
    };

    const handleSaveTeacherComment = (e) => {
        e.preventDefault();
        postTeacher(`/reports/students/${student.id}/comments`, {
            onSuccess: () => {
                setShowTeacherCommentForm(false);
            }
        });
    };

    const handleSaveHeadteacherComment = (e) => {
        e.preventDefault();
        postHeadteacher(`/reports/students/${student.id}/comments`, {
            onSuccess: () => {
                setShowHeadteacherCommentForm(false);
            }
        });
    };

    const handleLockComment = (commentType) => {
        if (confirm(`Are you sure you want to lock the ${commentType} comment? This action cannot be undone.`)) {
            router.post(`/reports/students/${student.id}/comments/lock`, {
                comment_type: commentType,
                term: term,
                academic_year: academicYear,
            });
        }
    };

    const getRubricColor = (rubric) => {
        if (!rubric) return 'bg-gray-100 text-gray-800';
        if (rubric === 'Exceeding Expectation') return 'bg-green-100 text-green-800';
        if (rubric === 'Meeting Expectation') return 'bg-blue-100 text-blue-800';
        if (rubric === 'Approaching Expectation') return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };

    const getMarksCellColor = (marks) => {
        if (marks === null) return 'bg-gray-50 text-gray-400';
        if (marks >= 90) return 'bg-green-50 text-green-900 font-semibold';
        if (marks >= 75) return 'bg-blue-50 text-blue-900 font-semibold';
        if (marks >= 50) return 'bg-yellow-50 text-yellow-900 font-semibold';
        return 'bg-red-50 text-red-900 font-semibold';
    };

    const formatMarks = (marks) => {
        return marks !== null ? `${marks}%` : '-';
    };

    return (
        <AuthenticatedLayout header={`Report Card - ${student.first_name} ${student.last_name}`}>
            <Head title={`Report - ${student.first_name} ${student.last_name}`} />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Actions */}
                <div className="flex justify-between items-center">
                    <Link
                        href="/reports"
                        className="inline-flex items-center px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Reports
                    </Link>
                    <button
                        onClick={() => window.print()}
                        className="inline-flex items-center px-4 py-2 text-sm text-white bg-orange rounded-lg hover:bg-orange-dark transition-colors"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Print Report
                    </button>
                </div>

                {/* Report Header Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none">
                    <div className="px-8 py-6 bg-gradient-to-r from-orange to-orange-dark print:bg-white print:border-b-2 print:border-gray-800">
                        <div className="flex justify-between items-start">
                            <div className="text-white print:text-gray-900">
                                <h1 className="text-3xl font-bold mb-2">Academic Report Card</h1>
                                <p className="text-white/90 print:text-gray-600">
                                    {student.grade?.name} • Academic Year {academicYear}
                                </p>
                            </div>
                            <div className="flex items-center space-x-4 print:hidden">
                                <select
                                    value={selectedTerm}
                                    onChange={(e) => setSelectedTerm(e.target.value)}
                                    className="px-4 py-2 border border-white/30 bg-white/20 backdrop-blur-sm text-white rounded-lg focus:ring-2 focus:ring-white/50"
                                >
                                    <option value="1">Term 1</option>
                                    <option value="2">Term 2</option>
                                    <option value="3">Term 3</option>
                                </select>
                                <input
                                    type="number"
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    className="w-24 px-4 py-2 border border-white/30 bg-white/20 backdrop-blur-sm text-white rounded-lg focus:ring-2 focus:ring-white/50"
                                    min="2020"
                                    max="2100"
                                />
                                <button
                                    onClick={handleTermYearChange}
                                    className="px-4 py-2 bg-white text-orange rounded-lg hover:bg-white/90 transition-colors font-medium"
                                >
                                    Load
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Student Info */}
                    <div className="px-8 py-6 bg-gray-50 border-b border-gray-200 print:bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex items-center">
                                <User className="w-5 h-5 text-gray-400 mr-3" />
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Student Name</p>
                                    <p className="text-base font-semibold text-gray-900">
                                        {student.first_name} {student.last_name}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <FileText className="w-5 h-5 text-gray-400 mr-3" />
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Admission Number</p>
                                    <p className="text-base font-semibold text-gray-900">{student.admission_number}</p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Term</p>
                                    <p className="text-base font-semibold text-gray-900">
                                        Term {term} - {academicYear}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Academic Subjects */}
                {reportData.academic_subjects.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none">
                        <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
                            <h2 className="text-lg font-semibold text-blue-900">Academic Subjects</h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Subject
                                        </th>
                                        {reportData.is_term3 ? (
                                            <>
                                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    End Term 1
                                                </th>
                                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    End Term 2
                                                </th>
                                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    End Term 3
                                                </th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Opening
                                                </th>
                                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Mid-Term
                                                </th>
                                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    End-Term
                                                </th>
                                            </>
                                        )}
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Average
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Rubric
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reportData.academic_subjects.map((subject, index) => (
                                        <tr key={subject.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {subject.name}
                                            </td>
                                            {reportData.is_term3 ? (
                                                <>
                                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-center ${getMarksCellColor(subject.term1_end)}`}>
                                                        {formatMarks(subject.term1_end)}
                                                    </td>
                                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-center ${getMarksCellColor(subject.term2_end)}`}>
                                                        {formatMarks(subject.term2_end)}
                                                    </td>
                                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-center ${getMarksCellColor(subject.term3_end)}`}>
                                                        {formatMarks(subject.term3_end)}
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-center ${getMarksCellColor(subject.opening)}`}>
                                                        {formatMarks(subject.opening)}
                                                    </td>
                                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-center ${getMarksCellColor(subject.midterm)}`}>
                                                        {formatMarks(subject.midterm)}
                                                    </td>
                                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-center ${getMarksCellColor(subject.end_term)}`}>
                                                        {formatMarks(subject.end_term)}
                                                    </td>
                                                </>
                                            )}
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-center ${getMarksCellColor(subject.average)}`}>
                                                {formatMarks(subject.average)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {subject.rubric && (
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRubricColor(subject.rubric)}`}>
                                                        {subject.rubric}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Islamic Subjects */}
                {reportData.islamic_subjects.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none">
                        <div className="px-6 py-4 bg-green-50 border-b border-green-100">
                            <h2 className="text-lg font-semibold text-green-900">Islamic Subjects</h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Subject
                                        </th>
                                        {reportData.is_term3 ? (
                                            <>
                                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    End Term 1
                                                </th>
                                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    End Term 2
                                                </th>
                                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    End Term 3
                                                </th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Opening
                                                </th>
                                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Mid-Term
                                                </th>
                                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    End-Term
                                                </th>
                                            </>
                                        )}
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Average
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Rubric
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reportData.islamic_subjects.map((subject, index) => (
                                        <tr key={subject.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {subject.name}
                                            </td>
                                            {reportData.is_term3 ? (
                                                <>
                                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-center ${getMarksCellColor(subject.term1_end)}`}>
                                                        {formatMarks(subject.term1_end)}
                                                    </td>
                                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-center ${getMarksCellColor(subject.term2_end)}`}>
                                                        {formatMarks(subject.term2_end)}
                                                    </td>
                                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-center ${getMarksCellColor(subject.term3_end)}`}>
                                                        {formatMarks(subject.term3_end)}
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-center ${getMarksCellColor(subject.opening)}`}>
                                                        {formatMarks(subject.opening)}
                                                    </td>
                                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-center ${getMarksCellColor(subject.midterm)}`}>
                                                        {formatMarks(subject.midterm)}
                                                    </td>
                                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-center ${getMarksCellColor(subject.end_term)}`}>
                                                        {formatMarks(subject.end_term)}
                                                    </td>
                                                </>
                                            )}
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-center ${getMarksCellColor(subject.average)}`}>
                                                {formatMarks(subject.average)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {subject.rubric && (
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRubricColor(subject.rubric)}`}>
                                                        {subject.rubric}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Overall Performance */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none">
                    <div className="px-6 py-4 bg-purple-50 border-b border-purple-100">
                        <h2 className="text-lg font-semibold text-purple-900">Overall Performance</h2>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-center p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-purple-700 mb-1">Overall Average</p>
                                    <p className="text-4xl font-bold text-purple-900">
                                        {reportData.overall_average ? `${reportData.overall_average}%` : 'N/A'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-blue-700 mb-1">Performance Level</p>
                                    {reportData.overall_rubric && (
                                        <span className={`inline-flex items-center px-4 py-2 rounded-full text-base font-bold ${getRubricColor(reportData.overall_rubric)}`}>
                                            {reportData.overall_rubric}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Comments Section - Continuing in next message... */}
                {/* Teacher Comment */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none">
                    <div className="px-6 py-4 bg-orange-50 border-b border-orange-100 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-orange-900">Class Teacher's Comment</h2>
                        {reportData.comments?.teacher_comment && reportData.comments?.teacher_comment_locked_at && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <Lock className="w-3 h-3 mr-1" />
                                Locked
                            </span>
                        )}
                    </div>
                    <div className="p-6">
                        {reportData.comments?.teacher_comment ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-gray-800 whitespace-pre-wrap">{reportData.comments.teacher_comment}</p>
                                </div>
                                {reportData.comments.teacher_comment_locked_at && (
                                    <div className="text-sm text-gray-600">
                                        <p>Locked by {reportData.comments.teacher_locked_by?.name} on {new Date(reportData.comments.teacher_comment_locked_at).toLocaleDateString()}</p>
                                    </div>
                                )}
                                {canEditTeacherComment && !reportData.comments.teacher_comment_locked_at && (
                                    <div className="flex gap-2 print:hidden">
                                        <button
                                            onClick={() => {
                                                setTeacherData('comment', reportData.comments.teacher_comment);
                                                setShowTeacherCommentForm(true);
                                            }}
                                            className="inline-flex items-center px-4 py-2 text-sm text-orange bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                                        >
                                            Edit Comment
                                        </button>
                                        <button
                                            onClick={() => handleLockComment('teacher')}
                                            className="inline-flex items-center px-4 py-2 text-sm text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                                        >
                                            <Lock className="w-4 h-4 mr-2" />
                                            Lock Comment
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                {canEditTeacherComment && !isGuardian ? (
                                    <div className="print:hidden">
                                        {showTeacherCommentForm ? (
                                            <form onSubmit={handleSaveTeacherComment} className="space-y-4">
                                                <textarea
                                                    value={teacherData.comment}
                                                    onChange={(e) => setTeacherData('comment', e.target.value)}
                                                    rows="6"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                                    placeholder="Enter teacher's comment about the student's performance, behavior, and areas for improvement..."
                                                    required
                                                ></textarea>
                                                <div className="flex gap-2 justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowTeacherCommentForm(false)}
                                                        className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={processingTeacher}
                                                        className="inline-flex items-center px-4 py-2 text-sm text-white bg-orange rounded-lg hover:bg-orange-dark transition-colors disabled:opacity-50"
                                                    >
                                                        <Save className="w-4 h-4 mr-2" />
                                                        {processingTeacher ? 'Saving...' : 'Save Comment'}
                                                    </button>
                                                </div>
                                            </form>
                                        ) : (
                                            <button
                                                onClick={() => setShowTeacherCommentForm(true)}
                                                className="inline-flex items-center px-6 py-3 text-sm text-white bg-orange rounded-lg hover:bg-orange-dark transition-colors"
                                            >
                                                <Save className="w-4 h-4 mr-2" />
                                                Add Teacher Comment
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic">No teacher comment added yet.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Headteacher Comment */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none">
                    <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-blue-900">Headteacher's Comment</h2>
                        {reportData.comments?.headteacher_comment && reportData.comments?.headteacher_comment_locked_at && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <Lock className="w-3 h-3 mr-1" />
                                Locked
                            </span>
                        )}
                    </div>
                    <div className="p-6">
                        {reportData.comments?.headteacher_comment ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-gray-800 whitespace-pre-wrap">{reportData.comments.headteacher_comment}</p>
                                </div>
                                {reportData.comments.headteacher_comment_locked_at && (
                                    <div className="text-sm text-gray-600">
                                        <p>Locked by {reportData.comments.headteacher_locked_by?.name} on {new Date(reportData.comments.headteacher_comment_locked_at).toLocaleDateString()}</p>
                                    </div>
                                )}
                                {canEditHeadteacherComment && !reportData.comments.headteacher_comment_locked_at && (
                                    <div className="flex gap-2 print:hidden">
                                        <button
                                            onClick={() => {
                                                setHeadteacherData('comment', reportData.comments.headteacher_comment);
                                                setShowHeadteacherCommentForm(true);
                                            }}
                                            className="inline-flex items-center px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                        >
                                            Edit Comment
                                        </button>
                                        <button
                                            onClick={() => handleLockComment('headteacher')}
                                            className="inline-flex items-center px-4 py-2 text-sm text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                                        >
                                            <Lock className="w-4 h-4 mr-2" />
                                            Lock Comment
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                {canEditHeadteacherComment && !isGuardian ? (
                                    <div className="print:hidden">
                                        {showHeadteacherCommentForm ? (
                                            <form onSubmit={handleSaveHeadteacherComment} className="space-y-4">
                                                <textarea
                                                    value={headteacherData.comment}
                                                    onChange={(e) => setHeadteacherData('comment', e.target.value)}
                                                    rows="6"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                    placeholder="Enter headteacher's comment about the student's overall performance and conduct..."
                                                    required
                                                ></textarea>
                                                <div className="flex gap-2 justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowHeadteacherCommentForm(false)}
                                                        className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={processingHeadteacher}
                                                        className="inline-flex items-center px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                                    >
                                                        <Save className="w-4 h-4 mr-2" />
                                                        {processingHeadteacher ? 'Saving...' : 'Save Comment'}
                                                    </button>
                                                </div>
                                            </form>
                                        ) : (
                                            <button
                                                onClick={() => setShowHeadteacherCommentForm(true)}
                                                className="inline-flex items-center px-6 py-3 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                <Save className="w-4 h-4 mr-2" />
                                                Add Headteacher Comment
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic">No headteacher comment added yet.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Grading Key */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Grading Rubric</h2>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="flex items-center p-4 border-2 border-green-200 bg-green-50 rounded-lg">
                                <div>
                                    <p className="text-sm font-bold text-green-800">Exceeding Expectation</p>
                                    <p className="text-xs text-green-600 mt-1">90% - 100%</p>
                                </div>
                            </div>
                            <div className="flex items-center p-4 border-2 border-blue-200 bg-blue-50 rounded-lg">
                                <div>
                                    <p className="text-sm font-bold text-blue-800">Meeting Expectation</p>
                                    <p className="text-xs text-blue-600 mt-1">75% - 89%</p>
                                </div>
                            </div>
                            <div className="flex items-center p-4 border-2 border-yellow-200 bg-yellow-50 rounded-lg">
                                <div>
                                    <p className="text-sm font-bold text-yellow-800">Approaching Expectation</p>
                                    <p className="text-xs text-yellow-600 mt-1">50% - 74%</p>
                                </div>
                            </div>
                            <div className="flex items-center p-4 border-2 border-red-200 bg-red-50 rounded-lg">
                                <div>
                                    <p className="text-sm font-bold text-red-800">Below Expectation</p>
                                    <p className="text-xs text-red-600 mt-1">0% - 49%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Print Footer */}
                <div className="hidden print:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6">
                        <div className="grid grid-cols-3 gap-8 pt-12">
                            <div className="text-center border-t-2 border-gray-900 pt-2">
                                <p className="text-sm font-semibold">Class Teacher's Signature</p>
                            </div>
                            <div className="text-center border-t-2 border-gray-900 pt-2">
                                <p className="text-sm font-semibold">Headteacher's Signature</p>
                            </div>
                            <div className="text-center border-t-2 border-gray-900 pt-2">
                                <p className="text-sm font-semibold">Parent/Guardian's Signature</p>
                            </div>
                        </div>
                        <div className="mt-8 text-center text-xs text-gray-500">
                            <p>This report was generated on {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}