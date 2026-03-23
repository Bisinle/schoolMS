import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Download, Lock, Save, ArrowLeft } from 'lucide-react';
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
    const { school, auth } = usePage().props;
    const showAcademicSubjects = shouldShowAcademicSubjects(school?.school_type);
    const [showTeacherCommentForm, setShowTeacherCommentForm] = useState(false);
    const [showHeadteacherCommentForm, setShowHeadteacherCommentForm] = useState(false);
    const [showLockModal, setShowLockModal] = useState(false);
    const [lockCommentType, setLockCommentType] = useState(null);
    const [showUnlockModal, setShowUnlockModal] = useState(false);
    const [unlockCommentType, setUnlockCommentType] = useState(null);

    const isAdmin = auth?.user?.role === 'admin';

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
        setLockCommentType(commentType);
        setShowLockModal(true);
    };

    const confirmLockComment = () => {
        router.post(`/reports/students/${student.id}/comments/lock`, {
            comment_type: lockCommentType,
            term: term,
            academic_year: academicYear,
        }, {
            onSuccess: () => {
                setShowLockModal(false);
                setLockCommentType(null);
            }
        });
    };

    const handleUnlockComment = (commentType) => {
        setUnlockCommentType(commentType);
        setShowUnlockModal(true);
    };

    const confirmUnlockComment = () => {
        router.post(`/reports/students/${student.id}/comments/unlock`, {
            comment_type: unlockCommentType,
            term: term,
            academic_year: academicYear,
        }, {
            onSuccess: () => {
                setShowUnlockModal(false);
                setUnlockCommentType(null);
            }
        });
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

            {/* Back and Print Buttons */}
            <div className="max-w-full lg:max-w-[210mm] mx-auto mb-4 px-4 print:hidden">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md text-sm"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="inline-flex items-center px-6 py-2.5 bg-orange text-white rounded-lg hover:bg-orange-dark transition-colors shadow-md text-sm"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Print Report Card
                    </button>
                </div>
            </div>

            {/* Report Card - Responsive A4 Size */}
            <div className="max-w-full lg:max-w-[210mm] mx-auto bg-white shadow-lg print:shadow-none report-card-container">

                <div className="border-[3px] border-gray-900">
                    {/* Beautiful School Header - REDESIGNED & RESPONSIVE */}
                    <div className="relative bg-gradient-to-br from-[#1e3a5f] via-[#2d4a7c] to-[#1e3a5f] px-4 sm:px-6 md:px-8 py-6 sm:py-8 print:from-white print:via-white print:to-white print:border-b-[3px] print:border-gray-900">
                        {/* Decorative Corner Elements */}
                        <div className="absolute top-0 left-0 w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 border-t-4 border-l-4 border-[#ff6b35] print:border-gray-900"></div>
                        <div className="absolute top-0 right-0 w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 border-t-4 border-r-4 border-[#ff6b35] print:border-gray-900"></div>
                        <div className="absolute bottom-0 left-0 w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 border-b-4 border-l-4 border-[#ff6b35] print:border-gray-900"></div>
                        <div className="absolute bottom-0 right-0 w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 border-b-4 border-r-4 border-[#ff6b35] print:border-gray-900"></div>

                        <div className="relative z-10">
                            {/* Screen View - Centered Layout */}
                            <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4 print:hidden">
                                {/* School Logo */}
                                {school?.logo_path ? (
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white rounded-full flex items-center justify-center shadow-2xl overflow-hidden ring-4 ring-white/30">
                                        <img src={`/storage/${school.logo_path}`} alt={school.name} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white rounded-full flex items-center justify-center shadow-2xl ring-4 ring-white/30">
                                        <span className="text-3xl sm:text-4xl md:text-5xl">🏫</span>
                                    </div>
                                )}

                                {/* School Name */}
                                <div className="text-white">
                                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-wider uppercase leading-tight drop-shadow-lg">
                                        {school?.name || 'School Name'}
                                    </h1>
                                    <div className="mt-2 flex items-center justify-center gap-2">
                                        <div className="h-px w-8 sm:w-12 md:w-16 bg-[#ff6b35]"></div>
                                        <p className="text-xs sm:text-sm md:text-base font-bold tracking-widest uppercase text-[#ff6b35]">
                                            Excellence in Education
                                        </p>
                                        <div className="h-px w-8 sm:w-12 md:w-16 bg-[#ff6b35]"></div>
                                    </div>
                                </div>

                                {/* Report Card Title Badge */}
                                <div className="mt-4 sm:mt-6">
                                    <div className="inline-block bg-white px-6 sm:px-8 md:px-10 py-3 sm:py-4 rounded-2xl shadow-2xl transform hover:scale-105 transition-transform">
                                        <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-black text-[#1e3a5f] tracking-widest uppercase">
                                            Student Report Card
                                        </h2>
                                        <div className="flex items-center justify-center gap-3 mt-2">
                                            <div className="flex items-center gap-2 bg-[#ff6b35] px-3 sm:px-4 py-1 sm:py-1.5 rounded-full">
                                                <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wide">
                                                    Academic Year
                                                </span>
                                                <span className="text-sm sm:text-base font-black text-white">
                                                    {academicYear}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Print View - Compact Horizontal Layout */}
                            <div className="hidden print:flex items-center justify-between py-3">
                                {/* Left: Logo & School Name */}
                                <div className="flex items-center gap-3">
                                    {school?.logo_path ? (
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-gray-900 overflow-hidden flex-shrink-0">
                                            <img src={`/storage/${school.logo_path}`} alt={school.name} className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-gray-900 flex-shrink-0">
                                            <span className="text-2xl">🏫</span>
                                        </div>
                                    )}
                                    <div className="text-left">
                                        <h1 className="text-lg font-black text-gray-900 uppercase leading-tight">
                                            {school?.name || 'School Name'}
                                        </h1>
                                        <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                                            Excellence in Education
                                        </p>
                                    </div>
                                </div>

                                {/* Center: Report Card Title */}
                                <div className="text-center">
                                    <h2 className="text-base font-black text-gray-900 uppercase tracking-wide border-2 border-gray-900 px-4 py-1.5 bg-gray-50">
                                        Student Report Card
                                    </h2>
                                </div>

                                {/* Right: Academic Year */}
                                <div className="text-right">
                                    <div className="border-2 border-gray-900 px-3 py-1.5 bg-gray-100">
                                        <p className="text-[9px] font-bold text-gray-600 uppercase tracking-wide">Academic Year</p>
                                        <p className="text-sm font-black text-gray-900">{academicYear}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Student Information - Enhanced & Responsive */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 print:bg-white border-b-2 border-gray-300 px-4 sm:px-6 py-4 print:py-2">
                        <div className="grid grid-cols-2 print:grid-cols-3 gap-x-4 gap-y-3 print:gap-y-2 sm:gap-x-6 text-xs sm:text-sm">
                            {/* Admission No */}
                            <div className="flex flex-col">
                                <span className="font-bold text-gray-600 text-[10px] sm:text-xs uppercase tracking-wide">Admission No</span>
                                <span className="font-semibold text-gray-900 text-sm sm:text-base print:text-xs">{student.admission_number}</span>
                            </div>

                            {/* Class */}
                            <div className="flex flex-col">
                                <span className="font-bold text-gray-600 text-[10px] sm:text-xs uppercase tracking-wide">Class</span>
                                <span className="font-semibold text-gray-900 text-sm sm:text-base print:text-xs">{student.grade?.name}</span>
                            </div>

                            {/* Term */}
                            <div className="flex flex-col">
                                <span className="font-bold text-gray-600 text-[10px] sm:text-xs uppercase tracking-wide">Term</span>
                                <span className="font-semibold text-gray-900 text-sm sm:text-base print:text-xs">Term {term}</span>
                            </div>

                            {/* Student Name */}
                            <div className="flex flex-col">
                                <span className="font-bold text-gray-600 text-[10px] sm:text-xs uppercase tracking-wide">Student Name</span>
                                <span className="font-semibold text-gray-900 capitalize text-sm sm:text-base print:text-xs">{student.first_name} {student.last_name}</span>
                            </div>

                            {/* Stream */}
                            <div className="flex flex-col">
                                <span className="font-bold text-gray-600 text-[10px] sm:text-xs uppercase tracking-wide">Stream</span>
                                <span className="font-semibold text-gray-900 text-sm sm:text-base print:text-xs">{student.grade?.code || 'N/A'}</span>
                            </div>

                            {/* Date of Birth */}
                            <div className="flex flex-col">
                                <span className="font-bold text-gray-600 text-[10px] sm:text-xs uppercase tracking-wide">Date of Birth</span>
                                <span className="font-semibold text-gray-900 text-sm sm:text-base print:text-xs">{new Date(student.date_of_birth).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Academic Performance Table - Enhanced & Responsive */}
                    {showAcademicSubjects && (
                    <div className="px-2 sm:px-4 md:px-6 py-3 overflow-x-auto">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                            <h3 className="text-xs sm:text-sm font-black text-blue-900 uppercase tracking-wide">Academic Performance</h3>
                        </div>

                        <div className="w-full">
                            <table className="w-full border-2 border-gray-900 text-[8px] sm:text-[10px] md:text-xs">
                                <thead>
                                    <tr className="bg-blue-100 print:bg-gray-200">
                                        <th className="border border-gray-900 px-1 sm:px-2 md:px-3 py-1 sm:py-1.5 text-left font-bold uppercase text-[7px] sm:text-[9px] md:text-[10px]">Subject</th>
                                        {reportData.is_term3 ? (
                                            <>
                                                <th className="border border-gray-900 px-1 sm:px-2 py-1 sm:py-1.5 text-center font-bold uppercase text-[7px] sm:text-[9px] md:text-[10px]">T1</th>
                                                <th className="border border-gray-900 px-1 sm:px-2 py-1 sm:py-1.5 text-center font-bold uppercase text-[7px] sm:text-[9px] md:text-[10px]">T2</th>
                                                <th className="border border-gray-900 px-1 sm:px-2 py-1 sm:py-1.5 text-center font-bold uppercase text-[7px] sm:text-[9px] md:text-[10px]">T3</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="border border-gray-900 px-1 sm:px-2 py-1 sm:py-1.5 text-center font-bold uppercase text-[7px] sm:text-[9px] md:text-[10px]">Open</th>
                                                <th className="border border-gray-900 px-1 sm:px-2 py-1 sm:py-1.5 text-center font-bold uppercase text-[7px] sm:text-[9px] md:text-[10px]">Mid</th>
                                                <th className="border border-gray-900 px-1 sm:px-2 py-1 sm:py-1.5 text-center font-bold uppercase text-[7px] sm:text-[9px] md:text-[10px]">End</th>
                                            </>
                                        )}
                                        <th className="border border-gray-900 px-1 sm:px-2 py-1 sm:py-1.5 text-center font-bold uppercase text-[7px] sm:text-[9px] md:text-[10px]">Avg</th>
                                        <th className="border border-gray-900 px-1 sm:px-2 py-1 sm:py-1.5 text-center font-bold uppercase text-[7px] sm:text-[9px] md:text-[10px]">Grade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.academic_subjects.map((subject, index) => (
                                        <tr key={subject.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="border border-gray-900 px-1 sm:px-2 md:px-3 py-0.5 sm:py-1 font-semibold text-[8px] sm:text-[10px] md:text-xs">{subject.name}</td>
                                            {reportData.is_term3 ? (
                                                <>
                                                    <td className={`border border-gray-900 px-1 sm:px-2 py-0.5 sm:py-1 text-center font-medium ${getMarkColor(subject.term1_average)}`}>
                                                        {formatMarks(subject.term1_average)}
                                                    </td>
                                                    <td className={`border border-gray-900 px-1 sm:px-2 py-0.5 sm:py-1 text-center font-medium ${getMarkColor(subject.term2_average)}`}>
                                                        {formatMarks(subject.term2_average)}
                                                    </td>
                                                    <td className={`border border-gray-900 px-1 sm:px-2 py-0.5 sm:py-1 text-center font-medium ${getMarkColor(subject.term3_result)}`}>
                                                        {formatMarks(subject.term3_result)}
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className={`border border-gray-900 px-1 sm:px-2 py-0.5 sm:py-1 text-center font-medium ${getMarkColor(subject.opening)}`}>
                                                        {formatMarks(subject.opening)}
                                                    </td>
                                                    <td className={`border border-gray-900 px-1 sm:px-2 py-0.5 sm:py-1 text-center font-medium ${getMarkColor(subject.midterm)}`}>
                                                        {formatMarks(subject.midterm)}
                                                    </td>
                                                    <td className={`border border-gray-900 px-1 sm:px-2 py-0.5 sm:py-1 text-center font-medium ${getMarkColor(subject.end_term)}`}>
                                                        {formatMarks(subject.end_term)}
                                                    </td>
                                                </>
                                            )}
                                            <td className={`border border-gray-900 px-1 sm:px-2 py-0.5 sm:py-1 text-center font-bold ${getMarkColor(subject.average)}`}>
                                                {formatMarks(subject.average)}
                                            </td>
                                            <td className="border border-gray-900 px-1 sm:px-2 py-0.5 sm:py-1 text-center font-bold">
                                                {subject.rubric || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-blue-200 print:bg-gray-300 font-bold">
                                        <td className="border-2 border-gray-900 px-1 sm:px-2 md:px-3 py-1 sm:py-1.5 uppercase text-[8px] sm:text-xs" colSpan={reportData.is_term3 ? "4" : "4"}>
                                            Academic Average
                                        </td>
                                        <td className="border-2 border-gray-900 px-1 sm:px-2 py-1 sm:py-1.5 text-center text-[9px] sm:text-sm">
                                            {reportData.academic_average ? reportData.academic_average.toFixed(2) : '-'}
                                        </td>
                                        <td className="border-2 border-gray-900 px-1 sm:px-2 py-1 sm:py-1.5 text-center text-[9px] sm:text-sm">
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
                        <div className="px-2 sm:px-4 md:px-6 py-3 overflow-x-auto">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-1 h-6 bg-green-600 rounded-full"></div>
                                <h3 className="text-xs sm:text-sm font-black text-green-900 uppercase tracking-wide">Islamic Studies</h3>
                            </div>

                            <div className="w-full">
                                <table className="w-full border-2 border-gray-900 text-[8px] sm:text-[10px] md:text-xs">
                                    <thead>
                                        <tr className="bg-green-100 print:bg-gray-200">
                                            <th className="border border-gray-900 px-1 sm:px-2 md:px-3 py-1 sm:py-1.5 text-left font-bold uppercase text-[7px] sm:text-[9px] md:text-[10px]">Subject</th>
                                            {reportData.is_term3 ? (
                                                <>
                                                    <th className="border border-gray-900 px-1 sm:px-2 py-1 sm:py-1.5 text-center font-bold uppercase text-[7px] sm:text-[9px] md:text-[10px]">T1</th>
                                                    <th className="border border-gray-900 px-1 sm:px-2 py-1 sm:py-1.5 text-center font-bold uppercase text-[7px] sm:text-[9px] md:text-[10px]">T2</th>
                                                    <th className="border border-gray-900 px-1 sm:px-2 py-1 sm:py-1.5 text-center font-bold uppercase text-[7px] sm:text-[9px] md:text-[10px]">T3</th>
                                                </>
                                            ) : (
                                                <>
                                                    <th className="border border-gray-900 px-1 sm:px-2 py-1 sm:py-1.5 text-center font-bold uppercase text-[7px] sm:text-[9px] md:text-[10px]">Open</th>
                                                    <th className="border border-gray-900 px-1 sm:px-2 py-1 sm:py-1.5 text-center font-bold uppercase text-[7px] sm:text-[9px] md:text-[10px]">Mid</th>
                                                    <th className="border border-gray-900 px-1 sm:px-2 py-1 sm:py-1.5 text-center font-bold uppercase text-[7px] sm:text-[9px] md:text-[10px]">End</th>
                                                </>
                                            )}
                                            <th className="border border-gray-900 px-1 sm:px-2 py-1 sm:py-1.5 text-center font-bold uppercase text-[7px] sm:text-[9px] md:text-[10px]">Avg</th>
                                            <th className="border border-gray-900 px-1 sm:px-2 py-1 sm:py-1.5 text-center font-bold uppercase text-[7px] sm:text-[9px] md:text-[10px]">Grade</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.islamic_subjects.map((subject, index) => (
                                            <tr key={subject.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="border border-gray-900 px-1 sm:px-2 md:px-3 py-0.5 sm:py-1 font-semibold text-[8px] sm:text-[10px] md:text-xs">{subject.name}</td>
                                                {reportData.is_term3 ? (
                                                    <>
                                                        <td className={`border border-gray-900 px-1 sm:px-2 py-0.5 sm:py-1 text-center font-medium ${getMarkColor(subject.term1_average)}`}>
                                                            {formatMarks(subject.term1_average)}
                                                        </td>
                                                        <td className={`border border-gray-900 px-1 sm:px-2 py-0.5 sm:py-1 text-center font-medium ${getMarkColor(subject.term2_average)}`}>
                                                            {formatMarks(subject.term2_average)}
                                                        </td>
                                                        <td className={`border border-gray-900 px-1 sm:px-2 py-0.5 sm:py-1 text-center font-medium ${getMarkColor(subject.term3_result)}`}>
                                                            {formatMarks(subject.term3_result)}
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className={`border border-gray-900 px-1 sm:px-2 py-0.5 sm:py-1 text-center font-medium ${getMarkColor(subject.opening)}`}>
                                                            {formatMarks(subject.opening)}
                                                        </td>
                                                        <td className={`border border-gray-900 px-1 sm:px-2 py-0.5 sm:py-1 text-center font-medium ${getMarkColor(subject.midterm)}`}>
                                                            {formatMarks(subject.midterm)}
                                                        </td>
                                                        <td className={`border border-gray-900 px-1 sm:px-2 py-0.5 sm:py-1 text-center font-medium ${getMarkColor(subject.end_term)}`}>
                                                            {formatMarks(subject.end_term)}
                                                        </td>
                                                    </>
                                                )}
                                                <td className={`border border-gray-900 px-1 sm:px-2 py-0.5 sm:py-1 text-center font-bold ${getMarkColor(subject.average)}`}>
                                                    {formatMarks(subject.average)}
                                                </td>
                                                <td className="border border-gray-900 px-1 sm:px-2 py-0.5 sm:py-1 text-center font-bold">
                                                    {subject.rubric || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="bg-green-200 print:bg-gray-300 font-bold">
                                            <td className="border-2 border-gray-900 px-1 sm:px-2 md:px-3 py-1 sm:py-1.5 uppercase text-[8px] sm:text-xs" colSpan={reportData.is_term3 ? "4" : "4"}>
                                                Islamic Studies Average
                                            </td>
                                            <td className="border-2 border-gray-900 px-1 sm:px-2 py-1 sm:py-1.5 text-center text-[9px] sm:text-sm">
                                                {reportData.islamic_average ? reportData.islamic_average.toFixed(2) : '-'}
                                            </td>
                                            <td className="border-2 border-gray-900 px-1 sm:px-2 py-1 sm:py-1.5 text-center text-[9px] sm:text-sm">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2 px-4 sm:px-6 py-4 print:py-2 border-b-2 border-gray-300">
                        {/* Teacher Comment */}
                        <div>
                            <div className="flex items-center justify-between gap-2 mb-1 print:mb-1">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-5 bg-indigo-600 rounded-full print:hidden"></div>
                                    <h3 className="text-xs sm:text-sm print:text-[10px] font-bold uppercase tracking-wide text-gray-700">Class Teacher's Comment</h3>
                                </div>
                            </div>

                            {reportData.comments?.teacher_comment ? (
                                <div>
                                    <div className="min-h-[60px] print:min-h-[35px] p-3 print:p-2 border-2 border-gray-300 print:rounded-none rounded-lg bg-gray-50 print:bg-white text-[10px] sm:text-xs print:text-[9px] leading-relaxed print:leading-snug">
                                        {reportData.comments.teacher_comment}
                                    </div>
                                    {reportData.comments.teacher_comment_locked_at ? (
                                        <div className="flex items-center gap-2 mt-2 print:hidden">
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
                                                <Lock className="w-3 h-3" />
                                                <span className="font-medium">Locked</span>
                                            </div>
                                            {isAdmin && (
                                                <button
                                                    onClick={() => handleUnlockComment('teacher')}
                                                    className="inline-flex items-center px-3 py-1.5 text-xs text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                                >
                                                    <Lock className="w-3 h-3 mr-1" />
                                                    Unlock
                                                </button>
                                            )}
                                        </div>
                                    ) : canEditTeacherComment && (
                                        <div className="flex gap-2 mt-2 print:hidden">
                                            <button
                                                onClick={() => {
                                                    setTeacherData('comment', reportData.comments.teacher_comment);
                                                    setShowTeacherCommentForm(true);
                                                }}
                                                className="inline-flex items-center px-3 py-1.5 text-xs text-orange bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                                            >
                                                Edit Comment
                                            </button>
                                            <button
                                                onClick={() => handleLockComment('teacher')}
                                                className="inline-flex items-center px-3 py-1.5 text-xs text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                                            >
                                                <Lock className="w-3 h-3 mr-1" />
                                                Lock
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    {canEditTeacherComment && !isGuardian ? (
                                        <div className="print:hidden">
                                            {showTeacherCommentForm ? (
                                                <form onSubmit={handleSaveTeacherComment} className="space-y-3">
                                                    <textarea
                                                        value={teacherData.comment}
                                                        onChange={(e) => setTeacherData('comment', e.target.value)}
                                                        rows="4"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all text-xs"
                                                        placeholder="Enter teacher's comment about the student's performance, behavior, and areas for improvement..."
                                                        required
                                                    ></textarea>
                                                    <div className="flex gap-2 justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowTeacherCommentForm(false)}
                                                            className="px-3 py-1.5 text-xs text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            type="submit"
                                                            disabled={processingTeacher}
                                                            className="inline-flex items-center px-3 py-1.5 text-xs text-white bg-orange rounded-lg hover:bg-orange-dark transition-colors disabled:opacity-50"
                                                        >
                                                            <Save className="w-3 h-3 mr-1" />
                                                            {processingTeacher ? 'Saving...' : 'Save'}
                                                        </button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <button
                                                    onClick={() => setShowTeacherCommentForm(true)}
                                                    className="inline-flex items-center px-4 py-2 text-xs text-white bg-orange rounded-lg hover:bg-orange-dark transition-colors"
                                                >
                                                    <Save className="w-3 h-3 mr-1" />
                                                    Add Teacher Comment
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="min-h-[60px] print:min-h-[35px] p-3 print:p-2 border-2 border-dashed border-gray-300 print:rounded-none rounded-lg bg-gray-50 print:bg-white text-[10px] sm:text-xs print:text-[9px] text-gray-400 italic flex items-center justify-center">
                                            No comment provided
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Principal Comment */}
                        <div>
                            <div className="flex items-center justify-between gap-2 mb-1 print:mb-1">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-5 bg-purple-600 rounded-full print:hidden"></div>
                                    <h3 className="text-xs sm:text-sm print:text-[10px] font-bold uppercase tracking-wide text-gray-700">Principal's Comment</h3>
                                </div>
                            </div>

                            {reportData.comments?.headteacher_comment ? (
                                <div>
                                    <div className="min-h-[60px] print:min-h-[35px] p-3 print:p-2 border-2 border-gray-300 print:rounded-none rounded-lg bg-gray-50 print:bg-white text-[10px] sm:text-xs print:text-[9px] leading-relaxed print:leading-snug">
                                        {reportData.comments.headteacher_comment}
                                    </div>
                                    {reportData.comments.headteacher_comment_locked_at ? (
                                        <div className="flex items-center gap-2 mt-2 print:hidden">
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
                                                <Lock className="w-3 h-3" />
                                                <span className="font-medium">Locked</span>
                                            </div>
                                            {isAdmin && (
                                                <button
                                                    onClick={() => handleUnlockComment('headteacher')}
                                                    className="inline-flex items-center px-3 py-1.5 text-xs text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                                >
                                                    <Lock className="w-3 h-3 mr-1" />
                                                    Unlock
                                                </button>
                                            )}
                                        </div>
                                    ) : canEditHeadteacherComment && (
                                        <div className="flex gap-2 mt-2 print:hidden">
                                            <button
                                                onClick={() => {
                                                    setHeadteacherData('comment', reportData.comments.headteacher_comment);
                                                    setShowHeadteacherCommentForm(true);
                                                }}
                                                className="inline-flex items-center px-3 py-1.5 text-xs text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                            >
                                                Edit Comment
                                            </button>
                                            <button
                                                onClick={() => handleLockComment('headteacher')}
                                                className="inline-flex items-center px-3 py-1.5 text-xs text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                                            >
                                                <Lock className="w-3 h-3 mr-1" />
                                                Lock
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    {canEditHeadteacherComment && !isGuardian ? (
                                        <div className="print:hidden">
                                            {showHeadteacherCommentForm ? (
                                                <form onSubmit={handleSaveHeadteacherComment} className="space-y-3">
                                                    <textarea
                                                        value={headteacherData.comment}
                                                        onChange={(e) => setHeadteacherData('comment', e.target.value)}
                                                        rows="4"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-xs"
                                                        placeholder="Enter headteacher's comment about the student's overall performance and conduct..."
                                                        required
                                                    ></textarea>
                                                    <div className="flex gap-2 justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowHeadteacherCommentForm(false)}
                                                            className="px-3 py-1.5 text-xs text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            type="submit"
                                                            disabled={processingHeadteacher}
                                                            className="inline-flex items-center px-3 py-1.5 text-xs text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                                        >
                                                            <Save className="w-3 h-3 mr-1" />
                                                            {processingHeadteacher ? 'Saving...' : 'Save'}
                                                        </button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <button
                                                    onClick={() => setShowHeadteacherCommentForm(true)}
                                                    className="inline-flex items-center px-4 py-2 text-xs text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                                                >
                                                    <Save className="w-3 h-3 mr-1" />
                                                    Add Principal Comment
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="min-h-[60px] print:min-h-[35px] p-3 print:p-2 border-2 border-dashed border-gray-300 print:rounded-none rounded-lg bg-gray-50 print:bg-white text-[10px] sm:text-xs print:text-[9px] text-gray-400 italic flex items-center justify-center">
                                            No comment provided
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Signatures - Enhanced & Responsive */}
                    <div className="px-4 sm:px-6 py-4 print:py-2 border-b-2 border-gray-300 bg-gray-50 print:bg-white">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 print:gap-3">
                            <div className="text-center">
                                <div className="border-b-2 border-gray-900 mb-1 h-12 print:h-8"></div>
                                <p className="text-[10px] sm:text-xs print:text-[9px] font-bold uppercase tracking-wide text-gray-700">Class Teacher</p>
                                <p className="text-[8px] sm:text-[9px] print:text-[8px] text-gray-500 mt-0.5 print:hidden">Signature & Date</p>
                            </div>
                            <div className="text-center">
                                <div className="border-b-2 border-gray-900 mb-1 h-12 print:h-8"></div>
                                <p className="text-[10px] sm:text-xs print:text-[9px] font-bold uppercase tracking-wide text-gray-700">Principal</p>
                                <p className="text-[8px] sm:text-[9px] print:text-[8px] text-gray-500 mt-0.5 print:hidden">Signature & Date</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer - Enhanced & Responsive */}
                    <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white print:bg-gray-200 print:text-gray-900 px-4 sm:px-6 py-3 print:py-2 text-center border-t-4 border-[#ff6b35] print:border-gray-900">
                        <p className="text-[10px] sm:text-xs print:text-[9px] font-semibold tracking-wide">
                            Official Document • Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        <p className="text-[8px] sm:text-[9px] print:text-[8px] text-gray-400 print:text-gray-600 mt-1 print:mt-0">
                            {school?.name || 'School Name'} • Academic Excellence
                        </p>
                    </div>
                </div>
            </div>

            {/* Lock Comment Confirmation Modal */}
            {showLockModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:hidden">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                                    <Lock className="w-6 h-6 text-yellow-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Lock Comment</h3>
                                    <p className="text-sm text-gray-500">Confirm this action</p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <p className="text-sm text-gray-700">
                                    Are you sure you want to lock the <span className="font-semibold">{lockCommentType === 'teacher' ? 'Class Teacher' : 'Principal'}</span> comment?
                                </p>
                                <p className="text-sm text-red-600 mt-2 font-medium">
                                    ⚠️ This action cannot be undone. Only administrators will be able to unlock it.
                                </p>
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => {
                                        setShowLockModal(false);
                                        setLockCommentType(null);
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmLockComment}
                                    className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 transition-colors inline-flex items-center gap-2"
                                >
                                    <Lock className="w-4 h-4" />
                                    Lock Comment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Unlock Comment Confirmation Modal */}
            {showUnlockModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:hidden">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                    <Lock className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Unlock Comment</h3>
                                    <p className="text-sm text-gray-500">Admin Action Required</p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <p className="text-sm text-gray-700">
                                    Are you sure you want to unlock the <span className="font-semibold">{unlockCommentType === 'teacher' ? 'Class Teacher' : 'Principal'}</span> comment?
                                </p>
                                <p className="text-sm text-blue-600 mt-2 font-medium">
                                    ℹ️ This will allow the comment to be edited again.
                                </p>
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => {
                                        setShowUnlockModal(false);
                                        setUnlockCommentType(null);
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmUnlockComment}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors inline-flex items-center gap-2"
                                >
                                    <Lock className="w-4 h-4" />
                                    Unlock Comment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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

                    /* Hide everything except the report card */
                    body > div:not(:has(.report-card-container)) {
                        display: none !important;
                    }

                    /* Hide navigation, header, sidebar */
                    nav, header, aside, .sidebar, [role="navigation"] {
                        display: none !important;
                    }

                    .print\\:hidden {
                        display: none !important;
                    }

                    /* Remove all margins and padding from body and main containers */
                    body, #app, main {
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    /* Compact header for print */
                    .bg-gradient-to-br {
                        padding-top: 0.5rem !important;
                        padding-bottom: 0.5rem !important;
                    }

                    /* Reduce spacing in student info section */
                    .bg-gradient-to-r {
                        padding-top: 0.4rem !important;
                        padding-bottom: 0.4rem !important;
                    }

                    /* Compact table sections */
                    .px-2, .px-4, .px-6 {
                        padding-left: 0.25rem !important;
                        padding-right: 0.25rem !important;
                    }

                    .py-3, .py-4 {
                        padding-top: 0.4rem !important;
                        padding-bottom: 0.4rem !important;
                    }

                    /* Reduce comment section height */
                    .min-h-\\[60px\\] {
                        min-height: 40px !important;
                    }

                    /* Compact signatures section */
                    .h-12 {
                        height: 2rem !important;
                    }

                    /* Reduce overall performance section spacing */
                    .space-y-4 {
                        gap: 0.5rem !important;
                    }

                    /* Make footer more compact */
                    footer, .bg-gradient-to-r.from-gray-900 {
                        padding-top: 0.4rem !important;
                        padding-bottom: 0.4rem !important;
                    }

                    /* Ensure single page */
                    .report-card-container {
                        page-break-inside: avoid;
                        page-break-after: avoid;
                        page-break-before: avoid;
                    }
                }
            `}</style>
        </AuthenticatedLayout>
    );
}