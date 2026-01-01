import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link, usePage } from '@inertiajs/react';
import { Clock, ArrowLeft, Save, Info, AlertCircle, AlertTriangle } from 'lucide-react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

export default function EditPeriod({ period, auth, gradeLevels = [] }) {
    const { errors: pageErrors, flash } = usePage().props;
    const { data, setData, put, processing, errors } = useForm({
        name: period.name || '',
        grade_level: period.grade_level || 'ECD',
        order: period.order || '',
        period_number: period.period_number || '',
        lesson_number: period.lesson_number || '',
        period_type: period.period_type || 'lesson',
        start_time: period.start_time || '',
        end_time: period.end_time || '',
        description: period.description || '',
        color_code: period.color_code || '#3B82F6',
        is_active: period.is_active ?? true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('timetables.periods.update', period.id));
    };

    const periodTypes = [
        { value: 'lesson', label: 'Lesson' },
        { value: 'break', label: 'Break' },
        { value: 'lunch', label: 'Lunch' },
        { value: 'assembly', label: 'Assembly' },
        { value: 'activity', label: 'Activity' },
        { value: 'study', label: 'Study' },
        { value: 'other', label: 'Other' },
    ];

    return (
        <AuthenticatedLayout header="Edit Time Block">
            <Head title="Edit Time Block" />

            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Clock className="w-8 h-8 text-orange" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Edit Time Block</h2>
                            <p className="text-sm text-gray-600">Update time block: {period.name}</p>
                        </div>
                    </div>
                    <Link
                        href={route('timetables.periods.index')}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Link>
                </div>

                {/* Error Messages */}
                {pageErrors?.error && (
                    <div className={`border-l-4 p-4 rounded-r-lg ${flash?.warning ? 'bg-yellow-50 border-yellow-500' : 'bg-red-50 border-red-500'}`}>
                        <div className="flex items-start">
                            {flash?.warning ? (
                                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                            ) : (
                                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="ml-3">
                                <p className={`text-sm font-medium ${flash?.warning ? 'text-yellow-800' : 'text-red-800'}`}>
                                    {pageErrors.error}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Info Box */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                    <div className="flex items-start">
                        <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">Atomic Time Blocks</h3>
                            <div className="mt-2 text-sm text-blue-700">
                                <p className="mb-2">Flexible time blocks for your school day:</p>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                    <li><strong>Order</strong>: Chronological position (1, 2, 3...) - must be unique</li>
                                    <li><strong>Lesson Number</strong>: Only for lesson periods (keeps lesson count consistent)</li>
                                    <li>Breaks, prayers, and activities don't need a lesson number</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="name" value="Period Name *" />
                                <TextInput
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="mt-1 block w-full"
                                    required
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="grade_level" value="Grade Level *" />
                                <select
                                    id="grade_level"
                                    value={data.grade_level}
                                    onChange={(e) => setData('grade_level', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:border-orange focus:ring focus:ring-orange focus:ring-opacity-50"
                                    required
                                >
                                    {gradeLevels.map((level) => (
                                        <option key={level} value={level}>{level}</option>
                                    ))}
                                </select>
                                <p className="mt-1 text-xs text-gray-500">
                                    Which grade level this period applies to
                                </p>
                                <InputError message={errors.grade_level} className="mt-2" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="order" value="Order (Sequence) *" />
                                <TextInput
                                    id="order"
                                    type="number"
                                    value={data.order}
                                    onChange={(e) => setData('order', e.target.value)}
                                    className="mt-1 block w-full"
                                    min="1"
                                    required
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Chronological position in the school day (must be unique per grade level)
                                </p>
                                <InputError message={errors.order} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="lesson_number" value="Lesson Number (Optional)" />
                                <TextInput
                                    id="lesson_number"
                                    type="number"
                                    value={data.lesson_number}
                                    onChange={(e) => setData('lesson_number', e.target.value)}
                                    className="mt-1 block w-full"
                                    min="1"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    For lesson periods only (e.g., "Period 1", "Period 2")
                                </p>
                                <InputError message={errors.lesson_number} className="mt-2" />
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="period_type" value="Period Type *" />
                            <select
                                id="period_type"
                                value={data.period_type}
                                onChange={(e) => setData('period_type', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:border-orange focus:ring focus:ring-orange focus:ring-opacity-50"
                            >
                                {periodTypes.map((type) => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                            <InputError message={errors.period_type} className="mt-2" />
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
                            <InputLabel htmlFor="description" value="Description" />
                            <textarea
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:border-orange focus:ring focus:ring-orange focus:ring-opacity-50"
                                rows="3"
                            />
                            <InputError message={errors.description} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="color_code" value="Color Code" />
                            <div className="flex items-center gap-3 mt-1">
                                <input
                                    id="color_code"
                                    type="color"
                                    value={data.color_code}
                                    onChange={(e) => setData('color_code', e.target.value)}
                                    className="h-10 w-20 border-gray-300 rounded-lg cursor-pointer"
                                />
                                <TextInput
                                    type="text"
                                    value={data.color_code}
                                    onChange={(e) => setData('color_code', e.target.value)}
                                    className="flex-1"
                                    placeholder="#3B82F6"
                                />
                            </div>
                            <InputError message={errors.color_code} className="mt-2" />
                        </div>

                        <div className="flex items-center">
                            <input
                                id="is_active"
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="w-4 h-4 text-orange border-gray-300 rounded focus:ring-orange"
                            />
                            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                                Active (available for scheduling)
                            </label>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                            <Link
                                href={route('timetables.periods.index')}
                                className="inline-flex items-center px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </Link>
                            <PrimaryButton disabled={processing} className="inline-flex items-center">
                                <Save className="w-4 h-4 mr-2" />
                                {processing ? 'Saving...' : 'Save Changes'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
