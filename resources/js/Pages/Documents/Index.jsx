import { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import ConfirmationModal from "@/Components/ConfirmationModal";
import {
    Download,
    Eye,
    Trash2,
    Plus,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    User,
    Calendar,
    Tag,
} from "lucide-react";
import useFilters from '@/Hooks/useFilters';
import { SearchInput, FilterSelect, FilterBar } from '@/Components/Filters';
import { SwipeableListItem, ExpandableCard, MobileListContainer } from '@/Components/Mobile';
import { Badge } from '@/Components/UI';

// Helper to get status badge variant and icon
function getStatusBadgeConfig(status) {
    const configs = {
        pending: { variant: 'warning', icon: Clock },
        verified: { variant: 'success', icon: CheckCircle },
        rejected: { variant: 'danger', icon: XCircle },
        expired: { variant: 'secondary', icon: AlertCircle },
    };
    return configs[status] || configs.pending;
}

// Mobile List Item Component - Refactored with new components
function MobileDocumentItem({
    doc,
    auth,
    onDelete,
    onDownload,
    getEntityName,
}) {
    // Define swipe actions
    const primaryActions = [
        { icon: Eye, label: 'View', color: 'blue', href: route("documents.show", doc.id) },
        { icon: Download, label: 'Download', color: 'indigo', onClick: () => onDownload(doc) },
    ];

    const secondaryActions = [
        { icon: Trash2, label: 'Delete', color: 'red', onClick: () => onDelete(doc) },
    ];

    const statusConfig = getStatusBadgeConfig(doc.status);
    const StatusIcon = statusConfig.icon;

    // Header content with Badge component
    const header = (
        <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg">
                <FileText className="w-7 h-7" />
            </div>

            <div className="flex-1 min-w-0">
                <h3 className="text-base font-black text-gray-900 truncate leading-tight">
                    {doc.original_filename}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                    {doc.category?.name}
                </p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge
                        variant={statusConfig.variant}
                        value={
                            <span className="inline-flex items-center gap-1">
                                <StatusIcon className="w-3 h-3" />
                                {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                            </span>
                        }
                        size="sm"
                    />
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                        {doc.file_size_human}
                    </span>
                </div>
            </div>
        </div>
    );

    // Expanded content
    const expandedContent = (
        <div className="space-y-4">
            {/* Info Grid */}
            <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                    <Tag className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <span className="text-xs text-gray-500 block">
                            Category
                        </span>
                        <span className="font-semibold text-gray-900">
                            {doc.category?.name}
                        </span>
                    </div>
                </div>
                {auth.user.role === "admin" && (
                    <div className="flex items-start gap-3">
                        <User className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <span className="text-xs text-gray-500 block">
                                Owner
                            </span>
                            <span className="font-semibold text-gray-900">
                                {getEntityName(doc)}
                            </span>
                        </div>
                    </div>
                )}
                <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <span className="text-xs text-gray-500 block">
                            Uploaded
                        </span>
                        <span className="font-semibold text-gray-900">
                            {new Date(
                                doc.created_at
                            ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                            })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                <Link
                    href={route("documents.show", doc.id)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl font-bold text-sm hover:bg-blue-100 transition-colors active:scale-95"
                >
                    <Eye className="w-4 h-4" />
                    View
                </Link>
                <button
                    onClick={() => onDownload(doc)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-green-50 text-green-700 rounded-xl font-bold text-sm hover:bg-green-100 transition-colors active:scale-95"
                >
                    <Download className="w-4 h-4" />
                    Download
                </button>
                <button
                    onClick={() => onDelete(doc)}
                    className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-700 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors active:scale-95"
                >
                    <Trash2 className="w-4 h-4" />
                    Delete Document
                </button>
            </div>
        </div>
    );

    return (
        <SwipeableListItem
            primaryActions={primaryActions}
            secondaryActions={secondaryActions}
        >
            <ExpandableCard header={header}>
                {expandedContent}
            </ExpandableCard>
        </SwipeableListItem>
    );
}

export default function Index({
    documents,
    categories,
    stats,
    filters: initialFilters = {},
    entityTypes,
    auth,
    flash,
}) {
    // Use the new useFilters hook
    const { filters, updateFilter, clearFilters } = useFilters({
        route: '/documents',
        initialFilters: {
            owner_search: initialFilters.owner_search || '',
            category_id: initialFilters.category_id || '',
            status: initialFilters.status || '',
            entity_type: initialFilters.entity_type || '',
        },
        debounceMs: 500, // Debounce owner search
    });

    // Confirmation modal state
    const [confirmAction, setConfirmAction] = useState({
        show: false,
        title: "",
        message: "",
        confirmText: "",
        type: "danger",
        onConfirm: () => {},
    });

    const closeConfirmation = () => {
        setConfirmAction({
            show: false,
            title: "",
            message: "",
            confirmText: "",
            type: "danger",
            onConfirm: () => {},
        });
    };

    const handleDeleteClick = (doc) => {
        setConfirmAction({
            show: true,
            title: "Delete Document",
            message: `Are you sure you want to delete "${doc.original_filename}"? This action cannot be undone and will permanently remove the document from the system.`,
            confirmText: "Delete Document",
            type: "danger",
            onConfirm: () => {
                router.delete(route("documents.destroy", doc.id), {
                    preserveScroll: true,
                    onSuccess: () => closeConfirmation(),
                });
            },
        });
    };

    const getStatusBadge = (doc) => {
        const statusConfig = getStatusBadgeConfig(doc.status);
        const StatusIcon = statusConfig.icon;

        return (
            <Badge
                variant={statusConfig.variant}
                value={
                    <span className="inline-flex items-center gap-1">
                        <StatusIcon className="w-3 h-3" />
                        {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                    </span>
                }
                size="sm"
            />
        );
    };

    const getEntityName = (doc) => {
        if (doc.documentable_type.includes("Teacher")) {
            return doc.documentable.user?.name || "Unknown Teacher";
        } else if (doc.documentable_type.includes("Student")) {
            return `${doc.documentable.first_name} ${doc.documentable.last_name}`;
        } else if (doc.documentable_type.includes("Guardian")) {
            return doc.documentable.user?.name || "Unknown Guardian";
        } else if (doc.documentable_type.includes("User")) {
            return doc.documentable.name || "Unknown User";
        }
        return "Unknown";
    };

    return (
        <AuthenticatedLayout header="Documents">
            <Head title="Documents" />

            {/* Success/Error Messages */}
            {flash?.success && (
                <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                    <p className="text-sm font-medium text-green-800">
                        {flash.success}
                    </p>
                </div>
            )}

            {flash?.error && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                    <p className="text-sm font-medium text-red-800">
                        {flash.error}
                    </p>
                </div>
            )}

            <div className="space-y-6">
                {/* Header with Stats - Mobile Optimized */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow">
                        <div className="text-xs sm:text-sm font-medium text-gray-600">
                            Total Documents
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-navy mt-1 sm:mt-2">
                            {stats.total}
                        </div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow">
                        <div className="text-xs sm:text-sm font-medium text-yellow-700">
                            Pending Review
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-yellow-600 mt-1 sm:mt-2">
                            {stats.pending}
                        </div>
                    </div>
                    <div className="bg-green-50 rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow">
                        <div className="text-xs sm:text-sm font-medium text-green-700">
                            Verified
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-green-600 mt-1 sm:mt-2">
                            {stats.verified}
                        </div>
                    </div>
                    <div className="bg-red-50 rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow">
                        <div className="text-xs sm:text-sm font-medium text-red-700">
                            Rejected
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-red-600 mt-1 sm:mt-2">
                            {stats.rejected}
                        </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow col-span-2 sm:col-span-1">
                        <div className="text-xs sm:text-sm font-medium text-gray-700">
                            Expired
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-gray-600 mt-1 sm:mt-2">
                            {stats.expired}
                        </div>
                    </div>
                </div>

                {/* Header with Upload Button */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    {/* Title */}
                    <h2 className="text-xl sm:text-2xl font-bold text-navy text-center sm:text-left">
                        My Documents
                    </h2>

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row flex-wrap justify-center sm:justify-end gap-2 w-full sm:w-auto">
                        {auth.user.role === "admin" && (
                            <Link
                                href={route("document-categories.index")}
                                className="inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold sm:font-medium rounded-xl shadow-sm hover:shadow-md hover:from-orange-600 hover:to-orange-700 transition-all duration-200 text-sm sm:text-base"
                            >
                                <span>📂</span>
                                <span>Doc Categories</span>
                            </Link>
                        )}

                        <Link
                            href={route("documents.create")}
                            className="inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold sm:font-medium rounded-xl shadow-sm hover:shadow-md hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 text-sm sm:text-base"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Upload Document</span>
                        </Link>
                    </div>
                </div>

                {/* Filters - Refactored with FilterBar */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <FilterBar onClear={clearFilters} gridCols={auth.user.role === "admin" ? "4" : "2"}>
                        {/* Owner Search (Admin only) - spans 2 columns */}
                        {auth.user.role === "admin" && (
                            <div className="md:col-span-2">
                                <SearchInput
                                    value={filters.owner_search}
                                    onChange={(e) => updateFilter('owner_search', e.target.value)}
                                    placeholder="Search by teacher, student, or guardian name..."
                                    label="Search by Owner Name"
                                />
                            </div>
                        )}

                        <FilterSelect
                            value={filters.category_id}
                            onChange={(e) => updateFilter('category_id', e.target.value)}
                            options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
                            allLabel="All Categories"
                            label="Category"
                        />

                        {auth.user.role === "admin" && (
                            <FilterSelect
                                value={filters.entity_type}
                                onChange={(e) => updateFilter('entity_type', e.target.value)}
                                options={entityTypes.map(type => ({ value: type, label: type }))}
                                allLabel="All Types"
                                label="Entity Type"
                            />
                        )}

                        <FilterSelect
                            value={filters.status}
                            onChange={(e) => updateFilter('status', e.target.value)}
                            options={[
                                { value: 'pending', label: 'Pending' },
                                { value: 'verified', label: 'Verified' },
                                { value: 'rejected', label: 'Rejected' },
                                { value: 'expired', label: 'Expired' }
                            ]}
                            allLabel="All Status"
                            label="Status"
                        />
                    </FilterBar>
                </div>

                {/* Mobile List View - Refactored with MobileListContainer */}
                <div className="block md:hidden">
                    <MobileListContainer
                        emptyState={{
                            icon: FileText,
                            title: 'No documents found',
                            message: filters.owner_search || filters.category_id || filters.status || filters.entity_type ? 'Try adjusting your filters' : 'Upload your first document',
                            action: {
                                label: 'Upload Document',
                                href: route("documents.create"),
                                icon: Plus,
                            }
                        }}
                    >
                        {documents.data.length > 0 && documents.data.map((doc) => (
                            <MobileDocumentItem
                                key={doc.id}
                                doc={doc}
                                auth={auth}
                                onDelete={handleDeleteClick}
                                onDownload={(doc) =>
                                    window.open(
                                        route("documents.download", doc.id),
                                        "_blank"
                                    )
                                }
                                getEntityName={getEntityName}
                            />
                        ))}
                    </MobileListContainer>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Document
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Category
                                    </th>
                                    {auth.user.role === "admin" && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Owner
                                        </th>
                                    )}
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Uploaded
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {documents.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={
                                                auth.user.role === "admin"
                                                    ? "6"
                                                    : "5"
                                            }
                                            className="px-6 py-12 text-center"
                                        >
                                            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-500">
                                                No documents found.
                                            </p>
                                            <Link
                                                href={route("documents.create")}
                                                className="inline-flex items-center mt-4 text-orange hover:text-orange-dark"
                                            >
                                                <Plus className="w-4 h-4 mr-1" />
                                                Upload your first document
                                            </Link>
                                        </td>
                                    </tr>
                                ) : (
                                    documents.data.map((doc) => (
                                        <tr
                                            key={doc.id}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <FileText className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                                                    <div>
                                                        <div className="font-medium text-navy">
                                                            {
                                                                doc.original_filename
                                                            }
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {
                                                                doc.file_size_human
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {doc.category?.name ||
                                                    "Unknown"}
                                            </td>
                                            {auth.user.role === "admin" && (
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900">
                                                        {getEntityName(doc)}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {doc.documentable_type
                                                            .split("\\")
                                                            .pop()}
                                                    </div>
                                                </td>
                                            )}
                                            <td className="px-6 py-4">
                                                {getStatusBadge(doc)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                <div>
                                                    {new Date(
                                                        doc.created_at
                                                    ).toLocaleDateString()}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    by{" "}
                                                    {doc.uploader?.name ||
                                                        "Unknown"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-3">
                                                <Link
                                                    href={route(
                                                        "documents.show",
                                                        doc.id
                                                    )}
                                                    className="inline-flex items-center text-blue-600 hover:text-blue-900 transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                                <a
                                                    href={route(
                                                        "documents.download",
                                                        doc.id
                                                    )}
                                                    className="inline-flex items-center text-green-600 hover:text-green-900 transition-colors"
                                                    title="Download"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </a>
                                                {(auth.user.role === "admin" ||
                                                    doc.status === "pending" ||
                                                    doc.status ===
                                                        "rejected") && (
                                                    <button
                                                        onClick={() =>
                                                            handleDeleteClick(
                                                                doc
                                                            )
                                                        }
                                                        className="inline-flex items-center text-red-600 hover:text-red-900 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {documents.links && documents.links.length > 3 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                            <div className="text-sm text-gray-600">
                                Showing {documents.from} to {documents.to} of{" "}
                                {documents.total} documents
                            </div>
                            <div className="flex gap-2">
                                {documents.links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url || "#"}
                                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                            link.active
                                                ? "bg-orange text-white"
                                                : link.url
                                                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                : "bg-gray-50 text-gray-400 cursor-not-allowed"
                                        }`}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                        preserveState
                                        preserveScroll
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Confirmation Modal */}
            <ConfirmationModal
                show={confirmAction.show}
                onClose={closeConfirmation}
                onConfirm={confirmAction.onConfirm}
                title={confirmAction.title}
                message={confirmAction.message}
                confirmText={confirmAction.confirmText}
                type={confirmAction.type}
            />
        </AuthenticatedLayout>
    );
}
