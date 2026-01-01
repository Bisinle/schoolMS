import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Clock, ArrowLeft, Edit, Calendar, Sparkles, ExternalLink } from 'lucide-react';

export default function ShowPeriod({ period, auth }) {
    const getPeriodTypeColor = (type) => {
        const colors = {
            lesson: 'bg-blue-100 text-blue-800',
            break: 'bg-green-100 text-green-800',
            lunch: 'bg-orange-100 text-orange-800',
            assembly: 'bg-purple-100 text-purple-800',
        };
        return colors[type] || colors.lesson;
    };

    const calculateDuration = (start, end) => {
        const startTime = new Date(`2000-01-01 ${start}`);
        const endTime = new Date(`2000-01-01 ${end}`);
        const diff = (endTime - startTime) / 1000 / 60; // minutes
        return `${diff} minutes`;
    };

    return (
        <AuthenticatedLayout header="Time Block Details">
            <Head title={`Time Block: ${period.name}`} />

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange text-white text-xl font-bold">
                            {period.order}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{period.name}</h2>
                            <p className="text-sm text-gray-600">
                                {period.lesson_number ? `Lesson ${period.lesson_number}` : 'Time Block Details'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('timetables.periods.edit', period.id)}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-orange rounded-lg hover:bg-orange-600"
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                        </Link>
                        <Link
                            href={route('timetables.periods.index')}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Link>
                    </div>
                </div>

                {/* Source Info Banner (if auto-generated) */}
                {period.generated_from_blueprint && (
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <Sparkles className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="ml-3 flex-1">
                                <h3 className="text-sm font-medium text-purple-900">Auto-Generated Period</h3>
                                <div className="mt-2 text-sm text-purple-800">
                                    <p>
                                        This period was automatically generated from the blueprint:
                                        <Link
                                            href={`/blueprints/${period.generated_from_blueprint.id}`}
                                            className="font-semibold ml-1 hover:underline inline-flex items-center"
                                        >
                                            {period.generated_from_blueprint.name}
                                            <ExternalLink className="w-3 h-3 ml-1" />
                                        </Link>
                                    </p>
                                    <p className="mt-1 text-xs text-purple-700">
                                        Changes to the blueprint can be synced by regenerating periods from the blueprint page.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Period Info */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Period Information</h3>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm text-gray-600">Period Name</p>
                            <p className="mt-1 text-lg font-medium text-gray-900">{period.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Period Type</p>
                            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${getPeriodTypeColor(period.period_type)}`}>
                                {period.period_type}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Order (Sequence)</p>
                            <p className="mt-1 text-lg font-medium text-gray-900">
                                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-orange text-white font-bold">
                                    {period.order}
                                </span>
                            </p>
                        </div>
                        {period.lesson_number && (
                            <div>
                                <p className="text-sm text-gray-600">Lesson Number</p>
                                <p className="mt-1 text-lg font-medium text-gray-900">
                                    Lesson {period.lesson_number}
                                </p>
                            </div>
                        )}
                        <div>
                            <p className="text-sm text-gray-600">Start Time</p>
                            <p className="mt-1 text-lg font-medium text-gray-900">{period.start_time}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">End Time</p>
                            <p className="mt-1 text-lg font-medium text-gray-900">{period.end_time}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Duration</p>
                            <p className="mt-1 text-lg font-medium text-gray-900">
                                {calculateDuration(period.start_time, period.end_time)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Status</p>
                            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${period.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {period.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Usage Statistics */}
                {period.slots && period.slots.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage in Timetables</h3>
                        <div className="space-y-3">
                            {period.slots.map((slot) => (
                                <div key={slot.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <Calendar className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <p className="font-medium text-gray-900">{slot.template?.name}</p>
                                            <p className="text-sm text-gray-600">
                                                {slot.day_of_week} - {slot.subject?.name}
                                            </p>
                                        </div>
                                    </div>
                                    <Link
                                        href={route('timetables.templates.show', slot.template?.id)}
                                        className="text-orange hover:text-orange-600 text-sm font-medium"
                                    >
                                        View Template
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {(!period.slots || period.slots.length === 0) && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                            This period is not currently used in any timetable templates.
                        </p>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

