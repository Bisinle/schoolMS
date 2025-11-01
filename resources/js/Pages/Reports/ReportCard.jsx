import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { Download, Lock, Save } from 'lucide-react';

export default function ReportCard({ 
    student, 
    term, 
    academicYear, 
    reportData, 
    canEditTeacherComment, 
    canEditHeadteacherComment,
    isGuardian 
}) {
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
        <AuthenticatedLayout>
            <Head title={`Report Card - ${student.first_name} ${student.last_name}`} />

            {/* Print Button */}
            <div className="max-w-[210mm] mx-auto mb-4 print:hidden">
                <button
                    onClick={() => window.print()}
                    className="inline-flex items-center px-6 py-2.5 bg-orange text-white rounded-lg hover:bg-orange-dark transition-colors shadow-md text-sm"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Print Report Card
                </button>
            </div>

            {/* Report Card - A4 Size */}
            <div className="max-w-[210mm] mx-auto bg-white shadow-lg print:shadow-none">
                
                <div className="border-[3px] border-gray-900">
                    {/* Beautiful School Header */}
                    <div className="relative bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 px-6 py-4 print:from-white print:via-white print:to-white print:border-b-[3px] print:border-gray-900">
                        {/* Decorative Corner Elements */}
                        <div className="absolute top-0 left-0 w-20 h-20 border-t-4 border-l-4 border-yellow-400 print:border-gray-900"></div>
                        <div className="absolute top-0 right-0 w-20 h-20 border-t-4 border-r-4 border-yellow-400 print:border-gray-900"></div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center justify-between">
                                {/* School Logo & Name */}
                                <div className="flex items-center space-x-3">
                                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg print:border-2 print:border-gray-900">
                                        <span className="text-2xl">🏫</span>
                                    </div>
                                    <div className="text-white print:text-gray-900">
                                        <h1 className="text-xl font-black tracking-wide">AL-EMI INTEG SCHOOLS</h1>
                                        <p className="text-xs font-medium tracking-wider opacity-90">EXCELLENCE IN EDUCATION</p>
                                    </div>
                                </div>
                                
                                {/* Report Card Title */}
                                <div className="text-right">
                                    <div className="bg-white print:bg-gray-100 px-4 py-2 rounded-lg shadow-lg print:shadow-none print:border-2 print:border-gray-900">
                                        <h2 className="text-base font-black text-gray-900 tracking-wide">STUDENT REPORT CARD</h2>
                                        <p className="text-xs font-semibold text-gray-700">Academic Year {academicYear}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Student Information - Compact */}
                    <div className="bg-gray-50 print:bg-white border-b-2 border-gray-300 px-6 py-2">
                        <div className="grid grid-cols-3 gap-x-6 text-[10px]">
                            <div className="space-y-0.5">
                                <div className="flex">
                                    <span className="font-bold w-24">Admission No:</span>
                                    <span>{student.admission_number}</span>
                                </div>
                                <div className="flex">
                                    <span className="font-bold w-24">Student Name:</span>
                                    <span className="capitalize">{student.first_name} {student.last_name}</span>
                                </div>
                            </div>
                            <div className="space-y-0.5">
                                <div className="flex">
                                    <span className="font-bold w-20">Class:</span>
                                    <span>{student.grade?.name}</span>
                                </div>
                                <div className="flex">
                                    <span className="font-bold w-20">Stream:</span>
                                    <span>{student.grade?.code || 'N/A'}</span>
                                </div>
                            </div>
                            <div className="space-y-0.5">
                                <div className="flex">
                                    <span className="font-bold w-20">Term:</span>
                                    <span>Term {term}</span>
                                </div>
                                <div className="flex">
                                    <span className="font-bold w-20">Date of Birth:</span>
                                    <span>{new Date(student.date_of_birth).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Academic Performance Table - Ultra Compact */}
                    <div className="px-6 py-2">
                        <h3 className="text-xs font-black mb-1 text-blue-900 uppercase tracking-wide">Academic Performance</h3>
                        
                        <table className="w-full border-2 border-gray-900 text-[9px]">
                            <thead>
                                <tr className="bg-blue-100 print:bg-gray-200">
                                    <th className="border border-gray-900 px-2 py-1 text-left font-bold">Subject</th>
                                    {reportData.is_term3 ? (
                                        <>
                                            <th className="border border-gray-900 px-2 py-1 text-center font-bold w-16">Term 1 Avg</th>
                                            <th className="border border-gray-900 px-2 py-1 text-center font-bold w-16">Term 2 Avg</th>
                                            <th className="border border-gray-900 px-2 py-1 text-center font-bold w-16">Term 3</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="border border-gray-900 px-2 py-1 text-center font-bold w-16">Opening</th>
                                            <th className="border border-gray-900 px-2 py-1 text-center font-bold w-16">Mid Term</th>
                                            <th className="border border-gray-900 px-2 py-1 text-center font-bold w-16">End Term</th>
                                        </>
                                    )}
                                    <th className="border border-gray-900 px-2 py-1 text-center font-bold w-16">Average</th>
                                    <th className="border border-gray-900 px-2 py-1 text-center font-bold w-12">Grade</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.academic_subjects.map((subject, index) => (
                                    <tr key={subject.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="border border-gray-900 px-2 py-0.5 font-medium">{subject.name}</td>
                                        {reportData.is_term3 ? (
                                            <>
                                                <td className={`border border-gray-900 px-2 py-0.5 text-center ${getMarkColor(subject.term1_average)}`}>
                                                    {formatMarks(subject.term1_average)}
                                                </td>
                                                <td className={`border border-gray-900 px-2 py-0.5 text-center ${getMarkColor(subject.term2_average)}`}>
                                                    {formatMarks(subject.term2_average)}
                                                </td>
                                                <td className={`border border-gray-900 px-2 py-0.5 text-center ${getMarkColor(subject.term3_result)}`}>
                                                    {formatMarks(subject.term3_result)}
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className={`border border-gray-900 px-2 py-0.5 text-center ${getMarkColor(subject.opening)}`}>
                                                    {formatMarks(subject.opening)}
                                                </td>
                                                <td className={`border border-gray-900 px-2 py-0.5 text-center ${getMarkColor(subject.midterm)}`}>
                                                    {formatMarks(subject.midterm)}
                                                </td>
                                                <td className={`border border-gray-900 px-2 py-0.5 text-center ${getMarkColor(subject.end_term)}`}>
                                                    {formatMarks(subject.end_term)}
                                                </td>
                                            </>
                                        )}
                                        <td className={`border border-gray-900 px-2 py-0.5 text-center font-bold ${getMarkColor(subject.average)}`}>
                                            {formatMarks(subject.average)}
                                        </td>
                                        <td className="border border-gray-900 px-2 py-0.5 text-center font-bold">
                                            {subject.rubric || '-'}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-blue-200 print:bg-gray-300 font-bold">
                                    <td className="border-2 border-gray-900 px-2 py-0.5" colSpan={reportData.is_term3 ? "4" : "4"}>
                                        ACADEMIC AVERAGE
                                    </td>
                                    <td className="border-2 border-gray-900 px-2 py-0.5 text-center">
                                        {reportData.academic_average ? reportData.academic_average.toFixed(2) : '-'}
                                    </td>
                                    <td className="border-2 border-gray-900 px-2 py-0.5 text-center">
                                        {reportData.academic_rubric || '-'}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Islamic Studies Performance Table */}
                    {reportData.islamic_subjects.length > 0 && (
                        <div className="px-6 py-2">
                            <h3 className="text-xs font-black mb-1 text-green-900 uppercase tracking-wide">Islamic Studies</h3>
                            
                            <table className="w-full border-2 border-gray-900 text-[9px]">
                                <thead>
                                    <tr className="bg-green-100 print:bg-gray-200">
                                        <th className="border border-gray-900 px-2 py-1 text-left font-bold">Subject</th>
                                        {reportData.is_term3 ? (
                                            <>
                                                <th className="border border-gray-900 px-2 py-1 text-center font-bold w-16">Term 1 Avg</th>
                                                <th className="border border-gray-900 px-2 py-1 text-center font-bold w-16">Term 2 Avg</th>
                                                <th className="border border-gray-900 px-2 py-1 text-center font-bold w-16">Term 3</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="border border-gray-900 px-2 py-1 text-center font-bold w-16">Opening</th>
                                                <th className="border border-gray-900 px-2 py-1 text-center font-bold w-16">Mid Term</th>
                                                <th className="border border-gray-900 px-2 py-1 text-center font-bold w-16">End Term</th>
                                            </>
                                        )}
                                        <th className="border border-gray-900 px-2 py-1 text-center font-bold w-16">Average</th>
                                        <th className="border border-gray-900 px-2 py-1 text-center font-bold w-12">Grade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.islamic_subjects.map((subject, index) => (
                                        <tr key={subject.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="border border-gray-900 px-2 py-0.5 font-medium">{subject.name}</td>
                                            {reportData.is_term3 ? (
                                                <>
                                                    <td className={`border border-gray-900 px-2 py-0.5 text-center ${getMarkColor(subject.term1_average)}`}>
                                                        {formatMarks(subject.term1_average)}
                                                    </td>
                                                    <td className={`border border-gray-900 px-2 py-0.5 text-center ${getMarkColor(subject.term2_average)}`}>
                                                        {formatMarks(subject.term2_average)}
                                                    </td>
                                                    <td className={`border border-gray-900 px-2 py-0.5 text-center ${getMarkColor(subject.term3_result)}`}>
                                                        {formatMarks(subject.term3_result)}
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className={`border border-gray-900 px-2 py-0.5 text-center ${getMarkColor(subject.opening)}`}>
                                                        {formatMarks(subject.opening)}
                                                    </td>
                                                    <td className={`border border-gray-900 px-2 py-0.5 text-center ${getMarkColor(subject.midterm)}`}>
                                                        {formatMarks(subject.midterm)}
                                                    </td>
                                                    <td className={`border border-gray-900 px-2 py-0.5 text-center ${getMarkColor(subject.end_term)}`}>
                                                        {formatMarks(subject.end_term)}
                                                    </td>
                                                </>
                                            )}
                                            <td className={`border border-gray-900 px-2 py-0.5 text-center font-bold ${getMarkColor(subject.average)}`}>
                                                {formatMarks(subject.average)}
                                            </td>
                                            <td className="border border-gray-900 px-2 py-0.5 text-center font-bold">
                                                {subject.rubric || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-green-200 print:bg-gray-300 font-bold">
                                        <td className="border-2 border-gray-900 px-2 py-0.5" colSpan={reportData.is_term3 ? "4" : "4"}>
                                            ISLAMIC STUDIES AVERAGE
                                        </td>
                                        <td className="border-2 border-gray-900 px-2 py-0.5 text-center">
                                            {reportData.islamic_average ? reportData.islamic_average.toFixed(2) : '-'}
                                        </td>
                                        <td className="border-2 border-gray-900 px-2 py-0.5 text-center">
                                            {reportData.islamic_rubric || '-'}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Overall Performance - Compact */}
                    <div className="px-6 py-2 bg-gradient-to-r from-purple-100 to-blue-100 print:bg-gray-100 border-y-2 border-gray-300">
                        <div className="flex justify-between items-center text-[10px]">
                            <div className="flex items-center space-x-2">
                                <span className="font-black">OVERALL AVERAGE:</span>
                                <span className="text-lg font-black text-purple-700">
                                    {reportData.overall_average ? `${reportData.overall_average}%` : 'N/A'}
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="font-black">OVERALL GRADE:</span>
                                <span className="px-3 py-1 bg-purple-700 text-white rounded font-black text-xs print:bg-white print:text-purple-700 print:border-2 print:border-purple-700">
                                    {reportData.overall_rubric || 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Comments - Compact */}
                    <div className="grid grid-cols-2 gap-2 px-6 py-2 border-b-2 border-gray-300">
                        {/* Teacher Comment */}
                        <div>
                            <h3 className="text-[9px] font-bold mb-1">Class Teacher's Comment:</h3>
                            {reportData.comments?.teacher_comment ? (
                                <div className="min-h-[40px] p-1.5 border border-gray-300 rounded bg-gray-50 print:bg-white text-[8px]">
                                    {reportData.comments.teacher_comment}
                                </div>
                            ) : (
                                <div className="min-h-[40px] p-1.5 border border-gray-300 rounded bg-gray-50 print:bg-white text-[8px] text-gray-400 italic">
                                    No comment
                                </div>
                            )}
                        </div>

                        {/* Principal Comment */}
                        <div>
                            <h3 className="text-[9px] font-bold mb-1">Principal's Comment:</h3>
                            {reportData.comments?.headteacher_comment ? (
                                <div className="min-h-[40px] p-1.5 border border-gray-300 rounded bg-gray-50 print:bg-white text-[8px]">
                                    {reportData.comments.headteacher_comment}
                                </div>
                            ) : (
                                <div className="min-h-[40px] p-1.5 border border-gray-300 rounded bg-gray-50 print:bg-white text-[8px] text-gray-400 italic">
                                    No comment
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Signatures - Compact */}
                    <div className="px-6 py-2 border-b-2 border-gray-300">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <div className="border-b-2 border-gray-900 mb-0.5 h-8"></div>
                                <p className="text-[8px] font-bold">Class Teacher's Signature</p>
                            </div>
                            <div className="text-center">
                                <div className="border-b-2 border-gray-900 mb-0.5 h-8"></div>
                                <p className="text-[8px] font-bold">Principal's Signature</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-900 text-white print:bg-gray-200 print:text-gray-900 px-6 py-1.5 text-center">
                        <p className="text-[8px] font-medium">
                            Official Document • Generated: {new Date().toLocaleDateString()}
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