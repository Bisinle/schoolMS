import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Download, Lock, Save } from 'lucide-react';
import { shouldShowAcademicSubjects } from '@/Utils/subjectFilters';

export default function ReportCard({
    student,
    term,
    academicYear,
    reportData,
    canEditTeacherComment,
    canEditHeadteacherComment,
    isGuardian
}) {
    const { school } = usePage().props;
    const showAcademicSubjects = shouldShowAcademicSubjects(school?.school_type);
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

    const formatMarks = (marks) => {
        return marks !== null ? marks : '-';
    };

    const getMarkColor = (marks) => {
        if (marks === null) return 'text-gray-400';
        if (marks >= 90) return 'text-green-700 font-semibold';
        if (marks >= 75) return 'text-blue-700 font-semibold';
        if (marks >= 50) return 'text-yellow-700 font-semibold';
        return 'text-red-700 font-semibold';
    };

    return (
        <AuthenticatedLayout header={`Report Card - ${student.first_name} ${student.last_name}`}>
            <Head title={`Report Card - ${student.first_name} ${student.last_name}`} />

            {/* Print Button */}
            <div className="max-w-full lg:max-w-[210mm] mx-auto mb-4 px-4 print:hidden">
                <button
                    onClick={() => window.print()}
                    className="inline-flex items-center px-6 py-2.5 bg-orange text-white rounded-lg hover:bg-orange-dark transition-colors shadow-md text-sm"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Print Report Card
                </button>
            </div>

            {/* Report Card - Responsive A4 Size */}
            <div className="max-w-full lg:max-w-[210mm] mx-auto bg-white shadow-lg print:shadow-none">
                
                <div className="border-[3px] border-gray-900">
                    {/* Beautiful School Header - REDESIGNED & RESPONSIVE */}
                    <div className="relative bg-gradient-to-br from-[#1e3a5f] via-[#2d4a7c] to-[#1e3a5f] px-4 sm:px-6 md:px-8 py-6 sm:py-8 print:from-white print:via-white print:to-white print:border-b-[3px] print:border-gray-900">
                        {/* Decorative Corner Elements */}
                        <div className="absolute top-0 left-0 w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 border-t-4 border-l-4 border-[#ff6b35] print:border-gray-900"></div>
                        <div className="absolute top-0 right-0 w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 border-t-4 border-r-4 border-[#ff6b35] print:border-gray-900"></div>
                        <div className="absolute bottom-0 left-0 w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 border-b-4 border-l-4 border-[#ff6b35] print:border-gray-900"></div>
                        <div className="absolute bottom-0 right-0 w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 border-b-4 border-r-4 border-[#ff6b35] print:border-gray-900"></div>

                        <div className="relative z-10">
                            {/* School Logo & Name - Centered Layout */}
                            <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
                                {/* School Logo */}
                                {school?.logo_path ? (
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white rounded-full flex items-center justify-center shadow-2xl print:border-4 print:border-gray-900 overflow-hidden ring-4 ring-white/30">
                                        <img src={school.logo_path} alt={school.name} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white rounded-full flex items-center justify-center shadow-2xl print:border-4 print:border-gray-900 ring-4 ring-white/30">
                                        <span className="text-3xl sm:text-4xl md:text-5xl">🏫</span>
                                    </div>
                                )}

                                {/* School Name */}
                                <div className="text-white print:text-gray-900">
                                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-wider uppercase leading-tight drop-shadow-lg">
                                        {school?.name || 'School Name'}
                                    </h1>
                                    <div className="mt-2 flex items-center justify-center gap-2">
                                        <div className="h-px w-8 sm:w-12 md:w-16 bg-[#ff6b35]"></div>
                                        <p className="text-xs sm:text-sm md:text-base font-bold tracking-widest uppercase text-[#ff6b35] print:text-gray-700">
                                            Excellence in Education
                                        </p>
                                        <div className="h-px w-8 sm:w-12 md:w-16 bg-[#ff6b35]"></div>
                                    </div>
                                </div>

                                {/* Report Card Title Badge */}
                                <div className="mt-4 sm:mt-6">
                                    <div className="inline-block bg-white print:bg-gray-50 px-6 sm:px-8 md:px-10 py-3 sm:py-4 rounded-2xl shadow-2xl print:shadow-none print:border-4 print:border-gray-900 transform hover:scale-105 transition-transform">
                                        <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-black text-[#1e3a5f] tracking-widest uppercase">
                                            Student Report Card
                                        </h2>
                                        <div className="flex items-center justify-center gap-3 mt-2">
                                            <div className="flex items-center gap-2 bg-[#ff6b35] print:bg-gray-200 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full">
                                                <span className="text-xs sm:text-sm font-black text-white print:text-gray-900 uppercase tracking-wide">
                                                    Academic Year
                                                </span>
                                                <span className="text-sm sm:text-base font-black text-white print:text-gray-900">
                                                    {academicYear}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Student Information - Enhanced & Responsive */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 print:bg-white border-b-2 border-gray-300 px-4 sm:px-6 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 text-xs sm:text-sm">
                            <div className="space-y-2 sm:space-y-3">
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-600 text-[10px] sm:text-xs uppercase tracking-wide">Admission No</span>
                                    <span className="font-semibold text-gray-900 text-sm sm:text-base">{student.admission_number}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-600 text-[10px] sm:text-xs uppercase tracking-wide">Student Name</span>
                                    <span className="font-semibold text-gray-900 capitalize text-sm sm:text-base">{student.first_name} {student.last_name}</span>
                                </div>
                            </div>
                            <div className="space-y-2 sm:space-y-3">
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-600 text-[10px] sm:text-xs uppercase tracking-wide">Class</span>
                                    <span className="font-semibold text-gray-900 text-sm sm:text-base">{student.grade?.name}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-600 text-[10px] sm:text-xs uppercase tracking-wide">Stream</span>
                                    <span className="font-semibold text-gray-900 text-sm sm:text-base">{student.grade?.code || 'N/A'}</span>
                                </div>
                            </div>
                            <div className="space-y-2 sm:space-y-3">
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-600 text-[10px] sm:text-xs uppercase tracking-wide">Term</span>
                                    <span className="font-semibold text-gray-900 text-sm sm:text-base">Term {term}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-600 text-[10px] sm:text-xs uppercase tracking-wide">Date of Birth</span>
                                    <span className="font-semibold text-gray-900 text-sm sm:text-base">{new Date(student.date_of_birth).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Academic Performance Table - Enhanced & Responsive */}
                    {showAcademicSubjects && (
                    <div className="px-4 sm:px-6 py-3 overflow-x-auto">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                            <h3 className="text-xs sm:text-sm font-black text-blue-900 uppercase tracking-wide">Academic Performance</h3>
                        </div>

                        <div className="min-w-[600px]">
                            <table className="w-full border-2 border-gray-900 text-[10px] sm:text-xs">
                                <thead>
                                    <tr className="bg-blue-100 print:bg-gray-200">
                                        <th className="border border-gray-900 px-2 sm:px-3 py-1.5 text-left font-bold uppercase text-[9px] sm:text-[10px]">Subject</th>
                                        {reportData.is_term3 ? (
                                            <>
                                                <th className="border border-gray-900 px-2 py-1.5 text-center font-bold w-16 sm:w-20 uppercase text-[9px] sm:text-[10px]">Term 1 Avg</th>
                                                <th className="border border-gray-900 px-2 py-1.5 text-center font-bold w-16 sm:w-20 uppercase text-[9px] sm:text-[10px]">Term 2 Avg</th>
                                                <th className="border border-gray-900 px-2 py-1.5 text-center font-bold w-16 sm:w-20 uppercase text-[9px] sm:text-[10px]">Term 3</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="border border-gray-900 px-2 py-1.5 text-center font-bold w-16 sm:w-20 uppercase text-[9px] sm:text-[10px]">Opening</th>
                                                <th className="border border-gray-900 px-2 py-1.5 text-center font-bold w-16 sm:w-20 uppercase text-[9px] sm:text-[10px]">Mid Term</th>
                                                <th className="border border-gray-900 px-2 py-1.5 text-center font-bold w-16 sm:w-20 uppercase text-[9px] sm:text-[10px]">End Term</th>
                                            </>
                                        )}
                                        <th className="border border-gray-900 px-2 py-1.5 text-center font-bold w-16 sm:w-20 uppercase text-[9px] sm:text-[10px]">Average</th>
                                        <th className="border border-gray-900 px-2 py-1.5 text-center font-bold w-12 sm:w-16 uppercase text-[9px] sm:text-[10px]">Grade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.academic_subjects.map((subject, index) => (
                                        <tr key={subject.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="border border-gray-900 px-2 sm:px-3 py-1 font-semibold">{subject.name}</td>
                                            {reportData.is_term3 ? (
                                                <>
                                                    <td className={`border border-gray-900 px-2 py-1 text-center font-medium ${getMarkColor(subject.term1_average)}`}>
                                                        {formatMarks(subject.term1_average)}
                                                    </td>
                                                    <td className={`border border-gray-900 px-2 py-1 text-center font-medium ${getMarkColor(subject.term2_average)}`}>
                                                        {formatMarks(subject.term2_average)}
                                                    </td>
                                                    <td className={`border border-gray-900 px-2 py-1 text-center font-medium ${getMarkColor(subject.term3_result)}`}>
                                                        {formatMarks(subject.term3_result)}
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className={`border border-gray-900 px-2 py-1 text-center font-medium ${getMarkColor(subject.opening)}`}>
                                                        {formatMarks(subject.opening)}
                                                    </td>
                                                    <td className={`border border-gray-900 px-2 py-1 text-center font-medium ${getMarkColor(subject.midterm)}`}>
                                                        {formatMarks(subject.midterm)}
                                                    </td>
                                                    <td className={`border border-gray-900 px-2 py-1 text-center font-medium ${getMarkColor(subject.end_term)}`}>
                                                        {formatMarks(subject.end_term)}
                                                    </td>
                                                </>
                                            )}
                                            <td className={`border border-gray-900 px-2 py-1 text-center font-bold ${getMarkColor(subject.average)}`}>
                                                {formatMarks(subject.average)}
                                            </td>
                                            <td className="border border-gray-900 px-2 py-1 text-center font-bold">
                                                {subject.rubric || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-blue-200 print:bg-gray-300 font-bold">
                                        <td className="border-2 border-gray-900 px-2 sm:px-3 py-1.5 uppercase text-xs" colSpan={reportData.is_term3 ? "4" : "4"}>
                                            Academic Average
                                        </td>
                                        <td className="border-2 border-gray-900 px-2 py-1.5 text-center text-sm">
                                            {reportData.academic_average ? reportData.academic_average.toFixed(2) : '-'}
                                        </td>
                                        <td className="border-2 border-gray-900 px-2 py-1.5 text-center text-sm">
                                            {reportData.academic_rubric || '-'}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    )}

                    {/* Islamic Studies Performance Table - Enhanced & Responsive */}
                    {reportData.islamic_subjects.length > 0 && (
                        <div className="px-4 sm:px-6 py-3 overflow-x-auto">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-1 h-6 bg-green-600 rounded-full"></div>
                                <h3 className="text-xs sm:text-sm font-black text-green-900 uppercase tracking-wide">Islamic Studies</h3>
                            </div>

                            <div className="min-w-[600px]">
                                <table className="w-full border-2 border-gray-900 text-[10px] sm:text-xs">
                                    <thead>
                                        <tr className="bg-green-100 print:bg-gray-200">
                                            <th className="border border-gray-900 px-2 sm:px-3 py-1.5 text-left font-bold uppercase text-[9px] sm:text-[10px]">Subject</th>
                                            {reportData.is_term3 ? (
                                                <>
                                                    <th className="border border-gray-900 px-2 py-1.5 text-center font-bold w-16 sm:w-20 uppercase text-[9px] sm:text-[10px]">Term 1 Avg</th>
                                                    <th className="border border-gray-900 px-2 py-1.5 text-center font-bold w-16 sm:w-20 uppercase text-[9px] sm:text-[10px]">Term 2 Avg</th>
                                                    <th className="border border-gray-900 px-2 py-1.5 text-center font-bold w-16 sm:w-20 uppercase text-[9px] sm:text-[10px]">Term 3</th>
                                                </>
                                            ) : (
                                                <>
                                                    <th className="border border-gray-900 px-2 py-1.5 text-center font-bold w-16 sm:w-20 uppercase text-[9px] sm:text-[10px]">Opening</th>
                                                    <th className="border border-gray-900 px-2 py-1.5 text-center font-bold w-16 sm:w-20 uppercase text-[9px] sm:text-[10px]">Mid Term</th>
                                                    <th className="border border-gray-900 px-2 py-1.5 text-center font-bold w-16 sm:w-20 uppercase text-[9px] sm:text-[10px]">End Term</th>
                                                </>
                                            )}
                                            <th className="border border-gray-900 px-2 py-1.5 text-center font-bold w-16 sm:w-20 uppercase text-[9px] sm:text-[10px]">Average</th>
                                            <th className="border border-gray-900 px-2 py-1.5 text-center font-bold w-12 sm:w-16 uppercase text-[9px] sm:text-[10px]">Grade</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.islamic_subjects.map((subject, index) => (
                                            <tr key={subject.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="border border-gray-900 px-2 sm:px-3 py-1 font-semibold">{subject.name}</td>
                                                {reportData.is_term3 ? (
                                                    <>
                                                        <td className={`border border-gray-900 px-2 py-1 text-center font-medium ${getMarkColor(subject.term1_average)}`}>
                                                            {formatMarks(subject.term1_average)}
                                                        </td>
                                                        <td className={`border border-gray-900 px-2 py-1 text-center font-medium ${getMarkColor(subject.term2_average)}`}>
                                                            {formatMarks(subject.term2_average)}
                                                        </td>
                                                        <td className={`border border-gray-900 px-2 py-1 text-center font-medium ${getMarkColor(subject.term3_result)}`}>
                                                            {formatMarks(subject.term3_result)}
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className={`border border-gray-900 px-2 py-1 text-center font-medium ${getMarkColor(subject.opening)}`}>
                                                            {formatMarks(subject.opening)}
                                                        </td>
                                                        <td className={`border border-gray-900 px-2 py-1 text-center font-medium ${getMarkColor(subject.midterm)}`}>
                                                            {formatMarks(subject.midterm)}
                                                        </td>
                                                        <td className={`border border-gray-900 px-2 py-1 text-center font-medium ${getMarkColor(subject.end_term)}`}>
                                                            {formatMarks(subject.end_term)}
                                                        </td>
                                                    </>
                                                )}
                                                <td className={`border border-gray-900 px-2 py-1 text-center font-bold ${getMarkColor(subject.average)}`}>
                                                    {formatMarks(subject.average)}
                                                </td>
                                                <td className="border border-gray-900 px-2 py-1 text-center font-bold">
                                                    {subject.rubric || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="bg-green-200 print:bg-gray-300 font-bold">
                                            <td className="border-2 border-gray-900 px-2 sm:px-3 py-1.5 uppercase text-xs" colSpan={reportData.is_term3 ? "4" : "4"}>
                                                Islamic Studies Average
                                            </td>
                                            <td className="border-2 border-gray-900 px-2 py-1.5 text-center text-sm">
                                                {reportData.islamic_average ? reportData.islamic_average.toFixed(2) : '-'}
                                            </td>
                                            <td className="border-2 border-gray-900 px-2 py-1.5 text-center text-sm">
                                                {reportData.islamic_rubric || '-'}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Overall Performance - Enhanced & Responsive */}
                    <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-purple-100 via-indigo-100 to-blue-100 print:bg-gray-100 border-y-2 border-gray-300">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
                            <div className="flex items-center space-x-2 sm:space-x-3">
                                <span className="font-black text-xs sm:text-sm uppercase tracking-wide text-gray-700">Overall Average:</span>
                                <span className="text-xl sm:text-2xl md:text-3xl font-black text-purple-700 print:text-purple-900">
                                    {reportData.overall_average ? `${reportData.overall_average}%` : 'N/A'}
                                </span>
                            </div>
                            <div className="flex items-center space-x-2 sm:space-x-3">
                                <span className="font-black text-xs sm:text-sm uppercase tracking-wide text-gray-700">Overall Grade:</span>
                                <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-700 text-white rounded-lg font-black text-sm sm:text-base md:text-lg print:bg-white print:text-purple-700 print:border-2 print:border-purple-700">
                                    {reportData.overall_rubric || 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Comments - Enhanced & Responsive */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 sm:px-6 py-4 border-b-2 border-gray-300">
                        {/* Teacher Comment */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-1 h-5 bg-indigo-600 rounded-full"></div>
                                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-gray-700">Class Teacher's Comment</h3>
                            </div>
                            {reportData.comments?.teacher_comment ? (
                                <div className="min-h-[60px] p-3 border-2 border-gray-300 rounded-lg bg-gray-50 print:bg-white text-[10px] sm:text-xs leading-relaxed">
                                    {reportData.comments.teacher_comment}
                                </div>
                            ) : (
                                <div className="min-h-[60px] p-3 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 print:bg-white text-[10px] sm:text-xs text-gray-400 italic flex items-center justify-center">
                                    No comment provided
                                </div>
                            )}
                        </div>

                        {/* Principal Comment */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-1 h-5 bg-purple-600 rounded-full"></div>
                                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-gray-700">Principal's Comment</h3>
                            </div>
                            {reportData.comments?.headteacher_comment ? (
                                <div className="min-h-[60px] p-3 border-2 border-gray-300 rounded-lg bg-gray-50 print:bg-white text-[10px] sm:text-xs leading-relaxed">
                                    {reportData.comments.headteacher_comment}
                                </div>
                            ) : (
                                <div className="min-h-[60px] p-3 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 print:bg-white text-[10px] sm:text-xs text-gray-400 italic flex items-center justify-center">
                                    No comment provided
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Signatures - Enhanced & Responsive */}
                    <div className="px-4 sm:px-6 py-4 border-b-2 border-gray-300 bg-gray-50 print:bg-white">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                            <div className="text-center">
                                <div className="border-b-2 border-gray-900 mb-1 h-12"></div>
                                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-gray-700">Class Teacher</p>
                                <p className="text-[8px] sm:text-[9px] text-gray-500 mt-0.5">Signature & Date</p>
                            </div>
                            <div className="text-center">
                                <div className="border-b-2 border-gray-900 mb-1 h-12"></div>
                                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-gray-700">Principal</p>
                                <p className="text-[8px] sm:text-[9px] text-gray-500 mt-0.5">Signature & Date</p>
                            </div>
                            <div className="text-center">
                                <div className="border-b-2 border-gray-900 mb-1 h-12"></div>
                                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-gray-700">Parent/Guardian</p>
                                <p className="text-[8px] sm:text-[9px] text-gray-500 mt-0.5">Signature & Date</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer - Enhanced & Responsive */}
                    <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white print:bg-gray-200 print:text-gray-900 px-4 sm:px-6 py-3 text-center border-t-4 border-[#ff6b35] print:border-gray-900">
                        <p className="text-[10px] sm:text-xs font-semibold tracking-wide">
                            Official Document • Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        <p className="text-[8px] sm:text-[9px] text-gray-400 print:text-gray-600 mt-1">
                            {school?.name || 'School Name'} • Academic Excellence
                        </p>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 8mm;
                    }
                    body {
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                }
            `}</style>
        </AuthenticatedLayout>
    );
}