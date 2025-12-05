import React, { useState } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    Plus,
    Edit,
    Trash2,
    Search,
    Bus,
    X,
    Save,
    AlertCircle,
    MapPin,
    DollarSign,
    Users,
    ToggleLeft,
    ToggleRight,
} from "lucide-react";
import Badge from "@/Components/UI/Badge";
import ConfirmationModal from "@/Components/ConfirmationModal";
import SwipeableListItem from "@/Components/Mobile/SwipeableListItem";
import ExpandableCard from "@/Components/Mobile/ExpandableCard";
import MobileListContainer from "@/Components/Mobile/MobileListContainer";

// Mobile Transport Route Item Component - Swipeable + Expandable
function MobileTransportRouteItem({ route, onEdit, onDelete, onToggleStatus }) {
    // Build swipe actions - only Edit and Delete
    const primaryActions = [
        { icon: Edit, label: 'Edit', onClick: () => onEdit(route) },
        { icon: Trash2, label: 'Delete', onClick: () => onDelete(route) },
    ];

    return (
        <SwipeableListItem
            primaryActions={primaryActions}
        >
            <ExpandableCard
                className={route.is_active ? '' : 'opacity-60'}
                header={
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Status Badge - Left Side */}
                        <div className="flex-shrink-0 pt-0.5">
                            <Badge variant={route.is_active ? "success" : "secondary"} size="sm">
                                {route.is_active ? "Active" : "Inactive"}
                            </Badge>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                            {/* Route Name */}
                            <h3 className="text-base font-bold text-gray-900 truncate mb-2">
                                {route.route_name}
                            </h3>

                            {/* Students Count & Toggle Button */}
                            <div className="flex items-center justify-between gap-2 mb-2">
                                {route.students_count > 0 ? (
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                        <Users className="w-3.5 h-3.5 text-gray-400" />
                                        <span>{route.students_count} Students</span>
                                    </div>
                                ) : (
                                    <div className="text-xs text-gray-400">No students</div>
                                )}

                                {/* Toggle Button - Shows Current State */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent card expansion when clicking toggle
                                        onToggleStatus(route);
                                    }}
                                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-colors ${
                                        route.is_active
                                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                                    }`}
                                >
                                    {route.is_active ? (
                                        <ToggleRight className="w-3.5 h-3.5" />
                                    ) : (
                                        <ToggleLeft className="w-3.5 h-3.5" />
                                    )}
                                    <span>{route.is_active ? 'Active' : 'Inactive'}</span>
                                </button>
                            </div>

                            {/* Pricing Details - Always Visible */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                                    <span className="text-xs font-medium text-gray-600">One-Way</span>
                                    <span className="text-sm font-semibold text-green-700">
                                        KSh {route.amount_one_way.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                                    <span className="text-xs font-medium text-gray-600">Two-Way</span>
                                    <span className="text-sm font-semibold text-blue-700">
                                        KSh {route.amount_two_way.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                }
            >
                {/* Expanded Details - Description & Action Buttons */}
                <div className="px-4 pb-4 pt-2 space-y-3">
                    {/* Description - If Available */}
                    {route.description && (
                        <div className="text-xs text-gray-600 leading-relaxed">
                            {route.description}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => onEdit(route)}
                            className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg text-xs font-semibold hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-sm hover:shadow active:scale-95"
                        >
                            <Edit className="w-3.5 h-3.5" />
                            Edit
                        </button>
                        <button
                            onClick={() => onDelete(route)}
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

// Desktop Transport Route Card Component
function DesktopTransportRouteCard({ route, onEdit, onDelete, onToggleStatus }) {
    return (
        <div className={`rounded-2xl shadow-md border-2 transition-all duration-200 ${
            route.is_active
                ? "bg-white border-gray-200 hover:shadow-lg hover:border-orange-300"
                : "bg-gray-50 border-gray-300 opacity-75"
        }`}>
            {/* Card Header */}
            <div className="p-4 md:p-5 border-b border-gray-200">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            route.is_active
                                ? "bg-gradient-to-br from-orange-500 to-orange-600"
                                : "bg-gray-400"
                        }`}>
                            <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-base md:text-lg font-bold text-gray-900 break-words leading-tight">
                                {route.route_name}
                            </h3>
                            {route.students_count > 0 && (
                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                    <Users className="w-3 h-3 flex-shrink-0" />
                                    <span>{route.students_count} Students</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Toggle Button */}
                    <button
                        onClick={() => onToggleStatus(route)}
                        className={`flex-shrink-0 w-10 h-10 md:w-11 md:h-11 rounded-lg flex items-center justify-center transition-all duration-200 ${
                            route.is_active
                                ? "bg-green-500 hover:bg-green-600"
                                : "bg-red-500 hover:bg-red-600"
                        }`}
                        title={route.is_active ? "Click to Deactivate" : "Click to Activate"}
                    >
                        {route.is_active ? (
                            <ToggleRight className="w-5 h-5 text-white" />
                        ) : (
                            <ToggleLeft className="w-5 h-5 text-white" />
                        )}
                    </button>
                </div>

                {/* Status Badge */}
                <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        route.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                    }`}>
                        {route.is_active ? "Active" : "Inactive"}
                    </span>
                </div>
            </div>

            {/* Card Body */}
            <div className="p-4 md:p-5 space-y-3">
                {/* Pricing */}
                <div className="space-y-2">
                    <div className={`flex items-center justify-between p-2.5 md:p-3 rounded-lg transition-colors ${
                        route.is_active
                            ? "bg-green-50"
                            : "bg-gray-100"
                    }`}>
                        <span className={`text-sm font-medium ${
                            route.is_active ? "text-gray-600" : "text-gray-500"
                        }`}>
                            One-Way
                        </span>
                        <span className={`text-sm md:text-base font-semibold ${
                            route.is_active ? "text-green-700" : "text-gray-600"
                        }`}>
                            KSh {route.amount_one_way.toLocaleString()}
                        </span>
                    </div>
                    <div className={`flex items-center justify-between p-2.5 md:p-3 rounded-lg transition-colors ${
                        route.is_active
                            ? "bg-blue-50"
                            : "bg-gray-100"
                    }`}>
                        <span className={`text-sm font-medium ${
                            route.is_active ? "text-gray-600" : "text-gray-500"
                        }`}>
                            Two-Way
                        </span>
                        <span className={`text-sm md:text-base font-semibold ${
                            route.is_active ? "text-blue-700" : "text-gray-600"
                        }`}>
                            KSh {route.amount_two_way.toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Description */}
                {route.description && (
                    <div className={`text-xs md:text-sm line-clamp-2 leading-relaxed ${
                        route.is_active ? "text-gray-600" : "text-gray-500"
                    }`}>
                        {route.description}
                    </div>
                )}
            </div>

            {/* Card Footer - Actions */}
            <div className="p-4 md:p-5 pt-0 flex gap-2">
                <button
                    onClick={() => onEdit(route)}
                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-3 rounded-lg transition-colors text-sm font-medium min-h-[48px]"
                >
                    <Edit className="w-4 h-4" />
                    Edit
                </button>
                <button
                    onClick={() => onDelete(route)}
                    className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-3 py-3 rounded-lg transition-colors min-h-[48px]"
                    title="Delete"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

export default function Index({ auth, routes, filters }) {
    const [search, setSearch] = useState(filters.search || "");
    const [statusFilter, setStatusFilter] = useState(filters.status || "");

    const [deleteModal, setDeleteModal] = useState({
        show: false,
        id: null,
        name: "",
    });
    const [showRouteModal, setShowRouteModal] = useState(false);
    const [editingRoute, setEditingRoute] = useState(null);

    // Form for creating/editing transport routes
    const routeForm = useForm({
        route_name: "",
        amount_two_way: "",
        amount_one_way: "",
        description: "",
        is_active: true,
    });

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route("transport-routes.index"),
            {
                search,
                status: statusFilter,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleFilterChange = (value) => {
        router.get(
            route("transport-routes.index"),
            {
                search,
                status: value,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const openCreateModal = () => {
        setEditingRoute(null);
        routeForm.reset();
        routeForm.setData({
            route_name: "",
            amount_two_way: "",
            amount_one_way: "",
            description: "",
            is_active: true,
        });
        setShowRouteModal(true);
    };

    const openEditModal = (transportRoute) => {
        setEditingRoute(transportRoute);
        routeForm.setData({
            route_name: transportRoute.route_name,
            amount_two_way: transportRoute.amount_two_way,
            amount_one_way: transportRoute.amount_one_way,
            description: transportRoute.description || "",
            is_active: transportRoute.is_active,
        });
        setShowRouteModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (editingRoute) {
            routeForm.put(route("transport-routes.update", editingRoute.id), {
                onSuccess: () => {
                    setShowRouteModal(false);
                    routeForm.reset();
                },
            });
        } else {
            routeForm.post(route("transport-routes.store"), {
                onSuccess: () => {
                    setShowRouteModal(false);
                    routeForm.reset();
                },
            });
        }
    };

    const handleDelete = (transportRoute) => {
        setDeleteModal({
            show: true,
            id: transportRoute.id,
            name: transportRoute.route_name,
        });
    };

    const confirmDelete = () => {
        router.delete(route("transport-routes.destroy", deleteModal.id), {
            onSuccess: () => {
                setDeleteModal({ show: false, id: null, name: "" });
            },
        });
    };

    const handleToggleStatus = (transportRoute) => {
        router.post(route("transport-routes.toggle-status", transportRoute.id));
    };

    const filteredRoutes = routes.filter((r) => {
        if (statusFilter === "active") return r.is_active;
        if (statusFilter === "inactive") return !r.is_active;
        return true;
    });

    return (
        <AuthenticatedLayout header="Transport Routes">
            <Head title="Transport Routes" />

            <div className="py-4 md:py-6">
                <div className="max-w-7xl mx-auto px-3 md:px-6 lg:px-8 space-y-4 md:space-y-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                                <Bus className="w-5 h-5 md:w-6 md:h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs md:text-sm text-gray-600 font-medium">
                                    Manage school transport routes and pricing
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={openCreateModal}
                            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 md:py-2.5 min-h-[48px] bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Add Route</span>
                        </button>
                    </div>

                    {/* Search and Filters */}
                    <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-4 md:p-6">
                        <form onSubmit={handleSearch} className="space-y-3 md:space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search routes..."
                                    className="w-full pl-10 pr-4 py-3 min-h-[48px] border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        handleFilterChange(e.target.value);
                                    }}
                                    className="px-4 py-3 min-h-[48px] border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-bold"
                                >
                                    <option value="">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>

                                <button
                                    type="submit"
                                    className="px-6 py-3 min-h-[48px] bg-gradient-to-r from-navy to-navy/95 text-white font-bold rounded-xl hover:from-navy/95 hover:to-navy transition-all shadow-md"
                                >
                                    Search
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Content */}
                    {filteredRoutes.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 p-8 md:p-12 text-center">
                            <Bus className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-base md:text-lg font-black text-gray-900 mb-2">
                                No transport routes found
                            </h3>
                            <p className="text-sm text-gray-600 mb-6 font-medium">
                                {search || statusFilter
                                    ? "Try adjusting your search or filters"
                                    : "Get started by creating your first transport route"}
                            </p>
                            {!search && !statusFilter && (
                                <button
                                    onClick={openCreateModal}
                                    className="inline-flex items-center gap-2 px-6 py-3 min-h-[48px] bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl hover:shadow-lg transition-all shadow-md"
                                >
                                    <Plus className="w-5 h-5" />
                                    Add First Route
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Mobile List View */}
                            <div className="block md:hidden">
                                <MobileListContainer
                                    emptyState={{
                                        icon: Bus,
                                        title: 'No transport routes found',
                                        message: 'Try adjusting your filters',
                                    }}
                                >
                                    {filteredRoutes.map((transportRoute) => (
                                        <MobileTransportRouteItem
                                            key={transportRoute.id}
                                            route={transportRoute}
                                            onEdit={openEditModal}
                                            onDelete={handleDelete}
                                            onToggleStatus={handleToggleStatus}
                                        />
                                    ))}
                                </MobileListContainer>
                            </div>

                            {/* Desktop Grid View */}
                            <div className="hidden md:block">
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
                                    {filteredRoutes.map((transportRoute) => (
                                        <DesktopTransportRouteCard
                                            key={transportRoute.id}
                                            route={transportRoute}
                                            onEdit={openEditModal}
                                            onDelete={handleDelete}
                                            onToggleStatus={handleToggleStatus}
                                        />
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Create/Edit Route Modal */}
                    {showRouteModal && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
                            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto my-8">
                                {/* Modal Header */}
                                <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 px-5 sm:px-6 py-4 rounded-t-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border-2 border-white/40">
                                            <Bus className="w-5 h-5 text-white" />
                                        </div>
                                        <h3 className="text-lg sm:text-xl font-black text-white">
                                            {editingRoute ? "Edit Transport Route" : "Add Transport Route"}
                                        </h3>
                                    </div>
                                    <button
                                        onClick={() => setShowRouteModal(false)}
                                        className="text-white/80 hover:text-white transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Modal Body */}
                                <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
                                    {/* Route Name */}
                                    <div>
                                        <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">
                                            Route Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={routeForm.data.route_name}
                                            onChange={(e) =>
                                                routeForm.setData("route_name", e.target.value)
                                            }
                                            placeholder="e.g., Eastleigh, South C, Ngara"
                                            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-medium ${
                                                routeForm.errors.route_name
                                                    ? "border-red-500"
                                                    : "border-gray-300"
                                            }`}
                                            required
                                        />
                                        {routeForm.errors.route_name && (
                                            <p className="mt-2 text-sm text-red-600 flex items-center gap-1 font-bold">
                                                <AlertCircle className="w-4 h-4" />
                                                {routeForm.errors.route_name}
                                            </p>
                                        )}
                                    </div>

                                    {/* Pricing Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* One-Way Amount */}
                                        <div>
                                            <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">
                                                One-Way Amount (KSh) <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-black">
                                                    KSh
                                                </span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={routeForm.data.amount_one_way}
                                                    onChange={(e) =>
                                                        routeForm.setData("amount_one_way", e.target.value)
                                                    }
                                                    placeholder="0.00"
                                                    className={`w-full pl-14 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-mono font-bold ${
                                                        routeForm.errors.amount_one_way
                                                            ? "border-red-500"
                                                            : "border-gray-300"
                                                    }`}
                                                    required
                                                />
                                            </div>
                                            {routeForm.errors.amount_one_way && (
                                                <p className="mt-2 text-sm text-red-600 flex items-center gap-1 font-bold">
                                                    <AlertCircle className="w-4 h-4" />
                                                    {routeForm.errors.amount_one_way}
                                                </p>
                                            )}
                                        </div>

                                        {/* Two-Way Amount */}
                                        <div>
                                            <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">
                                                Two-Way Amount (KSh) <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-black">
                                                    KSh
                                                </span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={routeForm.data.amount_two_way}
                                                    onChange={(e) =>
                                                        routeForm.setData("amount_two_way", e.target.value)
                                                    }
                                                    placeholder="0.00"
                                                    className={`w-full pl-14 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-mono font-bold ${
                                                        routeForm.errors.amount_two_way
                                                            ? "border-red-500"
                                                            : "border-gray-300"
                                                    }`}
                                                    required
                                                />
                                            </div>
                                            {routeForm.errors.amount_two_way && (
                                                <p className="mt-2 text-sm text-red-600 flex items-center gap-1 font-bold">
                                                    <AlertCircle className="w-4 h-4" />
                                                    {routeForm.errors.amount_two_way}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">
                                            Description / Pickup Points
                                        </label>
                                        <textarea
                                            value={routeForm.data.description}
                                            onChange={(e) =>
                                                routeForm.setData("description", e.target.value)
                                            }
                                            placeholder="e.g., Pickup points: 1st Avenue, 7th Street, General Waruinge"
                                            rows="3"
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none font-medium"
                                        />
                                    </div>

                                    {/* Active Status */}
                                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                                        <input
                                            type="checkbox"
                                            id="is_active"
                                            checked={routeForm.data.is_active}
                                            onChange={(e) =>
                                                routeForm.setData("is_active", e.target.checked)
                                            }
                                            className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                                        />
                                        <label
                                            htmlFor="is_active"
                                            className="text-sm font-bold text-gray-700"
                                        >
                                            Active (available for selection)
                                        </label>
                                    </div>

                                    {/* Modal Footer */}
                                    <div className="grid grid-cols-2 gap-3 pt-5 border-t-2 border-gray-200">
                                        <button
                                            type="button"
                                            onClick={() => setShowRouteModal(false)}
                                            className="px-4 py-3 border-2 border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={routeForm.processing}
                                            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 transition-all shadow-md"
                                        >
                                            <Save className="w-4 h-4" />
                                            <span className="hidden xs:inline">
                                                {routeForm.processing
                                                    ? "Saving..."
                                                    : editingRoute
                                                    ? "Update"
                                                    : "Create"}
                                            </span>
                                            <span className="xs:hidden">Save</span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Delete Confirmation Modal */}
                    <ConfirmationModal
                        show={deleteModal.show}
                        onClose={() => setDeleteModal({ show: false, id: null, name: "" })}
                        onConfirm={confirmDelete}
                        title="Delete Transport Route"
                        message={`Are you sure you want to delete "${deleteModal.name}"? This action cannot be undone.`}
                        confirmText="Delete"
                        confirmButtonClass="bg-red-600 hover:bg-red-700"
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}