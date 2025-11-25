import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { BookOpen, User, ChevronRight, Calendar, BookMarked, Layers } from "lucide-react";
import { Badge } from '@/Components/UI';

export default function Index({ students }) {
    // Helper to get reading type badge variant
    const getReadingTypeBadge = (type) => {
        const variants = {
            'new_learning': 'success',
            'revision': 'info',
            'subac': 'secondary',
        };
        return variants[type] || 'secondary';
    };

    // Helper to get difficulty badge variant
    const getDifficultyBadge = (difficulty) => {
        const variants = {
            'very_well': 'success',
            'middle': 'warning',
            'difficult': 'danger',
        };
        return variants[difficulty] || 'secondary';
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-2 sm:gap-3">
                    <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0" />
                    <h2 className="text-lg sm:text-2xl font-bold text-navy">
                        Children's Quran Progress
                    </h2>
                </div>
            }
        >
            <Head title="Quran Tracking" />

            <div className="py-6">
                {students && students.length > 0 ? (
                    <div className="space-y-4">
                        {students.map((student) => (
                            <div key={student.id}>
                                {/* Mobile Layout - Clickable Card */}
                                <Link
                                    href={`/quran-tracking/student/${student.id}/report`}
                                    className="sm:hidden block bg-white rounded-lg shadow-sm border border-gray-200 hover:border-orange-300 hover:shadow-md active:scale-[0.99] transition-all"
                                >
                                    {/* Student Header - Mobile */}
                                    <div className="p-4 border-b border-gray-100">
                                        <div className="flex items-start gap-3">
                                            {/* Avatar */}
                                            <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-sm">
                                                <User className="w-7 h-7 text-white" />
                                            </div>

                                            {/* Student Info */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-base font-bold text-navy truncate">
                                                    {student.first_name} {student.last_name}
                                                </h3>
                                                <p className="text-xs text-gray-600 mt-0.5">
                                                    {student.grade.name}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="inline-flex items-center px-2.5 py-1 bg-orange-50 text-orange-700 text-xs font-semibold rounded-full">
                                                        <Calendar className="w-3 h-3 mr-1" />
                                                        {student.total_sessions} {student.total_sessions === 1 ? 'Session' : 'Sessions'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Chevron */}
                                            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                                        </div>
                                    </div>

                                    {/* Latest Session Info - Mobile */}
                                    {student.latest_tracking && (
                                        <div className="p-4 bg-gradient-to-br from-gray-50 to-green-50">
                                            {/* Latest Session Header */}
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                    Latest Session
                                                </span>
                                                <span className="text-xs text-gray-600 font-medium">
                                                    {student.latest_tracking.date}
                                                </span>
                                            </div>

                                            {/* Badges */}
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                <Badge
                                                    variant={getReadingTypeBadge(student.latest_tracking.reading_type)}
                                                    value={student.latest_tracking.reading_type_label}
                                                    size="sm"
                                                />
                                                <Badge
                                                    variant={getDifficultyBadge(student.latest_tracking.difficulty)}
                                                    value={student.latest_tracking.difficulty_label}
                                                    size="sm"
                                                />
                                            </div>

                                            {/* Stats Grid */}
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="bg-white rounded-lg p-2.5 text-center border border-blue-100">
                                                    <div className="flex items-center justify-center mb-1">
                                                        <BookOpen className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <p className="text-lg font-black text-blue-600">
                                                        {student.latest_tracking.pages_memorized}
                                                    </p>
                                                    <p className="text-[10px] text-gray-600 font-medium mt-0.5">
                                                        Pages
                                                    </p>
                                                </div>
                                                <div className="bg-white rounded-lg p-2.5 text-center border border-purple-100">
                                                    <div className="flex items-center justify-center mb-1">
                                                        <BookMarked className="w-4 h-4 text-purple-600" />
                                                    </div>
                                                    <p className="text-lg font-black text-purple-600">
                                                        {student.latest_tracking.surahs_memorized}
                                                    </p>
                                                    <p className="text-[10px] text-gray-600 font-medium mt-0.5">
                                                        Surahs
                                                    </p>
                                                </div>
                                                <div className="bg-white rounded-lg p-2.5 text-center border border-indigo-100">
                                                    <div className="flex items-center justify-center mb-1">
                                                        <Layers className="w-4 h-4 text-indigo-600" />
                                                    </div>
                                                    <p className="text-lg font-black text-indigo-600">
                                                        {student.latest_tracking.juz_memorized}
                                                    </p>
                                                    <p className="text-[10px] text-gray-600 font-medium mt-0.5">
                                                        Juz
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </Link>

                                {/* Desktop Layout - Original Design */}
                                <div className="hidden sm:block p-5 bg-gradient-to-r from-gray-50 to-green-50 rounded-lg border border-gray-200 hover:border-green-300 transition-all">
                                    {/* Student Header */}
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-sm">
                                                <User className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-navy">
                                                    {student.first_name} {student.last_name}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    {student.grade.name} • {student.admission_number}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-center px-4 py-2 bg-white rounded-lg border border-gray-200">
                                                <p className="text-2xl font-black text-orange-600">{student.total_sessions}</p>
                                                <p className="text-xs text-gray-600 font-medium">Total Sessions</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Latest Session Info */}
                                    {student.latest_tracking && (
                                        <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-xs font-semibold text-gray-500 uppercase">Latest Session</p>
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Calendar className="w-4 h-4" />
                                                    {student.latest_tracking.date}
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge
                                                    variant={getReadingTypeBadge(student.latest_tracking.reading_type)}
                                                    value={student.latest_tracking.reading_type_label}
                                                    size="sm"
                                                />
                                                <Badge
                                                    variant={getDifficultyBadge(student.latest_tracking.difficulty)}
                                                    value={student.latest_tracking.difficulty_label}
                                                    size="sm"
                                                />
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 mt-3">
                                                <div className="text-center p-2 bg-blue-50 rounded">
                                                    <p className="text-lg font-black text-blue-600">{student.latest_tracking.pages_memorized}</p>
                                                    <p className="text-xs text-gray-600">Pages</p>
                                                </div>
                                                <div className="text-center p-2 bg-purple-50 rounded">
                                                    <p className="text-lg font-black text-purple-600">{student.latest_tracking.surahs_memorized}</p>
                                                    <p className="text-xs text-gray-600">Surahs</p>
                                                </div>
                                                <div className="text-center p-2 bg-indigo-50 rounded">
                                                    <p className="text-lg font-black text-indigo-600">{student.latest_tracking.juz_memorized}</p>
                                                    <p className="text-xs text-gray-600">Juz</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Button */}
                                    <Link
                                        href={`/quran-tracking/student/${student.id}/report`}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-600 transition-all shadow-sm"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                        View Full Report
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center">
                        <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                        <p className="text-gray-500 text-base sm:text-lg font-medium">No Quran tracking records found</p>
                        <p className="text-gray-400 text-sm mt-2">
                            Your children don't have any Quran tracking sessions yet
                        </p>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}


