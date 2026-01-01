import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { DoorOpen, ArrowLeft, Edit, Calendar, Users } from 'lucide-react';

export default function ShowRoom({ room, auth }) {
    const getRoomTypeColor = (type) => {
        const colors = {
            classroom: 'bg-blue-100 text-blue-800',
            laboratory: 'bg-purple-100 text-purple-800',
            library: 'bg-green-100 text-green-800',
            computer_lab: 'bg-indigo-100 text-indigo-800',
            art_room: 'bg-pink-100 text-pink-800',
            music_room: 'bg-yellow-100 text-yellow-800',
            gymnasium: 'bg-red-100 text-red-800',
            auditorium: 'bg-orange-100 text-orange-800',
            cafeteria: 'bg-teal-100 text-teal-800',
            playground: 'bg-lime-100 text-lime-800',
            other: 'bg-gray-100 text-gray-800',
        };
        return colors[type] || colors.other;
    };

    return (
        <AuthenticatedLayout header="Room Details">
            <Head title={`Room: ${room.code}`} />

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <DoorOpen className="w-8 h-8 text-orange" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Room {room.code}</h2>
                            <p className="text-sm text-gray-600">{room.name || 'Room Details'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('timetables.rooms.edit', room.id)}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-orange rounded-lg hover:bg-orange-600"
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                        </Link>
                        <Link
                            href={route('timetables.rooms.index')}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Link>
                    </div>
                </div>

                {/* Room Info */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Room Information</h3>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm text-gray-600">Room Code</p>
                            <p className="mt-1 text-lg font-medium text-gray-900">{room.code}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Room Name</p>
                            <p className="mt-1 text-lg font-medium text-gray-900">{room.name || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Room Type</p>
                            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${getRoomTypeColor(room.room_type)}`}>
                                {room.room_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Capacity</p>
                            <div className="flex items-center mt-1">
                                <Users className="w-5 h-5 text-gray-400 mr-2" />
                                <p className="text-lg font-medium text-gray-900">{room.capacity} students</p>
                            </div>
                        </div>
                        <div className="col-span-2">
                            <p className="text-sm text-gray-600 mb-2">Facilities</p>
                            {room.facilities && room.facilities.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {room.facilities.map((facility, index) => (
                                        <span
                                            key={index}
                                            className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                                        >
                                            {facility}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 italic">No facilities listed</p>
                            )}
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Status</p>
                            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${room.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {room.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Schedule */}
                {room.slots && room.slots.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Room Schedule</h3>
                        <div className="space-y-3">
                            {room.slots.map((slot) => (
                                <div key={slot.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <Calendar className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {slot.day_of_week} - {slot.period?.start_time} to {slot.period?.end_time}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {slot.subject?.name} - {slot.teacher?.name}
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

                {(!room.slots || room.slots.length === 0) && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                            This room is not currently scheduled in any timetable.
                        </p>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

