import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Book, BookOpen, Calendar, Users, TrendingUp, Award, Clock } from 'lucide-react';

const STATUS_BADGES = {
    pending: 'bg-yellow-100 text-yellow-800',
    graded: 'bg-green-100 text-green-800',
    absent: 'bg-red-100 text-red-800',
    not_prepared: 'bg-pink-100 text-pink-800',
};

const GRID_COLS_CLASS = {
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
};

export default function QuranDashboard({ auth, stats, recentSessions, recentActivity, recentProgress, activeSchedulesList }) {
    const role = stats?.role;
    const isGuardian = role === 'guardian';

    const modules = [
        {
            name: 'Quran Homework',
            href: isGuardian ? route('guardian.quran-homework') : '/quran-homework',
            icon: BookOpen,
            description: 'Assign and manage Quran homework',
            color: 'from-blue-500 to-blue-600',
            stats: stats?.homework || null,
        },
        {
            name: 'Quran Schedules',
            href: '/quran-schedule',
            icon: Calendar,
            description: 'Create and manage Quran learning schedules',
            color: 'from-green-500 to-green-600',
            stats: stats?.schedule || null,
            // Guardians have no dedicated schedules list — the dashboard's
            // own "Active Schedules" panel above already covers their
            // handful of children (with clickable rows into each schedule),
            // so this card would just be a redundant, non-clickable
            // duplicate of that panel for them. Hidden entirely rather than
            // shown non-clickable.
            hiddenForGuardian: true,
        },
    ];

    let overallStats = [];
    if (role === 'teacher') {
        overallStats = [
            { name: 'My Active Schedules', value: stats?.activeSchedules || 0, icon: Calendar, color: 'text-blue-600', bgColor: 'bg-blue-100' },
            { name: 'My Students', value: stats?.studentsTracked || 0, icon: Users, color: 'text-green-600', bgColor: 'bg-green-100' },
            { name: 'My Pending Homework', value: stats?.pendingHomework || 0, icon: Clock, color: 'text-orange-600', bgColor: 'bg-orange-100' },
        ];
    } else if (role === 'guardian') {
        overallStats = [
            { name: 'My Children Tracked', value: stats?.childrenTracked || 0, icon: Users, color: 'text-green-600', bgColor: 'bg-green-100' },
            { name: 'Pending Homework', value: stats?.pendingHomework || 0, icon: Clock, color: 'text-orange-600', bgColor: 'bg-orange-100' },
        ];
    } else {
        overallStats = [
            { name: 'Active Schedules', value: stats?.activeSchedules || 0, icon: Calendar, color: 'text-blue-600', bgColor: 'bg-blue-100' },
            { name: 'Students Tracked', value: stats?.studentsTracked || 0, icon: Users, color: 'text-green-600', bgColor: 'bg-green-100' },
            { name: 'Pending Homework', value: stats?.pendingHomework || 0, icon: Clock, color: 'text-orange-600', bgColor: 'bg-orange-100' },
            { name: 'Top Performer', value: stats?.topPerformer || 'No data yet', icon: Award, color: 'text-purple-600', bgColor: 'bg-purple-100' },
        ];
    }

    const gridColsClass = GRID_COLS_CLASS[overallStats.length] || 'lg:grid-cols-4';

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Quran Module" />

            <div className="py-6 sm:py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Book className="w-8 h-8 text-orange" />
                            Quran Module
                        </h1>
                        <p className="mt-2 text-gray-600">
                            Comprehensive Quran learning and tracking system
                        </p>
                    </div>

                    {/* Overall Stats */}
                    {stats && (
                        <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridColsClass} gap-6 mb-8`}>
                            {overallStats.map((stat) => {
                                const Icon = stat.icon;
                                return (
                                    <div
                                        key={stat.name}
                                        className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-600">
                                                    {stat.name}
                                                </p>
                                                <p className={`mt-2 font-bold text-gray-900 ${typeof stat.value === 'number' ? 'text-3xl' : 'text-xl'}`}>
                                                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                                                </p>
                                            </div>
                                            <div className={`${stat.bgColor} p-3 rounded-xl`}>
                                                <Icon className={`w-6 h-6 ${stat.color}`} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Teacher: Recent Activity */}
                    {role === 'teacher' && recentActivity && recentActivity.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                <Clock className="w-5 h-5 mr-2 text-orange" />
                                Recent Activity
                            </h3>
                            <div className="divide-y divide-gray-100">
                                {recentActivity.map((item) => (
                                    <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                                        <div>
                                            <p className="font-medium text-gray-900">{item.student_name}</p>
                                            <p className="text-sm text-gray-500">
                                                {item.surah_range} · {item.reading_type_label} · {item.date}
                                            </p>
                                        </div>
                                        <span className={`shrink-0 px-2.5 py-1 text-xs font-semibold rounded-full ${STATUS_BADGES[item.status] || 'bg-gray-100 text-gray-800'}`}>
                                            {item.status_label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Guardian: Recent Progress */}
                    {role === 'guardian' && recentProgress && recentProgress.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                <TrendingUp className="w-5 h-5 mr-2 text-orange" />
                                Recent Progress
                            </h3>
                            <div className="divide-y divide-gray-100">
                                {recentProgress.map((child) => (
                                    <div key={child.student_id} className="py-3 flex items-center justify-between gap-4">
                                        <p className="font-medium text-gray-900">{child.student_name}</p>
                                        {child.latest ? (
                                            <div className="text-right">
                                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${STATUS_BADGES[child.latest.status] || 'bg-gray-100 text-gray-800'}`}>
                                                    {child.latest.status_label}
                                                </span>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {child.latest.surah_range} · {child.latest.date}
                                                </p>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-400">No homework yet</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Guardian: Active Schedules */}
                    {role === 'guardian' && activeSchedulesList && activeSchedulesList.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                <Calendar className="w-5 h-5 mr-2 text-orange" />
                                Active Schedules
                            </h3>
                            <div className="space-y-4">
                                {activeSchedulesList.map((schedule) => (
                                    <Link
                                        key={schedule.id}
                                        href={route('quran-schedule.show', schedule.id)}
                                        className="block rounded-lg -m-2 p-2 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-medium text-gray-900">{schedule.student_name}</span>
                                            <span className="text-sm text-gray-500">
                                                {schedule.days_remaining != null ? `${schedule.days_remaining} days left` : 'No deadline'}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-orange h-2 rounded-full"
                                                style={{ width: `${schedule.progress_percentage || 0}%` }}
                                            ></div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Module Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {modules
                            .filter((module) => !module.hiddenForGuardian || !isGuardian)
                            .map((module) => {
                                const Icon = module.icon;
                                return (
                                    <Link
                                        key={module.name}
                                        href={module.href}
                                        className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
                                    >
                                        <div className={`h-2 bg-gradient-to-r ${module.color}`} />
                                        <div className="p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className={`p-3 rounded-xl bg-gradient-to-r ${module.color}`}>
                                                    <Icon className="w-6 h-6 text-white" />
                                                </div>
                                                <TrendingUp className="w-5 h-5 text-gray-400 group-hover:text-orange transition-colors" />
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                                {module.name}
                                            </h3>
                                            <p className="text-gray-600 text-sm mb-4">
                                                {module.description}
                                            </p>
                                            {module.stats && (
                                                <div className="flex gap-4 text-sm">
                                                    <div>
                                                        <span className="text-gray-500">Total: </span>
                                                        <span className="font-semibold text-gray-900">
                                                            {module.stats.total || 0}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">This Month: </span>
                                                        <span className="font-semibold text-gray-900">
                                                            {module.stats.thisMonth || 0}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
