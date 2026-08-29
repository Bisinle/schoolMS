import { Head, useForm, router, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Save, X, ArrowLeft } from "lucide-react";

export default function Edit({ document }) {
    const { data, setData, put, processing, errors } = useForm({
        expiry_date: document.expiry_date
            ? document.expiry_date.slice(0, 10)
            : "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route("documents.update", document.id));
    };

    return (
        <AuthenticatedLayout header="Edit Document">
            <Head title={`Edit: ${document.original_filename}`} />

            <Link
                href={route("documents.show", document.id)}
                className="inline-flex items-center px-4 py-2 bg-orange text-white rounded-lg hover:bg-orange-dark transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Document
            </Link>

            <div className="max-w-3xl mx-auto mt-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-navy">
                            Edit Document
                        </h2>
                        <p className="text-gray-600 mt-2">
                            Update the expiry date for "
                            {document.original_filename}"
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Expiry Date
                            </label>
                            <input
                                type="date"
                                value={data.expiry_date}
                                onChange={(e) =>
                                    setData("expiry_date", e.target.value)
                                }
                                className="w-full rounded-lg border-gray-300 focus:border-orange focus:ring focus:ring-orange focus:ring-opacity-50"
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                Leave blank if this document doesn't expire.
                            </p>
                            {errors.expiry_date && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.expiry_date}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={() =>
                                    router.visit(
                                        route("documents.show", document.id)
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
                                className="inline-flex items-center px-6 py-2 bg-orange text-white rounded-lg hover:bg-orange-dark transition-colors disabled:opacity-50"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {processing ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
