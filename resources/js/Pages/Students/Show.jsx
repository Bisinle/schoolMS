import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    User,
    Calendar,
    BookOpen,
    Users,
    MapPin,
    Phone,
    ClipboardCheck,
    TrendingUp
} from 'lucide-react';

export default function StudentsShow({ student, attendanceStats, currentMonth }) {
    const InfoCard = ({ icon: Icon, label, value }) => (
        <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-orange bg-opacity-10 rounded-lg flex items-center justify-center">
                <Icon className="w-5 h-5 text-orange" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600">{label}</p>
                <p className="mt-1 text-sm text-navy font-medium truncate">{value || 'N/A'}</p>
            </div>
        </div>
    );

    return (
        <AuthenticatedLayout header="Student Details">
            <Head title={`Student - ${student.first_name} ${student.last_name}`} />

            <div className="space-y-6">
                {/* Back Button */}
                <Link
                    href="/students"
                    className="inline-flex items-center text-sm text-gray-600 hover:text-orange transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Students
                </Link>

                {/* Main Info Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-orange to-orange-dark px-6 py-8">
                        <div className="flex items-center space-x-4">
                            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-3xl font-bold text-orange">
                                {student.first_name.charAt(0).toUpperCase()}
                                {student.last_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    {student.first_name} {student.last_name}
                                </h2>
                                <p className="text-orange-100 mt-1">
                                    Admission No: {student.admission_number}
                                </p>
                                <span
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                                        student.status === 'active'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}
                                >
                                    {student.status.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-navy mb-4">Student Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <InfoCard
                                icon={User}
                                label="Gender"
                                value={
                                    student.gender
                                        ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1)
                                        : 'N/A'
                                }
                            />
                            <InfoCard
                                icon={Calendar}
                                label="Date of Birth"
                                value={
                                    student.date_of_birth
                                        ? new Date(student.date_of_birth).toLocaleDateString()
                                        : 'N/A'
                                }
                            />
                            <InfoCard
                                icon={BookOpen}
                                label="Grade"
                                value={
                                    student.grade
                                        ? `${student.grade.name} - ${student.grade.level}`
                                        : 'Not Assigned'
                                }
                            />
                            <InfoCard
                                icon={Calendar}
                                label="Enrollment Date"
                                value={
                                    student.enrollment_date
                                        ? new Date(student.enrollment_date).toLocaleDateString()
                                        : 'N/A'
                                }
                            />
                        </div>

                        <h3 className="text-lg font-semibold text-navy mb-4 mt-6">Guardian Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InfoCard icon={Users} label="Guardian Name" value={student.guardian?.user?.name} />
                            <InfoCard icon={Phone} label="Guardian Phone" value={student.guardian?.phone_number} />
                            <InfoCard icon={User} label="Relationship" value={student.guardian?.relationship} />
                            <InfoCard icon={MapPin} label="Address" value={student.guardian?.address} />
                        </div>

                        {/* Attendance Summary Section */}
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-navy flex items-center">
                                    <ClipboardCheck className="w-5 h-5 mr-2 text-orange" />
                                    Attendance Summary ({currentMonth || 'N/A'})
                                </h3>
                                <Link
                                    href={`/attendance/student/${student.id}`}
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-orange border-2 border-orange rounded-lg hover:bg-orange hover:text-white transition-all"
                                >
                                    View Full History
                                    <TrendingUp className="w-4 h-4 ml-2" />
                                </Link>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <p className="text-xs text-gray-500 mb-1">Total Days</p>
                                    <p className="text-2xl font-bold text-navy">
                                        {attendanceStats?.total ?? 'N/A'}
                                    </p>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                    <p className="text-xs text-green-600 mb-1">Present</p>
                                    <p className="text-2xl font-bold text-green-700">
                                        {attendanceStats?.present ?? 'N/A'}
                                    </p>
                                </div>
                                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                                    <p className="text-xs text-red-600 mb-1">Absent</p>
                                    <p className="text-2xl font-bold text-red-700">
                                        {attendanceStats?.absent ?? 'N/A'}
                                    </p>
                                </div>
                                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                                    <p className="text-xs text-yellow-600 mb-1">Late</p>
                                    <p className="text-2xl font-bold text-yellow-700">
                                        {attendanceStats?.late ?? 'N/A'}
                                    </p>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                    <p className="text-xs text-blue-600 mb-1">Excused</p>
                                    <p className="text-2xl font-bold text-blue-700">
                                        {attendanceStats?.excused ?? 'N/A'}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 bg-gradient-to-r from-orange to-orange-dark rounded-lg p-4">
                                <div className="flex items-center justify-between text-white">
                                    <span className="text-sm font-medium">Attendance Rate</span>
                                    <span className="text-3xl font-bold">
                                        {attendanceStats?.attendance_rate ?? '0'}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                        <Link
                            href={`/attendance/student/${student.id}`}
                            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-all"
                        >
                            <ClipboardCheck className="w-4 h-4 mr-2" />
                            View Attendance
                        </Link>
                        <Link
                            href={`/students/${student.id}/edit`}
                            className="inline-flex items-center px-4 py-2 bg-orange text-white text-sm font-medium rounded-lg hover:bg-orange-dark transition-all"
                        >
                            Edit Student
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
