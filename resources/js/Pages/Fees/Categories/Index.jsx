import { useState } from "react";
import { Head, Link, router, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Pencil, Trash2, Plus, ArrowLeft, DollarSign, Tag } from "lucide-react";
import { useSwipeable } from 'react-swipeable';
import SwipeActionButton from '@/Components/SwipeActionButton';
import { SearchInput, FilterSelect, FilterBar } from '@/Components/Filters';
import useFilters from '@/Hooks/useFilters';
import { Badge } from '@/Components/UI';
import ConfirmationModal from '@/Components/ConfirmationModal';

// Mobile List Item Component
function MobileFeeCategoryItem({ category, onDelete, onToggleStatus }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [swipeAction, setSwipeAction] = useState(null);

    const handlers = useSwipeable({
        onSwipedLeft: () => setSwipeAction('primary'),
        onSwipedRight: () => setSwipeAction('secondary'),
        onSwiping: () => {},
        trackMouse: false,
        preventScrollOnSwipe: false,
        delta: 60,
    });

    return (
        <div className="relative bg-white border-b border-gray-200 overflow-hidden">
            {/* Swipe Actions Background */}
            {swipeAction === 'primary' && (
                <div className="absolute inset-0 bg-gradient-to-l from-green-500 to-green-600 flex items-center justify-end px-4 gap-2 z-10">
                    <SwipeActionButton
                        icon={<Pencil className="w-5 h-5 text-white" />}
                        onClick={() => {
                            // Open edit modal
                            setSwipeAction(null);
                        }}
                    />
                </div>
            )}
            {swipeAction === 'secondary' && (
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-start px-4 gap-2 z-10">
                    <SwipeActionButton
                        icon={<Trash2 className="w-5 h-5 text-white" />}
                        onClick={() => {
                            onDelete(category.id, category.category_name);
                            setSwipeAction(null);
                        }}
                    />
                </div>
            )}

            {/* Main Content */}
            <div
                {...handlers}
                className={`relative bg-white transition-transform duration-300 z-20 ${
                    swipeAction === 'primary' ? '-translate-x-20' :
                    swipeAction === 'secondary' ? 'translate-x-20' : ''
                }`}
                onClick={() => {
                    if (swipeAction) {
                        setSwipeAction(null);
                    }
                }}
            >
                {/* Summary Row */}
                <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg text-xl">
                                {category.category_name.charAt(0).toUpperCase()}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-black text-gray-900 truncate leading-tight">
                                    {category.category_name}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">{category.grade?.name}</p>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                        KSh {parseFloat(category.default_amount).toLocaleString()}
                                    </span>
                                    <button
                                        onClick={() => onToggleStatus(category.id)}
                                        className="cursor-pointer"
                                    >
                                        <Badge 
                                            variant="status" 
                                            value={category.is_active ? 'active' : 'inactive'}
                                        />
                                    </button>
                                    {category.is_per_child && (
                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                            Per Child
                                        </span>
                                    )}
                                </div>
                                {category.description && (
                                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">{category.description}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Index({ feeCategories, grades, filters: initialFilters = {} }) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null, name: '' });

    const { data, setData, post, put, processing, errors, reset } = useForm({
        grade_id: '',
        category_name: '',
        default_amount: '',
        is_per_child: true,
        description: '',
        is_active: true,
    });

    const { filters, updateFilter, applyFilters } = useFilters({
        route: route('fee-categories.index'),
        initialFilters: {
            search: initialFilters.search || '',
            grade_id: initialFilters.grade_id || '',
            status: initialFilters.status || '',
        },
    });

    const handleDelete = (id, name) => {
        setDeleteModal({ show: true, id, name });
    };

    const confirmDelete = () => {
        router.delete(route('fee-categories.destroy', deleteModal.id), {
            onSuccess: () => setDeleteModal({ show: false, id: null, name: '' }),
        });
    };

    const handleToggleStatus = (id) => {
        router.post(route('fee-categories.toggle-status', id));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingCategory) {
            put(route('fee-categories.update', editingCategory.id), {
                onSuccess: () => {
                    setEditingCategory(null);
                    setShowCreateModal(false);
                    reset();
                }
            });
        } else {
            post(route('fee-categories.store'), {
                onSuccess: () => {
                    setShowCreateModal(false);
                    reset();
                }
            });
        }
    };

    const startEdit = (category) => {
        setEditingCategory(category);
        setData({
            grade_id: category.grade_id,
            category_name: category.category_name,
            default_amount: category.default_amount,
            is_per_child: category.is_per_child,
            description: category.description || '',
            is_active: category.is_active,
        });
        setShowCreateModal(true);
    };

    const handleCloseModal = () => {
        setShowCreateModal(false);
        setEditingCategory(null);
        reset();
    };

    return (
        <AuthenticatedLayout header="Fee Categories">
            <Head title="Fee Categories" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex items-center space-x-3">
                        <Link
                            href="/fees"
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-150"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <Tag className="w-8 h-8 text-orange" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Fee Categories</h2>
                            <p className="text-sm text-gray-600">Manage fee categories for different grades</p>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            setEditingCategory(null);
                            reset();
                            setShowCreateModal(true);
                        }}
                        className="inline-flex items-center px-6 py-3 bg-orange text-white rounded-lg hover:bg-orange-dark transition-colors shadow-md hover:shadow-lg"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Fee Category
                    </button>
                </div>

                {/* Filters */}
                <FilterBar>
                    <SearchInput
                        value={filters.search}
                        onChange={(value) => updateFilter('search', value)}
                        onSearch={applyFilters}
                        placeholder="Search fee categories..."
                        className="flex-1"
                    />
                    <FilterSelect
                        value={filters.grade_id}
                        onChange={(e) => updateFilter('grade_id', e.target.value)}
                        options={[
                            { value: 'all', label: 'All Grades' },
                            ...grades.map(grade => ({ value: grade.id, label: grade.name }))
                        ]}
                        className="w-full sm:w-48"
                    />
                    <FilterSelect
                        value={filters.status}
                        onChange={(e) => updateFilter('status', e.target.value)}
                        options={[
                            { value: 'all', label: 'All Statuses' },
                            { value: 'active', label: 'Active' },
                            { value: 'inactive', label: 'Inactive' },
                        ]}
                        className="w-full sm:w-40"
                    />
                </FilterBar>

                {/* Mobile View */}
                <div className="lg:hidden">
                    {feeCategories.data.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                            <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No fee categories found.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                            {feeCategories.data.map((category) => (
                                <MobileFeeCategoryItem
                                    key={category.id}
                                    category={category}
                                    onDelete={handleDelete}
                                    onToggleStatus={handleToggleStatus}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {feeCategories.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                            No fee categories found.
                                        </td>
                                    </tr>
                                ) : (
                                    feeCategories.data.map((category) => (
                                        <tr key={category.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{category.category_name}</div>
                                                {category.description && (
                                                    <div className="text-sm text-gray-500 line-clamp-1">{category.description}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {category.grade?.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                KSh {parseFloat(category.default_amount).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {category.is_per_child ? 'Per Child' : 'Fixed'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleToggleStatus(category.id)}
                                                    className="cursor-pointer"
                                                >
                                                    <Badge
                                                        variant="status"
                                                        value={category.is_active ? 'active' : 'inactive'}
                                                    />
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <button
                                                    onClick={() => startEdit(category)}
                                                    className="inline-flex items-center px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(category.id, category.category_name)}
                                                    className="inline-flex items-center px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {feeCategories.links && feeCategories.links.length > 3 && (
                    <div className="flex justify-center">
                        <nav className="inline-flex rounded-md shadow-sm -space-x-px">
                            {feeCategories.links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url || '#'}
                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                        link.active
                                            ? 'z-10 bg-orange border-orange text-white'
                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                    } ${index === 0 ? 'rounded-l-md' : ''} ${
                                        index === feeCategories.links.length - 1 ? 'rounded-r-md' : ''
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </nav>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-xl font-bold text-gray-900">
                                {editingCategory ? 'Edit Fee Category' : 'Create Fee Category'}
                            </h3>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Grade *
                                    </label>
                                    <select
                                        value={data.grade_id}
                                        onChange={(e) => setData('grade_id', e.target.value)}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent ${errors.grade_id ? 'border-red-500' : 'border-gray-300'}`}
                                        required
                                    >
                                        <option value="">Select Grade</option>
                                        {grades.map((grade) => (
                                            <option key={grade.id} value={grade.id}>{grade.name}</option>
                                        ))}
                                    </select>
                                    {errors.grade_id && <p className="mt-1 text-sm text-red-600">{errors.grade_id}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Category Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={data.category_name}
                                        onChange={(e) => setData('category_name', e.target.value)}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent ${errors.category_name ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="e.g., Tuition, Transport, Sports"
                                        required
                                    />
                                    {errors.category_name && <p className="mt-1 text-sm text-red-600">{errors.category_name}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Default Amount (KSh) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.default_amount}
                                        onChange={(e) => setData('default_amount', e.target.value)}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent ${errors.default_amount ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="0.00"
                                        required
                                    />
                                    {errors.default_amount && <p className="mt-1 text-sm text-red-600">{errors.default_amount}</p>}
                                </div>

                                <div className="flex items-center space-y-4 flex-col justify-start">
                                    <div className="flex items-center w-full">
                                        <input
                                            type="checkbox"
                                            checked={data.is_per_child}
                                            onChange={(e) => setData('is_per_child', e.target.checked)}
                                            className="w-4 h-4 text-orange border-gray-300 rounded focus:ring-orange"
                                        />
                                        <label className="ml-2 text-sm text-gray-700">Charge per child</label>
                                    </div>

                                    <div className="flex items-center w-full">
                                        <input
                                            type="checkbox"
                                            checked={data.is_active}
                                            onChange={(e) => setData('is_active', e.target.checked)}
                                            className="w-4 h-4 text-orange border-gray-300 rounded focus:ring-orange"
                                        />
                                        <label className="ml-2 text-sm text-gray-700">Active</label>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows="3"
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="Optional description..."
                                />
                                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                    disabled={processing}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-orange text-white rounded-lg hover:bg-orange-dark transition-colors disabled:opacity-50"
                                    disabled={processing}
                                >
                                    {processing ? 'Saving...' : (editingCategory ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                show={deleteModal.show}
                onClose={() => setDeleteModal({ show: false, id: null, name: '' })}
                onConfirm={confirmDelete}
                title="Delete Fee Category"
                message={`Are you sure you want to delete "${deleteModal.name}"? This action cannot be undone.`}
                confirmText="Delete"
                type="danger"
            />
        </AuthenticatedLayout>
    );
}

