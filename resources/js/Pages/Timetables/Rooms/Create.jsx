import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { DoorOpen, ArrowLeft, Save } from 'lucide-react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import { useState } from 'react';

export default function CreateRoom({ auth }) {
    const { data, setData, post, processing, errors } = useForm({
        code: '',
        name: '',
        room_type: 'classroom',
        capacity: '',
        building: '',
        floor: '',
        facilities: [],
        is_active: true,
    });

    const [facilityInput, setFacilityInput] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('timetables.rooms.store'));
    };

    const roomTypes = [
        'classroom', 'laboratory', 'library', 'computer_lab', 'art_room',
        'music_room', 'gymnasium', 'auditorium', 'cafeteria', 'playground', 'other'
    ];

    const addFacility = () => {
        if (facilityInput.trim() && !data.facilities.includes(facilityInput.trim())) {
            setData('facilities', [...data.facilities, facilityInput.trim()]);
            setFacilityInput('');
        }
    };

    const removeFacility = (facility) => {
        setData('facilities', data.facilities.filter(f => f !== facility));
    };

    return (
        <AuthenticatedLayout header="Create Room">
            <Head title="Create Room" />

            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <DoorOpen className="w-8 h-8 text-orange" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Create Room</h2>
                            <p className="text-sm text-gray-600">Add a new room to the system</p>
                        </div>
                    </div>
                    <Link
                        href={route('timetables.rooms.index')}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Link>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="code" value="Room Code *" />
                                <TextInput
                                    id="code"
                                    type="text"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value)}
                                    className="mt-1 block w-full"
                                    placeholder="e.g., 101, A-205"
                                />
                                <InputError message={errors.code} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="name" value="Room Name *" />
                                <TextInput
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="mt-1 block w-full"
                                    placeholder="e.g., Science Lab 1"
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="capacity" value="Capacity *" />
                                <TextInput
                                    id="capacity"
                                    type="number"
                                    value={data.capacity}
                                    onChange={(e) => setData('capacity', e.target.value)}
                                    className="mt-1 block w-full"
                                    placeholder="e.g., 30"
                                    min="1"
                                />
                                <InputError message={errors.capacity} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="room_type" value="Room Type *" />
                                <select
                                    id="room_type"
                                    value={data.room_type}
                                    onChange={(e) => setData('room_type', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:border-orange focus:ring focus:ring-orange focus:ring-opacity-50"
                                >
                                    {roomTypes.map((type) => (
                                        <option key={type} value={type}>
                                            {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.room_type} className="mt-2" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="building" value="Building" />
                                <TextInput
                                    id="building"
                                    type="text"
                                    value={data.building}
                                    onChange={(e) => setData('building', e.target.value)}
                                    className="mt-1 block w-full"
                                    placeholder="e.g., Main Building"
                                />
                                <InputError message={errors.building} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="floor" value="Floor" />
                                <TextInput
                                    id="floor"
                                    type="text"
                                    value={data.floor}
                                    onChange={(e) => setData('floor', e.target.value)}
                                    className="mt-1 block w-full"
                                    placeholder="e.g., 1st Floor"
                                />
                                <InputError message={errors.floor} className="mt-2" />
                            </div>
                        </div>

                        <div>
                            <InputLabel value="Facilities" />
                            <div className="mt-1 flex gap-2">
                                <TextInput
                                    type="text"
                                    value={facilityInput}
                                    onChange={(e) => setFacilityInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFacility())}
                                    className="flex-1"
                                    placeholder="e.g., Projector, Whiteboard"
                                />
                                <button
                                    type="button"
                                    onClick={addFacility}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                                >
                                    Add
                                </button>
                            </div>
                            {data.facilities.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {data.facilities.map((facility, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                                        >
                                            {facility}
                                            <button
                                                type="button"
                                                onClick={() => removeFacility(facility)}
                                                className="ml-2 text-blue-600 hover:text-blue-800"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
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
                                href={route('timetables.rooms.index')}
                                className="inline-flex items-center px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </Link>
                            <PrimaryButton disabled={processing} className="inline-flex items-center">
                                <Save className="w-4 h-4 mr-2" />
                                {processing ? 'Creating...' : 'Create Room'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
