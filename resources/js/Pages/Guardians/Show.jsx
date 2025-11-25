import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Mail, Phone, MapPin, Briefcase, User, Users, ClipboardCheck, TrendingUp } from 'lucide-react';

export default function GuardiansShow({ guardian, studentsWithAttendance, currentMonth }) {
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
        <AuthenticatedLayout header="Guardian Details">
            <Head title={`Guardian - ${guardian.user?.name}`} />

            <div className="space-y-6">
                {/* Back Button */}
                <Link
                    href={route('guardians.index')}
                    className="inline-flex items-center text-sm text-gray-600 hover:text-orange transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Guardians
                </Link>

                {/* Main Info Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-orange to-orange-dark px-6 py-8">
                        <div className="flex items-center space-x-4">
                            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-3xl font-bold text-orange">
                                {guardian.user?.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="mb-2">
                                    <span className="inline-block px-3 py-1.5 text-sm font-bold rounded-md bg-white text-orange">
                                        {guardian.guardian_number}
                                    </span>
                                </div>
                                <h2 className="text-2xl font-bold text-white">{guardian.user?.name}</h2>
                                <p className="text-orange-100 mt-1">{guardian.relationship}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-navy mb-4">Contact Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <InfoCard icon={Mail} label="Email" value={guardian.user?.email} />
                            <InfoCard icon={Phone} label="Phone Number" value={guardian.phone_number} />
                            <InfoCard icon={Briefcase} label="Occupation" value={guardian.occupation} />
                            <InfoCard icon={User} label="Relationship" value={guardian.relationship} />
                            <div className="md:col-span-2">
                                <InfoCard icon={MapPin} label="Address" value={guardian.address} />
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-6 mt-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-navy">Children</h3>
                                <span className="text-sm text-gray-500">Attendance for {currentMonth}</span>
                            </div>
                            {studentsWithAttendance && studentsWithAttendance.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {studentsWithAttendance.map((student) => (
                                        <div key={student.id} className="border-2 border-gray-200 rounded-xl hover:shadow-lg transition-all hover:border-orange">
                                            <Link href={`/students/${student.id}`} className="block p-5">
                                                <div className="flex items-center mb-4">
                                                    <Users className="w-5 h-5 text-orange mr-2" />
                                                    <h4 className="font-semibold text-navy">
                                                        {student.first_name} {student.last_name}
                                                    </h4>
                                                </div>
                                                <div className="space-y-1 text-sm text-gray-600 mb-3">
                                                    <p><span className="font-medium">Admission:</span> {student.admission_number}</p>
                                                    <p><span className="font-medium">Grade:</span> {student.grade?.name || 'Not Assigned'}</p>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                        student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {student.status}
                                                    </span>
                                                </div>
                                            </Link>

                                            {/* Attendance Summary */}
                                            {student.attendance_stats && (
                                                <div className="border-t border-gray-200 p-5 bg-gray-50">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="text-xs font-semibold text-gray-600 uppercase flex items-center">
                                                            <ClipboardCheck className="w-3 h-3 mr-1" />
                                                            Attendance
                                                        </span>
                                                        <span className="text-xl font-bold text-orange">
                                                            {student.attendance_stats.attendance_rate}%
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-4 gap-2 mb-3">
                                                        <div className="text-center bg-white rounded p-2">
                                                            <p className="text-xs text-gray-500">Present</p>
                                                            <p className="text-sm font-bold text-green-600">{student.attendance_stats.present}</p>
                                                        </div>
                                                        <div className="text-center bg-white rounded p-2">
                                                            <p className="text-xs text-gray-500">Absent</p>
                                                            <p className="text-sm font-bold text-red-600">{student.attendance_stats.absent}</p>
                                                        </div>
                                                        <div className="text-center bg-white rounded p-2">
                                                            <p className="text-xs text-gray-500">Late</p>
                                                            <p className="text-sm font-bold text-yellow-600">{student.attendance_stats.late}</p>
                                                        </div>
                                                        <div className="text-center bg-white rounded p-2">
                                                            <p className="text-xs text-gray-500">Excused</p>
                                                            <p className="text-sm font-bold text-blue-600">{student.attendance_stats.excused}</p>
                                                        </div>
                                                    </div>
                                                    <Link
                                                        href={`/attendance/student/${student.id}`}
                                                        className="block w-full text-center px-4 py-2 bg-orange text-white text-sm font-medium rounded-lg hover:bg-orange-dark transition-all"
                                                    >
                                                        <TrendingUp className="w-4 h-4 inline mr-1" />
                                                        View Details
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-8">No children enrolled yet.</p>
                            )}
                        </div>
                    </div>

                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                        <Link
                            href={`/guardians/${guardian.id}/edit`}
                            className="inline-flex items-center px-4 py-2 bg-orange text-white text-sm font-medium rounded-lg hover:bg-orange-dark transition-all"
                        >
                            Edit Guardian
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}