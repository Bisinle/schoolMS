import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Calendar, ArrowLeft, ChevronRight, Plus } from 'lucide-react';

export default function SelectStream({ grade, streams, existingTemplates, auth }) {
    return (
        <AuthenticatedLayout header="Select Stream">
            <Head title={`Select Stream - ${grade.name}`} />

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Calendar className="w-8 h-8 text-orange" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Create Timetable Template</h2>
                            <p className="text-sm text-gray-600">
                                Step 2: Select stream for {grade.name}
                            </p>
                        </div>
                    </div>
                    <Link
                        href={route('timetables.templates.create')}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Link>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-blue-900 mb-2">Stream-Based Timetables</h3>
                    <p className="text-sm text-blue-800">
                        Each stream can have its own timetable template with different teachers, rooms, and schedules.
                        You can also create a template without a stream if this grade doesn't use streams.
                    </p>
                </div>

                {/* No Stream Option */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Without Stream</h3>
                        
                        <Link
                            href={route('timetables.templates.create-with-stream', grade.id)}
                            className="flex items-center justify-between p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange hover:bg-orange-50 transition-all group"
                        >
                            <div>
                                <h4 className="font-semibold text-gray-900 group-hover:text-orange">
                                    {grade.name} (No Stream)
                                </h4>
                                <p className="text-sm text-gray-500 mt-1">
                                    Create a timetable template without assigning a specific stream
                                </p>
                            </div>
                            <Plus className="w-5 h-5 text-gray-400 group-hover:text-orange" />
                        </Link>
                    </div>
                </div>

                {/* Streams List */}
                {streams.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Stream</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {streams.map((stream) => {
                                    const templatesForStream = existingTemplates[stream.id] || [];
                                    
                                    return (
                                        <Link
                                            key={stream.id}
                                            href={route('timetables.templates.create-with-stream', {
                                                grade: grade.id,
                                                stream_id: stream.id
                                            })}
                                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-orange hover:bg-orange-50 transition-all group"
                                        >
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900 group-hover:text-orange">
                                                    {grade.name} {stream.name}
                                                </h4>
                                                {stream.code && (
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Code: {stream.code}
                                                    </p>
                                                )}
                                                {templatesForStream.length > 0 && (
                                                    <p className="text-xs text-blue-600 mt-1">
                                                        {templatesForStream.length} existing template{templatesForStream.length > 1 ? 's' : ''}
                                                    </p>
                                                )}
                                            </div>
                                            <Plus className="w-5 h-5 text-gray-400 group-hover:text-orange" />
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {streams.length === 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-yellow-900 mb-2">No Streams Available</h3>
                        <p className="text-sm text-yellow-800">
                            No active streams found for this school. You can create a template without a stream,
                            or create streams first in the Streams management section.
                        </p>
                    </div>
                )}

                {/* Help Text */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">What's Next?</h3>
                    <p className="text-sm text-gray-600">
                        After selecting a stream (or choosing no stream), you'll be able to configure the timetable template
                        with specific academic terms, periods, and other settings.
                    </p>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

