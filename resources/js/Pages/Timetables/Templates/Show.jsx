import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Calendar, ArrowLeft, Edit, Plus, Clock, DoorOpen, BookOpen, User, Grid3x3, AlertTriangle } from 'lucide-react';

export default function ShowTimetableTemplate({ template, conflicts, auth }) {
    const getStatusColor = (status) => {
        const colors = {
            draft: 'bg-gray-100 text-gray-800',
            published: 'bg-green-100 text-green-800',
            archived: 'bg-red-100 text-red-800',
        };
        return colors[status] || colors.draft;
    };

    const groupSlotsByDay = (slots) => {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const grouped = {};
        days.forEach(day => {
            grouped[day] = slots.filter(slot => slot.day_of_week === day)
                .sort((a, b) => a.period?.start_time?.localeCompare(b.period?.start_time));
        });
        return grouped;
    };

    const slotsByDay = template.slots ? groupSlotsByDay(template.slots) : {};

    return (
        <AuthenticatedLayout header="Timetable Template Details">
            <Head title={`Template: ${template.name}`} />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Calendar className="w-8 h-8 text-orange" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{template.name}</h2>
                            <p className="text-sm text-gray-600">
                                {template.grade?.name} - {template.academic_term?.name}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('timetables.templates.grid', template.id)}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                        >
                            <Grid3x3 className="w-4 h-4 mr-2" />
                            Grid View
                        </Link>
                        <Link
                            href={route('timetables.templates.edit', template.id)}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-orange rounded-lg hover:bg-orange-600"
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                        </Link>
                        <Link
                            href={route('timetables.templates.index')}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Link>
                    </div>
                </div>

                {/* Conflict Alert */}
                {conflicts && conflicts.length > 0 && (
                    <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                        <div className="flex items-center">
                            <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
                            <div className="flex-1">
                                <h3 className="text-sm font-medium text-red-900">
                                    {conflicts.length} Conflict{conflicts.length > 1 ? 's' : ''} Detected
                                </h3>
                                <p className="text-sm text-red-700 mt-1">
                                    This timetable has scheduling conflicts that need attention.
                                </p>
                            </div>
                            <Link
                                href={route('timetables.templates.grid', template.id)}
                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                            >
                                View & Resolve
                            </Link>
                        </div>
                    </div>
                )}

                {/* Template Info */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="grid grid-cols-4 gap-6">
                        <div>
                            <p className="text-sm text-gray-600">Status</p>
                            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(template.status)}`}>
                                {template.status}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Grade</p>
                            <p className="mt-1 font-medium text-gray-900">{template.grade?.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Academic Term</p>
                            <p className="mt-1 font-medium text-gray-900">{template.academic_term?.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Effective From</p>
                            <p className="mt-1 font-medium text-gray-900">
                                {new Date(template.effective_from).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Timetable Grid */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Weekly Schedule</h3>
                        <Link
                            href={route('timetables.slots.create', { template_id: template.id })}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-orange rounded-lg hover:bg-orange-600"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Slot
                        </Link>
                    </div>

                    <div className="p-6">
                        {Object.keys(slotsByDay).length === 0 || Object.values(slotsByDay).every(slots => slots.length === 0) ? (
                            <div className="text-center py-12">
                                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 mb-4">No timetable slots added yet</p>
                                <Link
                                    href={route('timetables.slots.create', { template_id: template.id })}
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-orange rounded-lg hover:bg-orange-600"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add First Slot
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {Object.entries(slotsByDay).map(([day, slots]) => (
                                    slots.length > 0 && (
                                        <div key={day} className="border border-gray-200 rounded-lg overflow-hidden">
                                            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                                                <h4 className="font-medium text-gray-900 capitalize">{day}</h4>
                                            </div>
                                            <div className="divide-y divide-gray-200">
                                                {slots.map((slot) => (
                                                    <div key={slot.id} className="p-4 hover:bg-gray-50 transition-colors">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-4">
                                                                <div className="flex items-center text-sm text-gray-600">
                                                                    <Clock className="w-4 h-4 mr-1" />
                                                                    {slot.period?.start_time} - {slot.period?.end_time}
                                                                </div>
                                                                <div className="flex items-center text-sm font-medium text-gray-900">
                                                                    <BookOpen className="w-4 h-4 mr-1 text-blue-600" />
                                                                    {slot.subject?.name || 'No Subject'}
                                                                </div>
                                                                <div className="flex items-center text-sm text-gray-600">
                                                                    <User className="w-4 h-4 mr-1 text-green-600" />
                                                                    {slot.teacher?.user?.name || 'No Teacher'}
                                                                </div>
                                                                <div className="flex items-center text-sm text-gray-600">
                                                                    <DoorOpen className="w-4 h-4 mr-1 text-purple-600" />
                                                                    {slot.room?.code || 'No Room'}
                                                                </div>
                                                            </div>
                                                            <Link
                                                                href={route('timetables.slots.edit', slot.id)}
                                                                className="text-orange hover:text-orange-600"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Link>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

