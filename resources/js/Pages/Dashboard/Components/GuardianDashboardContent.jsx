import { Link } from "@inertiajs/react";
import {
    Users,
    Calendar,
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    BookOpen,
    Trophy,
    TrendingUp,
    AlertTriangle,
    UserCircle,
} from "lucide-react";
import { StatCard } from "@/Components/UI";

export default function GuardianDashboardContent({
    guardianInfo,
    currentYear,
    currentTerm,
    currentMonth,
    students,
    documentStats,
    quranStats,
    quranTrackingData,
}) {
    return (
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
                    value={`${
                        students?.length > 0
                            ? Math.round(
                                  students.reduce(
                                      (sum, s) =>
                                          sum + (s.attendance_stats?.attendance_rate || 0),
                                      0
                                  ) / students.length
                              )
                            : 0
                    }%`}
                    gradient="from-blue-500 to-indigo-600"
                    trend={`For ${currentMonth}`}
                />

                <StatCard
                    icon={FileText}
                    label="Total Exams"
                    value={
                        students?.reduce(
                            (sum, s) => sum + (s.total_exams_this_term || 0),
                            0
                        ) || 0
                    }
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
                            <p className="text-xs sm:text-sm text-gray-600 font-bold">Verified</p>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                            <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 mx-auto mb-1" />
                            <p className="text-xl sm:text-2xl font-black text-red-600">
                                {documentStats?.rejected || 0}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 font-bold">Rejected</p>
                        </div>
                    </div>

                    {(documentStats?.pending > 0 || documentStats?.rejected > 0) && (
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
                                {(documentStats.pending || 0) + (documentStats.rejected || 0) >
                                1
                                    ? "s"
                                    : ""}
                                .
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Quran Tracking (Madrasah Only) */}
            {quranStats && quranTrackingData && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                        <h3 className="text-lg font-semibold text-navy flex items-center">
                            <BookOpen className="w-5 h-5 mr-2 text-green-600" />
                            Children's Quran Progress
                        </h3>
                    </div>

                    {/* Summary Stats */}
                    <div className="p-4 sm:p-6 border-b border-gray-100">
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
                            <div className="text-center p-3 bg-green-50 rounded-xl">
                                <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mx-auto mb-1" />
                                <p className="text-xl sm:text-2xl font-black text-green-600">
                                    {quranStats.total_sessions || 0}
                                </p>
                                <p className="text-xs text-gray-600 font-bold">Sessions</p>
                            </div>
                            <div className="text-center p-3 bg-blue-50 rounded-xl">
                                <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mx-auto mb-1" />
                                <p className="text-xl sm:text-2xl font-black text-blue-600">
                                    {quranStats.total_pages || 0}
                                </p>
                                <p className="text-xs text-gray-600 font-bold">Pages</p>
                            </div>
                            <div className="text-center p-3 bg-purple-50 rounded-xl">
                                <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mx-auto mb-1" />
                                <p className="text-xl sm:text-2xl font-black text-purple-600">
                                    {quranStats.total_surahs || 0}
                                </p>
                                <p className="text-xs text-gray-600 font-bold">Surahs</p>
                            </div>
                            <div className="text-center p-3 bg-indigo-50 rounded-xl">
                                <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 mx-auto mb-1" />
                                <p className="text-xl sm:text-2xl font-black text-indigo-600">
                                    {quranStats.total_juz || 0}
                                </p>
                                <p className="text-xs text-gray-600 font-bold">Juz</p>
                            </div>
                            <div className="text-center p-3 bg-teal-50 rounded-xl">
                                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-teal-600 mx-auto mb-1" />
                                <p className="text-xl sm:text-2xl font-black text-teal-600">
                                    {quranStats.this_month || 0}
                                </p>
                                <p className="text-xs text-gray-600 font-bold">This Month</p>
                            </div>
                        </div>
                    </div>

                    {/* Recent Sessions */}
                    <div className="p-4 sm:p-6">
                        <h4 className="text-sm font-semibold text-gray-700 mb-4">
                            Recent Sessions
                        </h4>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {quranTrackingData.length > 0 ? (
                                quranTrackingData.map((session) => (
                                    <div
                                        key={session.id}
                                        className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-green-300 transition-colors"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-navy">
                                                    {session.student_name}
                                                </span>
                                                <span className="text-xs text-gray-500">•</span>
                                                <span className="text-sm text-gray-600">
                                                    {session.date}
                                                </span>
                                            </div>
                                            <span
                                                className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                    session.reading_type === "New Learning"
                                                        ? "bg-green-100 text-green-700"
                                                        : session.reading_type === "Revision"
                                                        ? "bg-blue-100 text-blue-700"
                                                        : "bg-purple-100 text-purple-700"
                                                }`}
                                            >
                                                {session.reading_type}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-600 mb-2">
                                            <div>
                                                <span className="font-medium">Surah:</span>{" "}
                                                {session.surah_range}
                                            </div>
                                            <div>
                                                <span className="font-medium">Pages:</span>{" "}
                                                {session.pages_memorized}
                                            </div>
                                            <div>
                                                <span className="font-medium">Difficulty:</span>{" "}
                                                {session.difficulty}
                                            </div>
                                            <div>
                                                <span className="font-medium">Teacher:</span>{" "}
                                                {session.teacher_name}
                                            </div>
                                        </div>
                                        {session.notes && (
                                            <div className="text-xs text-gray-500 italic mt-2 p-2 bg-white rounded border border-gray-200">
                                                {session.notes}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                                    <p>No Quran tracking sessions yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

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
                            <p className="text-xs text-gray-500">Available</p>
                        </div>
                    </div>
                    <h4 className="font-semibold text-navy mb-1">Report Cards</h4>
                    <p className="text-sm text-gray-600">Download term reports</p>
                </Link>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-orange-100 rounded-lg">
                            <Users className="w-6 h-6 text-orange" />
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-orange">
                                {students?.reduce(
                                    (sum, s) => sum + (s.total_exams_this_year || 0),
                                    0
                                ) || 0}
                            </p>
                            <p className="text-xs text-gray-500">Total</p>
                        </div>
                    </div>
                    <h4 className="font-semibold text-navy mb-1">Exams This Year</h4>
                    <p className="text-sm text-gray-600">Across all children</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-green-600">
                                {students?.filter(
                                    (s) => (s.attendance_stats?.attendance_rate || 0) >= 90
                                ).length || 0}
                            </p>
                            <p className="text-xs text-gray-500">Students</p>
                        </div>
                    </div>
                    <h4 className="font-semibold text-navy mb-1">Excellent Attendance</h4>
                    <p className="text-sm text-gray-600">90% and above</p>
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
                                            {student.first_name} {student.last_name}
                                        </h4>
                                        <p className="text-xs text-gray-600">
                                            {student.class_name}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                                    {student.overall_average && (
                                        <div className="bg-blue-50 rounded p-2">
                                            <p className="text-gray-600 mb-1">Average</p>
                                            <p className="font-bold text-blue-600">
                                                {student.overall_average}%
                                            </p>
                                        </div>
                                    )}
                                    {student.attendance_stats && (
                                        <div className="bg-green-50 rounded p-2">
                                            <p className="text-gray-600 mb-1">Attendance</p>
                                            <p className="font-bold text-green-600">
                                                {student.attendance_stats.attendance_rate}%
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
                        <p className="text-gray-500 text-lg">No active students found.</p>
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
                            <p className="text-xs text-gray-600 mb-2 font-medium">Full Name</p>
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
                            <p className="text-xs text-gray-600 mb-2 font-medium">Email</p>
                            <p className="font-semibold text-navy text-sm break-words">
                                {guardianInfo.email}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


