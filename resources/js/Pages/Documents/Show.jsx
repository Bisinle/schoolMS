import { useState } from "react";
import { Head, Link, router, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import ConfirmationModal from "@/Components/ConfirmationModal";
import {
    Download,
    Eye,
    Trash2,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    Calendar,
    User,
    FileText,
    Folder,
    ArrowLeft,
} from "lucide-react";

export default function Show({ document, auth }) {
    const [showRejectModal, setShowRejectModal] = useState(false);
    const { data, setData, post, processing } = useForm({
        rejection_reason: "",
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

    const handleVerifyClick = () => {
        setConfirmAction({
            show: true,
            title: "Verify Document",
            message: `Are you sure you want to verify "${document.original_filename}"? This will mark the document as approved and verified.`,
            confirmText: "Verify Document",
            type: "info",
            onConfirm: () => {
                router.post(route("documents.verify", document.id), {}, {
                    preserveScroll: true,
                    onSuccess: () => closeConfirmation(),
                });
            },
        });
    };

    const handleReject = (e) => {
        e.preventDefault();
        post(route("documents.reject", document.id), {
            onSuccess: () => setShowRejectModal(false),
        });
    };

    const handleDeleteClick = () => {
        setConfirmAction({
            show: true,
            title: "Delete Document",
            message: `Are you sure you want to delete "${document.original_filename}"? This action cannot be undone and will permanently remove the document from the system.`,
            confirmText: "Delete Document",
            type: "danger",
            onConfirm: () => {
                router.delete(route("documents.destroy", document.id), {
                    onSuccess: () => router.visit(route("documents.index")),
                });
            },
        });
    };

    const getStatusBadge = () => {
        const badges = {
            pending: {
                color: "bg-yellow-100 text-yellow-800 border-yellow-200",
                icon: Clock,
                text: "Pending Review",
            },
            verified: {
                color: "bg-green-100 text-green-800 border-green-200",
                icon: CheckCircle,
                text: "Verified",
            },
            rejected: {
                color: "bg-red-100 text-red-800 border-red-200",
                icon: XCircle,
                text: "Rejected",
            },
            expired: {
                color: "bg-gray-100 text-gray-800 border-gray-200",
                icon: AlertCircle,
                text: "Expired",
            },
        };

        const badge = badges[document.status] || badges.pending;
        const Icon = badge.icon;

        return (
            <span
                className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full border ${badge.color}`}
            >
                <Icon className="w-4 h-4 mr-1.5" />
                {badge.text}
            </span>
        );
    };

    const getEntityName = () => {
        if (document.documentable_type.includes("Teacher")) {
            return document.documentable.user?.name || "Unknown Teacher";
        } else if (document.documentable_type.includes("Student")) {
            return `${document.documentable.first_name} ${document.documentable.last_name}`;
        } else if (document.documentable_type.includes("Guardian")) {
            return document.documentable.user?.name || "Unknown Guardian";
        } else if (document.documentable_type.includes("User")) {
            return document.documentable.name || "Unknown User";
        }
        return "Unknown";
    };

    const getEntityType = () => {
        return document.documentable_type.split("\\").pop();
    };

    const isExpiringSoon = () => {
        if (!document.expiry_date) return false;
        const daysUntilExpiry = Math.floor(document.days_until_expiry);
        return daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    };

    const getDaysUntilExpiry = () => {
        if (document.days_until_expiry === null) return null;
        return Math.floor(document.days_until_expiry);
    };

    return (
        <AuthenticatedLayout header="Document Details">
            <Head title={`Document: ${document.original_filename}`} />

            <div className="max-w-5xl mx-auto space-y-6">
                {/* Back Button */}
                <Link
                    href={route("documents.index")}
                    className="inline-flex items-center text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Documents
                </Link>

                {/* Main Document Card */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="border-b border-gray-200 p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4">
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <FileText className="w-8 h-8 text-blue-600" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-navy">
                                        {document.original_filename}
                                    </h1>
                                    <p className="text-gray-500 mt-1">
                                        {document.file_size_human} •{" "}
                                        {document.mime_type}
                                    </p>
                                </div>
                            </div>
                            <div>{getStatusBadge()}</div>
                        </div>
                    </div>

                    {/* Expiry Warning */}
                    {isExpiringSoon() && (
                        <div className="bg-yellow-50 border-b border-yellow-200 p-4">
                            <div className="flex items-center space-x-3">
                                <AlertCircle className="w-5 h-5 text-yellow-600" />
                                <p className="text-sm text-yellow-800">
                                    <strong>Expiring Soon:</strong> This
                                    document expires in{" "}
                                    {getDaysUntilExpiry()} days on{" "}
                                    {new Date(
                                        document.expiry_date
                                    ).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    )}

                    {document.is_expired && (
                        <div className="bg-red-50 border-b border-red-200 p-4">
                            <div className="flex items-center space-x-3">
                                <XCircle className="w-5 h-5 text-red-600" />
                                <p className="text-sm text-red-800">
                                    <strong>Expired:</strong> This document
                                    expired on{" "}
                                    {new Date(
                                        document.expiry_date
                                    ).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Document Details */}
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column */}
                            <div className="space-y-4">
                                <div>
                                    <label className="flex items-center text-sm font-medium text-gray-500 mb-1">
                                        <Folder className="w-4 h-4 mr-2" />
                                        Category
                                    </label>
                                    <p className="text-lg font-medium text-navy">
                                        {document.category?.name || "Unknown"}
                                    </p>
                                    {document.category?.description && (
                                        <p className="text-sm text-gray-600 mt-1">
                                            {document.category.description}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="flex items-center text-sm font-medium text-gray-500 mb-1">
                                        <User className="w-4 h-4 mr-2" />
                                        Document Owner
                                    </label>
                                    <p className="text-lg font-medium text-navy">
                                        {getEntityName()}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {getEntityType()}
                                    </p>
                                </div>

                                {document.expiry_date && (
                                    <div>
                                        <label className="flex items-center text-sm font-medium text-gray-500 mb-1">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            Expiry Date
                                        </label>
                                        <p className="text-lg font-medium text-navy">
                                            {new Date(
                                                document.expiry_date
                                            ).toLocaleDateString()}
                                        </p>
                                        {getDaysUntilExpiry() !== null && (
                                            <p className="text-sm text-gray-600">
                                                {getDaysUntilExpiry() > 0
                                                    ? `${getDaysUntilExpiry()} days remaining`
                                                    : `Expired ${Math.abs(
                                                          getDaysUntilExpiry()
                                                      )} days ago`}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Right Column */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500 mb-1 block">
                                        Uploaded By
                                    </label>
                                    <p className="text-lg font-medium text-navy">
                                        {document.uploader?.name || "Unknown"}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {new Date(
                                            document.created_at
                                        ).toLocaleString()}
                                    </p>
                                </div>

                                {document.verified_by && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 mb-1 block">
                                            {document.status === "rejected"
                                                ? "Rejected By"
                                                : "Verified By"}
                                        </label>
                                        <p className="text-lg font-medium text-navy">
                                            {document.verifier?.name ||
                                                "Unknown"}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {new Date(
                                                document.verified_at
                                            ).toLocaleString()}
                                        </p>
                                    </div>
                                )}

                                {document.status === "rejected" &&
                                    document.rejection_reason && (
                                        <div>
                                            <label className="text-sm font-medium text-red-600 mb-1 block">
                                                Rejection Reason
                                            </label>
                                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                                <p className="text-sm text-red-800">
                                                    {document.rejection_reason}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50">
                        <div className="flex flex-col gap-4">
                            {/* Primary Actions - Preview & Download */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <a
                                    href={route(
                                        "documents.preview",
                                        document.id
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Preview
                                </a>
                                <a
                                    href={route(
                                        "documents.download",
                                        document.id
                                    )}
                                    className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                </a>
                            </div>

                            {/* Admin Actions or Delete */}
                            {(auth.user.role === "admin" || document.status === "pending" || document.status === "rejected") && (
                                <div className="flex flex-col sm:flex-row gap-3">
                                    {/* Admin Actions - Verify & Reject */}
                                    {auth.user.role === "admin" && document.status === "pending" && (
                                        <>
                                            <button
                                                onClick={handleVerifyClick}
                                                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Verify
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setShowRejectModal(true)
                                                }
                                                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-orange text-white text-sm font-medium rounded-lg hover:bg-orange-dark transition-colors"
                                            >
                                                <XCircle className="w-4 h-4 mr-2" />
                                                Reject
                                            </button>
                                        </>
                                    )}

                                    {/* Delete Action */}
                                    {(auth.user.role === "admin" ||
                                        document.status === "pending" ||
                                        document.status === "rejected") && (
                                        <button
                                            onClick={handleDeleteClick}
                                            className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-navy mb-4">
                            Reject Document
                        </h3>
                        <form onSubmit={handleReject} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Rejection Reason{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={data.rejection_reason}
                                    onChange={(e) =>
                                        setData(
                                            "rejection_reason",
                                            e.target.value
                                        )
                                    }
                                    rows="4"
                                    placeholder="Please provide a clear reason for rejection..."
                                    className="w-full rounded-lg border-gray-300 focus:border-orange focus:ring focus:ring-orange focus:ring-opacity-50"
                                    required
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    This will be shown to the user so they can
                                    re-upload a better version.
                                </p>
                            </div>

                            <div className="flex items-center justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowRejectModal(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    {processing
                                        ? "Rejecting..."
                                        : "Reject Document"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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