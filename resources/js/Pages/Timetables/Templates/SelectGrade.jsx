import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Calendar, ArrowLeft, ChevronRight } from 'lucide-react';

export default function SelectGrade({ grades, auth }) {
    return (
        <AuthenticatedLayout header="Create Timetable Template">
            <Head title="Select Grade - Create Timetable Template" />

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Calendar className="w-8 h-8 text-orange" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Create Timetable Template</h2>
                            <p className="text-sm text-gray-600">
                                Step 1: Select a grade to create a timetable template
                            </p>
                        </div>
                    </div>
                    <Link
                        href={route('timetables.templates.index')}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Link>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-blue-900 mb-2">How it works</h3>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                        <li>Select a grade to create a timetable template for</li>
                        <li>If the grade has streams, you'll be able to select which stream to create the template for</li>
                        <li>Each stream can have its own timetable with different teachers and rooms</li>
                    </ul>
                </div>

                {/* Grades List */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Grade</h3>
                        
                        {grades.length === 0 ? (
                            <div className="text-center py-12">
                                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-500">No active grades found</p>
                                <p className="text-sm text-gray-400 mt-1">
                                    Please create grades first before creating timetable templates
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {grades.map((grade) => (
                                    <Link
                                        key={grade.id}
                                        href={route('timetables.templates.select-stream', grade.id)}
                                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-orange hover:bg-orange-50 transition-all group"
                                    >
                                        <div>
                                            <h4 className="font-semibold text-gray-900 group-hover:text-orange">
                                                {grade.name}
                                            </h4>
                                            {grade.stream && (
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Stream: {grade.stream.name}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-1">
                                                Level {grade.level || 'N/A'}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange" />
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Help Text */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Need Help?</h3>
                    <p className="text-sm text-gray-600">
                        After selecting a grade, you'll be able to choose which stream (if any) to create the template for.
                        Each stream can have its own unique timetable with different teachers and rooms.
                    </p>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

