import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Users, UserCheck, UserCircle, GraduationCap, TrendingUp, Calendar } from 'lucide-react';

export default function Dashboard({ role, stats, recentStudents, students, guardianInfo }) {
    const StatCard = ({ icon: Icon, label, value, color = 'orange' }) => (
        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-6 border border-gray-100">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{label}</p>
                    <p className={`mt-2 text-3xl font-bold text-${color}`}>{value}</p>
                </div>
                <div className={`p-3 bg-${color} bg-opacity-10 rounded-lg`}>
                    <Icon className={`w-8 h-8 text-${color}`} />
                </div>
            </div>
        </div>
    );

    return (
        <AuthenticatedLayout header="Dashboard">
            <Head title="Dashboard" />

            {/* Admin Dashboard */}
            {role === 'admin' && (
                <div className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard icon={Users} label="Total Students" value={stats.totalStudents} color="orange" />
                        <StatCard icon={UserCheck} label="Active Students" value={stats.activeStudents} color="green-500" />
                        <StatCard icon={UserCircle} label="Total Guardians" value={stats.totalGuardians} color="blue-500" />
                        <StatCard icon={GraduationCap} label="Total Teachers" value={stats.totalTeachers} color="purple-500" />
                    </div>

                    {/* Recent Students Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h3 className="text-lg font-semibold text-navy flex items-center">
                                <TrendingUp className="w-5 h-5 mr-2 text-orange" />
                                Recent Students
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
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
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {recentStudents?.map((student) => (
                                        <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-navy">
                                                {student.admission_number}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {student.first_name} {student.last_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {student.class_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {student.guardian?.user?.name}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Teacher Dashboard */}
            {role === 'teacher' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <StatCard icon={Users} label="Total Students" value={stats.totalStudents} color="orange" />
                        <StatCard icon={UserCheck} label="Active Students" value={stats.activeStudents} color="green-500" />
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h3 className="text-lg font-semibold text-navy flex items-center">
                                <Users className="w-5 h-5 mr-2 text-orange" />
                                Recent Students
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
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
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {recentStudents?.map((student) => (
                                        <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-navy">
                                                {student.admission_number}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {student.first_name} {student.last_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {student.class_name}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Guardian Dashboard */}
            {role === 'guardian' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-navy mb-4 flex items-center">
                            <Users className="w-5 h-5 mr-2 text-orange" />
                            My Children
                        </h3>
                        {students && students.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {students.map((student) => (
                                    <div key={student.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                                        <div className="flex items-center mb-3">
                                            <div className="w-12 h-12 rounded-full bg-orange bg-opacity-10 flex items-center justify-center mr-3">
                                                <GraduationCap className="w-6 h-6 text-orange" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-lg text-navy">
                                                    {student.first_name} {student.last_name}
                                                </h4>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                    student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {student.status}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-sm text-gray-600">
                                            <p><span className="font-medium text-gray-700">Admission No:</span> {student.admission_number}</p>
                                            <p><span className="font-medium text-gray-700">Class:</span> {student.class_name}</p>
                                            <p><span className="font-medium text-gray-700">Gender:</span> {student.gender}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-8">No students found.</p>
                        )}
                    </div>

                    {guardianInfo && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-semibold text-navy mb-4 flex items-center">
                                <UserCircle className="w-5 h-5 mr-2 text-orange" />
                                My Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-600 mb-1">Phone Number</p>
                                    <p className="font-medium text-navy">{guardianInfo.phone_number}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600 mb-1">Relationship</p>
                                    <p className="font-medium text-navy">{guardianInfo.relationship}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600 mb-1">Occupation</p>
                                    <p className="font-medium text-navy">{guardianInfo.occupation || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600 mb-1">Address</p>
                                    <p className="font-medium text-navy">{guardianInfo.address || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </AuthenticatedLayout>
    );
}