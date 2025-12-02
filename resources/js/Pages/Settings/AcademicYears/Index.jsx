import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { Calendar, Plus, Edit, Trash2, Check, X, Save } from 'lucide-react';
import Badge from '@/Components/UI/Badge';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function AcademicYearsIndex({ academicYears }) {
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null, year: null, termsCount: 0 });

    const { data, setData, post, put, processing, errors, reset } = useForm({
        year: '',
        start_date: '',
        end_date: '',
        is_active: false,
    });

    const handleCreate = (e) => {
        e.preventDefault();
        post(route('settings.academic-years.store'), {
            onSuccess: () => {
                reset();
                setIsCreating(false);
            },
        });
    };

    const handleUpdate = (e, yearId) => {
        e.preventDefault();
        put(route('settings.academic-years.update', yearId), {
            onSuccess: () => {
                reset();
                setEditingId(null);
            },
        });
    };

    const handleDelete = (year) => {
        const termsCount = year.academic_terms?.length || 0;
        setDeleteModal({
            show: true,
            id: year.id,
            year: year.year,
            termsCount: termsCount
        });
    };

    const confirmDelete = () => {
        router.delete(route('settings.academic-years.destroy', deleteModal.id), {
            onSuccess: () => setDeleteModal({ show: false, id: null, year: null, termsCount: 0 }),
        });
    };

    const handleToggleActive = (yearId) => {
        router.post(route('settings.academic-years.toggle-active', yearId));
    };

    const startEdit = (year) => {
        setEditingId(year.id);
        setData({
            year: year.year,
            start_date: year.start_date,
            end_date: year.end_date,
            is_active: year.is_active,
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        reset();
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Calendar className="w-8 h-8 text-orange" />
                        <h2 className="text-2xl font-bold text-gray-900">Academic Years</h2>
                    </div>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="inline-flex items-center px-4 py-2 bg-orange text-white font-medium rounded-lg hover:bg-orange/90 transition-colors"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Academic Year
                    </button>
                </div>
            }
        >
            <Head title="Academic Years Settings" />

            <div className="max-w-5xl">
                {/* Create Form */}
                {isCreating && (
                    <div className="bg-white shadow-lg rounded-xl border border-gray-200 p-6 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Academic Year</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Year *</label>
                                    <input
                                        type="text"
                                        value={data.year}
                                        onChange={(e) => setData('year', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                                        placeholder="e.g., 2025"
                                        required
                                    />
                                    {errors.year && <p className="text-sm text-red-600 mt-1">{errors.year}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                                    <input
                                        type="date"
                                        value={data.start_date}
                                        onChange={(e) => setData('start_date', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                                        required
                                    />
                                    {errors.start_date && <p className="text-sm text-red-600 mt-1">{errors.start_date}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
                                    <input
                                        type="date"
                                        value={data.end_date}
                                        onChange={(e) => setData('end_date', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                                        required
                                    />
                                    {errors.end_date && <p className="text-sm text-red-600 mt-1">{errors.end_date}</p>}
                                </div>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="w-4 h-4 text-orange border-gray-300 rounded focus:ring-orange"
                                />
                                <label className="ml-2 text-sm text-gray-700">Set as active academic year</label>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCreating(false);
                                        reset();
                                    }}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center px-4 py-2 bg-orange text-white font-medium rounded-lg hover:bg-orange/90 disabled:opacity-50 transition-colors"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    {processing ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Academic Years List */}
                <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Terms</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {academicYears.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                            No academic years found. Click "Add Academic Year" to create one.
                                        </td>
                                    </tr>
                                ) : (
                                    academicYears.map((year) => (
                                        <tr key={year.id} className="hover:bg-gray-50">
                                            {editingId === year.id ? (
                                                <>
                                                    <td className="px-6 py-4">
                                                        <input
                                                            type="text"
                                                            value={data.year}
                                                            onChange={(e) => setData('year', e.target.value)}
                                                            className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-orange focus:border-transparent"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <input
                                                            type="date"
                                                            value={data.start_date}
                                                            onChange={(e) => setData('start_date', e.target.value)}
                                                            className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-orange focus:border-transparent"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <input
                                                            type="date"
                                                            value={data.end_date}
                                                            onChange={(e) => setData('end_date', e.target.value)}
                                                            className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-orange focus:border-transparent"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-900">
                                                        {year.academic_terms?.length || 0} terms
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={data.is_active}
                                                            onChange={(e) => setData('is_active', e.target.checked)}
                                                            className="w-4 h-4 text-orange border-gray-300 rounded focus:ring-orange"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 text-right space-x-2">
                                                        <button
                                                            onClick={(e) => handleUpdate(e, year.id)}
                                                            className="inline-flex items-center px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={cancelEdit}
                                                            className="inline-flex items-center px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">{year.year}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(year.start_date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(year.end_date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {year.academic_terms?.length || 0} terms
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <button
                                                            onClick={() => handleToggleActive(year.id)}
                                                            className="cursor-pointer"
                                                        >
                                                            <Badge
                                                                variant="status"
                                                                value={year.is_active ? 'active' : 'inactive'}
                                                            />
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                        <button
                                                            onClick={() => startEdit(year)}
                                                            className="inline-flex items-center px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(year)}
                                                            className="inline-flex items-center px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                show={deleteModal.show}
                onClose={() => setDeleteModal({ show: false, id: null, year: null, termsCount: 0 })}
                onConfirm={confirmDelete}
                title="Delete Academic Year"
                message={
                    deleteModal.termsCount > 0
                        ? `Are you sure you want to delete academic year ${deleteModal.year}? This will also delete ${deleteModal.termsCount} associated term${deleteModal.termsCount > 1 ? 's' : ''} and all their invoices. This action cannot be undone.`
                        : `Are you sure you want to delete academic year ${deleteModal.year}? This action cannot be undone.`
                }
                confirmText="Delete"
                type="danger"
            />
        </AuthenticatedLayout>
    );
}

