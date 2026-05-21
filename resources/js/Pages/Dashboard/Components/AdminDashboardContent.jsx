import { Link } from "@inertiajs/react";
import {
    Users,
    UserCheck,
    UserX,
    UserCircle,
    GraduationCap,
    School,
    BookOpen,
    FileText,
    Target,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Trophy,
    Award,
    Calendar,
    TrendingUp,
    CalendarClock,
    UserCog,
    BarChart3,
    PieChart,
    DoorOpen,
} from "lucide-react";
import { motion } from "framer-motion";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

import { StatCard } from "@/Components/UI";
import StudentsByGradeChart from "./StudentsByGradeChart";
import ExamCompletionChart from "./ExamCompletionChart";

export default function AdminDashboardContent({
    stats,
    currentYear,
    currentTerm,
    documentStats,
    quranStats,
    studentsByGrade,
    topStudents,
    examsWithCompletion,
    teachersByGrade,
    subjectsByCategory,
    quickStats,
    recentStudents,
    timetableAnalytics,
}) {
    return (
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

            <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -50, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 60, damping: 12, delay: 0.15 }}
                >
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">

                <StatCard
                    icon={UserCheck}
                    label="Active Students"
                    value={stats?.activeStudents || 0}
                    gradient="from-green-500 to-emerald-600"
                    link="/students"
                />
                <StatCard
                    icon={UserX}
                    label="Inactive Guardians"
                    value={stats?.inactiveGuardians || 0}
                    gradient="from-slate-400 to-slate-600"
                    link="/guardians/inactive"
                />
                <StatCard
                    icon={UserCircle}
                    label="Active Guardians"
                    value={stats?.activeGuardians || 0}
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

                    </motion.div>

            {/* Timetable Analytics Section */}
            {timetableAnalytics && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -50, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 60, damping: 12, delay: 0.2 }}
                >
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="p-5 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight flex items-center">
                                    <CalendarClock className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-indigo-600" />
                                    Timetable Analytics
                                </h3>
                                <Link
                                    href="/timetables/dashboard"
                                    className="text-sm sm:text-base text-indigo-600 hover:text-indigo-700 font-bold"
                                >
                                    View All →
                                </Link>
                            </div>
                        </div>

                        <div className="p-4 sm:p-6 space-y-6">
                            {/* Quick Stats Tiles - Timetable Specific */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                <Link
                                    href="/timetables/templates"
                                    className="text-center p-4 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-all hover:scale-105 active:scale-95"
                                >
                                    <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600 mx-auto mb-2" />
                                    <p className="text-2xl sm:text-3xl font-black text-indigo-600">
                                        {timetableAnalytics.activeTimetables || 0}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1 font-bold">
                                        Active Timetables
                                    </p>
                                </Link>

                                <Link
                                    href="/timetables/templates"
                                    className="text-center p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-all hover:scale-105 active:scale-95"
                                >
                                    <CalendarClock className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 mx-auto mb-2" />
                                    <p className="text-2xl sm:text-3xl font-black text-purple-600">
                                        {timetableAnalytics.totalSlots || 0}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1 font-bold">
                                        Total Slots
                                    </p>
                                </Link>

                                <div className={`text-center p-4 rounded-xl transition-all hover:scale-105 active:scale-95 ${
                                    timetableAnalytics.totalConflicts > 0
                                        ? 'bg-red-50 hover:bg-red-100'
                                        : 'bg-green-50 hover:bg-green-100'
                                }`}>
                                    <AlertTriangle className={`w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 ${
                                        timetableAnalytics.totalConflicts > 0 ? 'text-red-600' : 'text-green-600'
                                    }`} />
                                    <p className={`text-2xl sm:text-3xl font-black ${
                                        timetableAnalytics.totalConflicts > 0 ? 'text-red-600' : 'text-green-600'
                                    }`}>
                                        {timetableAnalytics.totalConflicts || 0}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1 font-bold">
                                        Conflicts
                                    </p>
                                </div>

                                <Link
                                    href="/timetables/rooms"
                                    className="text-center p-4 bg-cyan-50 rounded-xl hover:bg-cyan-100 transition-all hover:scale-105 active:scale-95"
                                >
                                    <DoorOpen className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-600 mx-auto mb-2" />
                                    <p className="text-2xl sm:text-3xl font-black text-cyan-600">
                                        {timetableAnalytics.totalRooms || 0}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1 font-bold">
                                        Rooms
                                    </p>
                                </Link>
                            </div>

                            {/* Charts Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Curriculum Compliance Card */}
                                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-4 sm:p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-lg font-bold text-gray-900 flex items-center">
                                            <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                                            Curriculum Compliance
                                        </h4>
                                        <Link
                                            href="/timetables"
                                            className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
                                        >
                                            Details →
                                        </Link>
                                    </div>

                                    {timetableAnalytics.curriculumCompliance && timetableAnalytics.curriculumCompliance.length > 0 ? (
                                        <div className="space-y-3">
                                            {timetableAnalytics.curriculumCompliance.slice(0, 5).map((item, index) => (
                                                <div key={index} className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-sm font-semibold text-gray-700">
                                                                {item.grade} - {item.subject}
                                                            </span>
                                                            <span className={`text-xs font-bold ${
                                                                item.complianceRate >= 100 ? 'text-green-600' :
                                                                item.complianceRate >= 80 ? 'text-yellow-600' : 'text-red-600'
                                                            }`}>
                                                                {item.complianceRate}%
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className={`h-2 rounded-full transition-all ${
                                                                    item.complianceRate >= 100 ? 'bg-green-500' :
                                                                    item.complianceRate >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                                                                }`}
                                                                style={{ width: `${Math.min(item.complianceRate, 100)}%` }}
                                                            />
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {item.scheduled}/{item.required} periods
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No curriculum data available</p>
                                        </div>
                                    )}
                                </div>

                                {/* Teacher Utilization Pie Chart */}
                                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-4 sm:p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-lg font-bold text-gray-900 flex items-center">
                                            <UserCog className="w-5 h-5 mr-2 text-purple-600" />
                                            Teacher Utilization
                                        </h4>
                                        <Link
                                            href="/teachers"
                                            className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
                                        >
                                            Details →
                                        </Link>
                                    </div>

                                    {timetableAnalytics.teacherUtilization && timetableAnalytics.teacherUtilization.length > 0 ? (
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RechartsPie>
                                                    <Pie
                                                        data={timetableAnalytics.teacherUtilization}
                                                        cx="50%"
                                                        cy="50%"
                                                        labelLine={false}
                                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                        outerRadius={80}
                                                        fill="#8884d8"
                                                        dataKey="value"
                                                    >
                                                        {timetableAnalytics.teacherUtilization.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color || ['#8b5cf6', '#06b6d4', '#f59e0b'][index % 3]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                </RechartsPie>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <PieChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No utilization data available</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Slot Coverage Bar Chart */}
                            {timetableAnalytics.slotCoverage && timetableAnalytics.slotCoverage.length > 0 && (
                                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-4 sm:p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-lg font-bold text-gray-900 flex items-center">
                                            <BarChart3 className="w-5 h-5 mr-2 text-cyan-600" />
                                            Weekly Slot Coverage
                                        </h4>
                                    </div>

                                    <div className="h-64 hidden sm:block">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={timetableAnalytics.slotCoverage}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="day" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Bar dataKey="lessons" fill="#8b5cf6" name="Lessons" />
                                                <Bar dataKey="breaks" fill="#06b6d4" name="Breaks" />
                                                <Bar dataKey="activities" fill="#f59e0b" name="Activities" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Mobile: Compact View */}
                                    <div className="sm:hidden space-y-2">
                                        {timetableAnalytics.slotCoverage.map((day, index) => (
                                            <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                                                <p className="font-bold text-gray-900 mb-2">{day.day}</p>
                                                <div className="flex gap-4 text-sm">
                                                    <span className="text-purple-600">📚 {day.lessons}</span>
                                                    <span className="text-cyan-600">☕ {day.breaks}</span>
                                                    <span className="text-orange-600">🎯 {day.activities}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}

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

            {/* Quran Tracking Analytics (Madrasah Only) */}
            {quranStats && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                        <h3 className="text-lg font-semibold text-navy flex items-center">
                            <BookOpen className="w-5 h-5 mr-2 text-green-600" />
                            Quran Tracking Analytics
                        </h3>
                    </div>
                    <div className="p-4 sm:p-6">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                            <div className="text-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
                                <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-green-600 mx-auto mb-2" />
                                <p className="text-2xl sm:text-3xl font-black text-green-600">
                                    {quranStats.total_sessions || 0}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-600 mt-1 font-bold">
                                    Total Sessions
                                </p>
                            </div>

                            <div className="text-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                                <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 mx-auto mb-2" />
                                <p className="text-2xl sm:text-3xl font-black text-blue-600">
                                    {quranStats.total_pages_memorized || 0}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-600 mt-1 font-bold">
                                    Pages Memorized
                                </p>
                            </div>

                            <div className="text-center p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors">
                                <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 mx-auto mb-2" />
                                <p className="text-2xl sm:text-3xl font-black text-purple-600">
                                    {quranStats.total_surahs_memorized || 0}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-600 mt-1 font-bold">
                                    Surahs Memorized
                                </p>
                            </div>

                            <div className="text-center p-4 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">
                                <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600 mx-auto mb-2" />
                                <p className="text-2xl sm:text-3xl font-black text-indigo-600">
                                    {quranStats.total_juz_memorized || 0}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-600 mt-1 font-bold">
                                    Juz Memorized
                                </p>
                            </div>

                            <div className="text-center p-4 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors">
                                <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-teal-600 mx-auto mb-2" />
                                <p className="text-2xl sm:text-3xl font-black text-teal-600">
                                    {quranStats.sessions_this_month || 0}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-600 mt-1 font-bold">
                                    This Month
                                </p>
                            </div>

                            <div className="text-center p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors">
                                <Users className="w-8 h-8 sm:w-10 sm:h-10 text-orange mx-auto mb-2" />
                                <p className="text-2xl sm:text-3xl font-black text-orange">
                                    {quranStats.students_tracked || 0}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-600 mt-1 font-bold">
                                    Students Tracked
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                                    {quickStats.students_without_guardian > 0 && (
                                        <Link
                                            href="/students"
                                            className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-gray-600">
                                                        Students without Guardian
                                                    </p>
                                                    <p className="text-2xl font-bold text-yellow-600">
                                                        {quickStats.students_without_guardian}
                                                    </p>
                                                </div>
                                                <UserCircle className="w-8 h-8 text-yellow-600" />
                                            </div>
                                        </Link>
                                    )}
                                    {quickStats.students_without_grade > 0 && (
                                        <Link
                                            href="/students"
                                            className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-gray-600">
                                                        Students without Grade
                                                    </p>
                                                    <p className="text-2xl font-bold text-yellow-600">
                                                        {quickStats.students_without_grade}
                                                    </p>
                                                </div>
                                                <School className="w-8 h-8 text-yellow-600" />
                                            </div>
                                        </Link>
                                    )}
                                    {quickStats.grades_without_class_teacher > 0 && (
                                        <Link
                                            href="/grades"
                                            className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-gray-600">
                                                        Grades without Class Teacher
                                                    </p>
                                                    <p className="text-2xl font-bold text-yellow-600">
                                                        {quickStats.grades_without_class_teacher}
                                                    </p>
                                                </div>
                                                <GraduationCap className="w-8 h-8 text-yellow-600" />
                                            </div>
                                        </Link>
                                    )}
                                    {quickStats.pending_exam_results > 0 && (
                                        <Link
                                            href="/exams"
                                            className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-gray-600">
                                                        Exams with Pending Results
                                                    </p>
                                                    <p className="text-2xl font-bold text-yellow-600">
                                                        {quickStats.pending_exam_results}
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

            {/* Two Column Layout - Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <StudentsByGradeChart studentsByGrade={studentsByGrade} />
                <ExamCompletionChart examsWithCompletion={examsWithCompletion} />
            </div>

            {/* Top Performing Students & Recently Added Students */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Performing Students */}
                {topStudents && topStudents.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="p-5 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-yellow-50 to-orange-50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
                                        <Trophy className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg sm:text-xl font-black text-gray-900">
                                            Top Performers
                                        </h3>
                                        <p className="text-xs sm:text-sm text-gray-600">
                                            Academic Year {currentYear}
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    href="/students"
                                    className="text-sm font-semibold text-orange hover:text-orange-dark transition-colors"
                                >
                                    View All
                                </Link>
                            </div>
                        </div>
                        <div className="p-4 sm:p-6">
                            <div className="space-y-3">
                                {topStudents.map((student, index) => (
                                    <Link
                                        key={student.id}
                                        href={`/students/${student.id}`}
                                        className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white hover:from-orange-50 hover:to-yellow-50 border border-gray-100 hover:border-orange-200 transition-all group"
                                    >
                                        <div className="flex-shrink-0">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                                                index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                                                index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                                                index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                                                'bg-gradient-to-br from-blue-400 to-blue-600'
                                            }`}>
                                                {index + 1}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-gray-900 truncate group-hover:text-orange transition-colors">
                                                {student.name}
                                            </h4>
                                            <p className="text-sm text-gray-600">
                                                {student.grade || 'No Grade'} • {student.admission_number}
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0 text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="flex items-center gap-1.5">
                                                    <Award className="w-4 h-4 text-orange" />
                                                    <span className="text-lg font-black text-orange">
                                                        {student.average}%
                                                    </span>
                                                </div>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                                    student.grade_rubric === 'EE' ? 'bg-green-100 text-green-700' :
                                                    student.grade_rubric === 'ME' ? 'bg-blue-100 text-blue-700' :
                                                    student.grade_rubric === 'AE' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {student.grade_rubric}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Recently Added Students */}
                {recentStudents && recentStudents.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="p-5 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                        <Users className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg sm:text-xl font-black text-gray-900">
                                            Recent Students
                                        </h3>
                                        <p className="text-xs sm:text-sm text-gray-600">
                                            Latest enrollments
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    href="/students"
                                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                                >
                                    View All
                                </Link>
                            </div>
                        </div>
                        <div className="p-4 sm:p-6">
                            <div className="space-y-3">
                                {recentStudents.slice(0, 5).map((student) => (
                                    <Link
                                        key={student.id}
                                        href={`/students/${student.id}`}
                                        className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white hover:from-blue-50 hover:to-indigo-50 border border-gray-100 hover:border-blue-200 transition-all group"
                                    >
                                        <div className="flex-shrink-0">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                                                {student.first_name?.charAt(0)}{student.last_name?.charAt(0)}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                                {student.first_name} {student.last_name}
                                            </h4>
                                            <p className="text-sm text-gray-600">
                                                {student.grade?.name || 'No Grade'} • {student.admission_number}
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <span className="text-xs text-gray-500">
                                                {new Date(student.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
