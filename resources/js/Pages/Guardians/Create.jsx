import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { Save, X } from 'lucide-react';

export default function GuardiansCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        phone_number: '',
        address: '',
        occupation: '',
        relationship: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/guardians');
    };

    return (
        <AuthenticatedLayout header="Add New Guardian">
            <Head title="Add Guardian" />

            <div className="max-w-4xl">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Guardian Number - Auto-generated */}
                            <div className="md:col-span-2">
                                <label htmlFor="guardian_number" className="block text-sm font-medium text-gray-700 mb-1">
                                    Guardian Number
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        id="guardian_number"
                                        value="Will be auto-generated (e.g., PAR-25-001)"
                                        readOnly
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                                        Auto-generated
                                    </span>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    A unique guardian number will be automatically assigned upon registration
                                </p>
                            </div>

                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Password <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                />
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                                )}
                            </div>

                            {/* Phone Number */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.phone_number}
                                    onChange={(e) => setData('phone_number', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                />
                                {errors.phone_number && (
                                    <p className="mt-1 text-sm text-red-600">{errors.phone_number}</p>
                                )}
                            </div>

                            {/* Relationship */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Relationship <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.relationship}
                                    onChange={(e) => setData('relationship', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                >
                                    <option value="">Select Relationship</option>
                                    <option value="Father">Father</option>
                                    <option value="Mother">Mother</option>
                                    <option value="Uncle">Uncle</option>
                                    <option value="Aunt">Aunt</option>
                                    <option value="Grandparent">Grandparent</option>
                                    <option value="Other">Other</option>
                                </select>
                                {errors.relationship && (
                                    <p className="mt-1 text-sm text-red-600">{errors.relationship}</p>
                                )}
                            </div>

                            {/* Occupation */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Occupation
                                </label>
                                <input
                                    type="text"
                                    value={data.occupation}
                                    onChange={(e) => setData('occupation', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                />
                                {errors.occupation && (
                                    <p className="mt-1 text-sm text-red-600">{errors.occupation}</p>
                                )}
                            </div>

                            {/* Address */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Address
                                </label>
                                <textarea
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    rows="3"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                />
                                {errors.address && (
                                    <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                            <Link
                                href="/guardians"
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
                                {processing ? 'Saving...' : 'Save Guardian'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}