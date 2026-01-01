import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { CalendarCheck, ArrowLeft, Save } from 'lucide-react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

export default function CreateAvailability({ teachers, auth }) {
    const isAdmin = auth.user.role === 'admin';
    
    const { data, setData, post, processing, errors } = useForm({
        teacher_id: isAdmin ? '' : auth.user.id,
        day_of_week: 'monday',
        start_time: '',
        end_time: '',
        availability_type: 'available',
        notes: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('timetables.availability.store'));
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

    const availabilityTypes = [
        { value: 'available', label: 'Available', color: 'green' },
        { value: 'unavailable', label: 'Unavailable', color: 'red' },
        { value: 'preferred', label: 'Preferred', color: 'blue' },
    ];

    return (
        <AuthenticatedLayout header="Create Availability">
            <Head title="Create Availability" />

            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <CalendarCheck className="w-8 h-8 text-orange" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Create Availability</h2>
                            <p className="text-sm text-gray-600">Set teacher availability for scheduling</p>
                        </div>
                    </div>
                    <Link
                        href={route('timetables.availability.index')}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Link>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {isAdmin && (
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
                                            {teacher.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.teacher_id} className="mt-2" />
                            </div>
                        )}

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

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="start_time" value="Start Time *" />
                                <TextInput
                                    id="start_time"
                                    type="time"
                                    value={data.start_time}
                                    onChange={(e) => setData('start_time', e.target.value)}
                                    className="mt-1 block w-full"
                                />
                                <InputError message={errors.start_time} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="end_time" value="End Time *" />
                                <TextInput
                                    id="end_time"
                                    type="time"
                                    value={data.end_time}
                                    onChange={(e) => setData('end_time', e.target.value)}
                                    className="mt-1 block w-full"
                                />
                                <InputError message={errors.end_time} className="mt-2" />
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="availability_type" value="Availability Type *" />
                            <select
                                id="availability_type"
                                value={data.availability_type}
                                onChange={(e) => setData('availability_type', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:border-orange focus:ring focus:ring-orange focus:ring-opacity-50"
                            >
                                {availabilityTypes.map((type) => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                            <InputError message={errors.availability_type} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="notes" value="Notes" />
                            <textarea
                                id="notes"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:border-orange focus:ring focus:ring-orange focus:ring-opacity-50"
                                rows="3"
                                placeholder="Optional notes about this availability"
                            />
                            <InputError message={errors.notes} className="mt-2" />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                            <Link
                                href={route('timetables.availability.index')}
                                className="inline-flex items-center px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </Link>
                            <PrimaryButton disabled={processing} className="inline-flex items-center">
                                <Save className="w-4 h-4 mr-2" />
                                {processing ? 'Creating...' : 'Create Availability'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

