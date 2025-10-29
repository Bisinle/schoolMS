import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { Save, X } from 'lucide-react';

export default function GradesCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        level: 'ECD',
        capacity: 40,
        description: '',
        status: 'active',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/grades');
    };

    return (
        <AuthenticatedLayout header="Add New Grade">
            <Head title="Add Grade" />

            <div className="max-w-4xl">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Grade Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Grade Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="e.g., Grade 1, Pre-Primary 1"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                )}
                            </div>

                            {/* Level */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Level <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.level}
                                    onChange={(e) => setData('level', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                >
                                    <option value="ECD">ECD (Pre-Primary 1-2)</option>
                                    <option value="Lower Primary">Lower Primary (Grade 1-3)</option>
                                    <option value="Upper Primary">Upper Primary (Grade 4-6)</option>
                                    <option value="Junior Secondary">Junior Secondary (Grade 7-9)</option>
                                </select>
                                {errors.level && (
                                    <p className="mt-1 text-sm text-red-600">{errors.level}</p>
                                )}
                            </div>

                            {/* Capacity */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Capacity <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={data.capacity}
                                    onChange={(e) => setData('capacity', e.target.value)}
                                    min="1"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                />
                                {errors.capacity && (
                                    <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>
                                )}
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                                {errors.status && (
                                    <p className="mt-1 text-sm text-red-600">{errors.status}</p>
                                )}
                            </div>

                            {/* Description */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows="4"
                                    placeholder="Brief description of this grade..."
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                />
                                {errors.description && (
                                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                            <Link
                                href="/grades"
                                className="inline-flex items-center px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center px-6 py-2.5 text-sm font-medium text-white bg-orange rounded-lg hover:bg-orange-dark transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {processing ? 'Saving...' : 'Save Grade'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}