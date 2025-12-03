import React, { useState } from "react";
import { Head, Link, router, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    Plus,
    Edit,
    Trash2,
    Search,
    DollarSign,
    X,
    Save,
    AlertCircle,
} from "lucide-react";
import Badge from "@/Components/UI/Badge";
import ConfirmationModal from "@/Components/ConfirmationModal";

export default function Index({
    auth,
    feeCategories,
    academicYears,
    activeYear,
    filters,
}) {
    const [search, setSearch] = useState(filters.search || "");
    const [typeFilter, setTypeFilter] = useState(filters.type || "");
    const [statusFilter, setStatusFilter] = useState(filters.status || "");
    const [selectedYear, setSelectedYear] = useState(activeYear?.id || "");

    const [deleteModal, setDeleteModal] = useState({
        show: false,
        id: null,
        name: "",
        type: "category",
    });
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showAmountModal, setShowAmountModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [editingAmount, setEditingAmount] = useState(null);
    const [selectedCategoryForAmount, setSelectedCategoryForAmount] =
        useState(null);

    // Form for creating/editing fee categories
    const categoryForm = useForm({
        name: "",
        description: "",
        is_universal: true,
        is_active: true,
    });

    // Form for creating/editing fee amounts
    const amountForm = useForm({
        fee_category_id: "",
        academic_year_id: selectedYear,
        grade_range: "",
        amount: "",
        is_active: true,
    });

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route("fee-categories.index"),
            {
                search,
                type: typeFilter,
                status: statusFilter,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleFilterChange = (filterType, value) => {
        router.get(
            route("fee-categories.index"),
            {
                search,
                type: filterType === "type" ? value : typeFilter,
                status: filterType === "status" ? value : statusFilter,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleYearChange = (yearId) => {
        setSelectedYear(yearId);
        router.get(
            route("fee-categories.index"),
            {
                search,
                type: typeFilter,
                status: statusFilter,
                year: yearId,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const openCreateCategoryModal = () => {
        categoryForm.reset();
        setEditingCategory(null);
        setShowCategoryModal(true);
    };

    const openEditCategoryModal = (category) => {
        categoryForm.setData({
            name: category.name,
            description: category.description || "",
            is_universal: category.is_universal,
            is_active: category.is_active,
        });
        setEditingCategory(category);
        setShowCategoryModal(true);
    };

    const handleCategorySubmit = (e) => {
        e.preventDefault();

        if (editingCategory) {
            categoryForm.put(
                route("fee-categories.update", editingCategory.id),
                {
                    onSuccess: () => {
                        setShowCategoryModal(false);
                        categoryForm.reset();
                    },
                }
            );
        } else {
            categoryForm.post(route("fee-categories.store"), {
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
            grade_range: category.is_universal ? null : "",
            amount: "",
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
            grade_range: amount.grade_range || "",
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
            amountForm.put(route("fee-amounts.update", editingAmount.id), {
                onSuccess: () => {
                    setShowAmountModal(false);
                    amountForm.reset();
                },
            });
        } else {
            amountForm.post(route("fee-amounts.store"), {
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
            type: "category",
        });
    };

    const handleDeleteAmount = (amount, categoryName) => {
        setDeleteModal({
            show: true,
            id: amount.id,
            name: `${categoryName} - ${amount.grade_range || "All Grades"}`,
            type: "amount",
        });
    };

    const confirmDelete = () => {
        if (deleteModal.type === "category") {
            router.delete(route("fee-categories.destroy", deleteModal.id), {
                onSuccess: () => {
                    setDeleteModal({
                        show: false,
                        id: null,
                        name: "",
                        type: "category",
                    });
                },
            });
        } else {
            router.delete(route("fee-amounts.destroy", deleteModal.id), {
                onSuccess: () => {
                    setDeleteModal({
                        show: false,
                        id: null,
                        name: "",
                        type: "amount",
                    });
                },
            });
        }
    };

    return (
        <AuthenticatedLayout header="Fee Categories">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                        <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                            Fee Categories
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-600 mt-0.5 font-medium">
                            Manage universal and grade-specific fees
                        </p>
                    </div>
                </div>

                <button
                    onClick={openCreateCategoryModal}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 sm:px-5 sm:py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl hover:shadow-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-md whitespace-nowrap"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add Category</span>
                </button>
            </div>
            <div className="py-4 sm:py-6">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
                    {/* Filters */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                        <div className="space-y-3 sm:space-y-4">
                            {/* Search - Full Width on Mobile */}
                            <div>
                                <form
                                    onSubmit={handleSearch}
                                    className="relative"
                                >
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        placeholder="Search categories..."
                                        className="w-full pl-10 pr-4 py-3 sm:py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-medium"
                                    />
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                </form>
                            </div>

                            {/* Type & Status Filters - Side by Side on Mobile */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <select
                                        value={typeFilter}
                                        onChange={(e) => {
                                            setTypeFilter(e.target.value);
                                            handleFilterChange(
                                                "type",
                                                e.target.value
                                            );
                                        }}
                                        className="w-full px-3 py-3 sm:py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-medium text-sm"
                                    >
                                        <option value="">All Types</option>
                                        <option value="universal">
                                            Universal
                                        </option>
                                        <option value="grade_specific">
                                            Grade Specific
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => {
                                            setStatusFilter(e.target.value);
                                            handleFilterChange(
                                                "status",
                                                e.target.value
                                            );
                                        }}
                                        className="w-full px-3 py-3 sm:py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-medium text-sm"
                                    >
                                        <option value="">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">
                                            Inactive
                                        </option>
                                    </select>
                                </div>
                            </div>

                            {/* Academic Year Selector */}
                            {academicYears && academicYears.length > 0 && (
                                <div className="pt-3 border-t border-gray-200">
                                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                                        Academic Year
                                    </label>
                                    <select
                                        value={selectedYear}
                                        onChange={(e) =>
                                            handleYearChange(e.target.value)
                                        }
                                        className="w-full px-4 py-3 sm:py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-bold"
                                    >
                                        {academicYears.map((year) => (
                                            <option
                                                key={year.id}
                                                value={year.id}
                                            >
                                                {year.year}{" "}
                                                {year.is_active && "(Active)"}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Fee Categories List */}
                    {feeCategories && feeCategories.length > 0 ? (
                        <div className="space-y-4">
                            {feeCategories.map((category) => (
                                <div
                                    key={category.id}
                                    className="bg-white rounded-2xl shadow-md border-2 border-gray-200 overflow-hidden"
                                >
                                    {/* Category Header */}
                                    <div className="bg-gradient-to-r from-navy via-navy/95 to-navy/90 px-4 sm:px-6 py-4">
                                        <div className="flex flex-col gap-3">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-base sm:text-lg font-black text-white mb-2 truncate">
                                                    {category.name}
                                                </h3>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge
                                                        variant="status"
                                                        value={
                                                            category.is_universal
                                                                ? "universal"
                                                                : "grade-specific"
                                                        }
                                                    />
                                                    <Badge
                                                        variant="status"
                                                        value={
                                                            category.is_active
                                                                ? "active"
                                                                : "inactive"
                                                        }
                                                    />
                                                </div>
                                                {category.description && (
                                                    <p className="text-sm text-white/90 mt-2 font-medium">
                                                        {category.description}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() =>
                                                        openEditCategoryModal(
                                                            category
                                                        )
                                                    }
                                                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-all font-bold border-2 border-white/20"
                                                    title="Edit category"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                    <span>Edit</span>
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDeleteCategory(
                                                            category
                                                        )
                                                    }
                                                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-bold shadow-md"
                                                    title="Delete category"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    <span>Delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Fee Amounts Section */}
                                    <div className="p-4 sm:p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-xs sm:text-sm font-black text-gray-700 uppercase tracking-wider">
                                                Fee Amounts •{" "}
                                                {activeYear?.year ||
                                                    "Selected Year"}
                                            </h4>
                                            <button
                                                onClick={() =>
                                                    openCreateAmountModal(
                                                        category
                                                    )
                                                }
                                                className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-orange-600 hover:text-orange-700 font-bold"
                                            >
                                                <Plus className="w-4 h-4" />
                                                <span className="hidden xs:inline">
                                                    Add Amount
                                                </span>
                                                <span className="xs:hidden">
                                                    Add
                                                </span>
                                            </button>
                                        </div>

                                        {category.fee_amounts &&
                                        category.fee_amounts.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {category.fee_amounts.map(
                                                    (amount) => (
                                                        <div
                                                            key={amount.id}
                                                            className="relative p-4 bg-gradient-to-br from-orange-50 to-white rounded-xl border-2 border-orange-200 hover:border-orange-400 transition-all shadow-sm"
                                                        >
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div className="flex-1">
                                                                    {amount.grade_range ? (
                                                                        <div className="inline-flex items-center px-3 py-1.5 bg-navy rounded-lg mb-2">
                                                                            <span className="text-xs font-black text-white uppercase">
                                                                                Grade{" "}
                                                                                {
                                                                                    amount.grade_range
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="inline-flex items-center px-3 py-1.5 bg-green-600 rounded-lg mb-2">
                                                                            <span className="text-xs font-black text-white uppercase">
                                                                                All
                                                                                Grades
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <button
                                                                        onClick={() =>
                                                                            openEditAmountModal(
                                                                                category,
                                                                                amount
                                                                            )
                                                                        }
                                                                        className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                                        title="Edit amount"
                                                                    >
                                                                        <Edit className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() =>
                                                                            handleDeleteAmount(
                                                                                amount,
                                                                                category.name
                                                                            )
                                                                        }
                                                                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                        title="Delete amount"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="text-xl sm:text-2xl font-black text-orange-600">
                                                                KSh{" "}
                                                                {parseFloat(
                                                                    amount.amount
                                                                ).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 sm:py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                                                <DollarSign className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2" />
                                                <p className="text-sm font-bold text-gray-500">
                                                    No fee amounts defined
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1 font-medium">
                                                    Click "Add Amount" to create
                                                    one
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 p-8 sm:p-12 text-center">
                            <DollarSign className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-base sm:text-lg font-black text-gray-900 mb-2">
                                No Fee Categories Found
                            </h3>
                            <p className="text-sm text-gray-500 mb-6 font-medium">
                                Create your first fee category to get started
                            </p>
                            <button
                                onClick={openCreateCategoryModal}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl hover:shadow-lg transition-all shadow-md"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Add Category</span>
                            </button>
                        </div>
                    )}

                    {/* Delete Confirmation Modal */}
                    <ConfirmationModal
                        show={deleteModal.show}
                        onClose={() =>
                            setDeleteModal({
                                show: false,
                                id: null,
                                name: "",
                                type: "category",
                            })
                        }
                        onConfirm={confirmDelete}
                        title={
                            deleteModal.type === "category"
                                ? "Delete Fee Category"
                                : "Delete Fee Amount"
                        }
                        message={
                            deleteModal.type === "category"
                                ? `Are you sure you want to delete "${deleteModal.name}"? This will also delete all associated fee amounts. This action cannot be undone.`
                                : `Are you sure you want to delete the fee amount for "${deleteModal.name}"? This action cannot be undone.`
                        }
                        confirmText="Delete"
                        confirmButtonClass="bg-red-600 hover:bg-red-700"
                    />

                    {/* Category Modal */}
                    {showCategoryModal && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
                            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl my-8">
                                <div className="bg-gradient-to-r from-navy to-navy/95 px-5 sm:px-6 py-4 rounded-t-2xl">
                                    <h2 className="text-lg sm:text-xl font-black text-white">
                                        {editingCategory
                                            ? "Edit Fee Category"
                                            : "Create Fee Category"}
                                    </h2>
                                </div>

                                <form
                                    onSubmit={handleCategorySubmit}
                                    className="p-5 sm:p-6"
                                >
                                    <div className="space-y-4">
                                        {/* Name */}
                                        <div>
                                            <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">
                                                Category Name{" "}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                value={categoryForm.data.name}
                                                onChange={(e) =>
                                                    categoryForm.setData(
                                                        "name",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="e.g., Sports, Food, Transport"
                                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-medium"
                                                required
                                            />
                                            {categoryForm.errors.name && (
                                                <p className="mt-2 text-sm text-red-600 flex items-center gap-1 font-bold">
                                                    <AlertCircle className="w-4 h-4" />
                                                    {categoryForm.errors.name}
                                                </p>
                                            )}
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">
                                                Description
                                            </label>
                                            <textarea
                                                value={
                                                    categoryForm.data
                                                        .description
                                                }
                                                onChange={(e) =>
                                                    categoryForm.setData(
                                                        "description",
                                                        e.target.value
                                                    )
                                                }
                                                rows={3}
                                                placeholder="Optional description for this fee category"
                                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none font-medium"
                                            />
                                        </div>

                                        {/* Type */}
                                        <div>
                                            <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">
                                                Fee Type{" "}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </label>
                                            <select
                                                value={
                                                    categoryForm.data
                                                        .is_universal
                                                        ? "true"
                                                        : "false"
                                                }
                                                onChange={(e) =>
                                                    categoryForm.setData(
                                                        "is_universal",
                                                        e.target.value ===
                                                            "true"
                                                    )
                                                }
                                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-bold"
                                                disabled={
                                                    editingCategory !== null
                                                }
                                            >
                                                <option value="true">
                                                    Universal (Same for all
                                                    grades)
                                                </option>
                                                <option value="false">
                                                    Grade-Specific (Varies by
                                                    grade)
                                                </option>
                                            </select>
                                            {editingCategory && (
                                                <p className="mt-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg font-medium">
                                                    ℹ️ Fee type cannot be
                                                    changed after creation
                                                </p>
                                            )}
                                        </div>

                                        {/* Active Checkbox */}
                                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                                            <input
                                                type="checkbox"
                                                id="is_active"
                                                checked={
                                                    categoryForm.data.is_active
                                                }
                                                onChange={(e) =>
                                                    categoryForm.setData(
                                                        "is_active",
                                                        e.target.checked
                                                    )
                                                }
                                                className="w-5 h-5 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                            />
                                            <label
                                                htmlFor="is_active"
                                                className="text-sm font-bold text-gray-700"
                                            >
                                                Set as active category
                                            </label>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t-2 border-gray-200">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowCategoryModal(false);
                                                categoryForm.reset();
                                            }}
                                            className="px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-bold transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={categoryForm.processing}
                                            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                                        >
                                            <Save className="w-4 h-4" />
                                            <span className="hidden xs:inline">
                                                {categoryForm.processing
                                                    ? "Saving..."
                                                    : editingCategory
                                                    ? "Update"
                                                    : "Create"}
                                            </span>
                                            <span className="xs:hidden">
                                                Save
                                            </span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Amount Modal */}
                    {showAmountModal && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
                            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl my-8">
                                <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-5 sm:px-6 py-4 rounded-t-2xl">
                                    <h2 className="text-lg sm:text-xl font-black text-white">
                                        {editingAmount
                                            ? "Edit Fee Amount"
                                            : "Add Fee Amount"}
                                    </h2>
                                    <p className="text-sm text-white/90 mt-1 font-bold">
                                        {selectedCategoryForAmount?.name}
                                    </p>
                                </div>

                                <form
                                    onSubmit={handleAmountSubmit}
                                    className="p-5 sm:p-6"
                                >
                                    <div className="space-y-4">
                                        {/* Grade Range (only for grade-specific) */}
                                        {!selectedCategoryForAmount?.is_universal && (
                                            <div>
                                                <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">
                                                    Grade Range{" "}
                                                    <span className="text-red-500">
                                                        *
                                                    </span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={
                                                        amountForm.data
                                                            .grade_range
                                                    }
                                                    onChange={(e) =>
                                                        amountForm.setData(
                                                            "grade_range",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="e.g., PP1-PP2, 1-3, 4-5"
                                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-medium"
                                                    required
                                                />
                                                <p className="mt-2 text-xs text-gray-500 bg-blue-50 p-3 rounded-lg font-medium">
                                                    💡 Examples:{" "}
                                                    <span className="font-mono font-bold">
                                                        PP1-PP2
                                                    </span>
                                                    ,{" "}
                                                    <span className="font-mono font-bold">
                                                        1-3
                                                    </span>
                                                    ,{" "}
                                                    <span className="font-mono font-bold">
                                                        4-5
                                                    </span>
                                                    ,{" "}
                                                    <span className="font-mono font-bold">
                                                        6-8
                                                    </span>
                                                </p>
                                                {amountForm.errors
                                                    .grade_range && (
                                                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1 font-bold">
                                                        <AlertCircle className="w-4 h-4" />
                                                        {
                                                            amountForm.errors
                                                                .grade_range
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Amount */}
                                        <div>
                                            <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">
                                                Amount (KSh){" "}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-black">
                                                    KSh
                                                </span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={
                                                        amountForm.data.amount
                                                    }
                                                    onChange={(e) =>
                                                        amountForm.setData(
                                                            "amount",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="0.00"
                                                    className="w-full pl-14 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-mono text-lg font-bold"
                                                    required
                                                />
                                            </div>
                                            {amountForm.errors.amount && (
                                                <p className="mt-2 text-sm text-red-600 flex items-center gap-1 font-bold">
                                                    <AlertCircle className="w-4 h-4" />
                                                    {amountForm.errors.amount}
                                                </p>
                                            )}
                                        </div>

                                        {/* Active Checkbox */}
                                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                                            <input
                                                type="checkbox"
                                                id="amount_is_active"
                                                checked={
                                                    amountForm.data.is_active
                                                }
                                                onChange={(e) =>
                                                    amountForm.setData(
                                                        "is_active",
                                                        e.target.checked
                                                    )
                                                }
                                                className="w-5 h-5 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                            />
                                            <label
                                                htmlFor="amount_is_active"
                                                className="text-sm font-bold text-gray-700"
                                            >
                                                Set as active fee amount
                                            </label>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t-2 border-gray-200">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowAmountModal(false);
                                                amountForm.reset();
                                            }}
                                            className="px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-bold transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={amountForm.processing}
                                            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                                        >
                                            <Save className="w-4 h-4" />
                                            <span className="hidden xs:inline">
                                                {amountForm.processing
                                                    ? "Saving..."
                                                    : editingAmount
                                                    ? "Update"
                                                    : "Add"}
                                            </span>
                                            <span className="xs:hidden">
                                                Save
                                            </span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
