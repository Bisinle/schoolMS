import { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import ConfirmationModal from "@/Components/ConfirmationModal";
import {
    Search,
    Filter,
    Download,
    Eye,
    Trash2,
    Plus,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
} from "lucide-react";

export default function Index({
    documents,
    categories,
    stats,
    filters,
    entityTypes,
    auth,
    flash,
}) {
    const [ownerSearch, setOwnerSearch] = useState(filters.owner_search || "");
    const [categoryId, setCategoryId] = useState(filters.category_id || "all");
    const [status, setStatus] = useState(filters.status || "all");
    const [entityType, setEntityType] = useState(filters.entity_type || "all");

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

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route("documents.index"),
            {
                owner_search: ownerSearch,
                category_id: categoryId,
                status,
                entity_type: entityType,
            },
            { preserveState: true, preserveScroll: true }
        );
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
        const badges = {
            pending: {
                color: "bg-yellow-100 text-yellow-800",
                icon: Clock,
                text: "Pending",
            },
            verified: {
                color: "bg-green-100 text-green-800",
                icon: CheckCircle,
                text: "Verified",
            },
            rejected: {
                color: "bg-red-100 text-red-800",
                icon: XCircle,
                text: "Rejected",
            },
            expired: {
                color: "bg-gray-100 text-gray-800",
                icon: AlertCircle,
                text: "Expired",
            },
        };

        const badge = badges[doc.status] || badges.pending;
        const Icon = badge.icon;

        return (
            <span
                className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}
            >
                <Icon className="w-3 h-3 mr-1" />
                {badge.text}
            </span>
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
                {/* Header with Stats */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="text-sm font-medium text-gray-600">
                            Total Documents
                        </div>
                        <div className="text-3xl font-bold text-navy mt-2">
                            {stats.total}
                        </div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg shadow-sm p-6">
                        <div className="text-sm font-medium text-yellow-700">
                            Pending Review
                        </div>
                        <div className="text-3xl font-bold text-yellow-600 mt-2">
                            {stats.pending}
                        </div>
                    </div>
                    <div className="bg-green-50 rounded-lg shadow-sm p-6">
                        <div className="text-sm font-medium text-green-700">
                            Verified
                        </div>
                        <div className="text-3xl font-bold text-green-600 mt-2">
                            {stats.verified}
                        </div>
                    </div>
                    <div className="bg-red-50 rounded-lg shadow-sm p-6">
                        <div className="text-sm font-medium text-red-700">
                            Rejected
                        </div>
                        <div className="text-3xl font-bold text-red-600 mt-2">
                            {stats.rejected}
                        </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg shadow-sm p-6">
                        <div className="text-sm font-medium text-gray-700">
                            Expired
                        </div>
                        <div className="text-3xl font-bold text-gray-600 mt-2">
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
                    <div className="flex flex-wrap justify-center sm:justify-end gap-2 sm:gap-3">
                        {auth.user.role === "admin" && (
                            <Link
                                href={route("document-categories.index")}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl shadow-sm hover:shadow-md hover:from-orange-600 hover:to-orange-700 transition-all duration-200 text-sm sm:text-base"
                            >
                                <span>📂</span>
                                <span>Doc Categories</span>
                            </Link>
                        )}

                        <Link
                            href={route("documents.create")}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl shadow-sm hover:shadow-md hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 text-sm sm:text-base"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Upload Document</span>
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Owner Search (Admin only) */}
                            {auth.user.role === "admin" && (
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Search by Owner Name
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            value={ownerSearch}
                                            onChange={(e) =>
                                                setOwnerSearch(e.target.value)
                                            }
                                            placeholder="Search by teacher, student, or guardian name..."
                                            className="pl-10 w-full rounded-lg border-gray-300 focus:border-orange focus:ring focus:ring-orange focus:ring-opacity-50"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category
                                </label>
                                <select
                                    value={categoryId}
                                    onChange={(e) =>
                                        setCategoryId(e.target.value)
                                    }
                                    className="w-full rounded-lg border-gray-300 focus:border-orange focus:ring focus:ring-orange focus:ring-opacity-50"
                                >
                                    <option value="all">All Categories</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {auth.user.role === "admin" && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Entity Type
                                    </label>
                                    <select
                                        value={entityType}
                                        onChange={(e) =>
                                            setEntityType(e.target.value)
                                        }
                                        className="w-full rounded-lg border-gray-300 focus:border-orange focus:ring focus:ring-orange focus:ring-opacity-50"
                                    >
                                        <option value="all">All Types</option>
                                        {entityTypes.map((type) => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Status
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full rounded-lg border-gray-300 focus:border-orange focus:ring focus:ring-orange focus:ring-opacity-50"
                                >
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="verified">Verified</option>
                                    <option value="rejected">Rejected</option>
                                    <option value="expired">Expired</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="inline-flex items-center px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy-light transition-colors"
                            >
                                <Filter className="w-4 h-4 mr-2" />
                                Apply Filters
                            </button>
                        </div>
                    </form>
                </div>

                {/* Documents Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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