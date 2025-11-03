import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Calendar, Eye, School, TrendingUp } from 'lucide-react';

export default function Attendance({ students, currentMonth }) {
    const ProgressBar = ({ percentage, color = 'orange' }) => (
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
                className={`h-full bg-${color} transition-all duration-500 rounded-full`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
            />
        </div>
    );

    return (
        <AuthenticatedLayout header="Attendance">
            <Head title="My Children - Attendance" />

            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-navy mb-2">Children's Attendance</h1>
                            <p className="text-gray-600">Monthly Report for {currentMonth}</p>
                        </div>
                        <Link
                            href="/dashboard"
                            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            ← Back to Dashboard
                        </Link>
                    </div>
                </div>

                {/* Children Attendance Cards */}
                {students && students.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {students.map((student) => (
                            <div key={student.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all">
                                {/* Student Header */}
                                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                                            <School className="w-8 h-8 text-blue-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold">{student.first_name} {student.last_name}</h2>
                                            <p className="text-sm opacity-90">{student.class_name} • {student.admission_number}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6">
                                    {/* Attendance Rate */}
                                    <div className="mb-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-semibold text-gray-700">Attendance Rate</span>
                                            <div className="text-right">
                                                <span className="text-3xl font-bold text-blue-600">
                                                    {student.attendance_stats.attendance_rate}%
                                                </span>
                                                {student.attendance_stats.attendance_rate >= 90 && (
                                                    <TrendingUp className="w-5 h-5 text-green-600 inline ml-2" />
                                                )}
                                            </div>
                                        </div>
                                        <ProgressBar 
                                            percentage={student.attendance_stats.attendance_rate}
                                            color={
                                                student.attendance_stats.attendance_rate >= 90 ? 'green-500' :
                                                student.attendance_stats.attendance_rate >= 75 ? 'blue-500' :
                                                student.attendance_stats.attendance_rate >= 60 ? 'yellow-500' :
                                                'red-500'
                                            }
                                        />
                                    </div>

                                    {/* Attendance Breakdown */}
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                            <p className="text-sm text-gray-600 mb-1">Present</p>
                                            <p className="text-3xl font-bold text-green-600">{student.attendance_stats.present}</p>
                                        </div>
                                        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                                            <p className="text-sm text-gray-600 mb-1">Absent</p>
                                            <p className="text-3xl font-bold text-red-600">{student.attendance_stats.absent}</p>
                                        </div>
                                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                            <p className="text-sm text-gray-600 mb-1">Late</p>
                                            <p className="text-3xl font-bold text-yellow-600">{student.attendance_stats.late}</p>
                                        </div>
                                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                            <p className="text-sm text-gray-600 mb-1">Excused</p>
                                            <p className="text-3xl font-bold text-blue-600">{student.attendance_stats.excused}</p>
                                        </div>
                                    </div>

                                    {/* Total Days */}
                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-6">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-700">Total School Days</span>
                                            <span className="text-2xl font-bold text-navy">{student.attendance_stats.total}</span>
                                        </div>
                                    </div>

                                    {/* View Details Button */}
                                    <Link
                                        href={`/attendance/student/${student.id}`}
                                        className="block w-full text-center px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center"
                                    >
                                        <Eye className="w-5 h-5 mr-2" />
                                        View Full Attendance History
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No students found.</p>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}