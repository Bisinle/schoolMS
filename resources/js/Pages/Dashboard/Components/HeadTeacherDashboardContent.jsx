import { Link } from "@inertiajs/react";
import {
    Users,
    GraduationCap,
    School,
    ClipboardCheck,
    FileText,
    CheckCircle,
    AlertCircle,
    MessageSquare,
} from "lucide-react";
import { StatCard, ProgressBar } from "@/Components/UI";

export default function HeadTeacherDashboardContent({
    stats,
    attendanceToday,
    examsNeedingAttention,
    reportCommentCompletion,
    currentYear,
    currentTerm,
}) {
    return (
        <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl shadow-2xl p-6 sm:p-8 text-white">
                <h1 className="text-2xl sm:text-3xl font-black mb-2 leading-tight">
                    Head Teacher Overview 👋
                </h1>
                <p className="text-purple-100 text-base sm:text-lg font-medium">
                    Academic Year {currentYear} • Term {currentTerm}
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

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-6">
                <StatCard
                    icon={Users}
                    label="Students"
                    value={stats?.totalStudents || 0}
                    gradient="from-orange-500 to-red-600"
                />
                <StatCard
                    icon={GraduationCap}
                    label="Teachers"
                    value={stats?.totalTeachers || 0}
                    gradient="from-blue-500 to-indigo-600"
                />
                <StatCard
                    icon={School}
                    label="Grades"
                    value={stats?.totalGrades || 0}
                    gradient="from-purple-500 to-indigo-600"
                />
                <StatCard
                    icon={ClipboardCheck}
                    label="Attendance Marked Today"
                    value={stats?.gradesAttendanceMarkedToday || 0}
                    gradient="from-green-500 to-emerald-600"
                />
                <StatCard
                    icon={AlertCircle}
                    label="Attendance Pending Today"
                    value={stats?.gradesAttendancePendingToday || 0}
                    gradient="from-red-500 to-orange-600"
                />
                <StatCard
                    icon={FileText}
                    label="Exams Pending Results"
                    value={stats?.examsPendingResults || 0}
                    gradient="from-teal-500 to-cyan-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Attendance Today, per grade */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                        <h3 className="text-lg font-semibold text-navy flex items-center">
                            <ClipboardCheck className="w-5 h-5 mr-2 text-orange" />
                            Attendance Marked Today
                        </h3>
                    </div>
                    <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
                        {attendanceToday && attendanceToday.length > 0 ? (
                            attendanceToday.map((grade) => (
                                <div
                                    key={grade.grade_id}
                                    className={`flex items-center justify-between p-3 rounded-lg ${
                                        grade.marked
                                            ? "bg-green-50 border border-green-200"
                                            : "bg-red-50 border border-red-200"
                                    }`}
                                >
                                    <div>
                                        <h4 className="font-semibold text-navy text-sm">
                                            {grade.grade}
                                        </h4>
                                        <p className="text-xs text-gray-600">
                                            {grade.students_count} students
                                        </p>
                                    </div>
                                    {grade.marked ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            <CheckCircle className="w-3 h-3 mr-1" /> Marked
                                        </span>
                                    ) : (
                                        <Link
                                            href={`/attendance?grade_id=${grade.grade_id}`}
                                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 transition-colors"
                                        >
                                            <AlertCircle className="w-3 h-3 mr-1" /> Pending
                                        </Link>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-8">
                                No active grades found
                            </p>
                        )}
                    </div>
                </div>

                {/* Exams needing attention, school-wide */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                        <h3 className="text-lg font-semibold text-navy flex items-center">
                            <FileText className="w-5 h-5 mr-2 text-orange" />
                            Exams Needing Results
                        </h3>
                    </div>
                    <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                        {examsNeedingAttention && examsNeedingAttention.length > 0 ? (
                            examsNeedingAttention.map((exam) => (
                                <Link
                                    key={exam.id}
                                    href={`/exams/${exam.id}/results`}
                                    className="block p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-navy text-sm mb-1">
                                                {exam.name} — {exam.subject}
                                            </h4>
                                            <p className="text-xs text-gray-600">
                                                {exam.grade} • {exam.exam_date}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-gray-600">
                                        <span>
                                            {exam.students_marked} of {exam.total_students} marked
                                        </span>
                                        <span className="font-medium text-red-600">
                                            {exam.completion_rate}% Complete
                                        </span>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                                <p className="text-gray-600 font-medium">All caught up!</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    No pending exam results this term
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Report comment completion, per grade */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                    <h3 className="text-lg font-semibold text-navy flex items-center">
                        <MessageSquare className="w-5 h-5 mr-2 text-orange" />
                        Report Comments — Term {currentTerm} Completion
                    </h3>
                </div>
                <div className="p-6 space-y-4">
                    {reportCommentCompletion && reportCommentCompletion.length > 0 ? (
                        reportCommentCompletion.map((grade) => (
                            <div key={grade.grade_id} className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold text-navy text-sm">
                                        {grade.grade}
                                    </h4>
                                    <p className="text-sm font-bold text-navy">
                                        {grade.comments_filed}/{grade.total_students}
                                    </p>
                                </div>
                                <ProgressBar
                                    percentage={grade.completion_rate}
                                    color={
                                        grade.completion_rate === 100
                                            ? "green-500"
                                            : grade.completion_rate > 50
                                            ? "yellow-500"
                                            : "red-500"
                                    }
                                />
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 text-center py-8">
                            No active grades found
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
