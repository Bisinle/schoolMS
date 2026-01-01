import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Grid3x3, Plus, Search, Filter, Calendar, Clock, User, BookOpen, DoorOpen, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function SlotsIndex({ slots, templates, filters, auth }) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedTemplate, setSelectedTemplate] = useState(filters.template_id || '');
    const [selectedDay, setSelectedDay] = useState(filters.day_of_week || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('timetables.slots.index'), {
            search,
            template_id: selectedTemplate,
            day_of_week: selectedDay,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDelete = (slotId) => {
        if (confirm('Are you sure you want to delete this slot?')) {
            router.delete(route('timetables.slots.destroy', slotId));
        }
    };

    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    const getSubjectColor = (subjectName) => {
        const colors = [
            'bg-blue-100 text-blue-800',
            'bg-green-100 text-green-800',
            'bg-purple-100 text-purple-800',
            'bg-pink-100 text-pink-800',
            'bg-yellow-100 text-yellow-800',
            'bg-indigo-100 text-indigo-800',
        ];
        if (!subjectName) return 'bg-gray-100 text-gray-800';
        const hash = subjectName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    };

    return (
        <AuthenticatedLayout header="Timetable Slots">
            <Head title="Timetable Slots" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Grid3x3 className="w-8 h-8 text-orange" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Timetable Slots</h2>
                            <p className="text-sm text-gray-600">Manage all timetable slot assignments</p>
                        </div>
                    </div>
                    <Link
                        href={route('timetables.slots.create')}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-orange rounded-lg hover:bg-orange-600"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Slot
                    </Link>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by subject, teacher..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                                />
                            </div>
                        </div>
                        <select
                            value={selectedTemplate}
                            onChange={(e) => setSelectedTemplate(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                        >
                            <option value="">All Templates</option>
                            {templates.map((template) => (
                                <option key={template.id} value={template.id}>
                                    {template.name}
                                </option>
                            ))}
                        </select>
                        <select
                            value={selectedDay}
                            onChange={(e) => setSelectedDay(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                        >
                            <option value="">All Days</option>
                            {daysOfWeek.map((day) => (
                                <option key={day} value={day}>
                                    {day.charAt(0).toUpperCase() + day.slice(1)}
                                </option>
                            ))}
                        </select>
                        <button
                            type="submit"
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-orange rounded-lg hover:bg-orange-600"
                        >
                            <Filter className="w-4 h-4 mr-2" />
                            Filter
                        </button>
                    </form>
                </div>

                {/* Slots List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Template
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Day & Period
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Subject
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Teacher
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Room
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {slots.data && slots.data.length > 0 ? (
                                    slots.data.map((slot) => (
                                        <tr key={slot.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                                    <span className="text-sm text-gray-900">
                                                        {slot.timetable_template?.name || 'N/A'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm">
                                                    <div className="font-medium text-gray-900 capitalize">
                                                        {slot.day_of_week}
                                                    </div>
                                                    <div className="text-gray-500 flex items-center">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        {slot.period?.name} ({slot.period?.start_time} - {slot.period?.end_time})
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSubjectColor(slot.subject?.name)}`}>
                                                    <BookOpen className="w-3 h-3 mr-1" />
                                                    {slot.subject?.name || 'No Subject'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-sm text-gray-900">
                                                    <User className="w-4 h-4 text-gray-400 mr-2" />
                                                    {slot.teacher?.name || 'No Teacher'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-sm text-gray-900">
                                                    <DoorOpen className="w-4 h-4 text-gray-400 mr-2" />
                                                    {slot.room?.name || slot.room?.code || 'No Room'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={route('timetables.slots.edit', slot.id)}
                                                        className="text-orange hover:text-orange-600"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(slot.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center">
                                            <Grid3x3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-500">No slots found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

