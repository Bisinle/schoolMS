import { useState } from "react";
import { Head, useForm, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Upload, X, AlertCircle, FileText } from "lucide-react";

export default function Create({ categories, entityOptions, auth }) {
    const { data, setData, post, processing, errors } = useForm({
        document_category_id: "",
        documentable_type: "",
        documentable_id: "",
        file: null,
        expiry_date: "",
    });

    const [selectedCategory, setSelectedCategory] = useState(null);
    const [fileName, setFileName] = useState("");
    const [fileSize, setFileSize] = useState(0);
    const [dragActive, setDragActive] = useState(false);

    const handleCategoryChange = (e) => {
        const categoryId = e.target.value;
        setData("document_category_id", categoryId);

        const category = categories.find((cat) => cat.id == categoryId);
        setSelectedCategory(category);

        // Auto-select entity type if only one option
        if (category && category.entity_type) {
            const entityType = category.entity_type;
            setData("documentable_type", entityType);

            // Auto-select entity if only one option
            const options = entityOptions[entityType];
            if (options && options.length === 1) {
                setData("documentable_id", options[0].id);
            }
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData("file", file);
            setFileName(file.name);
            setFileSize(file.size);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            setData("file", file);
            setFileName(file.name);
            setFileSize(file.size);
        }
    };

    const removeFile = () => {
        setData("file", null);
        setFileName("");
        setFileSize(0);
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
    };

    const validateFile = () => {
        if (!selectedCategory || !data.file) return true;

        const extension = fileName.split(".").pop().toLowerCase();
        const fileSizeKB = fileSize / 1024;

        // Check extension
        if (
            selectedCategory.allowed_extensions &&
            selectedCategory.allowed_extensions.length > 0
        ) {
            if (!selectedCategory.allowed_extensions.includes(extension)) {
                return `Invalid file type. Allowed: ${selectedCategory.allowed_extensions.join(
                    ", "
                )}`;
            }
        }

        // Check size
        if (fileSizeKB > selectedCategory.max_file_size) {
            return `File too large. Maximum: ${Math.round(
                selectedCategory.max_file_size / 1024
            )}MB`;
        }

        return true;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const validation = validateFile();
        if (validation !== true) {
            alert(validation);
            return;
        }

        post(route("documents.store"), {
            forceFormData: true,
        });
    };

    const availableEntityTypes = selectedCategory?.entity_type
        ? [selectedCategory.entity_type]
        : Object.keys(entityOptions);

    return (
        <AuthenticatedLayout header="Upload Document">
            <Head title="Upload Document" />

            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-navy">
                            Upload New Document
                        </h2>
                        <p className="text-gray-600 mt-2">
                            Select a category and upload your document. All
                            uploads will be reviewed by admin.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Category Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Document Category{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={data.document_category_id}
                                onChange={handleCategoryChange}
                                className="w-full rounded-lg border-gray-300 focus:border-orange focus:ring focus:ring-orange focus:ring-opacity-50"
                                required
                            >
                                <option value="">
                                    Select a document category
                                </option>
                                {categories.map((category) => (
                                    <option
                                        key={category.id}
                                        value={category.id}
                                    >
                                        {category.name}
                                        {category.is_required && " (Required)"}
                                    </option>
                                ))}
                            </select>
                            {errors.document_category_id && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.document_category_id}
                                </p>
                            )}

                            {selectedCategory && (
                                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-blue-700">
                                        <strong>📋 Description:</strong>{" "}
                                        {selectedCategory.description}
                                    </p>
                                    <p className="text-sm text-blue-700 mt-1">
                                        <strong>📦 Max Size:</strong>{" "}
                                        {Math.round(
                                            selectedCategory.max_file_size /
                                                1024
                                        )}
                                        MB
                                    </p>
                                    <p className="text-sm text-blue-700 mt-1">
                                        <strong>📄 Allowed Types:</strong>{" "}
                                        {selectedCategory.allowed_extensions
                                            ? selectedCategory.allowed_extensions.join(
                                                  ", "
                                              )
                                            : "All types"}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Entity Type Selection */}
                        {availableEntityTypes.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Upload For{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.documentable_type}
                                    onChange={(e) =>
                                        setData(
                                            "documentable_type",
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-lg border-gray-300 focus:border-orange focus:ring focus:ring-orange focus:ring-opacity-50"
                                    required
                                    disabled={
                                        selectedCategory?.entity_type !== null
                                    }
                                >
                                    <option value="">Select entity type</option>
                                    {availableEntityTypes.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                                {errors.documentable_type && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.documentable_type}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Entity Selection */}
                        {data.documentable_type &&
                            entityOptions[data.documentable_type] && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select{" "}
                                        {data.documentable_type
                                            .replace("App\\Models\\", "")
                                            .replace("\\", "")}{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={data.documentable_id}
                                        onChange={(e) =>
                                            setData(
                                                "documentable_id",
                                                e.target.value
                                            )
                                        }
                                        className="w-full rounded-lg border-gray-300 focus:border-orange focus:ring focus:ring-orange focus:ring-opacity-50"
                                        required
                                    >
                                        <option value="">
                                            Select {data.documentable_type}
                                        </option>
                                        {entityOptions[
                                            data.documentable_type
                                        ].map((entity) => (
                                            <option
                                                key={entity.id}
                                                value={entity.id}
                                            >
                                                {entity.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.documentable_id && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.documentable_id}
                                        </p>
                                    )}
                                </div>
                            )}

                        {/* File Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                File <span className="text-red-500">*</span>
                            </label>

                            {!data.file ? (
                                <div
                                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                                        dragActive
                                            ? "border-orange bg-orange-50"
                                            : "border-gray-300 hover:border-gray-400"
                                    }`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                >
                                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-sm text-gray-600 mb-2">
                                        Drag and drop your file here, or
                                    </p>
                                    <label className="inline-flex items-center px-4 py-2 bg-orange text-white rounded-lg hover:bg-orange-dark cursor-pointer transition-colors">
                                        <span>Browse Files</span>
                                        <input
                                            type="file"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            accept={
                                                selectedCategory?.allowed_extensions
                                                    ? selectedCategory.allowed_extensions
                                                          .map(
                                                              (ext) => `.${ext}`
                                                          )
                                                          .join(",")
                                                    : undefined
                                            }
                                        />
                                    </label>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-center space-x-3">
                                        <FileText className="w-8 h-8 text-blue-500" />
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {fileName}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {formatFileSize(fileSize)}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={removeFile}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            )}

                            {errors.file && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.file}
                                </p>
                            )}
                        </div>

                        {/* Expiry Date (Optional) */}
                        {selectedCategory?.expires && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Expiry Date{" "}
                                    <span className="text-gray-500">
                                        (Optional)
                                    </span>
                                </label>
                                <input
                                    type="date"
                                    value={data.expiry_date}
                                    onChange={(e) =>
                                        setData("expiry_date", e.target.value)
                                    }
                                    min={
                                        new Date()
                                            .toISOString()
                                            .split("T")[0]
                                    }
                                    className="w-full rounded-lg border-gray-300 focus:border-orange focus:ring focus:ring-orange focus:ring-opacity-50"
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    Set when this document expires (e.g., ID or
                                    certificate expiry date)
                                </p>
                                {errors.expiry_date && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.expiry_date}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Info Alert */}
                        <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-yellow-800">
                                <p className="font-medium mb-1">
                                    Document Review Process
                                </p>
                                <p>
                                    Your document will be reviewed by admin
                                    before being marked as verified. You'll be
                                    notified of the status.
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={() =>
                                    router.visit(route("documents.index"))
                                }
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2 bg-orange text-white rounded-lg hover:bg-orange-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? "Uploading..." : "Upload Document"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}