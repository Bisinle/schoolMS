import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Download, Lock, Save, ArrowLeft } from 'lucide-react';
import { shouldShowAcademicSubjects } from '@/Utils/subjectFilters';

export default function ReportCard({
    student,
    term,
    academicYear,
    reportData,
    canEditTeacherComment,
    isGuardian
}) {
    const { school, auth } = usePage().props;
    const showAcademicSubjects = shouldShowAcademicSubjects(school?.school_type);
    const [showTeacherCommentForm, setShowTeacherCommentForm] = useState(false);
    const [showLockModal, setShowLockModal] = useState(false);
    const [lockCommentType, setLockCommentType] = useState(null);
    const [showUnlockModal, setShowUnlockModal] = useState(false);
    const [unlockCommentType, setUnlockCommentType] = useState(null);

    const isAdmin = auth?.user?.role === 'admin';

    // Auto-print when opened via the Print button on the index page
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('autoprint') === '1') {
            const timer = setTimeout(() => window.print(), 800);
            return () => clearTimeout(timer);
        }
    }, []);

    const { data: teacherData, setData: setTeacherData, post: postTeacher, processing: processingTeacher } = useForm({
        comment_type: 'teacher',
        term: term,
        academic_year: academicYear,
        comment: reportData.comments?.teacher_comment || '',
    });

    const handleSaveTeacherComment = (e) => {
        e.preventDefault();
        postTeacher(`/reports/students/${student.id}/comments`, {
            onSuccess: () => {
                setShowTeacherCommentForm(false);
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
                            {/* Screen View - Original Centered Stacked Layout */}
                            <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4 print:hidden">
                                {/* School Logo */}
                                {school?.logo_path ? (
                                    <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 bg-white rounded-full flex items-center justify-center shadow-2xl overflow-hidden ring-4 ring-white/30">
                                        <img src={`/storage/${school.logo_path}`} alt={school.name} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 bg-white rounded-full flex items-center justify-center shadow-2xl ring-4 ring-white/30">
                                        <span className="text-5xl sm:text-6xl md:text-7xl">🏫</span>
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

                            {/* Print View - Two-column: large logo left, school info right */}
                            <div className="hidden print:flex flex-row items-center print-header-block">
                                {/* Left quarter — logo */}
                                <div className="flex items-center justify-center flex-shrink-0 print-header-logo-wrap">
                                    {school?.logo_path ? (
                                        <img src={`/storage/${school.logo_path}`} alt={school.name} className="print-header-logo" />
                                    ) : (
                                        <div className="flex items-center justify-center print-header-logo">
                                            <span className="text-7xl">🏫</span>
                                        </div>
                                    )}
                                </div>

                                {/* Right three-quarters — school identity */}
                                <div className="flex flex-col items-center justify-center text-center flex-1">
                                    <h1 className="text-2xl font-black text-gray-900 uppercase tracking-widest leading-tight">
                                        {school?.name || 'School Name'}
                                    </h1>
                                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.25em] mt-0.5">
                                        Excellence in Education
                                    </p>

                                    {/* Decorative rule */}
                                    <div className="flex items-center gap-2 w-full max-w-xs my-1.5">
                                        <div className="flex-1 h-px bg-gray-900"></div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-900"></div>
                                        <div className="flex-1 h-px bg-gray-900"></div>
                                    </div>

                                    <h2 className="text-base font-black text-gray-900 uppercase tracking-[0.2em]">
                                        Student Report Card
                                    </h2>
                                    <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest mt-0.5">
                                        Academic Year: <span className="text-gray-900 font-black">{academicYear}</span>
                                    </p>
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
                            <table className="w-full border-2 border-gray-900 text-sm sm:text-base">
                                <thead>
                                    <tr className="bg-blue-100 print:bg-gray-200">
                                        <th className="border border-gray-900 px-2 sm:px-3 md:px-4 py-3 sm:py-3.5 text-left font-bold uppercase text-xs sm:text-sm">Subject</th>
                                        {reportData.is_term3 ? (
                                            <>
                                                <th className="border border-gray-900 px-2 sm:px-3 py-3 sm:py-3.5 text-center font-bold uppercase text-xs sm:text-sm">T1</th>
                                                <th className="border border-gray-900 px-2 sm:px-3 py-3 sm:py-3.5 text-center font-bold uppercase text-xs sm:text-sm">T2</th>
                                                <th className="border border-gray-900 px-2 sm:px-3 py-3 sm:py-3.5 text-center font-bold uppercase text-xs sm:text-sm">T3</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="border border-gray-900 px-2 sm:px-3 py-3 sm:py-3.5 text-center font-bold uppercase text-xs sm:text-sm">Open</th>
                                                <th className="border border-gray-900 px-2 sm:px-3 py-3 sm:py-3.5 text-center font-bold uppercase text-xs sm:text-sm">Mid</th>
                                                <th className="border border-gray-900 px-2 sm:px-3 py-3 sm:py-3.5 text-center font-bold uppercase text-xs sm:text-sm">End</th>
                                            </>
                                        )}
                                        <th className="border border-gray-900 px-2 sm:px-3 py-3 sm:py-3.5 text-center font-bold uppercase text-xs sm:text-sm">Avg</th>
                                        <th className="border border-gray-900 px-2 sm:px-3 py-3 sm:py-3.5 text-center font-bold uppercase text-xs sm:text-sm">Grade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.academic_subjects.map((subject, index) => (
                                        <tr key={subject.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="border border-gray-900 px-2 sm:px-3 md:px-4 py-2.5 sm:py-3 font-semibold text-sm sm:text-base">{subject.name}</td>
                                            {reportData.is_term3 ? (
                                                <>
                                                    <td className={`border border-gray-900 px-2 sm:px-3 py-2.5 sm:py-3 text-center font-semibold text-sm sm:text-base ${getMarkColor(subject.term1_average)}`}>
                                                        {formatMarks(subject.term1_average)}
                                                    </td>
                                                    <td className={`border border-gray-900 px-2 sm:px-3 py-2.5 sm:py-3 text-center font-semibold text-sm sm:text-base ${getMarkColor(subject.term2_average)}`}>
                                                        {formatMarks(subject.term2_average)}
                                                    </td>
                                                    <td className={`border border-gray-900 px-2 sm:px-3 py-2.5 sm:py-3 text-center font-semibold text-sm sm:text-base ${getMarkColor(subject.term3_result)}`}>
                                                        {formatMarks(subject.term3_result)}
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className={`border border-gray-900 px-2 sm:px-3 py-2.5 sm:py-3 text-center font-semibold text-sm sm:text-base ${getMarkColor(subject.opening)}`}>
                                                        {formatMarks(subject.opening)}
                                                    </td>
                                                    <td className={`border border-gray-900 px-2 sm:px-3 py-2.5 sm:py-3 text-center font-semibold text-sm sm:text-base ${getMarkColor(subject.midterm)}`}>
                                                        {formatMarks(subject.midterm)}
                                                    </td>
                                                    <td className={`border border-gray-900 px-2 sm:px-3 py-2.5 sm:py-3 text-center font-semibold text-sm sm:text-base ${getMarkColor(subject.end_term)}`}>
                                                        {formatMarks(subject.end_term)}
                                                    </td>
                                                </>
                                            )}
                                            <td className={`border border-gray-900 px-2 sm:px-3 py-2.5 sm:py-3 text-center font-bold text-sm sm:text-base ${getMarkColor(subject.average)}`}>
                                                {formatMarks(subject.average)}
                                            </td>
                                            <td className="border border-gray-900 px-2 sm:px-3 py-2.5 sm:py-3 text-center font-bold text-sm sm:text-base">
                                                {subject.rubric || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-blue-200 print:bg-gray-300 font-bold">
                                        <td className="border-2 border-gray-900 px-2 sm:px-3 md:px-4 py-2.5 sm:py-3 uppercase text-xs sm:text-sm">
                                            Average
                                        </td>
                                        {reportData.is_term3 ? (
                                            <>
                                                <td className="border-2 border-gray-900 px-2 sm:px-3 py-2.5 sm:py-3 text-center text-sm sm:text-base">-</td>
                                                <td className="border-2 border-gray-900 px-2 sm:px-3 py-2.5 sm:py-3 text-center text-sm sm:text-base">-</td>
                                                <td className="border-2 border-gray-900 px-2 sm:px-3 py-2.5 sm:py-3 text-center text-sm sm:text-base">-</td>
                                            </>
                                        ) : (
                                            <>
                                                <td className={`border-2 border-gray-900 px-2 sm:px-3 py-2.5 sm:py-3 text-center text-sm sm:text-base ${getMarkColor(reportData.academic_opening_average)}`}>
                                                    {reportData.academic_opening_average !== null ? reportData.academic_opening_average.toFixed(2) : '-'}
                                                </td>
                                                <td className={`border-2 border-gray-900 px-2 sm:px-3 py-2.5 sm:py-3 text-center text-sm sm:text-base ${getMarkColor(reportData.academic_midterm_average)}`}>
                                                    {reportData.academic_midterm_average !== null ? reportData.academic_midterm_average.toFixed(2) : '-'}
                                                </td>
                                                <td className={`border-2 border-gray-900 px-2 sm:px-3 py-2.5 sm:py-3 text-center text-sm sm:text-base ${getMarkColor(reportData.academic_end_term_average)}`}>
                                                    {reportData.academic_end_term_average !== null ? reportData.academic_end_term_average.toFixed(2) : '-'}
                                                </td>
                                            </>
                                        )}
                                        <td className={`border-2 border-gray-900 px-2 sm:px-3 py-2.5 sm:py-3 text-center text-sm sm:text-base ${getMarkColor(reportData.academic_average)}`}>
                                            {reportData.academic_average ? reportData.academic_average.toFixed(2) : '-'}
                                        </td>
                                        <td className="border-2 border-gray-900 px-2 sm:px-3 py-2.5 sm:py-3 text-center text-sm sm:text-base">
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
                                <table className="w-full border-2 border-gray-900 text-sm sm:text-base">
                                    <thead>
                                        <tr className="bg-green-100 print:bg-gray-200">
                                            <th className="border border-gray-900 px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 text-left font-bold uppercase text-xs sm:text-sm">Subject</th>
                                            {reportData.is_term3 ? (
                                                <>
                                                    <th className="border border-gray-900 px-2 sm:px-3 py-2 sm:py-2.5 text-center font-bold uppercase text-xs sm:text-sm">T1</th>
                                                    <th className="border border-gray-900 px-2 sm:px-3 py-2 sm:py-2.5 text-center font-bold uppercase text-xs sm:text-sm">T2</th>
                                                    <th className="border border-gray-900 px-2 sm:px-3 py-2 sm:py-2.5 text-center font-bold uppercase text-xs sm:text-sm">T3</th>
                                                </>
                                            ) : (
                                                <>
                                                    <th className="border border-gray-900 px-2 sm:px-3 py-2 sm:py-2.5 text-center font-bold uppercase text-xs sm:text-sm">Open</th>
                                                    <th className="border border-gray-900 px-2 sm:px-3 py-2 sm:py-2.5 text-center font-bold uppercase text-xs sm:text-sm">Mid</th>
                                                    <th className="border border-gray-900 px-2 sm:px-3 py-2 sm:py-2.5 text-center font-bold uppercase text-xs sm:text-sm">End</th>
                                                </>
                                            )}
                                            <th className="border border-gray-900 px-2 sm:px-3 py-2 sm:py-2.5 text-center font-bold uppercase text-xs sm:text-sm">Avg</th>
                                            <th className="border border-gray-900 px-2 sm:px-3 py-2 sm:py-2.5 text-center font-bold uppercase text-xs sm:text-sm">Grade</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.islamic_subjects.map((subject, index) => (
                                            <tr key={subject.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="border border-gray-900 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 font-semibold text-sm sm:text-base">{subject.name}</td>
                                                {reportData.is_term3 ? (
                                                    <>
                                                        <td className={`border border-gray-900 px-2 sm:px-3 py-1.5 sm:py-2 text-center font-semibold text-sm sm:text-base ${getMarkColor(subject.term1_average)}`}>
                                                            {formatMarks(subject.term1_average)}
                                                        </td>
                                                        <td className={`border border-gray-900 px-2 sm:px-3 py-1.5 sm:py-2 text-center font-semibold text-sm sm:text-base ${getMarkColor(subject.term2_average)}`}>
                                                            {formatMarks(subject.term2_average)}
                                                        </td>
                                                        <td className={`border border-gray-900 px-2 sm:px-3 py-1.5 sm:py-2 text-center font-semibold text-sm sm:text-base ${getMarkColor(subject.term3_result)}`}>
                                                            {formatMarks(subject.term3_result)}
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className={`border border-gray-900 px-2 sm:px-3 py-1.5 sm:py-2 text-center font-semibold text-sm sm:text-base ${getMarkColor(subject.opening)}`}>
                                                            {formatMarks(subject.opening)}
                                                        </td>
                                                        <td className={`border border-gray-900 px-2 sm:px-3 py-1.5 sm:py-2 text-center font-semibold text-sm sm:text-base ${getMarkColor(subject.midterm)}`}>
                                                            {formatMarks(subject.midterm)}
                                                        </td>
                                                        <td className={`border border-gray-900 px-2 sm:px-3 py-1.5 sm:py-2 text-center font-semibold text-sm sm:text-base ${getMarkColor(subject.end_term)}`}>
                                                            {formatMarks(subject.end_term)}
                                                        </td>
                                                    </>
                                                )}
                                                <td className={`border border-gray-900 px-2 sm:px-3 py-1.5 sm:py-2 text-center font-bold text-sm sm:text-base ${getMarkColor(subject.average)}`}>
                                                    {formatMarks(subject.average)}
                                                </td>
                                                <td className="border border-gray-900 px-2 sm:px-3 py-1.5 sm:py-2 text-center font-bold text-sm sm:text-base">
                                                    {subject.rubric || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="bg-green-200 print:bg-gray-300 font-bold">
                                            <td className="border-2 border-gray-900 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 uppercase text-xs sm:text-sm">
                                                Average
                                            </td>
                                            {reportData.is_term3 ? (
                                                <>
                                                    <td className="border-2 border-gray-900 px-2 sm:px-3 py-1.5 sm:py-2 text-center text-sm sm:text-base">-</td>
                                                    <td className="border-2 border-gray-900 px-2 sm:px-3 py-1.5 sm:py-2 text-center text-sm sm:text-base">-</td>
                                                    <td className="border-2 border-gray-900 px-2 sm:px-3 py-1.5 sm:py-2 text-center text-sm sm:text-base">-</td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className={`border-2 border-gray-900 px-2 sm:px-3 py-1.5 sm:py-2 text-center text-sm sm:text-base ${getMarkColor(reportData.islamic_opening_average)}`}>
                                                        {reportData.islamic_opening_average !== null ? reportData.islamic_opening_average.toFixed(2) : '-'}
                                                    </td>
                                                    <td className={`border-2 border-gray-900 px-2 sm:px-3 py-1.5 sm:py-2 text-center text-sm sm:text-base ${getMarkColor(reportData.islamic_midterm_average)}`}>
                                                        {reportData.islamic_midterm_average !== null ? reportData.islamic_midterm_average.toFixed(2) : '-'}
                                                    </td>
                                                    <td className={`border-2 border-gray-900 px-2 sm:px-3 py-1.5 sm:py-2 text-center text-sm sm:text-base ${getMarkColor(reportData.islamic_end_term_average)}`}>
                                                        {reportData.islamic_end_term_average !== null ? reportData.islamic_end_term_average.toFixed(2) : '-'}
                                                    </td>
                                                </>
                                            )}
                                            <td className={`border-2 border-gray-900 px-2 sm:px-3 py-1.5 sm:py-2 text-center text-sm sm:text-base ${getMarkColor(reportData.islamic_average)}`}>
                                                {reportData.islamic_average ? reportData.islamic_average.toFixed(2) : '-'}
                                            </td>
                                            <td className="border-2 border-gray-900 px-2 sm:px-3 py-1.5 sm:py-2 text-center text-sm sm:text-base">
                                                {reportData.islamic_rubric || '-'}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Averages Summary - Two separate blocks */}
                    <div className="grid grid-cols-2 border-y-2 border-gray-300 print:border-gray-900 divide-x-2 divide-gray-300 print:divide-gray-900">
                        {/* Academic Average */}
                        <div className="px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-100 to-indigo-100 print:bg-gray-100">
                            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wide text-blue-800 print:text-gray-600 mb-1">Academic Average</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl sm:text-2xl font-black text-blue-700 print:text-gray-900">
                                    {reportData.academic_average ? `${reportData.academic_average.toFixed(2)}%` : 'N/A'}
                                </span>
                                <span className="px-2 py-0.5 bg-blue-700 text-white rounded font-black text-xs print:bg-white print:text-blue-700 print:border print:border-blue-700">
                                    {reportData.academic_rubric || '—'}
                                </span>
                            </div>
                        </div>

                        {/* Islamic Studies Average */}
                        <div className="px-4 sm:px-6 py-3 bg-gradient-to-r from-green-100 to-emerald-100 print:bg-gray-50">
                            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wide text-green-800 print:text-gray-600 mb-1">Islamic Studies Average</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl sm:text-2xl font-black text-green-700 print:text-gray-900">
                                    {reportData.islamic_average ? `${reportData.islamic_average.toFixed(2)}%` : 'N/A'}
                                </span>
                                <span className="px-2 py-0.5 bg-green-700 text-white rounded font-black text-xs print:bg-white print:text-green-700 print:border print:border-green-700">
                                    {reportData.islamic_rubric || '—'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Class Teacher's Comment - Full Width */}
                    <div className="px-4 sm:px-6 py-4 print:py-3 border-b-2 border-gray-300">
                        <div className="flex items-center justify-between gap-2 mb-2 print:mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-5 bg-indigo-600 rounded-full print:hidden"></div>
                                <h3 className="text-xs sm:text-sm print:text-[10px] font-bold uppercase tracking-wide text-gray-700">Class Teacher's Comment</h3>
                            </div>
                        </div>

                        {reportData.comments?.teacher_comment ? (
                            <div>
                                <div className="min-h-[100px] print:min-h-[80px] p-3 print:p-2 border-2 border-gray-300 print:rounded-none rounded-lg bg-gray-50 print:bg-white text-[10px] sm:text-xs print:text-[9px] leading-relaxed print:leading-snug">
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
                                                    rows="6"
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
                                    /* Print-only: large blank handwriting area */
                                    <div className="min-h-[100px] print:min-h-[80px] p-3 print:p-2 border-2 border-dashed border-gray-300 print:border-gray-400 print:rounded-none rounded-lg bg-gray-50 print:bg-white text-[10px] sm:text-xs print:text-[9px] text-gray-400 italic flex items-start justify-start">
                                        <span className="print:hidden">No comment provided</span>
                                    </div>
                                )}
                                {/* Blank lined area for handwritten comment on print */}
                                <div className="hidden print:block mt-2 space-y-3">
                                    <div className="border-b border-gray-400 h-5"></div>
                                    <div className="border-b border-gray-400 h-5"></div>
                                    <div className="border-b border-gray-400 h-5"></div>
                                    <div className="border-b border-gray-400 h-5"></div>
                                </div>
                            </div>
                        )}
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
                        size: A4 portrait;
                        margin: 8mm 10mm;
                    }

                    body {
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                    }

                    /* Hide every sibling of the report card — sidebar, bottomnav, etc.
                       This eliminates the blank first page. */
                    .min-h-screen > *:not(:has(.report-card-container)) {
                        display: none !important;
                    }

                    /* Collapse the layout shell so it takes zero height */
                    .min-h-screen,
                    .min-h-screen > *,
                    .min-h-screen > * > * {
                        min-height: 0 !important;
                        height: auto !important;
                    }

                    /* Strip margin/padding from every layout wrapper */
                    body, #app,
                    body > div, #app > div,
                    [class*="pl-64"],
                    main, main > div, main > div > div {
                        margin: 0 !important;
                        padding: 0 !important;
                        max-width: 100% !important;
                    }

                    /* Hide nav chrome */
                    nav, header, aside,
                    .sticky, .print\\:hidden {
                        display: none !important;
                    }

                    /* Report card container — no zoom, full width */
                    .report-card-container {
                        width: 100% !important;
                        max-width: 100% !important;
                        box-shadow: none !important;
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }

                    /* ── Print header: two-column row ── */
                    .print-header-block {
                        flex-direction: row !important;
                        align-items: center !important;
                        padding-top: 6px !important;
                        padding-bottom: 6px !important;
                        gap: 0 !important;
                    }
                    /* Left quarter — logo container fills 25% of the header */
                    .print-header-logo-wrap {
                        width: 25% !important;
                        align-self: stretch !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        padding: 4px !important;
                    }
                    /* Logo: no circle, no border — just the image filling the space */
                    .print-header-logo {
                        width: 100% !important;
                        height: 100% !important;
                        max-width: 100% !important;
                        object-fit: contain !important;
                        border-radius: 0 !important;
                        border: none !important;
                        display: block !important;
                    }
                    .print-header-block h1 { font-size: 14pt !important; }
                    .print-header-block h2 { font-size: 10pt !important; }
                    .print-header-block p  { font-size: 7pt  !important; }

                    /* ── Table fonts — 9pt is the standard for printed tables ── */
                    .report-card-container table {
                        font-size: 9pt !important;
                    }
                    .report-card-container table th {
                        font-size: 8pt !important;
                        padding: 3px 5px !important;
                    }
                    .report-card-container table td {
                        font-size: 9pt !important;
                        padding: 3px 5px !important;
                    }

                    /* ── Compact section paddings ── */
                    .report-card-container [class*="py-3"],
                    .report-card-container [class*="py-4"] {
                        padding-top: 4px !important;
                        padding-bottom: 4px !important;
                    }
                    .report-card-container [class*="px-4"],
                    .report-card-container [class*="px-6"] {
                        padding-left: 8px !important;
                        padding-right: 8px !important;
                    }

                    /* ── Averages summary ── */
                    .report-card-container [class*="text-xl"],
                    .report-card-container [class*="text-2xl"] {
                        font-size: 13pt !important;
                    }

                    /* ── Teacher comment + signature areas ── */
                    .report-card-container [class*="min-h-"] {
                        min-height: 50px !important;
                    }
                    .report-card-container [class*="h-12"] {
                        height: 28px !important;
                    }
                }
            `}</style>
        </AuthenticatedLayout>
    );
}