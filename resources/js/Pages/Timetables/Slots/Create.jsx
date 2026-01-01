import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { Calendar, ArrowLeft, Save } from 'lucide-react';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

export default function CreateSlot({ template, periods, subjects, teachers, rooms, defaultRoomId, classTeacherId, slotTypes, auth }) {
    const { data, setData, post, processing, errors } = useForm({
        timetable_template_id: template?.id || '',
        timetable_period_id: '',
        day_of_week: 'monday',
        slot_type: 'lesson',
        subject_id: '',
        teacher_id: classTeacherId || '',
        room_id: defaultRoomId || '',
        topic: '',
        notes: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('timetables.slots.store'));
    };

    const daysOfWeek = [
        { value: 'monday', label: 'Monday' },
        { value: 'tuesday', label: 'Tuesday' },
        { value: 'wednesday', label: 'Wednesday' },
        { value: 'thursday', label: 'Thursday' },
        { value: 'friday', label: 'Friday' },
        { value: 'saturday', label: 'Saturday' },
        { value: 'sunday', label: 'Sunday' },
    ];

    return (
        <AuthenticatedLayout header="Create Timetable Slot">
            <Head title="Create Timetable Slot" />

            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Calendar className="w-8 h-8 text-orange" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Create Timetable Slot</h2>
                            <p className="text-sm text-gray-600">
                                {template?.name ? `Add a new slot to ${template.name}` : 'Add a new timetable slot'}
                            </p>
                        </div>
                    </div>
                    {template?.id && (
                        <Link
                            href={route('timetables.templates.show', template.id)}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Link>
                    )}
                    {!template?.id && (
                        <Link
                            href={route('timetables.templates.index')}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Templates
                        </Link>
                    )}
                </div>

                {!template && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800">
                            <strong>Note:</strong> To create a slot, please select a template from the{' '}
                            <Link href={route('timetables.templates.index')} className="underline font-medium">
                                templates page
                            </Link>
                            {' '}and click "Add Slot" from the template details.
                        </p>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div>
                            <InputLabel htmlFor="slot_type" value="Slot Type *" />
                            <select
                                id="slot_type"
                                value={data.slot_type}
                                onChange={(e) => setData('slot_type', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:border-orange focus:ring focus:ring-orange focus:ring-opacity-50"
                            >
                                {slotTypes.map((type) => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                            <InputError message={errors.slot_type} className="mt-2" />
                            <p className="mt-1 text-sm text-gray-500">
                                {data.slot_type === 'lesson'
                                    ? 'Academic lesson - requires subject and teacher'
                                    : 'Non-academic time block - no subject or teacher required'}
                            </p>
                        </div>

                        <div>
                            <InputLabel htmlFor="day_of_week" value="Day of Week *" />
                            <select
                                id="day_of_week"
                                value={data.day_of_week}
                                onChange={(e) => setData('day_of_week', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:border-orange focus:ring focus:ring-orange focus:ring-opacity-50"
                            >
                                {daysOfWeek.map((day) => (
                                    <option key={day.value} value={day.value}>{day.label}</option>
                                ))}
                            </select>
                            <InputError message={errors.day_of_week} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="timetable_period_id" value="Period *" />
                            <select
                                id="timetable_period_id"
                                value={data.timetable_period_id}
                                onChange={(e) => setData('timetable_period_id', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:border-orange focus:ring focus:ring-orange focus:ring-opacity-50"
                            >
                                <option value="">Select a period</option>
                                {periods.map((period) => (
                                    <option key={period.id} value={period.id}>
                                        {period.name} ({period.start_time} - {period.end_time})
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.timetable_period_id} className="mt-2" />
                        </div>

                        {/* Only show subject and teacher fields for lessons */}
                        {data.slot_type === 'lesson' && (
                            <>
                                <div>
                                    <InputLabel htmlFor="subject_id" value="Subject *" />
                                    <select
                                        id="subject_id"
                                        value={data.subject_id}
                                        onChange={(e) => setData('subject_id', e.target.value)}
                                        className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:border-orange focus:ring focus:ring-orange focus:ring-opacity-50"
                                    >
                                        <option value="">Select a subject</option>
                                        {subjects.map((subject) => (
                                            <option key={subject.id} value={subject.id}>
                                                {subject.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.subject_id} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="teacher_id" value="Teacher *" />
                                    <select
                                        id="teacher_id"
                                        value={data.teacher_id}
                                        onChange={(e) => setData('teacher_id', e.target.value)}
                                        className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:border-orange focus:ring focus:ring-orange focus:ring-opacity-50"
                                    >
                                        <option value="">Select a teacher</option>
                                        {teachers.map((teacher) => (
                                            <option key={teacher.id} value={teacher.id}>
                                                {teacher.name}{teacher.is_class_teacher ? ' (Class Teacher)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.teacher_id} className="mt-2" />
                                    {classTeacherId && data.teacher_id === classTeacherId && (
                                        <p className="mt-1 text-sm text-green-600">
                                            ✓ Pre-filled with grade's class teacher
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <InputLabel htmlFor="topic" value="Topic (Optional)" />
                                    <input
                                        type="text"
                                        id="topic"
                                        value={data.topic}
                                        onChange={(e) => setData('topic', e.target.value)}
                                        className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:border-orange focus:ring focus:ring-orange focus:ring-opacity-50"
                                        placeholder="e.g., Introduction to Algebra"
                                    />
                                    <InputError message={errors.topic} className="mt-2" />
                                </div>
                            </>
                        )}

                        <div>
                            <InputLabel htmlFor="room_id" value="Classroom" />
                            {defaultRoomId && rooms.length === 1 ? (
                                // If grade has a default room, show it as read-only
                                <div className="mt-1">
                                    <div className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                                        {rooms[0].code} - {rooms[0].name} {rooms[0].capacity ? `(Capacity: ${rooms[0].capacity})` : ''}
                                    </div>
                                    <p className="mt-1 text-sm text-blue-600">
                                        ℹ️ This grade's assigned classroom (fixed)
                                    </p>
                                </div>
                            ) : (
                                // Otherwise show dropdown for all rooms
                                <>
                                    <select
                                        id="room_id"
                                        value={data.room_id}
                                        onChange={(e) => setData('room_id', e.target.value)}
                                        className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:border-orange focus:ring focus:ring-orange focus:ring-opacity-50"
                                    >
                                        <option value="">Select a room (optional)</option>
                                        {rooms.map((room) => (
                                            <option key={room.id} value={room.id}>
                                                {room.code} - {room.name} {room.capacity ? `(Capacity: ${room.capacity})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.room_id} className="mt-2" />
                                </>
                            )}
                        </div>

                        <div>
                            <InputLabel htmlFor="notes" value="Notes (Optional)" />
                            <textarea
                                id="notes"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                rows="3"
                                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:border-orange focus:ring focus:ring-orange focus:ring-opacity-50"
                                placeholder="Additional notes about this slot..."
                            />
                            <InputError message={errors.notes} className="mt-2" />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                            {template?.id ? (
                                <Link
                                    href={route('timetables.templates.show', template.id)}
                                    className="inline-flex items-center px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </Link>
                            ) : (
                                <Link
                                    href={route('timetables.templates.index')}
                                    className="inline-flex items-center px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </Link>
                            )}
                            <PrimaryButton disabled={processing} className="inline-flex items-center">
                                <Save className="w-4 h-4 mr-2" />
                                {processing ? 'Creating...' : 'Create Slot'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

