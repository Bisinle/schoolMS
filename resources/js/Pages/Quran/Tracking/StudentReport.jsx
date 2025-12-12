import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, BookOpen, Calendar, TrendingUp, BarChart3, PieChart, Award, Target, Book, User, Eye, Star, AlertCircle } from 'lucide-react';

// Mobile Session Card Component
function MobileSessionCard({ session, getReadingTypeBadge, getDifficultyBadge }) {
    return (
        <div className="border-b border-gray-200 p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    {new Date(session.date).toLocaleDateString()}
                </div>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getReadingTypeBadge(session.reading_type)}`}>
                    {session.reading_type_label}
                </span>
            </div>

            <div className="mb-3">
                <div className="text-sm font-semibold text-gray-900 mb-1">
                    {session.surah_name}
                </div>
                <div className="text-xs text-gray-600">
                    Verses {session.verse_from} - {session.verse_to} ({session.calculated_total_verses} verses)
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getDifficultyBadge(session.difficulty)}`}>
                        {session.difficulty_label}
                    </span>
                    <span className="text-xs text-gray-500">• {session.teacher.name}</span>
                </div>
                <Link
                    href={`/quran-tracking/${session.id}`}
                    className="px-3 py-1.5 bg-orange text-white text-xs font-medium rounded-md hover:bg-orange-dark transition-colors flex items-center gap-1"
                >
                    <Eye className="w-3 h-3" />
                    View
                </Link>
            </div>
        </div>
    );
}

export default function StudentReport({ student, sessions, analytics, sessionsByMonth, sessionsByType, sessionsByDifficulty, assessmentAnalytics }) {
    const { auth } = usePage().props;
    const isGuardian = auth.user.role === 'guardian';

    const getReadingTypeBadge = (type) => {
        const badges = {
            'new_learning': 'bg-green-100 text-green-800',
            'revision': 'bg-blue-100 text-blue-800',
            'subac': 'bg-orange-100 text-orange-800',
        };
        return badges[type] || 'bg-gray-100 text-gray-800';
    };

    const getDifficultyBadge = (difficulty) => {
        const badges = {
            'very_well': 'bg-green-100 text-green-800',
            'middle': 'bg-yellow-100 text-yellow-800',
            'difficult': 'bg-red-100 text-red-800',
        };
        return badges[difficulty] || 'bg-gray-100 text-gray-800';
    };

    // Calculate percentages for pie charts
    const totalSessions = analytics.total_sessions || 1;
    const typePercentages = {
        new_learning: Math.round((sessionsByType.new_learning / totalSessions) * 100),
        revision: Math.round((sessionsByType.revision / totalSessions) * 100),
        subac: Math.round((sessionsByType.subac / totalSessions) * 100),
    };

    const difficultyPercentages = {
        very_well: Math.round((sessionsByDifficulty.very_well / totalSessions) * 100),
        middle: Math.round((sessionsByDifficulty.middle / totalSessions) * 100),
        difficult: Math.round((sessionsByDifficulty.difficult / totalSessions) * 100),
    };

    return (
        <AuthenticatedLayout header={`Quran Tracking Report - ${student.first_name} ${student.last_name}`}>
            <Head title={`Quran Report - ${student.first_name} ${student.last_name}`} />

            <div className="py-6 sm:py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 sm:mb-8">
                        <Link
                            href={isGuardian ? "/guardian/quran-tracking" : "/quran-tracking"}
                            className="inline-flex items-center text-sm text-gray-600 hover:text-orange transition-colors mb-4"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Quran Tracking
                        </Link>
                        <div className="flex items-center space-x-3">
                            <BookOpen className="w-8 h-8 text-orange" />
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Quran Tracking Report
                                </h2>
                                <p className="text-sm text-gray-600">
                                    {student.first_name} {student.last_name} - {student.grade ? student.grade.name : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 text-white">
                            <div className="flex flex-col sm:flex-row items-center justify-between">
                                <Calendar className="w-6 h-6 sm:w-8 sm:h-8 opacity-80 mb-2 sm:mb-0" />
                                <div className="text-center sm:text-right">
                                    <div className="text-2xl sm:text-3xl font-bold">{analytics.total_sessions}</div>
                                    <div className="text-xs sm:text-sm opacity-90">Sessions</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 text-white">
                            <div className="flex flex-col sm:flex-row items-center justify-between">
                                <Book className="w-6 h-6 sm:w-8 sm:h-8 opacity-80 mb-2 sm:mb-0" />
                                <div className="text-center sm:text-right">
                                    <div className="text-2xl sm:text-3xl font-bold">{analytics.total_verses}</div>
                                    <div className="text-xs sm:text-sm opacity-90">Verses</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 text-white">
                            <div className="flex flex-col sm:flex-row items-center justify-between">
                                <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 opacity-80 mb-2 sm:mb-0" />
                                <div className="text-center sm:text-right">
                                    <div className="text-2xl sm:text-3xl font-bold">{analytics.total_pages}</div>
                                    <div className="text-xs sm:text-sm opacity-90">Pages</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-orange to-orange-dark rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 text-white">
                            <div className="flex flex-col sm:flex-row items-center justify-between">
                                <Award className="w-6 h-6 sm:w-8 sm:h-8 opacity-80 mb-2 sm:mb-0" />
                                <div className="text-center sm:text-right">
                                    <div className="text-2xl sm:text-3xl font-bold">{analytics.pages_memorized}</div>
                                    <div className="text-xs sm:text-sm opacity-90">Memorized</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Reading Type Distribution */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                                <PieChart className="w-5 h-5 mr-2 text-orange" />
                                Reading Type Distribution
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-700">New Learning</span>
                                        <span className="text-sm font-bold text-green-600">{typePercentages.new_learning}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div 
                                            className="bg-green-500 h-3 rounded-full transition-all duration-500"
                                            style={{ width: `${typePercentages.new_learning}%` }}
                                        ></div>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">{sessionsByType.new_learning} sessions</div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-700">Revision</span>
                                        <span className="text-sm font-bold text-blue-600">{typePercentages.revision}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div 
                                            className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                                            style={{ width: `${typePercentages.revision}%` }}
                                        ></div>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">{sessionsByType.revision} sessions</div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-700">Subac (Group)</span>
                                        <span className="text-sm font-bold text-orange">{typePercentages.subac}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div
                                            className="bg-orange h-3 rounded-full transition-all duration-500"
                                            style={{ width: `${typePercentages.subac}%` }}
                                        ></div>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">{sessionsByType.subac} sessions</div>
                                </div>
                            </div>
                        </div>

                        {/* Difficulty Distribution */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                                <Target className="w-5 h-5 mr-2 text-orange" />
                                Performance Level Distribution
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-700">Very Well</span>
                                        <span className="text-sm font-bold text-green-600">{difficultyPercentages.very_well}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div
                                            className="bg-green-500 h-3 rounded-full transition-all duration-500"
                                            style={{ width: `${difficultyPercentages.very_well}%` }}
                                        ></div>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">{sessionsByDifficulty.very_well} sessions</div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-700">Middle</span>
                                        <span className="text-sm font-bold text-yellow-600">{difficultyPercentages.middle}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div
                                            className="bg-yellow-500 h-3 rounded-full transition-all duration-500"
                                            style={{ width: `${difficultyPercentages.middle}%` }}
                                        ></div>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">{sessionsByDifficulty.middle} sessions</div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-700">Difficult</span>
                                        <span className="text-sm font-bold text-red-600">{difficultyPercentages.difficult}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div
                                            className="bg-red-500 h-3 rounded-full transition-all duration-500"
                                            style={{ width: `${difficultyPercentages.difficult}%` }}
                                        ></div>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">{sessionsByDifficulty.difficult} sessions</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Memorization Progress */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                            <Award className="w-5 h-5 mr-2 text-orange" />
                            Memorization Progress
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                                <div className="text-4xl font-bold text-green-600 mb-2">{analytics.pages_memorized}</div>
                                <div className="text-sm text-gray-700 font-medium">Pages Memorized</div>
                                <div className="text-xs text-gray-500 mt-1">Out of 604 total pages</div>
                            </div>
                            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                                <div className="text-4xl font-bold text-blue-600 mb-2">{analytics.surahs_memorized}</div>
                                <div className="text-sm text-gray-700 font-medium">Surahs Memorized</div>
                                <div className="text-xs text-gray-500 mt-1">Out of 114 total surahs</div>
                            </div>
                            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                                <div className="text-4xl font-bold text-purple-600 mb-2">{analytics.juz_memorized}</div>
                                <div className="text-sm text-gray-700 font-medium">Juz Memorized</div>
                                <div className="text-xs text-gray-500 mt-1">Out of 30 total juz</div>
                            </div>
                        </div>
                    </div>

                    {/* Assessment Analytics */}
                    {assessmentAnalytics && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                                <Star className="w-5 h-5 mr-2 text-orange" />
                                Assessment Analytics
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* Sessions with Assessment */}
                                <div className="text-center p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl">
                                    <div className="text-4xl font-bold text-indigo-600 mb-2">
                                        {assessmentAnalytics.sessions_with_assessment}
                                    </div>
                                    <div className="text-sm text-gray-700 font-medium">Assessed Sessions</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        Out of {analytics.total_sessions} total
                                    </div>
                                </div>

                                {/* Average Fluency Rating */}
                                {assessmentAnalytics.avg_fluency_rating && (
                                    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <Star className="w-6 h-6 fill-blue-600 text-blue-600" />
                                            <div className="text-4xl font-bold text-blue-600">
                                                {assessmentAnalytics.avg_fluency_rating}
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-700 font-medium">Avg Fluency</div>
                                        <div className="text-xs text-gray-500 mt-1">Out of 5 stars</div>
                                    </div>
                                )}

                                {/* Average Tajweed Rating */}
                                {assessmentAnalytics.avg_tajweed_rating && (
                                    <div className="text-center p-6 bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl">
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <Star className="w-6 h-6 fill-teal-600 text-teal-600" />
                                            <div className="text-4xl font-bold text-teal-600">
                                                {assessmentAnalytics.avg_tajweed_rating}
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-700 font-medium">Avg Tajweed</div>
                                        <div className="text-xs text-gray-500 mt-1">Out of 5 stars</div>
                                    </div>
                                )}

                                {/* Total Mistakes */}
                                <div className="text-center p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <AlertCircle className={`w-6 h-6 ${
                                            assessmentAnalytics.total_mistakes === 0
                                                ? 'text-green-600'
                                                : assessmentAnalytics.avg_mistakes_per_session <= 2
                                                ? 'text-yellow-600'
                                                : 'text-red-600'
                                        }`} />
                                        <div className={`text-4xl font-bold ${
                                            assessmentAnalytics.total_mistakes === 0
                                                ? 'text-green-600'
                                                : assessmentAnalytics.avg_mistakes_per_session <= 2
                                                ? 'text-yellow-600'
                                                : 'text-red-600'
                                        }`}>
                                            {assessmentAnalytics.total_mistakes}
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-700 font-medium">Total Mistakes</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        Avg: {assessmentAnalytics.avg_mistakes_per_session} per session
                                    </div>
                                </div>
                            </div>

                            {/* Performance Insight */}
                            {(assessmentAnalytics.avg_fluency_rating || assessmentAnalytics.avg_tajweed_rating) && (
                                <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                                    <div className="flex items-start gap-3">
                                        <TrendingUp className="w-5 h-5 text-orange mt-0.5" />
                                        <div>
                                            <div className="font-semibold text-gray-900 mb-1">Performance Insight</div>
                                            <div className="text-sm text-gray-700">
                                                {(() => {
                                                    const avgRating = (
                                                        (assessmentAnalytics.avg_fluency_rating || 0) +
                                                        (assessmentAnalytics.avg_tajweed_rating || 0)
                                                    ) / 2;

                                                    if (avgRating >= 4.5) {
                                                        return "Excellent performance! The student demonstrates outstanding mastery of Quran recitation.";
                                                    } else if (avgRating >= 3.5) {
                                                        return "Very good progress! The student is performing well with consistent improvement.";
                                                    } else if (avgRating >= 2.5) {
                                                        return "Good effort! Continue practicing to improve fluency and tajweed.";
                                                    } else {
                                                        return "Keep practicing! Focus on improving fluency and tajweed rules.";
                                                    }
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* All Sessions Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center">
                                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-orange" />
                                All Sessions ({sessions.length})
                            </h3>
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Surah & Verses
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Performance
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Teacher
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {sessions.map((session) => (
                                        <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-sm text-gray-900">
                                                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                                    {new Date(session.date).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-3 py-1 text-xs leading-5 font-bold rounded-full ${getReadingTypeBadge(session.reading_type)}`}>
                                                    {session.reading_type_label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {session.surah_name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        Verses {session.verse_from} - {session.verse_to} ({session.calculated_total_verses} verses)
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-3 py-1 text-xs leading-5 font-bold rounded-full ${getDifficultyBadge(session.difficulty)}`}>
                                                    {session.difficulty_label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{session.teacher.name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <Link
                                                    href={`/quran-tracking/${session.id}`}
                                                    className="text-orange hover:text-orange-dark transition-colors"
                                                >
                                                    View Details
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile List View */}
                        <div className="md:hidden">
                            {sessions.map((session) => (
                                <MobileSessionCard
                                    key={session.id}
                                    session={session}
                                    getReadingTypeBadge={getReadingTypeBadge}
                                    getDifficultyBadge={getDifficultyBadge}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

