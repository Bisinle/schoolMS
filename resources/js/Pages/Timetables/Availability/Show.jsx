import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { CalendarCheck, ArrowLeft, Edit, User, Clock, Calendar } from 'lucide-react';

export default function ShowAvailability({ availability, auth }) {
    const getAvailabilityTypeColor = (type) => {
        const colors = {
            available: 'bg-green-100 text-green-800',
            unavailable: 'bg-red-100 text-red-800',
            preferred: 'bg-blue-100 text-blue-800',
        };
        return colors[type] || colors.available;
    };

    const calculateDuration = (start, end) => {
        const startTime = new Date(`2000-01-01 ${start}`);
        const endTime = new Date(`2000-01-01 ${end}`);
        const diff = (endTime - startTime) / 1000 / 60; // minutes
        return `${diff} minutes`;
    };

    return (
        <AuthenticatedLayout header="Availability Details">
            <Head title="Availability Details" />

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <CalendarCheck className="w-8 h-8 text-orange" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Availability Details</h2>
                            <p className="text-sm text-gray-600">Teacher availability information</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('timetables.availability.edit', availability.id)}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-orange rounded-lg hover:bg-orange-600"
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                        </Link>
                        <Link
                            href={route('timetables.availability.index')}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Link>
                    </div>
                </div>

                {/* Availability Info */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Availability Information</h3>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm text-gray-600">Teacher</p>
                            <div className="flex items-center mt-1">
                                <User className="w-5 h-5 text-gray-400 mr-2" />
                                <p className="text-lg font-medium text-gray-900">{availability.teacher?.name}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Availability Type</p>
                            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${getAvailabilityTypeColor(availability.availability_type)}`}>
                                {availability.availability_type}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Day of Week</p>
                            <div className="flex items-center mt-1">
                                <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                                <p className="text-lg font-medium text-gray-900 capitalize">{availability.day_of_week}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Time Range</p>
                            <div className="flex items-center mt-1">
                                <Clock className="w-5 h-5 text-gray-400 mr-2" />
                                <p className="text-lg font-medium text-gray-900">
                                    {availability.start_time} - {availability.end_time}
                                </p>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Duration</p>
                            <p className="mt-1 text-lg font-medium text-gray-900">
                                {calculateDuration(availability.start_time, availability.end_time)}
                            </p>
                        </div>
                        {availability.notes && (
                            <div className="col-span-2">
                                <p className="text-sm text-gray-600">Notes</p>
                                <p className="mt-1 text-gray-900">{availability.notes}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Box */}
                <div className={`border rounded-lg p-4 ${
                    availability.availability_type === 'available' ? 'bg-green-50 border-green-200' :
                    availability.availability_type === 'unavailable' ? 'bg-red-50 border-red-200' :
                    'bg-blue-50 border-blue-200'
                }`}>
                    <p className={`text-sm ${
                        availability.availability_type === 'available' ? 'text-green-800' :
                        availability.availability_type === 'unavailable' ? 'text-red-800' :
                        'text-blue-800'
                    }`}>
                        {availability.availability_type === 'available' && 
                            `${availability.teacher?.name} is available on ${availability.day_of_week}s from ${availability.start_time} to ${availability.end_time}.`
                        }
                        {availability.availability_type === 'unavailable' && 
                            `${availability.teacher?.name} is not available on ${availability.day_of_week}s from ${availability.start_time} to ${availability.end_time}.`
                        }
                        {availability.availability_type === 'preferred' && 
                            `${availability.teacher?.name} prefers to teach on ${availability.day_of_week}s from ${availability.start_time} to ${availability.end_time}.`
                        }
                    </p>
                </div>

                {/* Metadata */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-gray-600">Created</p>
                            <p className="text-gray-900 font-medium">
                                {new Date(availability.created_at).toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-600">Last Updated</p>
                            <p className="text-gray-900 font-medium">
                                {new Date(availability.updated_at).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

