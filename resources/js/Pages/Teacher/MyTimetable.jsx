import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Clock, BookOpen, DoorOpen, Calendar, TrendingUp, Award, User } from 'lucide-react';

export default function MyTimetable({ auth, timetable, teacher, stats, todayLessons, upcomingLessons, currentDay }) {
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    
    const getDayLabel = (day) => {
        return day.charAt(0).toUpperCase() + day.slice(1);
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                            My Teaching Schedule
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Teacher: {teacher.name}
                            {teacher.subject_specialization && ` • ${teacher.subject_specialization}`}
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="My Timetable" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Lessons per Week</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total_lessons_per_week}</p>
                                </div>
                                <Calendar className="w-10 h-10 text-blue-500" />
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Subjects Teaching</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.subjects_teaching}</p>
                                </div>
                                <BookOpen className="w-10 h-10 text-green-500" />
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Grades Teaching</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.grades_teaching}</p>
                                </div>
                                <Award className="w-10 h-10 text-purple-500" />
                            </div>
                        </div>
                    </div>

                    {/* Today's School Schedule */}
                    {todayLessons && todayLessons.length > 0 && (
                        <div className="bg-white rounded-lg shadow mb-6 p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-1 flex items-center">
                                <Clock className="w-5 h-5 mr-2 text-orange" />
                                Today's School Schedule ({getDayLabel(currentDay)})
                            </h3>
                            <p className="text-xs text-gray-500 mb-4">All lessons across the school today. Your own lessons are highlighted.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {todayLessons.map((lesson) => (
                                    <div
                                        key={lesson.id}
                                        className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                                            lesson.is_mine
                                                ? 'border-orange bg-orange-50'
                                                : 'border-gray-200'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center text-sm font-semibold text-gray-900">
                                                <BookOpen className="w-4 h-4 mr-2 text-blue-600" />
                                                {lesson.subject?.name}
                                            </div>
                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                {lesson.grade?.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600 mb-1">
                                            <Clock className="w-3 h-3 mr-2" />
                                            {lesson.start_time || lesson.period?.start_time} - {lesson.end_time || lesson.period?.end_time}
                                        </div>
                                        {lesson.teacher && (
                                            <div className="flex items-center text-sm text-gray-600 mb-1">
                                                <User className="w-3 h-3 mr-2" />
                                                {lesson.teacher.name}
                                                {lesson.is_mine && (
                                                    <span className="ml-1 text-xs font-medium text-orange">(you)</span>
                                                )}
                                            </div>
                                        )}
                                        {lesson.room && (
                                            <div className="flex items-center text-sm text-gray-600">
                                                <DoorOpen className="w-3 h-3 mr-2" />
                                                Room {lesson.room.room_number}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Full Timetable by Grade */}
                    <div className="space-y-6">
                        {Object.keys(timetable).length === 0 ? (
                            <div className="bg-white rounded-lg shadow p-8 text-center">
                                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Timetable Assigned</h3>
                                <p className="text-gray-600">You don't have any published timetable assignments yet.</p>
                            </div>
                        ) : (
                            Object.entries(timetable).map(([gradeName, days]) => (
                                <div key={gradeName} className="bg-white rounded-lg shadow overflow-hidden">
                                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                                        <h3 className="text-lg font-semibold text-white flex items-center">
                                            <Award className="w-5 h-5 mr-2" />
                                            {gradeName}
                                        </h3>
                                    </div>
                                    
                                    <div className="p-6">
                                        {daysOfWeek.map((day) => {
                                            const dayLessons = days[day] || [];
                                            
                                            if (dayLessons.length === 0) return null;
                                            
                                            return (
                                                <div key={day} className="mb-6 last:mb-0">
                                                    <h4 className="text-md font-semibold text-gray-700 mb-3 capitalize border-b pb-2">
                                                        {getDayLabel(day)}
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {dayLessons.map((lesson) => (
                                                            <div key={lesson.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                                <div className="flex items-center space-x-4 flex-1">
                                                                    <div className="flex items-center text-sm font-medium text-gray-600 min-w-[100px]">
                                                                        <Clock className="w-4 h-4 mr-2 text-gray-500" />
                                                                        {lesson.start_time || lesson.period?.start_time}
                                                                    </div>
                                                                    <div className="flex items-center text-sm font-semibold text-gray-900">
                                                                        <BookOpen className="w-4 h-4 mr-2 text-blue-600" />
                                                                        {lesson.subject.name}
                                                                    </div>
                                                                </div>
                                                                {lesson.room && (
                                                                    <div className="flex items-center text-sm text-gray-600">
                                                                        <DoorOpen className="w-4 h-4 mr-2" />
                                                                        Room {lesson.room.room_number}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

