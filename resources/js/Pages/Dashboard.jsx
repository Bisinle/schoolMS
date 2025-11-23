import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { usePage } from '@inertiajs/react';
import { Head, Link } from "@inertiajs/react";
import {
    Users,
    UserCheck,
    UserCircle,
    GraduationCap,
    TrendingUp,
    Calendar,
    ClipboardCheck,
    BarChart3,
    Award,
    AlertCircle,
    CheckCircle,
    BookOpen,
    FileText,
    Target,
    Clock,
    Trophy,
    AlertTriangle,
    UserPlus,
    School,
    XCircle,
} from "lucide-react";

export default function Dashboard({
    role,
    stats,
    recentStudents,
    students,
    guardianInfo,
    currentMonth,
    currentYear,
    currentTerm,
    documentStats,
    // Admin specific
    studentsByGrade,
    studentsByGender,
    topStudents,
    examsWithCompletion,
    teachersByGrade,
    subjectsByCategory,
    quickStats,
    // Teacher specific
    isClassTeacher,
    classTeacherGrade,
    myGrades,
    examsNeedingAttention,
}) {
    const { flash } = usePage().props;
    const StatCard = ({
        icon: Icon,
        label,
        value,
        gradient = "from-orange-500 to-red-600",
        trend,
        link,
    }) => {
        const CardContent = (
            <div className="group relative bg-white rounded-2xl p-4 sm:p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden active:scale-95">
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

                <div className="relative">
                    {/* Icon - Mobile First */}
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg mb-3 sm:mb-4`}>
                        <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>

                    {/* Text Content */}
                    <div>
                        <p className="text-xs sm:text-sm font-bold text-gray-600 uppercase tracking-wide mb-1 sm:mb-2 leading-tight">{label}</p>
                        <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900">{value}</p>
                        {trend && (
                            <p className="text-xs text-gray-500 flex items-center mt-2">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                {trend}
                            </p>
                        )}
                    </div>
                </div>

                {/* Decorative corner */}
                <div className={`absolute -bottom-6 -right-6 w-20 h-20 bg-gradient-to-br ${gradient} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`}></div>
            </div>
        );

        return link ? <Link href={link}>{CardContent}</Link> : CardContent;
    };

    const ProgressBar = ({ percentage, color = "orange" }) => (
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
                className={`h-full bg-${color} transition-all duration-500 rounded-full`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
            />
        </div>
    );

    return (
        <AuthenticatedLayout header="Dashboard">
            <Head title="Dashboard" />
            {/* Success message for password reset */}
            {flash?.status && (
                <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <svg
                                className="h-5 w-5 text-green-500"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-green-800">
                                {flash.status}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Admin Dashboard */}
            {role === "admin" && (
                <div className="space-y-6">
                    {/* Welcome Banner - Mobile Optimized */}
                    <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 rounded-2xl shadow-2xl p-6 sm:p-8 text-white">
                        <h1 className="text-2xl sm:text-3xl font-black mb-2 leading-tight">
                            Welcome Back, Administrator!
                        </h1>
                        <p className="text-blue-100 text-base sm:text-lg font-medium">
                            Academic Year {currentYear} • Term {currentTerm} •{" "}
                            {new Date().toLocaleDateString("en-US", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </p>
                    </div>

                    {/* Stats Grid - Mobile Optimized */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                        <StatCard
                            icon={Users}
                            label="Total Students"
                            value={stats?.totalStudents || 0}
                            gradient="from-orange-500 to-red-600"
                            trend={
                                stats?.recentEnrollments > 0
                                    ? `+${stats.recentEnrollments} this month`
                                    : ""
                            }
                            link="/students"
                        />
                        <StatCard
                            icon={UserCheck}
                            label="Active Students"
                            value={stats?.activeStudents || 0}
                            gradient="from-green-500 to-emerald-600"
                            link="/students"
                        />
                        <StatCard
                            icon={UserCircle}
                            label="Total Guardians"
                            value={stats?.totalGuardians || 0}
                            gradient="from-blue-500 to-indigo-600"
                            link="/guardians"
                        />
                        <StatCard
                            icon={GraduationCap}
                            label="Total Teachers"
                            value={stats?.totalTeachers || 0}
                            gradient="from-purple-500 to-indigo-600"
                            link="/teachers"
                        />
                        <StatCard
                            icon={School}
                            label="Active Grades"
                            value={stats?.totalGrades || 0}
                            gradient="from-indigo-500 to-purple-600"
                            link="/grades"
                        />
                        <StatCard
                            icon={BookOpen}
                            label="Active Subjects"
                            value={stats?.totalSubjects || 0}
                            gradient="from-pink-500 to-rose-600"
                            link="/subjects"
                        />
                        <StatCard
                            icon={FileText}
                            label="Total Exams"
                            value={stats?.totalExams || 0}
                            gradient="from-cyan-500 to-blue-600"
                            link="/exams"
                        />
                        <StatCard
                            icon={Target}
                            label="Exams This Term"
                            value={stats?.examsThisTerm || 0}
                            gradient="from-teal-500 to-cyan-600"
                            link="/exams"
                        />
                    </div>

                    {/* Document Management Widget - Mobile Optimized */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="p-5 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight flex items-center">
                                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-orange" />
                                    Document Management
                                </h3>
                                <Link
                                    href="/documents"
                                    className="text-sm sm:text-base text-orange hover:text-orange-dark font-bold"
                                >
                                    View All →
                                </Link>
                            </div>
                        </div>

                        <div className="p-4 sm:p-6">
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                                <div className="text-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                                    <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 mx-auto mb-2" />
                                    <p className="text-2xl sm:text-3xl font-black text-blue-600">
                                        {documentStats?.total || 0}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1 font-bold">
                                        Total Docs
                                    </p>
                                </div>

                                <div className="text-center p-4 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition-colors">
                                    <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-600 mx-auto mb-2" />
                                    <p className="text-2xl sm:text-3xl font-black text-yellow-600">
                                        {documentStats?.pending || 0}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1 font-bold">
                                        Pending
                                    </p>
                                </div>

                                <div className="text-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
                                    <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600 mx-auto mb-2" />
                                    <p className="text-2xl sm:text-3xl font-black text-green-600">
                                        {documentStats?.verified || 0}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1 font-bold">
                                        Verified
                                    </p>
                                </div>

                                <div className="text-center p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                                    <XCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-600 mx-auto mb-2" />
                                    <p className="text-2xl sm:text-3xl font-black text-red-600">
                                        {documentStats?.rejected || 0}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1 font-bold">
                                        Rejected
                                    </p>
                                </div>

                                <div className="text-center p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors">
                                    <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-orange mx-auto mb-2" />
                                    <p className="text-2xl sm:text-3xl font-black text-orange">
                                        {documentStats?.expiring_soon || 0}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1 font-bold">
                                        Expiring
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Required Cards */}
                    {quickStats &&
                        (quickStats.students_without_guardian > 0 ||
                            quickStats.students_without_grade > 0 ||
                            quickStats.grades_without_class_teacher > 0 ||
                            quickStats.pending_exam_results > 0) && (
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-6">
                                <div className="flex items-start">
                                    <AlertTriangle className="w-6 h-6 text-yellow-600 mr-3 mt-0.5" />
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-yellow-900 mb-3">
                                            Action Required
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {quickStats.students_without_guardian >
                                                0 && (
                                                <Link
                                                    href="/students"
                                                    className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm text-gray-600">
                                                                Students without
                                                                Guardian
                                                            </p>
                                                            <p className="text-2xl font-bold text-yellow-600">
                                                                {
                                                                    quickStats.students_without_guardian
                                                                }
                                                            </p>
                                                        </div>
                                                        <UserCircle className="w-8 h-8 text-yellow-600" />
                                                    </div>
                                                </Link>
                                            )}
                                            {quickStats.students_without_grade >
                                                0 && (
                                                <Link
                                                    href="/students"
                                                    className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm text-gray-600">
                                                                Students without
                                                                Grade
                                                            </p>
                                                            <p className="text-2xl font-bold text-yellow-600">
                                                                {
                                                                    quickStats.students_without_grade
                                                                }
                                                            </p>
                                                        </div>
                                                        <School className="w-8 h-8 text-yellow-600" />
                                                    </div>
                                                </Link>
                                            )}
                                            {quickStats.grades_without_class_teacher >
                                                0 && (
                                                <Link
                                                    href="/grades"
                                                    className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm text-gray-600">
                                                                Grades without
                                                                Class Teacher
                                                            </p>
                                                            <p className="text-2xl font-bold text-yellow-600">
                                                                {
                                                                    quickStats.grades_without_class_teacher
                                                                }
                                                            </p>
                                                        </div>
                                                        <GraduationCap className="w-8 h-8 text-yellow-600" />
                                                    </div>
                                                </Link>
                                            )}
                                            {quickStats.pending_exam_results >
                                                0 && (
                                                <Link
                                                    href="/exams"
                                                    className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm text-gray-600">
                                                                Exams with
                                                                Pending Results
                                                            </p>
                                                            <p className="text-2xl font-bold text-yellow-600">
                                                                {
                                                                    quickStats.pending_exam_results
                                                                }
                                                            </p>
                                                        </div>
                                                        <FileText className="w-8 h-8 text-yellow-600" />
                                                    </div>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    {/* Two Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Students by Grade */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                                <h3 className="text-lg font-semibold text-navy flex items-center">
                                    <BarChart3 className="w-5 h-5 mr-2 text-orange" />
                                    Students by Grade
                                </h3>
                            </div>
                            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                                {studentsByGrade &&
                                studentsByGrade.length > 0 ? (
                                    studentsByGrade.map((grade, index) => (
                                        <div key={index}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-gray-700">
                                                    {grade.name}
                                                </span>
                                                <div className="text-right">
                                                    <span className="text-sm font-bold text-navy">
                                                        {grade.count}/
                                                        {grade.capacity}
                                                    </span>
                                                    <span
                                                        className={`ml-2 text-xs ${
                                                            grade.percentage >
                                                            90
                                                                ? "text-red-600"
                                                                : grade.percentage >
                                                                  70
                                                                ? "text-yellow-600"
                                                                : "text-green-600"
                                                        }`}
                                                    >
                                                        ({grade.percentage}%)
                                                    </span>
                                                </div>
                                            </div>
                                            <ProgressBar
                                                percentage={grade.percentage}
                                                color={
                                                    grade.percentage > 90
                                                        ? "red-500"
                                                        : grade.percentage > 70
                                                        ? "yellow-500"
                                                        : "green-500"
                                                }
                                            />
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-center py-4">
                                        No grade data available
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Students by Gender */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                                <h3 className="text-lg font-semibold text-navy flex items-center">
                                    <Users className="w-5 h-5 mr-2 text-orange" />
                                    Students by Gender
                                </h3>
                            </div>
                            <div className="p-6">
                                {studentsByGender ? (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-around">
                                            <div className="text-center">
                                                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                                                    <span className="text-3xl font-bold text-blue-600">
                                                        {studentsByGender.male ||
                                                            0}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-semibold text-gray-700">
                                                    Male Students
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {stats.totalStudents > 0
                                                        ? Math.round(
                                                              ((studentsByGender.male ||
                                                                  0) /
                                                                  stats.totalStudents) *
                                                                  100
                                                          )
                                                        : 0}
                                                    %
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <div className="w-24 h-24 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-3">
                                                    <span className="text-3xl font-bold text-pink-600">
                                                        {studentsByGender.female ||
                                                            0}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-semibold text-gray-700">
                                                    Female Students
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {stats.totalStudents > 0
                                                        ? Math.round(
                                                              ((studentsByGender.female ||
                                                                  0) /
                                                                  stats.totalStudents) *
                                                                  100
                                                          )
                                                        : 0}
                                                    %
                                                </p>
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-gray-200">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">
                                                    Gender Ratio
                                                </span>
                                                <span className="font-semibold text-navy">
                                                    {studentsByGender.male || 0}{" "}
                                                    :{" "}
                                                    {studentsByGender.female ||
                                                        0}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-8">
                                        No gender data available
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Exam Completion & Top Students */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Exam Completion Status */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                                <h3 className="text-lg font-semibold text-navy flex items-center">
                                    <Target className="w-5 h-5 mr-2 text-orange" />
                                    Recent Exam Completion Status
                                </h3>
                            </div>
                            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                                {examsWithCompletion &&
                                examsWithCompletion.length > 0 ? (
                                    examsWithCompletion.map((exam) => (
                                        <Link
                                            key={exam.id}
                                            href={`/exams/${exam.id}/results`}
                                            className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-navy text-sm mb-1">
                                                        {exam.subject}
                                                    </h4>
                                                    <p className="text-xs text-gray-600">
                                                        {exam.grade}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span
                                                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                                            exam.completion_rate ===
                                                            100
                                                                ? "bg-green-100 text-green-800"
                                                                : exam.completion_rate >=
                                                                  50
                                                                ? "bg-yellow-100 text-yellow-800"
                                                                : "bg-red-100 text-red-800"
                                                        }`}
                                                    >
                                                        {exam.completion_rate}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                                                <span>
                                                    {exam.students_marked} of{" "}
                                                    {exam.total_students}{" "}
                                                    students marked
                                                </span>
                                            </div>
                                            <ProgressBar
                                                percentage={
                                                    exam.completion_rate
                                                }
                                                color={
                                                    exam.completion_rate === 100
                                                        ? "green-500"
                                                        : exam.completion_rate >=
                                                          50
                                                        ? "yellow-500"
                                                        : "red-500"
                                                }
                                            />
                                        </Link>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-center py-8">
                                        No exam data available
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Top Performing Students */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                                <h3 className="text-lg font-semibold text-navy flex items-center">
                                    <Trophy className="w-5 h-5 mr-2 text-orange" />
                                    Top Performing Students ({currentYear})
                                </h3>
                            </div>
                            <div className="p-6 space-y-3">
                                {topStudents && topStudents.length > 0 ? (
                                    topStudents.map((student, index) => (
                                        <Link
                                            key={student.id}
                                            href={`/students/${student.id}`}
                                            className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <div
                                                className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                                                    index === 0
                                                        ? "bg-yellow-100"
                                                        : index === 1
                                                        ? "bg-gray-100"
                                                        : index === 2
                                                        ? "bg-orange-100"
                                                        : "bg-blue-100"
                                                }`}
                                            >
                                                <span
                                                    className={`font-bold ${
                                                        index === 0
                                                            ? "text-yellow-600"
                                                            : index === 1
                                                            ? "text-gray-600"
                                                            : index === 2
                                                            ? "text-orange-600"
                                                            : "text-blue-600"
                                                    }`}
                                                >
                                                    {index + 1}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-navy text-sm">
                                                    {student.name}
                                                </h4>
                                                <p className="text-xs text-gray-600">
                                                    {student.grade} •{" "}
                                                    {student.admission_number}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-orange">
                                                    {student.average}%
                                                </div>
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                        student.grade_rubric ===
                                                        "EE"
                                                            ? "bg-green-100 text-green-800"
                                                            : student.grade_rubric ===
                                                              "ME"
                                                            ? "bg-blue-100 text-blue-800"
                                                            : student.grade_rubric ===
                                                              "AE"
                                                            ? "bg-yellow-100 text-yellow-800"
                                                            : "bg-red-100 text-red-800"
                                                    }`}
                                                >
                                                    {student.grade_rubric}
                                                </span>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-center py-8">
                                        No performance data available yet
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Recent Students - Mobile Friendly */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base sm:text-lg font-semibold text-navy flex items-center">
                                    <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-orange" />
                                    Recently Added Students
                                </h3>
                                <Link
                                    href="/students"
                                    className="text-xs sm:text-sm text-orange hover:text-orange-dark font-medium"
                                >
                                    View All →
                                </Link>
                            </div>
                        </div>

                        {/* Mobile Card View */}
                        <div className="block md:hidden">
                            {recentStudents && recentStudents.length > 0 ? (
                                <div className="divide-y divide-gray-200">
                                    {recentStudents.map((student) => (
                                        <Link
                                            key={student.id}
                                            href={`/students/${student.id}`}
                                            className="block p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-bold text-navy truncate">
                                                        {student.first_name}{" "}
                                                        {student.last_name}
                                                    </h4>
                                                    <p className="text-xs text-gray-600 mt-0.5">
                                                        {student.admission_number}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${
                                                        student.status === "active"
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-red-100 text-red-700"
                                                    }`}
                                                >
                                                    {student.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500">
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md font-medium">
                                                    {student.grade?.name || "No Class"}
                                                </span>
                                                {student.guardian?.user?.name && (
                                                    <>
                                                        <span className="text-gray-400">•</span>
                                                        <span className="truncate">
                                                            {student.guardian.user.name}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-gray-500 text-sm">
                                    No students found
                                </div>
                            )}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Admission No.
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Class
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Guardian
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {recentStudents && recentStudents.length > 0 ? (
                                        recentStudents.map((student) => (
                                            <tr
                                                key={student.id}
                                                className="hover:bg-gray-50 transition-colors"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-navy">
                                                    {student.admission_number}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Link
                                                        href={`/students/${student.id}`}
                                                        className="text-sm font-medium text-navy hover:text-orange"
                                                    >
                                                        {student.first_name}{" "}
                                                        {student.last_name}
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {student.grade?.name || "Not Assigned"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {student.guardian?.user?.name || "Not Assigned"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                            student.status === "active"
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-red-100 text-red-800"
                                                        }`}
                                                    >
                                                        {student.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan="5"
                                                className="px-6 py-8 text-center text-gray-500"
                                            >
                                                No students found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Teacher Dashboard */}
            {role === "teacher" && (
                <div className="space-y-6">
                    {/* Welcome Banner - Mobile Optimized */}
                    <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl shadow-2xl p-6 sm:p-8 text-white">
                        <h1 className="text-2xl sm:text-3xl font-black mb-2 leading-tight">
                            Welcome Back, Teacher! 👋
                        </h1>
                        <p className="text-purple-100 text-base sm:text-lg font-medium">
                            Academic Year {currentYear} • Term {currentTerm}
                            {isClassTeacher && classTeacherGrade && (
                                <span className="block sm:inline sm:ml-4 mt-2 sm:mt-0 bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-semibold">
                                    ⭐ Class Teacher - {classTeacherGrade}
                                </span>
                            )}
                        </p>
                        <p className="text-purple-200 text-sm mt-2">
                            {new Date().toLocaleDateString("en-US", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </p>
                    </div>

                    {/* Stats Grid - Mobile Optimized */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-6">
                        <StatCard
                            icon={School}
                            label="My Grades"
                            value={stats?.assignedGrades || 0}
                            gradient="from-purple-500 to-indigo-600"
                        />
                        <StatCard
                            icon={Users}
                            label="My Students"
                            value={stats?.totalStudents || 0}
                            gradient="from-orange-500 to-red-600"
                        />
                        <StatCard
                            icon={FileText}
                            label="My Exams"
                            value={stats?.myExams || 0}
                            gradient="from-blue-500 to-indigo-600"
                        />
                        <StatCard
                            icon={Target}
                            label="Exams This Term"
                            value={stats?.examsThisTerm || 0}
                            gradient="from-green-500 to-emerald-600"
                        />
                        <StatCard
                            icon={AlertCircle}
                            label="Pending Results"
                            value={stats?.pendingResults || 0}
                            gradient="from-red-500 to-orange-600"
                        />
                    </div>

                    {/* Document Stats Widget - Mobile Optimized */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="p-5 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight flex items-center">
                                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-orange" />
                                    My Documents
                                </h3>
                                <Link
                                    href="/documents"
                                    className="text-sm sm:text-base text-orange hover:text-orange-dark font-bold"
                                >
                                    Manage →
                                </Link>
                            </div>
                        </div>

                        <div className="p-4 sm:p-6">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                <div className="text-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                                    <p className="text-2xl sm:text-3xl font-black text-blue-600">
                                        {documentStats?.total || 0}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1 font-bold">
                                        Total
                                    </p>
                                </div>
                                <div className="text-center p-4 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition-colors">
                                    <p className="text-2xl sm:text-3xl font-black text-yellow-600">
                                        {documentStats?.pending || 0}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1 font-bold">
                                        Pending
                                    </p>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
                                    <p className="text-2xl sm:text-3xl font-black text-green-600">
                                        {documentStats?.verified || 0}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1 font-bold">
                                        Verified
                                    </p>
                                </div>
                                <div className="text-center p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                                    <p className="text-2xl sm:text-3xl font-black text-red-600">
                                        {documentStats?.rejected || 0}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1 font-bold">
                                        Rejected
                                    </p>
                                </div>
                            </div>

                            {documentStats?.rejected > 0 && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-800">
                                        <AlertTriangle className="w-4 h-4 inline mr-1" />
                                        You have {documentStats.rejected} rejected
                                        document
                                        {documentStats.rejected > 1 ? "s" : ""} that
                                        need attention.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* My Grades & Exams Needing Attention */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* My Grades */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                                <h3 className="text-lg font-semibold text-navy flex items-center">
                                    <School className="w-5 h-5 mr-2 text-orange" />
                                    My Assigned Grades
                                </h3>
                            </div>
                            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                                {myGrades && myGrades.length > 0 ? (
                                    myGrades.map((grade) => (
                                        <div
                                            key={grade.id}
                                            className="p-4 bg-gray-50 rounded-lg"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div>
                                                    <h4 className="font-semibold text-navy">
                                                        {grade.name}
                                                    </h4>
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        {grade.level}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    {grade.is_class_teacher && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange bg-opacity-10 text-orange mb-1">
                                                            Class Teacher
                                                        </span>
                                                    )}
                                                    <p className="text-sm font-bold text-navy">
                                                        {grade.students_count}/
                                                        {grade.capacity}
                                                    </p>
                                                </div>
                                            </div>
                                            <ProgressBar
                                                percentage={grade.percentage}
                                                color={
                                                    grade.percentage > 90
                                                        ? "red-500"
                                                        : grade.percentage > 70
                                                        ? "yellow-500"
                                                        : "green-500"
                                                }
                                            />
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-center py-8">
                                        No grades assigned yet
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Exams Needing Attention */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                                <h3 className="text-lg font-semibold text-navy flex items-center">
                                    <AlertCircle className="w-5 h-5 mr-2 text-orange" />
                                    Exams Needing Attention
                                </h3>
                            </div>
                            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                                {examsNeedingAttention &&
                                examsNeedingAttention.length > 0 ? (
                                    examsNeedingAttention.map((exam) => (
                                        <Link
                                            key={exam.id}
                                            href={`/exams/${exam.id}/results`}
                                            className="block p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-navy text-sm mb-1">
                                                        {exam.subject?.name}
                                                    </h4>
                                                    <p className="text-xs text-gray-600">
                                                        {exam.grade?.name} •
                                                        Term {exam.term}
                                                    </p>
                                                </div>
                                                <Clock className="w-5 h-5 text-red-500" />
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                                                <span>
                                                    {exam.results_count} of{" "}
                                                    {exam.grade?.students
                                                        ?.length || 0}{" "}
                                                    students marked
                                                </span>
                                                <span className="font-medium text-red-600">
                                                    {exam.grade?.students
                                                        ?.length > 0
                                                        ? Math.round(
                                                              (exam.results_count /
                                                                  exam.grade
                                                                      .students
                                                                      .length) *
                                                                  100
                                                          )
                                                        : 0}
                                                    % Complete
                                                </span>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                                        <p className="text-gray-600 font-medium">
                                            All caught up!
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            No pending exam results
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Top Students & Recent Students */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Students */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                                <h3 className="text-lg font-semibold text-navy flex items-center">
                                    <Trophy className="w-5 h-5 mr-2 text-orange" />
                                    Top Students in My Grades
                                </h3>
                            </div>
                            <div className="p-6 space-y-3">
                                {topStudents && topStudents.length > 0 ? (
                                    topStudents.map((student, index) => (
                                        <div
                                            key={student.id}
                                            className="flex items-center p-3 bg-gray-50 rounded-lg"
                                        >
                                            <div
                                                className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                                                    index === 0
                                                        ? "bg-yellow-100"
                                                        : index === 1
                                                        ? "bg-gray-100"
                                                        : index === 2
                                                        ? "bg-orange-100"
                                                        : "bg-blue-100"
                                                }`}
                                            >
                                                <span
                                                    className={`font-bold ${
                                                        index === 0
                                                            ? "text-yellow-600"
                                                            : index === 1
                                                            ? "text-gray-600"
                                                            : index === 2
                                                            ? "text-orange-600"
                                                            : "text-blue-600"
                                                    }`}
                                                >
                                                    {index + 1}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-navy text-sm">
                                                    {student.name}
                                                </h4>
                                                <p className="text-xs text-gray-600">
                                                    {student.grade}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-orange">
                                                    {student.average}%
                                                </div>
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                        student.grade_rubric ===
                                                        "EE"
                                                            ? "bg-green-100 text-green-800"
                                                            : student.grade_rubric ===
                                                              "ME"
                                                            ? "bg-blue-100 text-blue-800"
                                                            : student.grade_rubric ===
                                                              "AE"
                                                            ? "bg-yellow-100 text-yellow-800"
                                                            : "bg-red-100 text-red-800"
                                                    }`}
                                                >
                                                    {student.grade_rubric}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-center py-8">
                                        No performance data available yet
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Recent Students */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                                <h3 className="text-lg font-semibold text-navy flex items-center">
                                    <Users className="w-5 h-5 mr-2 text-orange" />
                                    Recent Students
                                </h3>
                            </div>
                            <div className="overflow-x-auto max-h-96">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                                Adm. No.
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                                Name
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                                Class
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {recentStudents &&
                                        recentStudents.length > 0 ? (
                                            recentStudents.map((student) => (
                                                <tr
                                                    key={student.id}
                                                    className="hover:bg-gray-50 transition-colors"
                                                >
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-navy">
                                                        {
                                                            student.admission_number
                                                        }
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                        {student.first_name}{" "}
                                                        {student.last_name}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                        {student.grade?.name ||
                                                            "N/A"}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan="3"
                                                    className="px-4 py-8 text-center text-gray-500"
                                                >
                                                    No students found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Guardian Dashboard */}
            {role === "guardian" && (
                <div className="space-y-6">
                    {/* Welcome Banner - Mobile Optimized */}
                    <div className="bg-gradient-to-r from-green-600 via-teal-600 to-cyan-600 rounded-2xl shadow-2xl p-6 sm:p-8 text-white">
                        <h1 className="text-2xl sm:text-3xl font-black mb-2 leading-tight">
                            Welcome Back, {guardianInfo?.name || "Parent/Guardian"}!
                        </h1>
                        <p className="text-green-100 text-base sm:text-lg font-medium">
                            Academic Year {currentYear} • Term {currentTerm} •{" "}
                            {new Date().toLocaleDateString("en-US", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </p>
                    </div>

                    {/* Quick Stats - Mobile Optimized */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                        <StatCard
                            icon={Users}
                            label="My Children"
                            value={students?.length || 0}
                            gradient="from-orange-500 to-red-600"
                            trend="Active students"
                        />

                        <StatCard
                            icon={Calendar}
                            label="Avg Attendance"
                            value={`${students?.length > 0
                                ? Math.round(
                                      students.reduce(
                                          (sum, s) =>
                                              sum +
                                              (s.attendance_stats
                                                  ?.attendance_rate ||
                                                  0),
                                          0
                                      ) / students.length
                                  )
                                : 0}%`}
                            gradient="from-blue-500 to-indigo-600"
                            trend={`For ${currentMonth}`}
                        />

                        <StatCard
                            icon={FileText}
                            label="Total Exams"
                            value={students?.reduce(
                                (sum, s) =>
                                    sum +
                                    (s.total_exams_this_term || 0),
                                0
                            ) || 0}
                            gradient="from-purple-500 to-indigo-600"
                            trend="This term"
                        />
                    </div>

                    {/* Document Stats Widget - Mobile Optimized */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="p-5 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight flex items-center">
                                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-orange" />
                                    Family Documents
                                </h3>
                                <Link
                                    href="/documents"
                                    className="text-sm sm:text-base text-orange hover:text-orange-dark font-bold"
                                >
                                    View All →
                                </Link>
                            </div>
                        </div>

                        <div className="p-4 sm:p-6">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                                <div className="text-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                                    <p className="text-2xl sm:text-3xl font-black text-blue-600">
                                        {documentStats?.total || 0}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1 font-bold">
                                        Total Docs
                                    </p>
                                </div>
                                <div className="text-center p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors">
                                    <p className="text-2xl sm:text-3xl font-black text-purple-600">
                                        {documentStats?.my_docs || 0}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1 font-bold">
                                        My Docs
                                    </p>
                                </div>
                                <div className="text-center p-4 bg-cyan-50 rounded-xl hover:bg-cyan-100 transition-colors">
                                    <p className="text-2xl sm:text-3xl font-black text-cyan-600">
                                        {documentStats?.children_docs || 0}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1 font-bold">
                                        Children Docs
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="text-center p-3 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition-colors">
                                    <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 mx-auto mb-1" />
                                    <p className="text-xl sm:text-2xl font-black text-yellow-600">
                                        {documentStats?.pending || 0}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-600 font-bold">Pending</p>
                                </div>
                                <div className="text-center p-3 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
                                    <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mx-auto mb-1" />
                                    <p className="text-xl sm:text-2xl font-black text-green-600">
                                        {documentStats?.verified || 0}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-600 font-bold">
                                        Verified
                                    </p>
                                </div>
                                <div className="text-center p-3 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                                    <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 mx-auto mb-1" />
                                    <p className="text-xl sm:text-2xl font-black text-red-600">
                                        {documentStats?.rejected || 0}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-600 font-bold">
                                        Rejected
                                    </p>
                                </div>
                            </div>

                            {(documentStats?.pending > 0 ||
                                documentStats?.rejected > 0) && (
                                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                    <p className="text-sm text-orange-800">
                                        <AlertTriangle className="w-4 h-4 inline mr-1" />
                                        {documentStats.pending > 0 &&
                                            `${documentStats.pending} pending `}
                                        {documentStats.pending > 0 &&
                                            documentStats.rejected > 0 &&
                                            " & "}
                                        {documentStats.rejected > 0 &&
                                            `${documentStats.rejected} rejected `}
                                        document
                                        {(documentStats.pending || 0) +
                                            (documentStats.rejected || 0) >
                                        1
                                            ? "s"
                                            : ""}
                                        .
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Additional Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Link
                            href="/reports"
                            className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 border border-gray-100 group"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                                    <FileText className="w-6 h-6 text-purple-600" />
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-purple-600">
                                        {students?.length || 0}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Available
                                    </p>
                                </div>
                            </div>
                            <h4 className="font-semibold text-navy mb-1">
                                Report Cards
                            </h4>
                            <p className="text-sm text-gray-600">
                                Download term reports
                            </p>
                        </Link>

                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-orange-100 rounded-lg">
                                    <Users className="w-6 h-6 text-orange" />
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-orange">
                                        {students?.reduce(
                                            (sum, s) =>
                                                sum +
                                                (s.total_exams_this_year || 0),
                                            0
                                        ) || 0}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Total
                                    </p>
                                </div>
                            </div>
                            <h4 className="font-semibold text-navy mb-1">
                                Exams This Year
                            </h4>
                            <p className="text-sm text-gray-600">
                                Across all children
                            </p>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-green-600">
                                        {students?.filter(
                                            (s) =>
                                                (s.attendance_stats
                                                    ?.attendance_rate || 0) >=
                                                90
                                        ).length || 0}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Students
                                    </p>
                                </div>
                            </div>
                            <h4 className="font-semibold text-navy mb-1">
                                Excellent Attendance
                            </h4>
                            <p className="text-sm text-gray-600">
                                90% and above
                            </p>
                        </div>
                    </div>

                    {/* Children Summary */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-xl font-semibold text-navy mb-6 flex items-center">
                            <Users className="w-6 h-6 mr-2 text-orange" />
                            My Children - Quick Overview
                        </h3>

                        {students && students.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {students.map((student) => (
                                    <div
                                        key={student.id}
                                        className="border border-gray-200 rounded-lg p-4 hover:border-orange hover:shadow-md transition-all"
                                    >
                                        <div className="flex items-center space-x-3 mb-3">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange to-orange-dark flex items-center justify-center text-white text-lg font-bold">
                                                {student.first_name?.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-navy">
                                                    {student.first_name}{" "}
                                                    {student.last_name}
                                                </h4>
                                                <p className="text-xs text-gray-600">
                                                    {student.class_name}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                                            {student.overall_average && (
                                                <div className="bg-blue-50 rounded p-2">
                                                    <p className="text-gray-600 mb-1">
                                                        Average
                                                    </p>
                                                    <p className="font-bold text-blue-600">
                                                        {
                                                            student.overall_average
                                                        }
                                                        %
                                                    </p>
                                                </div>
                                            )}
                                            {student.attendance_stats && (
                                                <div className="bg-green-50 rounded p-2">
                                                    <p className="text-gray-600 mb-1">
                                                        Attendance
                                                    </p>
                                                    <p className="font-bold text-green-600">
                                                        {
                                                            student
                                                                .attendance_stats
                                                                .attendance_rate
                                                        }
                                                        %
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <Link
                                                href="/reports"
                                                className="flex-1 text-center px-2 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition-all"
                                            >
                                                Performance
                                            </Link>
                                            <Link
                                                href="/guardian/attendance"
                                                className="flex-1 text-center px-2 py-1.5 bg-green-600 text-white text-xs font-semibold rounded hover:bg-green-700 transition-all"
                                            >
                                                Attendance
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">
                                    No active students found.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Guardian Information */}
                    {guardianInfo && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-semibold text-navy mb-6 flex items-center">
                                <UserCircle className="w-6 h-6 mr-2 text-orange" />
                                My Contact Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                                    <p className="text-xs text-gray-600 mb-2 font-medium">
                                        Full Name
                                    </p>
                                    <p className="font-semibold text-navy text-lg">
                                        {guardianInfo.name}
                                    </p>
                                </div>
                                <div className="p-4 bg-gradient-to-br from-green-50 to-teal-50 rounded-lg border border-green-200">
                                    <p className="text-xs text-gray-600 mb-2 font-medium">
                                        Phone Number
                                    </p>
                                    <p className="font-semibold text-navy text-lg">
                                        {guardianInfo.phone_number}
                                    </p>
                                </div>
                                <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                                    <p className="text-xs text-gray-600 mb-2 font-medium">
                                        Relationship
                                    </p>
                                    <p className="font-semibold text-navy text-lg capitalize">
                                        {guardianInfo.relationship}
                                    </p>
                                </div>
                                <div className="p-4 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
                                    <p className="text-xs text-gray-600 mb-2 font-medium">
                                        Email
                                    </p>
                                    <p className="font-semibold text-navy text-sm break-words">
                                        {guardianInfo.email}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </AuthenticatedLayout>
    );
}
