import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Eye, Edit, Trash2, School, MapPin, Users, AlertCircle } from 'lucide-react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import useFilters from '@/Hooks/useFilters';
import { SearchInput, FilterSelect, FilterBar } from '@/Components/Filters';
import { Badge } from '@/Components/UI';

export default function RoomsIndex({ rooms, filters: initialFilters = {}, auth }) {
    const { errors } = usePage().props;

    // Extract data from paginated response
    const roomsData = rooms.data || rooms;

    // Use the new useFilters hook
    const { filters, updateFilter, clearFilters } = useFilters({
        route: '/timetables/rooms',
        initialFilters: {
            search: initialFilters.search || '',
            room_type: initialFilters.room_type || '',
            is_active: initialFilters.is_active || '',
        },
    });

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);

    const confirmDelete = (room) => {
        setSelectedRoom(room);
        setShowDeleteModal(true);
    };

    const handleDelete = () => {
        if (selectedRoom) {
            router.delete(route('timetables.rooms.destroy', selectedRoom.id), {
                onSuccess: () => {
                    setShowDeleteModal(false);
                    setSelectedRoom(null);
                },
            });
        }
    };

    const getRoomTypeColor = (type) => {
        const colors = {
            'classroom': 'bg-blue-100 text-blue-800',
            'laboratory': 'bg-purple-100 text-purple-800',
            'library': 'bg-green-100 text-green-800',
            'computer_lab': 'bg-indigo-100 text-indigo-800',
            'art_room': 'bg-pink-100 text-pink-800',
            'music_room': 'bg-yellow-100 text-yellow-800',
            'sports_hall': 'bg-orange-100 text-orange-800',
            'auditorium': 'bg-red-100 text-red-800',
            'cafeteria': 'bg-teal-100 text-teal-800',
            'prayer_room': 'bg-cyan-100 text-cyan-800',
            'other': 'bg-gray-100 text-gray-800',
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    };

    const roomTypes = [
        { value: 'classroom', label: 'Classroom' },
        { value: 'laboratory', label: 'Laboratory' },
        { value: 'library', label: 'Library' },
        { value: 'computer_lab', label: 'Computer Lab' },
        { value: 'art_room', label: 'Art Room' },
        { value: 'music_room', label: 'Music Room' },
        { value: 'sports_hall', label: 'Sports Hall' },
        { value: 'auditorium', label: 'Auditorium' },
        { value: 'cafeteria', label: 'Cafeteria' },
        { value: 'prayer_room', label: 'Prayer Room' },
        { value: 'other', label: 'Other' },
    ];

    return (
        <AuthenticatedLayout header="Rooms">
            <Head title="Rooms" />

            <div className="space-y-6">
                {/* Error Messages */}
                {errors?.error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                        <div className="flex items-start">
                            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-red-800">
                                    {errors.error}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header Actions */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex items-center space-x-3">
                        <School className="w-8 h-8 text-orange" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Rooms</h2>
                            <p className="text-sm text-gray-600">
                                Manage rooms and facilities
                            </p>
                        </div>
                    </div>

                    {auth.user.role === 'admin' && (
                        <Link
                            href={route('timetables.rooms.create')}
                            className="inline-flex items-center px-6 py-3 bg-orange text-white rounded-lg hover:bg-orange-dark transition-colors shadow-md hover:shadow-lg"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Add Room
                        </Link>
                    )}
                </div>

                {/* Filters */}
                <FilterBar onClear={clearFilters} gridCols="3">
                    <SearchInput
                        value={filters.search}
                        onChange={(e) => updateFilter('search', e.target.value)}
                        placeholder="Search rooms..."
                    />
                    <FilterSelect
                        value={filters.room_type}
                        onChange={(e) => updateFilter('room_type', e.target.value)}
                        options={roomTypes}
                        allLabel="All Types"
                        hideLabel
                    />
                    <FilterSelect
                        value={filters.is_active}
                        onChange={(e) => updateFilter('is_active', e.target.value)}
                        options={[
                            { value: '1', label: 'Active' },
                            { value: '0', label: 'Inactive' }
                        ]}
                        allLabel="All Statuses"
                        hideLabel
                    />
                </FilterBar>

                {/* Rooms Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
                    {roomsData.length > 0 ? (
                        roomsData.map((room) => (
                            <div
                                key={room.id}
                                className="rounded-xl border-2 overflow-hidden transition-all duration-300 bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-sm hover:shadow-lg hover:border-blue-300"
                            >
                                {/* Card Header */}
                                <div className="p-4 md:p-5 border-b border-gray-200/60">
                                    <div className="flex items-start justify-between mb-2.5">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1.5 truncate">
                                                {room.name}
                                            </h3>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoomTypeColor(room.room_type)}`}>
                                                    {room.room_type.replace('_', ' ')}
                                                </span>
                                                {room.code && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100/80 text-gray-600 border border-gray-200/50">
                                                        <MapPin className="w-3 h-3 mr-1" />
                                                        {room.code}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <Badge
                                            variant={room.is_active ? 'success' : 'secondary'}
                                            value={room.is_active ? 'Active' : 'Inactive'}
                                            size="sm"
                                        />
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-3 text-sm flex-wrap mt-3">
                                        {room.capacity && (
                                            <div className="flex items-center text-blue-600 bg-blue-50/80 px-2.5 py-1 rounded border border-blue-200/50">
                                                <Users className="w-3.5 h-3.5 mr-1.5" />
                                                <span className="font-semibold text-xs md:text-sm">
                                                    {room.capacity}
                                                </span>
                                                <span className="ml-1 text-xs font-medium hidden sm:inline">
                                                    capacity
                                                </span>
                                            </div>
                                        )}
                                        {room.facilities && room.facilities.length > 0 && (
                                            <div className="flex items-center text-green-600 text-xs">
                                                <span className="font-medium">{room.facilities.length} facilities</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="p-3 md:p-4">
                                    {/* Facilities */}
                                    {room.facilities && room.facilities.length > 0 && (
                                        <div className="mb-3">
                                            <div className="flex flex-wrap gap-1.5">
                                                {room.facilities.slice(0, 3).map((facility, index) => (
                                                    <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                                        {facility}
                                                    </span>
                                                ))}
                                                {room.facilities.length > 3 && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                                                        +{room.facilities.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <Link
                                            href={route('timetables.rooms.show', room.id)}
                                            className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs md:text-sm font-medium text-blue-600 bg-blue-50/80 border border-blue-200/50 rounded hover:bg-blue-100 transition-colors"
                                        >
                                            <Eye className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5" />
                                            <span className="hidden sm:inline">View</span>
                                        </Link>
                                        {auth.user.role === 'admin' && (
                                            <>
                                                <Link
                                                    href={route('timetables.rooms.edit', room.id)}
                                                    className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs md:text-sm font-medium text-orange bg-orange-50/80 border border-orange-200/50 rounded hover:bg-orange-100 transition-colors"
                                                >
                                                    <Edit className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5" />
                                                    <span className="hidden sm:inline">Edit</span>
                                                </Link>
                                                <button
                                                    onClick={() => confirmDelete(room)}
                                                    className="inline-flex items-center justify-center px-3 py-2 text-xs md:text-sm font-medium text-red-600 bg-red-50/80 border border-red-200/50 rounded hover:bg-red-100 transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                                <School className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms found</h3>
                                <p className="text-gray-600 mb-6">
                                    {filters.search || filters.room_type || filters.is_active ? 'Try adjusting your filters' : 'Get started by adding your first room'}
                                </p>
                                {auth.user.role === 'admin' && !filters.search && !filters.room_type && !filters.is_active && (
                                    <Link
                                        href={route('timetables.rooms.create')}
                                        className="inline-flex items-center px-6 py-3 bg-orange text-white text-sm font-medium rounded-lg hover:bg-orange-dark transition-colors"
                                    >
                                        <Plus className="w-5 h-5 mr-2" />
                                        Add First Room
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {rooms.links && rooms.links.length > 3 && (
                    <div className="mt-6 flex justify-center gap-2">
                        {rooms.links.map((link, index) => (
                            <Link
                                key={index}
                                href={link.url || '#'}
                                className={`
                                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                                    ${link.active
                                        ? 'bg-orange text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                    }
                                    ${!link.url && 'opacity-50 cursor-not-allowed'}
                                `}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                preserveState
                                preserveScroll
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Room"
                message={
                    <div className="space-y-3">
                        <p>Are you sure you want to delete <strong>{selectedRoom?.name}</strong>?</p>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4">
                            <p className="text-xs md:text-sm text-red-800">
                                ⚠️ This action cannot be undone. This room will be removed from all timetables.
                            </p>
                        </div>
                    </div>
                }
                confirmText="Delete Room"
                type="danger"
            />
        </AuthenticatedLayout>
    );
}


