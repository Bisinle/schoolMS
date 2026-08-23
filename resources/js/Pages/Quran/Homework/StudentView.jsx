import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, BookOpen, Calendar, User, CheckCircle, XCircle, AlertTriangle, Clock, Eye } from 'lucide-react';

const STATUS_BADGES = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'graded': 'bg-green-100 text-green-800',
    'absent': 'bg-red-100 text-red-800',
    'not_prepared': 'bg-pink-100 text-pink-800',
};

const STATUS_LABELS = {
    'pending': 'Pending',
    'graded': 'Graded',
    'absent': 'Absent',
    'not_prepared': 'Not Prepared',
};

const getStatusIcon = (status) => {
    if (status === 'graded') return CheckCircle;
    if (status === 'absent') return XCircle;
    if (status === 'not_prepared') return AlertTriangle;
    return Clock;
};

/**
 * Read-only history of a student's Homework entries — what's been assigned
 * and graded so far. Deliberately minimal: no self-logging here, that's
 * QuranHomePractice's job.
 */
export default function StudentView({ student, homework }) {
    const { auth } = usePage().props;
    const isGuardian = auth.user.role === 'guardian';

    return (
        <AuthenticatedLayout header={`Quran Homework - ${student.first_name} ${student.last_name}`}>
            <Head title={`Quran Homework - ${student.first_name} ${student.last_name}`} />

            <div className="py-6 sm:py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 sm:mb-8">
                        <Link
                            href={isGuardian ? "/guardian/quran-homework" : "/quran-homework"}
                            className="inline-flex items-center text-sm text-gray-600 hover:text-orange transition-colors mb-4"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Link>
                        <div className="flex items-center space-x-3">
                            <div className="w-14 h-14 bg-gradient-to-br from-orange to-orange-dark rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {student.first_name} {student.last_name}
                                </h2>
                                <p className="text-sm text-gray-600">
                                    {student.grade ? student.grade.name : 'No Grade'} • {student.admission_number}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Homework List */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center">
                                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-orange" />
                                Homework History ({homework.length})
                            </h3>
                        </div>

                        {homework.length === 0 ? (
                            <div className="text-center py-12">
                                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">No homework has been assigned yet.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {homework.map((hw) => {
                                    const StatusIcon = getStatusIcon(hw.status);
                                    return (
                                        <Link
                                            key={hw.id}
                                            href={`/quran-homework/${hw.id}`}
                                            className="flex items-center justify-between gap-4 p-4 sm:px-6 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {new Date(hw.assigned_date).toLocaleDateString()}
                                                </div>
                                                <div className="text-sm font-semibold text-gray-900">
                                                    Surah {hw.surah_from}:{hw.verse_from} → Surah {hw.surah_to}:{hw.verse_to}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    {hw.reading_type_label} • Assigned by {hw.teacher.name}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${STATUS_BADGES[hw.status] || 'bg-gray-100 text-gray-800'}`}>
                                                    <StatusIcon className="w-3.5 h-3.5" />
                                                    {STATUS_LABELS[hw.status] || hw.status_label}
                                                </span>
                                                <Eye className="w-4 h-4 text-gray-400" />
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
