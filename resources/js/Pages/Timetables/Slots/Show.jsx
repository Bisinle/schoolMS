import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Grid3x3, ArrowLeft, Edit, Calendar, Clock, User, BookOpen, DoorOpen, FileText } from 'lucide-react';

export default function ShowSlot({ slot, auth }) {
    const getSubjectColor = (subjectName) => {
        const colors = [
            'bg-blue-100 text-blue-800',
            'bg-green-100 text-green-800',
            'bg-purple-100 text-purple-800',
            'bg-pink-100 text-pink-800',
            'bg-yellow-100 text-yellow-800',
            'bg-indigo-100 text-indigo-800',
        ];
        if (!subjectName) return 'bg-gray-100 text-gray-800';
        const hash = subjectName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    };

    return (
        <AuthenticatedLayout header="Slot Details">
            <Head title="Slot Details" />

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Grid3x3 className="w-8 h-8 text-orange" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Timetable Slot Details</h2>
                            <p className="text-sm text-gray-600">View slot information</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('timetables.slots.edit', slot.id)}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-orange rounded-lg hover:bg-orange-600"
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                        </Link>
                        <Link
                            href={route('timetables.slots.index')}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Link>
                    </div>
                </div>

                {/* Slot Info */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Slot Information</h3>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm text-gray-600">Template</p>
                            <div className="flex items-center mt-1">
                                <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                                <p className="text-lg font-medium text-gray-900">
                                    {slot.timetable_template?.name || 'N/A'}
                                </p>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Day of Week</p>
                            <div className="flex items-center mt-1">
                                <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                                <p className="text-lg font-medium text-gray-900 capitalize">
                                    {slot.day_of_week}
                                </p>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Period</p>
                            <div className="flex items-center mt-1">
                                <Clock className="w-5 h-5 text-gray-400 mr-2" />
                                <div>
                                    <p className="text-lg font-medium text-gray-900">
                                        {slot.period?.name || 'N/A'}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {slot.period?.start_time} - {slot.period?.end_time}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Subject</p>
                            <div className="mt-1">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSubjectColor(slot.subject?.name)}`}>
                                    <BookOpen className="w-4 h-4 mr-2" />
                                    {slot.subject?.name || 'No Subject'}
                                </span>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Teacher</p>
                            <div className="flex items-center mt-1">
                                <User className="w-5 h-5 text-gray-400 mr-2" />
                                <p className="text-lg font-medium text-gray-900">
                                    {slot.teacher?.name || 'No Teacher'}
                                </p>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Room</p>
                            <div className="flex items-center mt-1">
                                <DoorOpen className="w-5 h-5 text-gray-400 mr-2" />
                                <p className="text-lg font-medium text-gray-900">
                                    {slot.room?.name || slot.room?.code || 'No Room'}
                                </p>
                            </div>
                        </div>
                        {slot.topic && (
                            <div className="col-span-2">
                                <p className="text-sm text-gray-600">Topic</p>
                                <div className="flex items-center mt-1">
                                    <FileText className="w-5 h-5 text-gray-400 mr-2" />
                                    <p className="text-gray-900">{slot.topic}</p>
                                </div>
                            </div>
                        )}
                        {slot.notes && (
                            <div className="col-span-2">
                                <p className="text-sm text-gray-600">Notes</p>
                                <p className="mt-1 text-gray-900">{slot.notes}</p>
                            </div>
                        )}
                        {slot.is_substitution && (
                            <div className="col-span-2">
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <p className="text-sm font-medium text-yellow-800">
                                        ⚠️ This is a substitution slot
                                    </p>
                                    {slot.original_teacher && (
                                        <p className="text-sm text-yellow-700 mt-1">
                                            Original Teacher: {slot.original_teacher.name}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Summary Card */}
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-orange-900 mb-2">Slot Summary</h3>
                    <p className="text-orange-800">
                        <span className="font-medium capitalize">{slot.day_of_week}</span> at{' '}
                        <span className="font-medium">{slot.period?.name}</span> ({slot.period?.start_time} - {slot.period?.end_time})
                        {' - '}
                        <span className="font-medium">{slot.subject?.name || 'No Subject'}</span> with{' '}
                        <span className="font-medium">{slot.teacher?.name || 'No Teacher'}</span>
                        {slot.room && (
                            <>
                                {' '}in <span className="font-medium">{slot.room.name || slot.room.code}</span>
                            </>
                        )}
                    </p>
                </div>

                {/* Metadata */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-gray-600">Created</p>
                            <p className="text-gray-900 font-medium">
                                {new Date(slot.created_at).toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-600">Last Updated</p>
                            <p className="text-gray-900 font-medium">
                                {new Date(slot.updated_at).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

