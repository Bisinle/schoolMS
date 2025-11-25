import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    ArrowLeft,
    Pencil,
    Trash2,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
} from "lucide-react";

export default function Show({ category }) {
    const handleDelete = () => {
        if (category.documents_count > 0) {
            alert(
                "Cannot delete this category because it has documents attached. Please delete or reassign documents first."
            );
            return;
        }

        if (
            confirm(
                `Are you sure you want to delete "${category.name}"? This action cannot be undone.`
            )
        ) {
            router.delete(route("document-categories.destroy", category.id), {
                onSuccess: () =>
                    router.visit(route("document-categories.index")),
            });
        }
    };

    return (
        <AuthenticatedLayout header="Document Category Details">
            <Head title={category.name} />

            <div className="max-w-5xl mx-auto space-y-6">
                {/* Back Button */}
                <Link
                    href={route("document-categories.index")}
                    className="inline-flex items-center px-4 py-2 bg-orange text-white rounded-lg hover:bg-orange-dark transition-colors"
                    >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Categories
                </Link>

                {/* Main Card */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="border-b border-gray-200 p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-navy">
                                    {category.name}
                                </h1>
                                <p className="text-gray-500 mt-1">
                                    {category.slug}
                                </p>
                            </div>
                            <div className="flex items-center space-x-3">
                                {category.status === "active" ? (
                                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                                        Active
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800">
                                        Inactive
                                    </span>
                                )}
                                {category.is_required && (
                                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800">
                                        Required
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Statistics - Mobile Optimized */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 p-4 sm:p-6 bg-gray-50 border-b border-gray-200">
                        <div className="text-center p-3 sm:p-0 bg-white sm:bg-transparent rounded-lg sm:rounded-none">
                            <div className="text-2xl sm:text-3xl font-bold text-navy">
                                {category.documents_count}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600 mt-1">
                                Total Documents
                            </div>
                        </div>
                        <div className="text-center p-3 sm:p-0 bg-yellow-50 sm:bg-transparent rounded-lg sm:rounded-none">
                            <div className="text-2xl sm:text-3xl font-bold text-yellow-600">
                                {category.pending_count}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600 mt-1 flex items-center justify-center">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                            </div>
                        </div>
                        <div className="text-center p-3 sm:p-0 bg-green-50 sm:bg-transparent rounded-lg sm:rounded-none">
                            <div className="text-2xl sm:text-3xl font-bold text-green-600">
                                {category.verified_count}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600 mt-1 flex items-center justify-center">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Verified
                            </div>
                        </div>
                        <div className="text-center p-3 sm:p-0 bg-red-50 sm:bg-transparent rounded-lg sm:rounded-none">
                            <div className="text-2xl sm:text-3xl font-bold text-red-600">
                                {category.rejected_count}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600 mt-1 flex items-center justify-center">
                                <XCircle className="w-3 h-3 mr-1" />
                                Rejected
                            </div>
                        </div>
                        <div className="text-center p-3 sm:p-0 bg-gray-100 sm:bg-transparent rounded-lg sm:rounded-none col-span-2 sm:col-span-1">
                            <div className="text-2xl sm:text-3xl font-bold text-gray-600">
                                {category.expired_count}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600 mt-1 flex items-center justify-center">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Expired
                            </div>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500 block mb-1">
                                        Description
                                    </label>
                                    <p className="text-gray-900">
                                        {category.description ||
                                            "No description provided"}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500 block mb-1">
                                        Entity Type
                                    </label>
                                    <p className="text-gray-900">
                                        {category.entity_type || "Global (All)"}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500 block mb-1">
                                        Maximum File Size
                                    </label>
                                    <p className="text-gray-900">
                                        {Math.round(
                                            category.max_file_size / 1024
                                        )}{" "}
                                        MB ({category.max_file_size} KB)
                                    </p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500 block mb-1">
                                        Allowed File Types
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {category.allowed_extensions &&
                                        category.allowed_extensions.length >
                                            0 ? (
                                            category.allowed_extensions.map(
                                                (ext) => (
                                                    <span
                                                        key={ext}
                                                        className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800 uppercase"
                                                    >
                                                        {ext}
                                                    </span>
                                                )
                                            )
                                        ) : (
                                            <span className="text-gray-600">
                                                All file types allowed
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500 block mb-1">
                                        Document Expires
                                    </label>
                                    <p className="text-gray-900">
                                        {category.expires ? (
                                            <>
                                                Yes - Alert{" "}
                                                {category.expiry_alert_days}{" "}
                                                days before expiry
                                            </>
                                        ) : (
                                            "No expiry tracking"
                                        )}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500 block mb-1">
                                        Sort Order
                                    </label>
                                    <p className="text-gray-900">
                                        {category.sort_order}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500 block mb-1">
                                        Created
                                    </label>
                                    <p className="text-gray-900">
                                        {new Date(
                                            category.created_at
                                        ).toLocaleString()}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500 block mb-1">
                                        Last Updated
                                    </label>
                                    <p className="text-gray-900">
                                        {new Date(
                                            category.updated_at
                                        ).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="border-t border-gray-200 p-6 bg-gray-50">
                        <div className="flex items-center justify-end space-x-3">
                            <Link
                                href={route(
                                    "document-categories.edit",
                                    category.id
                                )}
                                className="inline-flex items-center px-4 py-2 bg-orange text-white rounded-lg hover:bg-orange-dark transition-colors"
                            >
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit Category
                            </Link>
                            {category.documents_count === 0 && (
                                <button
                                    onClick={handleDelete}
                                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Category
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Info Box */}
                {category.documents_count > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                            <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-blue-800">
                                <p className="font-medium mb-1">
                                    Category In Use
                                </p>
                                <p>
                                    This category has{" "}
                                    {category.documents_count} document(s)
                                    attached. To delete this category, you must
                                    first delete or reassign all documents.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}