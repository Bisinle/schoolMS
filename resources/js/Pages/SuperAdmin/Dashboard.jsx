import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { School, Users, UserCheck, CircleX, Trophy, TrendingUp, GraduationCap, UserCircle, FileText, BookOpen, Library, ArrowRight } from 'lucide-react';

export default function Dashboard({ stats, recentlyActiveSchools, latestActivities, topSchools }) {
    const statCards = [
        { label: 'Total Schools', value: stats.totalSchools, icon: School, gradient: 'from-blue-500 to-cyan-500' },
        { label: 'Active Schools', value: stats.activeSchools, icon: UserCheck, gradient: 'from-green-500 to-emerald-500' },
        { label: 'Suspended Schools', value: stats.suspendedSchools, icon: CircleX, gradient: 'from-red-500 to-pink-500' },
        { label: 'Total Users', value: stats.totalUsers, icon: Users, gradient: 'from-purple-500 to-indigo-500' },
        { label: 'Total Students', value: stats.totalStudents, icon: Trophy, gradient: 'from-yellow-500 to-orange-500' },
        { label: 'Trial Schools', value: stats.trialSchools, icon: TrendingUp, gradient: 'from-orange-500 to-red-500' },
        { label: 'Total Teachers', value: stats.totalTeachers, icon: GraduationCap, gradient: 'from-indigo-500 to-purple-500' },
        { label: 'Total Guardians', value: stats.totalGuardians, icon: UserCircle, gradient: 'from-teal-500 to-cyan-500' },
        { label: 'Total Documents', value: stats.totalDocuments, icon: FileText, gradient: 'from-pink-500 to-rose-500' },
        { label: 'Total Grades', value: stats.totalGrades, icon: BookOpen, gradient: 'from-cyan-500 to-blue-500' },
        { label: 'Total Subjects', value: stats.totalSubjects, icon: Library, gradient: 'from-emerald-500 to-green-500' },
    ];

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl sm:text-2xl font-bold leading-tight text-gray-800">
                    Super Admin Dashboard
                </h2>
            }
        >
            <Head title="Super Admin Dashboard" />

            <div className="py-6 sm:py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Welcome Section */}
                    <div className="mb-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
                        <h1 className="text-2xl sm:text-3xl font-black mb-2">Welcome Back, Super Admin!</h1>
                        <p className="text-blue-100 text-sm sm:text-base">Monitor and manage all schools from your central dashboard</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
                        {statCards.map((stat, index) => (
                            <div
                                key={index}
                                className="group relative bg-white rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden"
                            >
                                {/* Background Gradient */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                                
                                <div className="relative flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">{stat.label}</p>
                                        <p className="text-2xl sm:text-3xl font-black text-gray-900 truncate">{stat.value}</p>
                                    </div>
                                    <div className={`ml-4 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                                        <stat.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                                    </div>
                                </div>
                                
                                {/* Decorative corner */}
                                <div className={`absolute -bottom-6 -right-6 w-20 h-20 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`}></div>
                            </div>
                        ))}
                    </div>

                    {/* Top Schools Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <h3 className="text-lg sm:text-xl font-black text-gray-900">Top Schools by Student Count</h3>
                                    <p className="text-sm text-gray-600 mt-1">Leading institutions in your network</p>
                                </div>
                                <Link
                                    href={route('super-admin.schools.index')}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 w-full sm:w-auto justify-center"
                                >
                                    View All Schools
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">School Name</th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Students</th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {topSchools && topSchools.length > 0 ? (
                                        topSchools.map((school, index) => (
                                            <tr key={school.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                                            {index + 1}
                                                        </div>
                                                        <div className="text-sm font-bold text-gray-900">{school.name}</div>
                                                    </div>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-bold text-gray-900">{school.current_student_count}</div>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                                                        school.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {school.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                    <Link 
                                                        href={route('super-admin.schools.show', school.id)} 
                                                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-900 font-semibold text-sm transition-colors"
                                                    >
                                                        View Details
                                                        <ArrowRight className="w-3 h-3" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-12 text-center">
                                                <School className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                                <p className="text-gray-500 font-medium">No schools found</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}