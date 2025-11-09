import { Head, useForm, router, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Save, X } from "lucide-react";
import { ArrowLeft } from "lucide-react";

export default function Create({ entityTypes }) {
    const { data, setData, post, processing, errors } = useForm({
        name: "",
        entity_type: "",
        is_required: false,
        description: "",
        max_file_size: 10240, // 10MB default
        allowed_extensions: [],
        expires: false,
        expiry_alert_days: 30,
        sort_order: 0,
        status: "active",
    });

    const extensionOptions = [
        "pdf",
        "doc",
        "docx",
        "jpg",
        "jpeg",
        "png",
        "gif",
        "zip",
    ];

    const handleExtensionToggle = (ext) => {
        if (data.allowed_extensions.includes(ext)) {
            setData(
                "allowed_extensions",
                data.allowed_extensions.filter((e) => e !== ext)
            );
        } else {
            setData("allowed_extensions", [...data.allowed_extensions, ext]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("document-categories.store"));
    };

    return (
        <AuthenticatedLayout header="Create Document Category">
            <Head title="Create Document Category" />
  {/* Back Button */}
  <Link
                    href={route("document-categories.index")}
                    className="inline-flex items-center px-4 py-2 bg-orange text-white rounded-lg hover:bg-orange-dark transition-colors"
                    >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Categories
                </Link>

            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-navy">
                            Create New Document Category
                        </h2>
                        <p className="text-gray-600 mt-2">
                            Define a new type of document that can be uploaded
                            in the system.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Category Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Category Name{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData("name", e.target.value)}
                                placeholder="e.g., Birth Certificate, National ID"
                                className="w-full rounded-lg border-gray-300 focus:border-orange focus:ring focus:ring-orange focus:ring-opacity-50"
                                required
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        {/* Entity Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Entity Type
                            </label>
                            <select
                                value={data.entity_type}
                                onChange={(e) =>
                                    setData("entity_type", e.target.value)
                                }
                                className="w-full rounded-lg border-gray-300 focus:border-orange focus:ring focus:ring-orange focus:ring-opacity-50"
                            >
                                <option value="">
                                    Global (All Entity Types)
                                </option>
                                {entityTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                            <p className="mt-1 text-sm text-gray-500">
                                Leave as "Global" if this document applies to
                                all users, or select a specific entity type.
                            </p>
                            {errors.entity_type && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.entity_type}
                                </p>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                value={data.description}
                                onChange={(e) =>
                                    setData("description", e.target.value)
                                }
                                rows="3"
                                placeholder="Brief description of what this document is..."
                                className="w-full rounded-lg border-gray-300 focus:border-orange focus:ring focus:ring-orange focus:ring-opacity-50"
                            />
                            {errors.description && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.description}
                                </p>
                            )}
                        </div>

                        {/* Required Toggle */}
                        <div className="flex items-start">
                            <div className="flex items-center h-5">
                                <input
                                    type="checkbox"
                                    checked={data.is_required}
                                    onChange={(e) =>
                                        setData("is_required", e.target.checked)
                                    }
                                    className="w-4 h-4 text-orange border-gray-300 rounded focus:ring-orange"
                                />
                            </div>
                            <div className="ml-3">
                                <label className="text-sm font-medium text-gray-700">
                                    Required Document
                                </label>
                                <p className="text-sm text-gray-500">
                                    Mark as required if users must upload this
                                    document.
                                </p>
                            </div>
                        </div>

                        {/* Max File Size */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Maximum File Size (KB){" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                value={data.max_file_size}
                                onChange={(e) =>
                                    setData("max_file_size", e.target.value)
                                }
                                min="1"
                                max="51200"
                                step="1024"
                                className="w-full rounded-lg border-gray-300 focus:border-orange focus:ring focus:ring-orange focus:ring-opacity-50"
                                required
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                Current: {Math.round(data.max_file_size / 1024)}
                                MB (Max: 50MB)
                            </p>
                            {errors.max_file_size && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.max_file_size}
                                </p>
                            )}
                        </div>

                        {/* Allowed Extensions */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Allowed File Types
                            </label>
                            <div className="grid grid-cols-4 gap-3">
                                {extensionOptions.map((ext) => (
                                    <label
                                        key={ext}
                                        className="flex items-center space-x-2 cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={data.allowed_extensions.includes(
                                                ext
                                            )}
                                            onChange={() =>
                                                handleExtensionToggle(ext)
                                            }
                                            className="w-4 h-4 text-orange border-gray-300 rounded focus:ring-orange"
                                        />
                                        <span className="text-sm text-gray-700 uppercase">
                                            {ext}
                                        </span>
                                    </label>
                                ))}
                            </div>
                            <p className="mt-1 text-sm text-gray-500">
                                Leave all unchecked to allow any file type.
                            </p>
                            {errors.allowed_extensions && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.allowed_extensions}
                                </p>
                            )}
                        </div>

                        {/* Expiry Settings */}
                        <div className="border-t border-gray-200 pt-6">
                            <div className="flex items-start mb-4">
                                <div className="flex items-center h-5">
                                    <input
                                        type="checkbox"
                                        checked={data.expires}
                                        onChange={(e) =>
                                            setData("expires", e.target.checked)
                                        }
                                        className="w-4 h-4 text-orange border-gray-300 rounded focus:ring-orange"
                                    />
                                </div>
                                <div className="ml-3">
                                    <label className="text-sm font-medium text-gray-700">
                                        Document Expires
                                    </label>
                                    <p className="text-sm text-gray-500">
                                        Enable if this document type has an
                                        expiry date (e.g., IDs, certificates).
                                    </p>
                                </div>
                            </div>

                            {data.expires && (
                                <div className="ml-7">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Alert Days Before Expiry
                                    </label>
                                    <input
                                        type="number"
                                        value={data.expiry_alert_days}
                                        onChange={(e) =>
                                            setData(
                                                "expiry_alert_days",
                                                e.target.value
                                            )
                                        }
                                        min="1"
                                        max="365"
                                        className="w-full rounded-lg border-gray-300 focus:border-orange focus:ring focus:ring-orange focus:ring-opacity-50"
                                    />
                                    <p className="mt-1 text-sm text-gray-500">
                                        Send alert X days before document
                                        expires.
                                    </p>
                                    {errors.expiry_alert_days && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.expiry_alert_days}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Sort Order */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Sort Order
                            </label>
                            <input
                                type="number"
                                value={data.sort_order}
                                onChange={(e) =>
                                    setData("sort_order", e.target.value)
                                }
                                min="0"
                                className="w-full rounded-lg border-gray-300 focus:border-orange focus:ring focus:ring-orange focus:ring-opacity-50"
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                Lower numbers appear first in lists.
                            </p>
                            {errors.sort_order && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.sort_order}
                                </p>
                            )}
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={data.status}
                                onChange={(e) =>
                                    setData("status", e.target.value)
                                }
                                className="w-full rounded-lg border-gray-300 focus:border-orange focus:ring focus:ring-orange focus:ring-opacity-50"
                                required
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                            {errors.status && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.status}
                                </p>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={() =>
                                    router.visit(
                                        route("document-categories.index")
                                    )
                                }
                                className="inline-flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center px-6 py-2 bg-orange text-white rounded-lg hover:bg-orange-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {processing ? "Creating..." : "Create Category"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}