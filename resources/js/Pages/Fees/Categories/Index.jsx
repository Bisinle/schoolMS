import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Plus, Edit, Trash2, Search, DollarSign, X, Save, AlertCircle } from 'lucide-react';
import Badge from '@/Components/UI/Badge';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function Index({ auth, feeCategories, academicYears, activeYear, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [selectedYear, setSelectedYear] = useState(activeYear?.id || '');
    
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null, name: '', type: 'category' });
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showAmountModal, setShowAmountModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [editingAmount, setEditingAmount] = useState(null);
    const [selectedCategoryForAmount, setSelectedCategoryForAmount] = useState(null);

    // Form for creating/editing fee categories
    const categoryForm = useForm({
        name: '',
        description: '',
        is_universal: true,
        is_active: true,
    });

    // Form for creating/editing fee amounts
    const amountForm = useForm({
        fee_category_id: '',
        academic_year_id: selectedYear,
        grade_range: '',
        amount: '',
        is_active: true,
    });

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('fee-categories.index'), {
            search,
            type: typeFilter,
            status: statusFilter,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleFilterChange = (filterType, value) => {
        router.get(route('fee-categories.index'), {
            search,
            type: filterType === 'type' ? value : typeFilter,
            status: filterType === 'status' ? value : statusFilter,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleYearChange = (yearId) => {
        setSelectedYear(yearId);
        router.get(route('fee-categories.index'), {
            search,
            type: typeFilter,
            status: statusFilter,
            year: yearId,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const openCreateCategoryModal = () => {
        categoryForm.reset();
        setEditingCategory(null);
        setShowCategoryModal(true);
    };

    const openEditCategoryModal = (category) => {
        categoryForm.setData({
            name: category.name,
            description: category.description || '',
            is_universal: category.is_universal,
            is_active: category.is_active,
        });
        setEditingCategory(category);
        setShowCategoryModal(true);
    };

    const handleCategorySubmit = (e) => {
        e.preventDefault();
        
        if (editingCategory) {
            categoryForm.put(route('fee-categories.update', editingCategory.id), {
                onSuccess: () => {
                    setShowCategoryModal(false);
                    categoryForm.reset();
                },
            });
        } else {
            categoryForm.post(route('fee-categories.store'), {
                onSuccess: () => {
                    setShowCategoryModal(false);
                    categoryForm.reset();
                },
            });
        }
    };

    const openCreateAmountModal = (category) => {
        amountForm.reset();
        amountForm.setData({
            fee_category_id: category.id,
            academic_year_id: selectedYear,
            grade_range: category.is_universal ? null : '',
            amount: '',
            is_active: true,
        });
        setSelectedCategoryForAmount(category);
        setEditingAmount(null);
        setShowAmountModal(true);
    };

    const openEditAmountModal = (category, amount) => {
        amountForm.setData({
            fee_category_id: category.id,
            academic_year_id: amount.academic_year_id,
            grade_range: amount.grade_range || '',
            amount: amount.amount,
            is_active: amount.is_active,
        });
        setSelectedCategoryForAmount(category);
        setEditingAmount(amount);
        setShowAmountModal(true);
    };

    const handleAmountSubmit = (e) => {
        e.preventDefault();
        
        if (editingAmount) {
            amountForm.put(route('fee-amounts.update', editingAmount.id), {
                onSuccess: () => {
                    setShowAmountModal(false);
                    amountForm.reset();
                },
            });
        } else {
            amountForm.post(route('fee-amounts.store'), {
                onSuccess: () => {
                    setShowAmountModal(false);
                    amountForm.reset();
                },
            });
        }
    };

    const handleDeleteCategory = (category) => {
        setDeleteModal({
            show: true,
            id: category.id,
            name: category.name,
            type: 'category',
        });
    };

    const handleDeleteAmount = (amount, categoryName) => {
        setDeleteModal({
            show: true,
            id: amount.id,
            name: `${categoryName} - ${amount.grade_range || 'All Grades'}`,
            type: 'amount',
        });
    };

    const confirmDelete = () => {
        if (deleteModal.type === 'category') {
            router.delete(route('fee-categories.destroy', deleteModal.id), {
                onSuccess: () => {
                    setDeleteModal({ show: false, id: null, name: '', type: 'category' });
                },
            });
        } else {
            router.delete(route('fee-amounts.destroy', deleteModal.id), {
                onSuccess: () => {
                    setDeleteModal({ show: false, id: null, name: '', type: 'amount' });
                },
            });
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange rounded-lg flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Fee Categories</h2>
                            <p className="text-sm text-gray-600 mt-0.5">Manage universal and grade-specific fees</p>
                        </div>
                    </div>
                    <button
                        onClick={openCreateCategoryModal}
                        className="inline-flex items-center justify-center px-4 py-2.5 bg-orange text-white font-semibold rounded-lg hover:bg-orange-dark shadow-md hover:shadow-lg transition-all duration-200"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Category
                    </button>
                </div>
            }
        >
            <Head title="Fee Categories" />

            <div className="max-w-7xl space-y-6">
                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search */}
                        <div className="md:col-span-1">
                            <form onSubmit={handleSearch} className="relative">
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search categories..."
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-orange transition-all"
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            </form>
                        </div>

                        {/* Type Filter */}
                        <div>
                            <select
                                value={typeFilter}
                                onChange={(e) => {
                                    setTypeFilter(e.target.value);
                                    handleFilterChange('type', e.target.value);
                                }}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-orange transition-all"
                            >
                                <option value="">All Types</option>
                                <option value="universal">Universal</option>
                                <option value="grade_specific">Grade Specific</option>
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    handleFilterChange('status', e.target.value);
                                }}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-orange transition-all"
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    {/* Academic Year Selector */}
                    {academicYears && academicYears.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Academic Year
                            </label>
                            <select
                                value={selectedYear}
                                onChange={(e) => handleYearChange(e.target.value)}
                                className="w-full sm:w-64 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-orange transition-all"
                            >
                                {academicYears.map((year) => (
                                    <option key={year.id} value={year.id}>
                                        {year.year} {year.is_active && '(Active)'}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Fee Categories List */}
                {feeCategories && feeCategories.length > 0 ? (
                    <div className="space-y-4">
                        {feeCategories.map((category) => (
                            <div key={category.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                {/* Category Header */}
                                <div className="bg-gradient-to-r from-navy to-navy/95 px-4 sm:px-6 py-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 flex-wrap mb-2">
                                                <h3 className="text-lg font-bold text-white">
                                                    {category.name}
                                                </h3>
                                                <Badge
                                                    variant="status"
                                                    value={category.is_universal ? 'universal' : 'grade-specific'}
                                                />
                                                <Badge
                                                    variant="status"
                                                    value={category.is_active ? 'active' : 'inactive'}
                                                />
                                            </div>
                                            {category.description && (
                                                <p className="text-sm text-white/80">
                                                    {category.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => openEditCategoryModal(category)}
                                                className="inline-flex items-center px-3 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-all font-semibold border border-white/20"
                                                title="Edit category"
                                            >
                                                <Edit className="w-4 h-4 sm:mr-2" />
                                                <span className="hidden sm:inline">Edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCategory(category)}
                                                className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-semibold"
                                                title="Delete category"
                                            >
                                                <Trash2 className="w-4 h-4 sm:mr-2" />
                                                <span className="hidden sm:inline">Delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Fee Amounts Section */}
                                <div className="p-4 sm:p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                            Fee Amounts • {activeYear?.year || 'Selected Year'}
                                        </h4>
                                        <button
                                            onClick={() => openCreateAmountModal(category)}
                                            className="inline-flex items-center gap-1.5 text-sm text-orange hover:text-orange-dark font-semibold"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Amount
                                        </button>
                                    </div>

                                    {category.fee_amounts && category.fee_amounts.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {category.fee_amounts.map((amount) => (
                                                <div
                                                    key={amount.id}
                                                    className="group relative p-4 bg-gradient-to-br from-orange-50 to-white rounded-lg border-2 border-orange-200 hover:border-orange-400 transition-all"
                                                >
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex-1">
                                                            {amount.grade_range ? (
                                                                <div className="inline-flex items-center px-2.5 py-1 bg-navy rounded-md mb-2">
                                                                    <span className="text-xs font-bold text-white uppercase">
                                                                        Grade {amount.grade_range}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <div className="inline-flex items-center px-2.5 py-1 bg-green-600 rounded-md mb-2">
                                                                    <span className="text-xs font-bold text-white uppercase">
                                                                        All Grades
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => openEditAmountModal(category, amount)}
                                                                className="p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                                title="Edit amount"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteAmount(amount, category.name)}
                                                                className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Delete amount"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="text-2xl font-bold text-orange">
                                                        KSh {parseFloat(amount.amount).toLocaleString()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500 font-medium">No fee amounts defined</p>
                                            <p className="text-xs text-gray-400 mt-1">Click "Add Amount" to create one</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Fee Categories Found</h3>
                        <p className="text-gray-500 mb-6">Create your first fee category to get started</p>
                        <button
                            onClick={openCreateCategoryModal}
                            className="inline-flex items-center px-4 py-2 bg-orange text-white font-semibold rounded-lg hover:bg-orange-dark transition-colors"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Add Category
                        </button>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                <ConfirmationModal
                    show={deleteModal.show}
                    onClose={() => setDeleteModal({ show: false, id: null, name: '', type: 'category' })}
                    onConfirm={confirmDelete}
                    title={deleteModal.type === 'category' ? 'Delete Fee Category' : 'Delete Fee Amount'}
                    message={
                        deleteModal.type === 'category'
                            ? `Are you sure you want to delete "${deleteModal.name}"? This will also delete all associated fee amounts. This action cannot be undone.`
                            : `Are you sure you want to delete the fee amount for "${deleteModal.name}"? This action cannot be undone.`
                    }
                    confirmText="Delete"
                    confirmButtonClass="bg-red-600 hover:bg-red-700"
                />

                {/* Category Modal */}
                {showCategoryModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
                            <div className="bg-gradient-to-r from-navy to-navy/95 px-6 py-4 rounded-t-xl">
                                <h2 className="text-xl font-bold text-white">
                                    {editingCategory ? 'Edit Fee Category' : 'Create Fee Category'}
                                </h2>
                            </div>
                            
                            <form onSubmit={handleCategorySubmit} className="p-6">
                                <div className="space-y-4">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Category Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={categoryForm.data.name}
                                            onChange={(e) => categoryForm.setData('name', e.target.value)}
                                            placeholder="e.g., Sports, Food, Transport"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-orange transition-all"
                                            required
                                        />
                                        {categoryForm.errors.name && (
                                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                                <AlertCircle className="w-4 h-4" />
                                                {categoryForm.errors.name}
                                            </p>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Description
                                        </label>
                                        <textarea
                                            value={categoryForm.data.description}
                                            onChange={(e) => categoryForm.setData('description', e.target.value)}
                                            rows={3}
                                            placeholder="Optional description for this fee category"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-orange transition-all resize-none"
                                        />
                                    </div>

                                    {/* Type */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Fee Type <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={categoryForm.data.is_universal ? 'true' : 'false'}
                                            onChange={(e) => categoryForm.setData('is_universal', e.target.value === 'true')}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-orange transition-all"
                                            disabled={editingCategory !== null}
                                        >
                                            <option value="true">Universal (Same for all grades)</option>
                                            <option value="false">Grade-Specific (Varies by grade)</option>
                                        </select>
                                        {editingCategory && (
                                            <p className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                                ℹ️ Fee type cannot be changed after creation
                                            </p>
                                        )}
                                    </div>

                                    {/* Active Checkbox */}
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <input
                                            type="checkbox"
                                            id="is_active"
                                            checked={categoryForm.data.is_active}
                                            onChange={(e) => categoryForm.setData('is_active', e.target.checked)}
                                            className="w-5 h-5 text-orange focus:ring-orange border-gray-300 rounded"
                                        />
                                        <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                                            Set as active category
                                        </label>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6 pt-6 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCategoryModal(false);
                                            categoryForm.reset();
                                        }}
                                        className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={categoryForm.processing}
                                        className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-orange hover:bg-orange-dark text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        {categoryForm.processing ? 'Saving...' : (editingCategory ? 'Update Category' : 'Create Category')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Amount Modal */}
                {showAmountModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
                            <div className="bg-gradient-to-r from-orange to-orange-dark px-6 py-4 rounded-t-xl">
                                <h2 className="text-xl font-bold text-white">
                                    {editingAmount ? 'Edit Fee Amount' : 'Add Fee Amount'}
                                </h2>
                                <p className="text-sm text-white/90 mt-1">
                                    {selectedCategoryForAmount?.name}
                                </p>
                            </div>
                            
                            <form onSubmit={handleAmountSubmit} className="p-6">
                                <div className="space-y-4">
                                    {/* Grade Range (only for grade-specific) */}
                                    {!selectedCategoryForAmount?.is_universal && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Grade Range <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={amountForm.data.grade_range}
                                                onChange={(e) => amountForm.setData('grade_range', e.target.value)}
                                                placeholder="e.g., PP1-PP2, 1-3, 4-5"
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-orange transition-all"
                                                required
                                            />
                                            <p className="mt-2 text-xs text-gray-500 bg-blue-50 p-2 rounded">
                                                💡 Examples: <span className="font-mono font-semibold">PP1-PP2</span>, <span className="font-mono font-semibold">1-3</span>, <span className="font-mono font-semibold">4-5</span>, <span className="font-mono font-semibold">6-8</span>
                                            </p>
                                            {amountForm.errors.grade_range && (
                                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                                    <AlertCircle className="w-4 h-4" />
                                                    {amountForm.errors.grade_range}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Amount */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Amount (KSh) <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                                                KSh
                                            </span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={amountForm.data.amount}
                                                onChange={(e) => amountForm.setData('amount', e.target.value)}
                                                placeholder="0.00"
                                                className="w-full pl-14 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-orange transition-all font-mono text-lg"
                                                required
                                            />
                                        </div>
                                        {amountForm.errors.amount && (
                                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                                <AlertCircle className="w-4 h-4" />
                                                {amountForm.errors.amount}
                                            </p>
                                        )}
                                    </div>

                                    {/* Active Checkbox */}
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <input
                                            type="checkbox"
                                            id="amount_is_active"
                                            checked={amountForm.data.is_active}
                                            onChange={(e) => amountForm.setData('is_active', e.target.checked)}
                                            className="w-5 h-5 text-orange focus:ring-orange border-gray-300 rounded"
                                        />
                                        <label htmlFor="amount_is_active" className="text-sm font-medium text-gray-700">
                                            Set as active fee amount
                                        </label>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6 pt-6 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAmountModal(false);
                                            amountForm.reset();
                                        }}
                                        className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={amountForm.processing}
                                        className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-orange hover:bg-orange-dark text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        {amountForm.processing ? 'Saving...' : (editingAmount ? 'Update Amount' : 'Add Amount')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}