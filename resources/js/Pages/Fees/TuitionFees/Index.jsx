import React, { useState } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    Plus,
    Edit,
    Trash2,
    Search,
    X,
    Save,
    GraduationCap,
    DollarSign,
    ToggleLeft,
    ToggleRight,
    List,
    Calendar,
} from "lucide-react";
import Badge from "@/Components/UI/Badge";
import ConfirmationModal from "@/Components/ConfirmationModal";
import { SwipeableListItem, ExpandableCard, MobileListContainer } from '@/Components/Mobile';

export default function Index({ auth, tuitionFees, academicYears, grades, selectedYear, filters }) {
    const [search, setSearch] = useState(filters.search || "");
    const [statusFilter, setStatusFilter] = useState(filters.status || "");
    const [selectedYearId, setSelectedYearId] = useState(filters.year || selectedYear?.id);

    const [deleteModal, setDeleteModal] = useState({
        show: false,
        id: null,
        gradeName: "",
    });
    const [showFeeModal, setShowFeeModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [editingFee, setEditingFee] = useState(null);

    // Form for creating/editing single tuition fee
    const feeForm = useForm({
        grade_id: "",
        academic_year_id: selectedYear?.id || "",
        amount_full_day: "",
        amount_half_day: "",
        is_active: true,
    });

    // Form for bulk creating tuition fees
    const bulkForm = useForm({
        academic_year_id: selectedYear?.id || "",
        fees: [],
    });

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route("tuition-fees.index"),
            {
                search,
                status: statusFilter,
                year: selectedYearId,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleFilterChange = (filterType, value) => {
        if (filterType === 'status') {
            setStatusFilter(value);
        } else if (filterType === 'year') {
            setSelectedYearId(value);
        }
        
        router.get(
            route("tuition-fees.index"),
            {
                search,
                status: filterType === 'status' ? value : statusFilter,
                year: filterType === 'year' ? value : selectedYearId,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const openCreateModal = () => {
        setEditingFee(null);
        feeForm.reset();
        feeForm.setData({
            grade_id: "",
            academic_year_id: selectedYear?.id || "",
            amount_full_day: "",
            amount_half_day: "",
            is_active: true,
        });
        setShowFeeModal(true);
    };

    const openEditModal = (fee) => {
        setEditingFee(fee);
        feeForm.setData({
            grade_id: fee.grade_id,
            academic_year_id: fee.academic_year_id,
            amount_full_day: fee.amount_full_day,
            amount_half_day: fee.amount_half_day,
            is_active: fee.is_active,
        });
        setShowFeeModal(true);
    };

    const openBulkModal = () => {
        // Initialize fees array with all grades
        const initialFees = grades.map(grade => ({
            grade_id: grade.id,
            grade_name: grade.name,
            grade_level: grade.level,
            amount_full_day: "",
            amount_half_day: "",
        }));

        bulkForm.setData({
            academic_year_id: selectedYear?.id || "",
            fees: initialFees,
        });
        setShowBulkModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (editingFee) {
            feeForm.put(route("tuition-fees.update", editingFee.id), {
                onSuccess: () => {
                    setShowFeeModal(false);
                    feeForm.reset();
                },
            });
        } else {
            feeForm.post(route("tuition-fees.store"), {
                onSuccess: () => {
                    setShowFeeModal(false);
                    feeForm.reset();
                },
            });
        }
    };

    const handleBulkSubmit = (e) => {
        e.preventDefault();

        // Filter out fees with empty amounts
        const validFees = bulkForm.data.fees.filter(
            fee => fee.amount_full_day && fee.amount_half_day
        );

        if (validFees.length === 0) {
            alert("Please enter at least one fee.");
            return;
        }

        bulkForm.setData('fees', validFees);

        bulkForm.post(route("tuition-fees.bulk-store"), {
            onSuccess: () => {
                setShowBulkModal(false);
                bulkForm.reset();
            },
        });
    };

    const handleDelete = () => {
        router.delete(route("tuition-fees.destroy", deleteModal.id), {
            onSuccess: () => {
                setDeleteModal({ show: false, id: null, gradeName: "" });
            },
        });
    };

    const handleToggleStatus = (feeId) => {
        router.post(route("tuition-fees.toggle-status", feeId));
    };

    const updateBulkFee = (index, field, value) => {
        const updatedFees = [...bulkForm.data.fees];
        updatedFees[index][field] = value;
        bulkForm.setData('fees', updatedFees);
    };

    const applyPercentageIncrease = () => {
        const percentage = prompt("Enter percentage increase (e.g., 5 for 5%):");
        if (!percentage || isNaN(percentage)) return;

        const multiplier = 1 + (parseFloat(percentage) / 100);
        const updatedFees = bulkForm.data.fees.map(fee => ({
            ...fee,
            amount_full_day: fee.amount_full_day ? Math.round(fee.amount_full_day * multiplier) : "",
            amount_half_day: fee.amount_half_day ? Math.round(fee.amount_half_day * multiplier) : "",
        }));

        bulkForm.setData('fees', updatedFees);
    };

    // Group fees by grade level
    const groupedFees = tuitionFees.reduce((acc, fee) => {
        const level = fee.grade_level || 'Other';
        if (!acc[level]) acc[level] = [];
        acc[level].push(fee);
        return acc;
    }, {});

    const levelOrder = ['PP', 'Lower Primary', 'Upper Primary', 'Junior Secondary', 'Other'];
    const sortedLevels = Object.keys(groupedFees).sort((a, b) => {
        return levelOrder.indexOf(a) - levelOrder.indexOf(b);
    });

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Tuition Fees" />

            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 sm:py-8 px-3 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-t-2xl shadow-lg p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-xl">
                                    <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                                        Tuition Fees
                                    </h1>
                                    <p className="text-orange-100 text-xs sm:text-sm mt-1">
                                        Manage tuition fees per grade and academic year
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                                <button
                                    onClick={openBulkModal}
                                    className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl transition-all duration-200 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl min-h-[48px] border border-white/20 hover:border-white/30"
                                >
                                    <List className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span>Bulk Add</span>
                                </button>
                                <button
                                    onClick={openCreateModal}
                                    className="flex items-center justify-center gap-2 bg-white text-orange-600 hover:bg-orange-50 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl transition-all duration-200 text-sm sm:text-base font-bold shadow-lg hover:shadow-xl min-h-[48px] hover:scale-105 active:scale-95"
                                >
                                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span>Add Tuition Fee</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white border-x border-gray-200 p-4">
                        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                            {/* Academic Year Filter */}
                            <select
                                value={selectedYearId || ""}
                                onChange={(e) => handleFilterChange('year', e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base min-h-[48px]"
                            >
                                <option value="">All Years</option>
                                {academicYears.map((year) => (
                                    <option key={year.id} value={year.id}>
                                        {year.year}
                                    </option>
                                ))}
                            </select>

                            {/* Search Input */}
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    placeholder="Search by grade name..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base min-h-[48px]"
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                            </div>

                            {/* Status Filter */}
                            <select
                                value={statusFilter}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base min-h-[48px]"
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>

                            {/* Search Button */}
                            <button
                                type="submit"
                                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg text-sm sm:text-base min-h-[48px]"
                            >
                                Search
                            </button>
                        </form>
                    </div>

                    {/* Content */}
                    <div className="bg-white rounded-b-2xl shadow-lg p-4 sm:p-6">
                        {tuitionFees.length === 0 ? (
                            <div className="text-center py-12">
                                <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    No tuition fees found
                                </h3>
                                <p className="text-gray-500 mb-6">
                                    {filters.search || filters.status
                                        ? "Try adjusting your filters"
                                        : "Get started by adding your first tuition fee"}
                                </p>
                                {!filters.search && !filters.status && (
                                    <button
                                        onClick={openCreateModal}
                                        className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Add First Tuition Fee
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                {/* Mobile List View */}
                                <div className="block md:hidden">
                                    <MobileListContainer
                                        emptyState={{
                                            icon: GraduationCap,
                                            title: 'No tuition fees found',
                                            message: 'Try adjusting your filters',
                                        }}
                                    >
                                        {tuitionFees.map((fee) => (
                                            <MobileTuitionFeeItem
                                                key={fee.id}
                                                fee={fee}
                                                onEdit={openEditModal}
                                                onDelete={(id, gradeName) =>
                                                    setDeleteModal({ show: true, id, gradeName })
                                                }
                                                onToggleStatus={handleToggleStatus}
                                            />
                                        ))}
                                    </MobileListContainer>
                                </div>

                                {/* Desktop Grid View */}
                                <div className="hidden md:block">
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
                                        {tuitionFees.map((fee) => (
                                            <DesktopFeeCard
                                                key={fee.id}
                                                fee={fee}
                                                onEdit={openEditModal}
                                                onDelete={(id, gradeName) =>
                                                    setDeleteModal({ show: true, id, gradeName })
                                                }
                                                onToggleStatus={handleToggleStatus}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {showFeeModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-white">
                                    {editingFee ? "Edit Tuition Fee" : "Add Tuition Fee"}
                                </h2>
                                <button
                                    onClick={() => setShowFeeModal(false)}
                                    className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Academic Year */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Academic Year *
                                </label>
                                <select
                                    value={feeForm.data.academic_year_id}
                                    onChange={(e) => feeForm.setData("academic_year_id", e.target.value)}
                                    disabled={editingFee}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100"
                                    required
                                >
                                    <option value="">Select Year</option>
                                    {academicYears.map((year) => (
                                        <option key={year.id} value={year.id}>
                                            {year.year}
                                        </option>
                                    ))}
                                </select>
                                {feeForm.errors.academic_year_id && (
                                    <p className="text-red-500 text-sm mt-1">{feeForm.errors.academic_year_id}</p>
                                )}
                            </div>

                            {/* Grade */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Grade *
                                </label>
                                <select
                                    value={feeForm.data.grade_id}
                                    onChange={(e) => feeForm.setData("grade_id", e.target.value)}
                                    disabled={editingFee}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100"
                                    required
                                >
                                    <option value="">Select Grade</option>
                                    {grades.map((grade) => (
                                        <option key={grade.id} value={grade.id}>
                                            {grade.name}
                                        </option>
                                    ))}
                                </select>
                                {feeForm.errors.grade_id && (
                                    <p className="text-red-500 text-sm mt-1">{feeForm.errors.grade_id}</p>
                                )}
                            </div>

                            {/* Full-Day Amount */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Full-Day Amount (KSh) *
                                </label>
                                <input
                                    type="number"
                                    value={feeForm.data.amount_full_day}
                                    onChange={(e) => feeForm.setData("amount_full_day", e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="e.g., 35000"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                                {feeForm.errors.amount_full_day && (
                                    <p className="text-red-500 text-sm mt-1">{feeForm.errors.amount_full_day}</p>
                                )}
                            </div>

                            {/* Half-Day Amount */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Half-Day Amount (KSh) *
                                </label>
                                <input
                                    type="number"
                                    value={feeForm.data.amount_half_day}
                                    onChange={(e) => feeForm.setData("amount_half_day", e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="e.g., 20000"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                                {feeForm.errors.amount_half_day && (
                                    <p className="text-red-500 text-sm mt-1">{feeForm.errors.amount_half_day}</p>
                                )}
                            </div>

                            {/* Active Status */}
                            {editingFee && (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={feeForm.data.is_active}
                                        onChange={(e) => feeForm.setData("is_active", e.target.checked)}
                                        className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                                    />
                                    <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                                        Active
                                    </label>
                                </div>
                            )}

                            {/* Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowFeeModal(false)}
                                    className="flex-1 px-4 py-3 min-h-[48px] border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={feeForm.processing}
                                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-3 min-h-[48px] rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    {feeForm.processing
                                        ? "Saving..."
                                        : editingFee
                                        ? "Update Fee"
                                        : "Create Fee"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bulk Create Modal */}
            {showBulkModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-t-2xl sticky top-0 z-10">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-white">Bulk Add Tuition Fees</h2>
                                <button
                                    onClick={() => setShowBulkModal(false)}
                                    className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleBulkSubmit} className="p-6 space-y-4">
                            {/* Academic Year */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Academic Year *
                                </label>
                                <select
                                    value={bulkForm.data.academic_year_id}
                                    onChange={(e) => bulkForm.setData("academic_year_id", e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">Select Year</option>
                                    {academicYears.map((year) => (
                                        <option key={year.id} value={year.id}>
                                            {year.year}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Percentage Increase Button */}
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={applyPercentageIncrease}
                                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                                >
                                    Apply % Increase to All
                                </button>
                            </div>

                            {/* Fees Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                                                Grade
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                                                Full-Day (KSh)
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                                                Half-Day (KSh)
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bulkForm.data.fees.map((fee, index) => (
                                            <tr key={fee.grade_id} className="border-b hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                    {fee.grade_name}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="number"
                                                        value={fee.amount_full_day}
                                                        onChange={(e) =>
                                                            updateBulkFee(index, "amount_full_day", e.target.value)
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                                                        placeholder="0"
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="number"
                                                        value={fee.amount_half_day}
                                                        onChange={(e) =>
                                                            updateBulkFee(index, "amount_half_day", e.target.value)
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                                                        placeholder="0"
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <p className="text-sm text-gray-500 italic">
                                * Leave amounts empty for grades you don't want to add
                            </p>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowBulkModal(false)}
                                    className="flex-1 px-4 py-3 min-h-[48px] border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={bulkForm.processing}
                                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-3 min-h-[48px] rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    {bulkForm.processing ? "Saving..." : "Create All Fees"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                show={deleteModal.show}
                onClose={() => setDeleteModal({ show: false, id: null, gradeName: "" })}
                onConfirm={handleDelete}
                title="Delete Tuition Fee"
                message={`Are you sure you want to delete the tuition fee for ${deleteModal.gradeName}? This action cannot be undone.`}
                confirmText="Delete"
                confirmButtonClass="bg-red-600 hover:bg-red-700"
            />
        </AuthenticatedLayout>
    );
}

// Mobile Tuition Fee Item Component - Swipeable + Expandable
function MobileTuitionFeeItem({ fee, onEdit, onDelete, onToggleStatus }) {
    // Build swipe actions - only Edit and Delete
    const primaryActions = [
        { icon: Edit, label: 'Edit', onClick: () => onEdit(fee) },
        { icon: Trash2, label: 'Delete', onClick: () => onDelete(fee.id, fee.grade_name) },
    ];

    return (
        <SwipeableListItem
            primaryActions={primaryActions}
        >
            <ExpandableCard
                className={fee.is_active ? '' : 'opacity-60'}
                header={
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Status Badge - Left Side */}
                        <div className="flex-shrink-0 pt-0.5">
                            <Badge variant={fee.is_active ? "success" : "secondary"} size="sm">
                                {fee.is_active ? "Active" : "Inactive"}
                            </Badge>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                            {/* Grade Name */}
                            <h3 className="text-base font-bold text-gray-900 truncate mb-2">
                                {fee.grade_name}
                            </h3>

                            {/* Academic Year & Toggle Button */}
                            <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                    <span>{fee.academic_year}</span>
                                </div>

                                {/* Toggle Button - Shows Current State */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent card expansion when clicking toggle
                                        onToggleStatus(fee.id);
                                    }}
                                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-colors ${
                                        fee.is_active
                                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                                    }`}
                                >
                                    {fee.is_active ? (
                                        <ToggleRight className="w-3.5 h-3.5" />
                                    ) : (
                                        <ToggleLeft className="w-3.5 h-3.5" />
                                    )}
                                    <span>{fee.is_active ? 'Active' : 'Inactive'}</span>
                                </button>
                            </div>

                            {/* Pricing Details - Always Visible */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                                    <span className="text-xs font-medium text-gray-600">Full-Day</span>
                                    <span className="text-sm font-semibold text-green-700">
                                        KSh {fee.amount_full_day.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                                    <span className="text-xs font-medium text-gray-600">Half-Day</span>
                                    <span className="text-sm font-semibold text-blue-700">
                                        KSh {fee.amount_half_day.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                }
            >
                {/* Expanded Details - Action Buttons */}
                <div className="px-4 pb-4 pt-2">
                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => onEdit(fee)}
                            className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg text-xs font-semibold hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-sm hover:shadow active:scale-95"
                        >
                            <Edit className="w-3.5 h-3.5" />
                            Edit
                        </button>
                        <button
                            onClick={() => onDelete(fee.id, fee.grade_name)}
                            className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg text-xs font-semibold hover:from-red-700 hover:to-red-800 transition-all shadow-sm hover:shadow active:scale-95"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                        </button>
                    </div>
                </div>
            </ExpandableCard>
        </SwipeableListItem>
    );
}

// Desktop Fee Card Component
function DesktopFeeCard({ fee, onEdit, onDelete, onToggleStatus }) {
    return (
        <div className={`rounded-2xl shadow-md border-2 transition-all duration-200 ${
            fee.is_active
                ? "bg-white border-gray-200 hover:shadow-lg hover:border-orange-300"
                : "bg-gray-50 border-gray-300 opacity-75"
        }`}>
            {/* Card Header */}
            <div className="p-4 md:p-5 border-b border-gray-200">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            fee.is_active
                                ? "bg-gradient-to-br from-orange-500 to-orange-600"
                                : "bg-gray-400"
                        }`}>
                            <GraduationCap className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-base md:text-lg font-bold text-gray-900 break-words leading-tight">
                                {fee.grade_name}
                            </h3>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                <Calendar className="w-3 h-3 flex-shrink-0" />
                                <span>{fee.academic_year}</span>
                            </div>
                        </div>
                    </div>

                    {/* Toggle Button */}
                    <button
                        onClick={() => onToggleStatus(fee.id)}
                        className={`flex-shrink-0 w-10 h-10 md:w-11 md:h-11 rounded-lg flex items-center justify-center transition-all duration-200 ${
                            fee.is_active
                                ? "bg-green-500 hover:bg-green-600"
                                : "bg-red-500 hover:bg-red-600"
                        }`}
                        title={fee.is_active ? "Click to Deactivate" : "Click to Activate"}
                    >
                        {fee.is_active ? (
                            <ToggleRight className="w-5 h-5 text-white" />
                        ) : (
                            <ToggleLeft className="w-5 h-5 text-white" />
                        )}
                    </button>
                </div>

                {/* Status Badge */}
                <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        fee.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                    }`}>
                        {fee.is_active ? "Active" : "Inactive"}
                    </span>
                </div>
            </div>

            {/* Card Body */}
            <div className="p-4 md:p-5 space-y-3">
                {/* Pricing */}
                <div className="space-y-2">
                    <div className={`flex items-center justify-between p-2.5 md:p-3 rounded-lg transition-colors ${
                        fee.is_active
                            ? "bg-green-50"
                            : "bg-gray-100"
                    }`}>
                        <span className={`text-sm font-medium ${
                            fee.is_active ? "text-gray-600" : "text-gray-500"
                        }`}>
                            Full-Day
                        </span>
                        <span className={`text-sm md:text-base font-semibold ${
                            fee.is_active ? "text-green-700" : "text-gray-600"
                        }`}>
                            KSh {fee.amount_full_day.toLocaleString()}
                        </span>
                    </div>
                    <div className={`flex items-center justify-between p-2.5 md:p-3 rounded-lg transition-colors ${
                        fee.is_active
                            ? "bg-blue-50"
                            : "bg-gray-100"
                    }`}>
                        <span className={`text-sm font-medium ${
                            fee.is_active ? "text-gray-600" : "text-gray-500"
                        }`}>
                            Half-Day
                        </span>
                        <span className={`text-sm md:text-base font-semibold ${
                            fee.is_active ? "text-blue-700" : "text-gray-600"
                        }`}>
                            KSh {fee.amount_half_day.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Card Footer - Actions */}
            <div className="p-4 md:p-5 pt-0 flex gap-2">
                <button
                    onClick={() => onEdit(fee)}
                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-3 rounded-lg transition-colors text-sm font-medium min-h-[48px]"
                >
                    <Edit className="w-4 h-4" />
                    Edit
                </button>
                <button
                    onClick={() => onDelete(fee.id, fee.grade_name)}
                    className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-3 py-3 rounded-lg transition-colors min-h-[48px]"
                    title="Delete"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

