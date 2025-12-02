import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { BookOpen, Plus, Edit, Trash2, Check, X, Save, Calendar, AlertCircle } from 'lucide-react';
import Badge from '@/Components/UI/Badge';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function AcademicTermsIndex({ academicYears }) {
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null });

    const { data, setData, post, put, processing, errors, reset } = useForm({
        academic_year_id: '',
        term_number: '',
        name: '',
        start_date: '',
        end_date: '',
        is_active: false,
    });

    const handleCreate = (e) => {
        e.preventDefault();
        post(route('settings.academic-terms.store'), {
            onSuccess: () => {
                reset();
                setIsCreating(false);
            },
        });
    };

    const handleUpdate = (e, termId) => {
        e.preventDefault();
        put(route('settings.academic-terms.update', termId), {
            onSuccess: () => {
                reset();
                setEditingId(null);
            },
        });
    };

    const handleDelete = (termId) => {
        setDeleteModal({ show: true, id: termId });
    };

    const confirmDelete = () => {
        router.delete(route('settings.academic-terms.destroy', deleteModal.id), {
            onSuccess: () => setDeleteModal({ show: false, id: null }),
        });
    };

    const handleToggleActive = (termId) => {
        router.post(route('settings.academic-terms.toggle-active', termId));
    };

    const startEdit = (term) => {
        setEditingId(term.id);
        setData({
            academic_year_id: term.academic_year_id,
            term_number: term.term_number,
            name: term.name,
            start_date: term.start_date,
            end_date: term.end_date,
            is_active: term.is_active,
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        reset();
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange rounded-lg flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Academic Terms</h2>
                    </div>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="inline-flex items-center justify-center px-4 py-2.5 bg-orange text-white font-semibold rounded-lg hover:bg-orange-dark shadow-md hover:shadow-lg transition-all duration-200"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Term
                    </button>
                </div>
            }
        >
            <Head title="Academic Terms Settings" />

            <div className="max-w-7xl space-y-6">
                {/* Create Form */}
                {isCreating && (
                    <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-navy to-navy/95 px-6 py-4">
                            <h3 className="text-lg font-semibold text-white">Create New Academic Term</h3>
                        </div>
                        
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Academic Year */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Academic Year <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={data.academic_year_id}
                                        onChange={(e) => setData('academic_year_id', e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-orange transition-all"
                                        required
                                    >
                                        <option value="">Select Academic Year</option>
                                        {academicYears.map((year) => (
                                            <option key={year.id} value={year.id}>{year.year}</option>
                                        ))}
                                    </select>
                                    {errors.academic_year_id && (
                                        <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                            <AlertCircle className="w-4 h-4" />
                                            {errors.academic_year_id}
                                        </p>
                                    )}
                                </div>

                                {/* Term Number */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Term Number <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={data.term_number}
                                        onChange={(e) => setData('term_number', e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-orange transition-all"
                                        required
                                    >
                                        <option value="">Select Term</option>
                                        <option value="1">Term 1</option>
                                        <option value="2">Term 2</option>
                                        <option value="3">Term 3</option>
                                    </select>
                                    {errors.term_number && (
                                        <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                            <AlertCircle className="w-4 h-4" />
                                            {errors.term_number}
                                        </p>
                                    )}
                                </div>

                                {/* Term Name */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Term Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-orange transition-all"
                                        placeholder="e.g., Term 1"
                                        required
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                            <AlertCircle className="w-4 h-4" />
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                {/* Start Date */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Start Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={data.start_date}
                                        onChange={(e) => setData('start_date', e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-orange transition-all"
                                        required
                                    />
                                    {errors.start_date && (
                                        <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                            <AlertCircle className="w-4 h-4" />
                                            {errors.start_date}
                                        </p>
                                    )}
                                </div>

                                {/* End Date */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        End Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={data.end_date}
                                        onChange={(e) => setData('end_date', e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-orange transition-all"
                                        required
                                    />
                                    {errors.end_date && (
                                        <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                            <AlertCircle className="w-4 h-4" />
                                            {errors.end_date}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Active Checkbox */}
                            <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                                <input
                                    type="checkbox"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="w-5 h-5 text-orange border-gray-300 rounded focus:ring-orange"
                                />
                                <label className="text-sm font-medium text-gray-700">Set as active term</label>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCreating(false);
                                        reset();
                                    }}
                                    className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-semibold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center justify-center px-6 py-2.5 bg-orange text-white font-semibold rounded-lg hover:bg-orange-dark disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    {processing ? 'Creating...' : 'Create Term'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Academic Terms List Grouped by Year */}
                {academicYears.length === 0 ? (
                    <div className="bg-white shadow-lg rounded-xl border border-gray-200 p-12 text-center">
                        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Academic Years Found</h3>
                        <p className="text-gray-500 mb-6">Please create academic years first before adding terms.</p>
                        <a
                            href="/admin/settings/academic-years"
                            className="inline-flex items-center px-4 py-2 bg-orange text-white font-semibold rounded-lg hover:bg-orange-dark transition-colors"
                        >
                            Go to Academic Years
                        </a>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {academicYears.map((year) => (
                            <div key={year.id} className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
                                {/* Year Header */}
                                <div className="bg-gradient-to-r from-navy to-navy/95 px-4 sm:px-6 py-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                        <h3 className="text-lg font-semibold text-white">
                                            Academic Year {year.year}
                                        </h3>
                                        {year.is_active && (
                                            <Badge variant="status" value="active" label="Active Year" />
                                        )}
                                    </div>
                                </div>

                                {/* Desktop Table */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Term</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Start Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">End Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {!year.academic_terms || year.academic_terms.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                                        <p className="font-medium">No terms for this academic year</p>
                                                        <p className="text-sm mt-1">Click "Add Term" to create one</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                year.academic_terms.map((term) => (
                                                    <tr key={term.id} className="hover:bg-gray-50 transition-colors">
                                                        {editingId === term.id ? (
                                                            <>
                                                                <td className="px-6 py-4">
                                                                    <select
                                                                        value={data.term_number}
                                                                        onChange={(e) => setData('term_number', e.target.value)}
                                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange"
                                                                    >
                                                                        <option value="1">1</option>
                                                                        <option value="2">2</option>
                                                                        <option value="3">3</option>
                                                                    </select>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <input
                                                                        type="text"
                                                                        value={data.name}
                                                                        onChange={(e) => setData('name', e.target.value)}
                                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange"
                                                                    />
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <input
                                                                        type="date"
                                                                        value={data.start_date}
                                                                        onChange={(e) => setData('start_date', e.target.value)}
                                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange"
                                                                    />
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <input
                                                                        type="date"
                                                                        value={data.end_date}
                                                                        onChange={(e) => setData('end_date', e.target.value)}
                                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange"
                                                                    />
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <label className="flex items-center gap-2">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={data.is_active}
                                                                            onChange={(e) => setData('is_active', e.target.checked)}
                                                                            className="w-4 h-4 text-orange border-gray-300 rounded focus:ring-orange"
                                                                        />
                                                                        <span className="text-sm">Active</span>
                                                                    </label>
                                                                </td>
                                                                <td className="px-6 py-4 text-right space-x-2">
                                                                    <button
                                                                        onClick={(e) => handleUpdate(e, term.id)}
                                                                        disabled={processing}
                                                                        className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold transition-colors"
                                                                    >
                                                                        <Check className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={cancelEdit}
                                                                        className="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold transition-colors"
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                    </button>
                                                                </td>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                                    Term {term.term_number}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                                    {term.name}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                                    {new Date(term.start_date).toLocaleDateString()}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                                    {new Date(term.end_date).toLocaleDateString()}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <button
                                                                        onClick={() => handleToggleActive(term.id)}
                                                                        className="cursor-pointer"
                                                                    >
                                                                        <Badge
                                                                            variant="status"
                                                                            value={term.is_active ? 'active' : 'inactive'}
                                                                        />
                                                                    </button>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                                    <button
                                                                        onClick={() => startEdit(term)}
                                                                        className="inline-flex items-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors"
                                                                    >
                                                                        <Edit className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDelete(term.id)}
                                                                        className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors"
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

                                {/* Mobile Cards */}
                                <div className="md:hidden divide-y divide-gray-200">
                                    {!year.academic_terms || year.academic_terms.length === 0 ? (
                                        <div className="px-4 py-12 text-center text-gray-500">
                                            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                            <p className="font-medium">No terms for this academic year</p>
                                            <p className="text-sm mt-1">Click "Add Term" to create one</p>
                                        </div>
                                    ) : (
                                        year.academic_terms.map((term) => (
                                            <div key={term.id} className="p-4">
                                                {editingId === term.id ? (
                                                    <div className="space-y-3">
                                                        <div>
                                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Term Number</label>
                                                            <select
                                                                value={data.term_number}
                                                                onChange={(e) => setData('term_number', e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange text-sm"
                                                            >
                                                                <option value="1">Term 1</option>
                                                                <option value="2">Term 2</option>
                                                                <option value="3">Term 3</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Term Name</label>
                                                            <input
                                                                type="text"
                                                                value={data.name}
                                                                onChange={(e) => setData('name', e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange text-sm"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="block text-xs font-semibold text-gray-700 mb-1">Start Date</label>
                                                                <input
                                                                    type="date"
                                                                    value={data.start_date}
                                                                    onChange={(e) => setData('start_date', e.target.value)}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange text-sm"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-semibold text-gray-700 mb-1">End Date</label>
                                                                <input
                                                                    type="date"
                                                                    value={data.end_date}
                                                                    onChange={(e) => setData('end_date', e.target.value)}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange text-sm"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={data.is_active}
                                                                onChange={(e) => setData('is_active', e.target.checked)}
                                                                className="w-4 h-4 text-orange border-gray-300 rounded focus:ring-orange"
                                                            />
                                                            <label className="text-sm font-medium text-gray-700">Set as active</label>
                                                        </div>
                                                        <div className="flex gap-2 pt-2">
                                                            <button
                                                                onClick={(e) => handleUpdate(e, term.id)}
                                                                disabled={processing}
                                                                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold transition-colors"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                                Save
                                                            </button>
                                                            <button
                                                                onClick={cancelEdit}
                                                                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold transition-colors"
                                                            >
                                                                <X className="w-4 h-4" />
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h4 className="font-semibold text-gray-900 text-lg">Term {term.term_number}</h4>
                                                                <p className="text-sm text-gray-600 mt-0.5">{term.name}</p>
                                                            </div>
                                                            <button
                                                                onClick={() => handleToggleActive(term.id)}
                                                                className="cursor-pointer"
                                                            >
                                                                <Badge
                                                                    variant="status"
                                                                    value={term.is_active ? 'active' : 'inactive'}
                                                                />
                                                            </button>
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                                            <div>
                                                                <p className="text-gray-500 text-xs font-medium mb-1">Start Date</p>
                                                                <p className="text-gray-900 font-semibold">{new Date(term.start_date).toLocaleDateString()}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-gray-500 text-xs font-medium mb-1">End Date</p>
                                                                <p className="text-gray-900 font-semibold">{new Date(term.end_date).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-2 pt-2">
                                                            <button
                                                                onClick={() => startEdit(term)}
                                                                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(term.id)}
                                                                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                show={deleteModal.show}
                onClose={() => setDeleteModal({ show: false, id: null })}
                onConfirm={confirmDelete}
                title="Delete Academic Term"
                message="Are you sure you want to delete this academic term? This action cannot be undone."
                confirmText="Delete"
                type="danger"
            />
        </AuthenticatedLayout>
    );
}