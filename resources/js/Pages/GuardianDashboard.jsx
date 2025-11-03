import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { 
    Users, UserCircle, GraduationCap, Calendar, 
    ClipboardCheck, BarChart3, Award, FileText, TrendingUp,
    BookOpen, Target, Download, Eye, ChevronRight, School
} from 'lucide-react';

// This is the Guardian-specific dashboard component
// Import this in your main Dashboard.jsx like:
// import GuardianDashboard from './GuardianDashboard';
// Then in your Dashboard component, for guardian role:
// if (role === 'guardian') return <GuardianDashboard {...props} />;

export default function GuardianDashboard({ 
    students, 
    guardianInfo, 
    currentMonth,
    currentYear,
    currentTerm,
    totalChildren
}) {
    const StatCard = ({ icon: Icon, label, value, color = 'orange', subtext }) => (
        <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 border border-gray-100">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
                    <p className={`text-3xl font-bold text-${color} mb-1`}>{value}</p>
                    {subtext && (
                        <p className="text-xs text-gray-500">{subtext}</p>
                    )}
                </div>
                <div className={`p-4 bg-${color} bg-opacity-10 rounded-xl`}>
                    <Icon className={`w-8 h-8 text-${color}`} />
                </div>
            </div>
        </div>
    );

    const ProgressBar = ({ percentage, color = 'orange' }) => (
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
                className={`h-full bg-${color} transition-all duration-500 rounded-full`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
            />
        </div>
    );

    const getGradeColor = (grade) => {
        switch(grade) {
            case 'EE': return 'text-green-700 bg-green-100';
            case 'ME': return 'text-blue-700 bg-blue-100';
            case 'AE': return 'text-yellow-700 bg-yellow-100';
            case 'BE': return 'text-red-700 bg-red-100';
            default: return 'text-gray-700 bg-gray-100';
        }
    };

    const getMarkColor = (marks) => {
        if (marks >= 90) return 'text-green-700 font-semibold';
        if (marks >= 75) return 'text-blue-700 font-semibold';
        if (marks >= 50) return 'text-yellow-700 font-semibold';
        return 'text-red-700 font-semibold';
    };

    // Calculate overall stats
    const totalAttendanceRate = students?.length > 0 
        ? Math.round(students.reduce((sum, s) => sum + (s.attendance_stats?.attendance_rate || 0), 0) / students.length)
        : 0;

    const totalExamsThisTerm = students?.reduce((sum, s) => sum + (s.total_exams_this_term || 0), 0) || 0;

    return (
        <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-green-600 via-teal-600 to-cyan-600 rounded-2xl shadow-lg p-8 text-white">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Welcome Back, {guardianInfo?.name}!</h1>
                    <p className="text-green-100 text-lg">
                        Academic Year {currentYear} • Term {currentTerm} • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <UserCircle className="w-20 h-20 opacity-20" />
            </div>
        </div>

        {/* Quick Stats & Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">My Children</p>
                        <p className="text-4xl font-bold text-orange">{totalChildren || 0}</p>
                        <p className="text-xs text-gray-500 mt-1">Active students</p>
                    </div>
                    <Users className="w-12 h-12 text-orange opacity-20" />
                </div>
                <Link
                    href="/guardian/children"
                    className="block w-full text-center px-4 py-2 bg-orange text-white text-sm font-semibold rounded-lg hover:bg-orange-dark transition-all"
                >
                    View Academic Performance
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Attendance</p>
                        <p className="text-4xl font-bold text-blue-600">
                            {students?.length > 0 
                                ? Math.round(students.reduce((sum, s) => sum + (s.attendance_stats?.attendance_rate || 0), 0) / students.length)
                                : 0}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1">For {currentMonth}</p>
                    </div>
                    <Calendar className="w-12 h-12 text-blue-600 opacity-20" />
                </div>
                <Link
                    href="/guardian/attendance"
                    className="block w-full text-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all"
                >
                    View Attendance Details
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Report Cards</p>
                        <p className="text-4xl font-bold text-purple-600">
                            {students?.reduce((sum, s) => sum + (s.total_exams_this_term || 0), 0) || 0}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Exams this term</p>
                    </div>
                    <FileText className="w-12 h-12 text-purple-600 opacity-20" />
                </div>
                <Link
                    href="/reports"
                    className="block w-full text-center px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-all"
                >
                    Download Reports
                </Link>
            </div>
        </div>

        {/* Children Summary Cards */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-semibold text-navy mb-6 flex items-center">
                <GraduationCap className="w-6 h-6 mr-2 text-orange" />
                My Children Overview
            </h3>

            {students && students.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {students.map((student) => (
                        <div key={student.id} className="border-2 border-gray-200 rounded-xl p-6 hover:border-orange hover:shadow-lg transition-all">
                            <div className="flex items-center space-x-4 mb-4">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange to-orange-dark flex items-center justify-center text-white text-2xl font-bold">
                                    {student.first_name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-navy">{student.first_name} {student.last_name}</h4>
                                    <p className="text-sm text-gray-600">{student.class_name}</p>
                                    <p className="text-xs text-gray-500">{student.admission_number}</p>
                                </div>
                            </div>

                            {student.overall_average && (
                                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Overall Average</span>
                                        <span className="text-2xl font-bold text-blue-600">{student.overall_average}%</span>
                                    </div>
                                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${
                                        student.overall_grade === 'EE' ? 'bg-green-100 text-green-700' :
                                        student.overall_grade === 'ME' ? 'bg-blue-100 text-blue-700' :
                                        student.overall_grade === 'AE' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                        {student.overall_grade}
                                    </span>
                                </div>
                            )}

                            {student.attendance_stats && (
                                <div className="mb-4 p-4 bg-green-50 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Attendance</span>
                                        <span className="text-2xl font-bold text-green-600">{student.attendance_stats.attendance_rate}%</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Present:</span>
                                            <span className="font-semibold">{student.attendance_stats.present}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Absent:</span>
                                            <span className="font-semibold">{student.attendance_stats.absent}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Link
                                    href={`/reports/generate?student_id=${student.id}&term=${currentTerm}&academic_year=${currentYear}`}
                                    className="flex-1 text-center px-3 py-2 bg-orange text-white text-xs font-semibold rounded-lg hover:bg-orange-dark transition-all"
                                >
                                    <Download className="w-3 h-3 inline mr-1" />
                                    Report
                                </Link>
                                <Link
                                    href={`/attendance/student/${student.id}`}
                                    className="flex-1 text-center px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-all"
                                >
                                    <Eye className="w-3 h-3 inline mr-1" />
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
                        <p className="font-semibold text-navy text-lg">{guardianInfo.name}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-green-50 to-teal-50 rounded-lg border border-green-200">
                        <p className="text-xs text-gray-600 mb-2 font-medium">Phone Number</p>
                        <p className="font-semibold text-navy text-lg">{guardianInfo.phone_number}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                        <p className="text-xs text-gray-600 mb-2 font-medium">Relationship</p>
                        <p className="font-semibold text-navy text-lg capitalize">{guardianInfo.relationship}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
                        <p className="text-xs text-gray-600 mb-2 font-medium">Email</p>
                        <p className="font-semibold text-navy text-sm break-words">{guardianInfo.email}</p>
                    </div>
                </div>
            </div>
        )}
    </div>
    );
}