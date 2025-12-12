import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Book, BookOpen, Calendar, Home, Users, TrendingUp, Award, Clock } from 'lucide-react';

export default function QuranDashboard({ auth, stats, recentSessions }) {
    const modules = [
        {
            name: 'Quran Tracking',
            href: '/quran-tracking',
            icon: Book,
            description: 'Track student Quran memorization and recitation',
            color: 'from-orange-500 to-orange-600',
            stats: stats?.tracking || null,
        },
        {
            name: 'Quran Homework',
            href: '/quran-homework',
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
        },
        {
            name: 'Home Practice',
            href: '/quran-home-practice',
            icon: Home,
            description: 'Log and track home practice sessions',
            color: 'from-purple-500 to-purple-600',
            stats: stats?.homePractice || null,
            guardianOnly: true,
        },
    ];

    const overallStats = [
        {
            name: 'Total Sessions',
            value: stats?.totalSessions || 0,
            icon: Clock,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
        },
        {
            name: 'Students Tracked',
            value: stats?.studentsTracked || 0,
            icon: Users,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
        },
        {
            name: 'Pages Memorized',
            value: stats?.pagesMemorized || 0,
            icon: Book,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100',
        },
        {
            name: 'Juz Completed',
            value: stats?.juzMemorized || 0,
            icon: Award,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
        },
    ];

    const isGuardian = auth.user.role === 'guardian';

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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                                                <p className="mt-2 text-3xl font-bold text-gray-900">
                                                    {stat.value.toLocaleString()}
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

                    {/* Module Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {modules
                            .filter((module) => !module.guardianOnly || isGuardian)
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

