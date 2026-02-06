import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Calendar, Clock, DoorOpen, Grid3x3, Users, TrendingUp, AlertCircle } from 'lucide-react';
import TimetableSetupGuide from '@/Components/Timetable/TimetableSetupGuide';

export default function TimetableDashboard({ stats, recentTemplates, auth }) {
    const statCards = [
        {
            title: 'Total Templates',
            value: stats.templates_count,
            icon: Calendar,
            color: 'bg-blue-500',
            link: route('timetables.templates.index'),
        },
        {
            title: 'Time Periods',
            value: stats.periods_count,
            icon: Clock,
            color: 'bg-green-500',
            link: route('timetables.periods.index'),
        },
        {
            title: 'Rooms',
            value: stats.rooms_count,
            icon: DoorOpen,
            color: 'bg-purple-500',
            link: route('timetables.rooms.index'),
        },
        {
            title: 'Total Slots',
            value: stats.slots_count,
            icon: Grid3x3,
            color: 'bg-orange',
            link: route('timetables.templates.index'),
        },
        {
            title: 'Published',
            value: stats.published_count,
            icon: TrendingUp,
            color: 'bg-teal-500',
            link: route('timetables.templates.index'),
        },
        {
            title: 'Draft',
            value: stats.draft_count,
            icon: AlertCircle,
            color: 'bg-yellow-500',
            link: route('timetables.templates.index'),
        },
    ];

    return (
        <AuthenticatedLayout header="Timetable Dashboard">
            <Head title="Timetable Dashboard" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Timetable Management</h2>
                        <p className="text-sm sm:text-base text-gray-600 mt-1">
                            Manage school timetables, periods, rooms, and schedules
                        </p>
                    </div>
                    <Link
                        href={route('timetables.templates.create')}
                        className="inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium text-white bg-orange rounded-lg hover:bg-orange-600 transition-colors shadow-md hover:shadow-lg"
                    >
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        Create New Template
                    </Link>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                    {statCards.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <Link
                                key={index}
                                href={stat.link}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-all hover:scale-105 active:scale-95"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className={`${stat.color} p-2 rounded-lg`}>
                                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                    </div>
                                </div>
                                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</p>
                                <p className="text-xs sm:text-sm text-gray-600 mt-1">{stat.title}</p>
                            </Link>
                        );
                    })}
                </div>

                {/* Setup Guide */}
                <TimetableSetupGuide stats={stats} />

                {/* Recent Templates */}
                {recentTemplates && recentTemplates.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Templates</h3>
                            <Link
                                href={route('timetables.templates.index')}
                                className="text-xs sm:text-sm text-orange hover:text-orange-600 font-medium"
                            >
                                View All →
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {recentTemplates.map((template) => (
                                <Link
                                    key={template.id}
                                    href={route('timetables.templates.show', template.id)}
                                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors active:scale-98"
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-gray-900 truncate">{template.name}</p>
                                            <p className="text-xs sm:text-sm text-gray-600 truncate">
                                                {template.grade?.name} - {template.academic_term?.name}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                                            template.status === 'published'
                                                ? 'bg-green-100 text-green-800'
                                                : template.status === 'draft'
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {template.status}
                                        </span>
                                        <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                                            {template.slots_count || 0} slots
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <Link
                            href={route('timetables.periods.create')}
                            className="flex items-center gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all hover:shadow-md active:scale-95"
                        >
                            <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-orange flex-shrink-0" />
                            <div>
                                <p className="text-sm sm:text-base font-medium text-gray-900">Add Period</p>
                                <p className="text-xs text-gray-600">Create time slot</p>
                            </div>
                        </Link>
                        <Link
                            href={route('timetables.rooms.create')}
                            className="flex items-center gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all hover:shadow-md active:scale-95"
                        >
                            <DoorOpen className="w-6 h-6 sm:w-8 sm:h-8 text-orange flex-shrink-0" />
                            <div>
                                <p className="text-sm sm:text-base font-medium text-gray-900">Add Room</p>
                                <p className="text-xs text-gray-600">Register classroom</p>
                            </div>
                        </Link>
                        <Link
                            href={route('timetables.templates.create')}
                            className="flex items-center gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all hover:shadow-md active:scale-95"
                        >
                            <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-orange flex-shrink-0" />
                            <div>
                                <p className="text-sm sm:text-base font-medium text-gray-900">New Template</p>
                                <p className="text-xs text-gray-600">Create timetable</p>
                            </div>
                        </Link>
                        <Link
                            href={route('timetables.availability.index')}
                            className="flex items-center gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all hover:shadow-md active:scale-95"
                        >
                            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-orange flex-shrink-0" />
                            <div>
                                <p className="text-sm sm:text-base font-medium text-gray-900">Availability</p>
                                <p className="text-xs text-gray-600">Teacher schedules</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

