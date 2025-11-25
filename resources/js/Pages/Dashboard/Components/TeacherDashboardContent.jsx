import { Link } from "@inertiajs/react";
import {
    Users,
    School,
    FileText,
    Target,
    AlertCircle,
    Clock,
    CheckCircle,
    Trophy,
    AlertTriangle,
} from "lucide-react";
import { StatCard, ProgressBar } from "@/Components/UI";

export default function TeacherDashboardContent({
    stats,
    currentYear,
    currentTerm,
    isClassTeacher,
    classTeacherGrade,
    documentStats,
    myGrades,
    examsNeedingAttention,
    topStudents,
    recentStudents,
}) {
    return (
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
                                You have {documentStats.rejected} rejected document
                                {documentStats.rejected > 1 ? "s" : ""} that need attention.
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
                                <div key={grade.id} className="p-4 bg-gray-50 rounded-lg">
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
                                                {grade.students_count}/{grade.capacity}
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
                                                {exam.subject?.name}
                                            </h4>
                                            <p className="text-xs text-gray-600">
                                                {exam.grade?.name} • Term {exam.term}
                                            </p>
                                        </div>
                                        <Clock className="w-5 h-5 text-red-500" />
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                                        <span>
                                            {exam.results_count} of{" "}
                                            {exam.grade?.students?.length || 0} students marked
                                        </span>
                                        <span className="font-medium text-red-600">
                                            {exam.grade?.students?.length > 0
                                                ? Math.round(
                                                      (exam.results_count /
                                                          exam.grade.students.length) *
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
                                <p className="text-gray-600 font-medium">All caught up!</p>
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
                                        <p className="text-xs text-gray-600">{student.grade}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-orange">
                                            {student.average}%
                                        </div>
                                        <span
                                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                student.grade_rubric === "EE"
                                                    ? "bg-green-100 text-green-800"
                                                    : student.grade_rubric === "ME"
                                                    ? "bg-blue-100 text-blue-800"
                                                    : student.grade_rubric === "AE"
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
                                {recentStudents && recentStudents.length > 0 ? (
                                    recentStudents.map((student) => (
                                        <tr
                                            key={student.id}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-navy">
                                                {student.admission_number}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                {student.first_name} {student.last_name}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                {student.grade?.name || "N/A"}
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
    );
}


