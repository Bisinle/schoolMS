import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { BookOpen, User, Eye, FileText, Calendar } from "lucide-react";

export default function Index({ students }) {
    const getReadingTypeBadge = (type) => {
        const badges = {
            'new_learning': 'bg-emerald-100 text-emerald-700 border border-emerald-200',
            'revision': 'bg-blue-100 text-blue-700 border border-blue-200',
            'subac': 'bg-orange-100 text-orange-700 border border-orange-200',
        };
        return badges[type] || 'bg-gray-100 text-gray-700 border border-gray-200';
    };

    const getDifficultyBadge = (difficulty) => {
        const badges = {
            'very_well': 'bg-emerald-100 text-emerald-700 border border-emerald-200',
            'middle': 'bg-amber-100 text-amber-700 border border-amber-200',
            'difficult': 'bg-rose-100 text-rose-700 border border-rose-200',
        };
        return badges[difficulty] || 'bg-gray-100 text-gray-700 border border-gray-200';
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <BookOpen className="w-8 h-8 text-green-600" />
                        <h2 className="text-2xl font-bold text-navy">
                            Children's Quran Progress
                        </h2>
                    </div>
                </div>
            }
        >
            <Head title="Quran Tracking" />

            <div className="py-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h3 className="text-lg font-semibold text-navy">Your Children</h3>
                        <p className="text-sm text-gray-600 mt-1">Click on a child to view their detailed Quran tracking report</p>
                    </div>

                    <div className="p-6">
                        {students && students.length > 0 ? (
                            <div className="space-y-4">
                                {students.map((student) => (
                                    <div
                                        key={student.id}
                                        className="p-5 bg-gradient-to-r from-gray-50 to-green-50 rounded-lg border border-gray-200 hover:border-green-300 transition-all"
                                    >
                                        {/* Student Header */}
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-sm">
                                                    <User className="w-6 h-6 text-white" />
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
                                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getReadingTypeBadge(student.latest_tracking.reading_type)}`}>
                                                        {student.latest_tracking.reading_type_label}
                                                    </span>
                                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getDifficultyBadge(student.latest_tracking.difficulty)}`}>
                                                        {student.latest_tracking.difficulty_label}
                                                    </span>
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
                                            <FileText className="w-5 h-5" />
                                            View Full Report
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">No Quran tracking records found</p>
                                <p className="text-gray-400 text-sm mt-2">
                                    Your children don't have any Quran tracking sessions yet
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}


