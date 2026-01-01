import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Calendar, Clock, BookOpen, School, MapPin, User } from 'lucide-react';

export default function MyTimetable({ timetable, stats, teacher }) {
    const days = [
        { key: 'monday', label: 'Monday' },
        { key: 'tuesday', label: 'Tuesday' },
        { key: 'wednesday', label: 'Wednesday' },
        { key: 'thursday', label: 'Thursday' },
        { key: 'friday', label: 'Friday' },
        { key: 'saturday', label: 'Saturday' },
        { key: 'sunday', label: 'Sunday' },
    ];

    // Format time from ISO string or HH:MM:SS to user-friendly format (e.g., "7:50 AM")
    const formatTime = (timeString) => {
        if (!timeString) return '';

        // Handle ISO timestamp format (2025-12-31T07:50:00.000000Z)
        if (timeString.includes('T')) {
            const date = new Date(timeString);
            return date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        }

        // Handle HH:MM:SS format
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours, 10);
        const minute = minutes || '00';
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

        return `${displayHour}:${minute} ${period}`;
    };

    const getSubjectColor = (category) => {
        const colors = {
            academic: 'bg-blue-100 text-blue-800 border-blue-300',
            islamic: 'bg-green-100 text-green-800 border-green-300',
            extracurricular: 'bg-purple-100 text-purple-800 border-purple-300',
        };
        return colors[category] || 'bg-gray-100 text-gray-800 border-gray-300';
    };

    return (
        <AuthenticatedLayout header="My Timetable">
            <Head title="My Timetable" />

            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">My Teaching Schedule</h2>
                            <p className="text-indigo-100">
                                <User className="w-4 h-4 inline mr-1" />
                                {teacher.name} {teacher.employee_id && `(${teacher.employee_id})`}
                            </p>
                        </div>
                        <Calendar className="w-16 h-16 opacity-50" />
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Lessons Per Week</p>
                                <p className="text-3xl font-bold text-indigo-600">{stats.total_lessons_per_week}</p>
                            </div>
                            <div className="bg-indigo-100 rounded-full p-3">
                                <Clock className="w-6 h-6 text-indigo-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Subjects Teaching</p>
                                <p className="text-3xl font-bold text-green-600">{stats.subjects_teaching}</p>
                            </div>
                            <div className="bg-green-100 rounded-full p-3">
                                <BookOpen className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Grades Teaching</p>
                                <p className="text-3xl font-bold text-purple-600">{stats.grades_teaching}</p>
                            </div>
                            <div className="bg-purple-100 rounded-full p-3">
                                <School className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Weekly Timetable */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center">
                            <Calendar className="w-6 h-6 mr-2 text-indigo-600" />
                            Weekly Schedule
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">Your assigned lessons for the week</p>
                    </div>

                    <div className="p-6">
                        {days.map((day) => {
                            const daySlots = timetable[day.key] || [];
                            
                            if (daySlots.length === 0) {
                                return null; // Skip days with no lessons
                            }

                            return (
                                <div key={day.key} className="mb-6 last:mb-0">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                        <div className="w-2 h-2 rounded-full bg-indigo-600 mr-2"></div>
                                        {day.label}
                                        <span className="ml-2 text-sm font-normal text-gray-500">
                                            ({daySlots.length} lesson{daySlots.length !== 1 ? 's' : ''})
                                        </span>
                                    </h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {daySlots.map((slot) => (
                                            <div
                                                key={slot.id}
                                                className={`border-2 rounded-lg p-4 hover:shadow-md transition-shadow ${getSubjectColor(slot.subject.category)}`}
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <h5 className="font-semibold text-sm mb-1">
                                                            {slot.subject.name}
                                                        </h5>
                                                        <p className="text-xs opacity-75">
                                                            {slot.subject.code}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs font-medium px-2 py-1 bg-white bg-opacity-50 rounded">
                                                        {slot.grade.name}
                                                    </span>
                                                </div>

                                                <div className="space-y-1 text-xs">
                                                    <div className="flex items-center">
                                                        <Clock className="w-3 h-3 mr-1.5" />
                                                        <span className="font-medium">
                                                            {formatTime(slot.period.start_time)} - {formatTime(slot.period.end_time)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center text-xs opacity-75">
                                                        <span className="ml-4">{slot.period.name}</span>
                                                    </div>
                                                    {slot.room && (
                                                        <div className="flex items-center">
                                                            <MapPin className="w-3 h-3 mr-1.5" />
                                                            <span>{slot.room.name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        {/* No lessons message */}
                        {days.every(day => (timetable[day.key] || []).length === 0) && (
                            <div className="text-center py-12">
                                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">No lessons assigned yet</p>
                                <p className="text-gray-400 text-sm mt-2">
                                    Contact your administrator if you believe this is an error
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

