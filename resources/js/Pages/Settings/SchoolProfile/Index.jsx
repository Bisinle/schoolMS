import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { Building2, Upload, X, Save } from 'lucide-react';

export default function SchoolProfileIndex({ school }) {
    const [previewLogo, setPreviewLogo] = useState(school.logo_path ? `/storage/${school.logo_path}` : null);

    const { data, setData, post, processing, errors } = useForm({
        name: school.name || '',
        tagline: school.tagline || '',
        motto: school.motto || '',
        vision: school.vision || '',
        mission: school.mission || '',
        email: school.email || '',
        phone_primary: school.phone_primary || '',
        phone_secondary: school.phone_secondary || '',
        physical_address: school.physical_address || '',
        logo: null,
        _method: 'PUT',
    });

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('logo', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewLogo(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveLogo = () => {
        setData('logo', null);
        setPreviewLogo(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('settings.profile.update'), {
            forceFormData: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center space-x-3">
                    <Building2 className="w-8 h-8 text-orange" />
                    <h2 className="text-2xl font-bold text-gray-900">School Profile</h2>
                </div>
            }
        >
            <Head title="School Profile Settings" />

            <div className="max-w-4xl">
                <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
                    {/* School Logo Section */}
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">School Logo</h3>
                        <div className="flex items-center space-x-6">
                            {previewLogo ? (
                                <div className="relative">
                                    <img src={previewLogo} alt="School Logo" className="w-32 h-32 object-contain rounded-lg border-2 border-gray-200" />
                                    <button
                                        type="button"
                                        onClick={handleRemoveLogo}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="w-32 h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                    <Upload className="w-8 h-8 text-gray-400" />
                                </div>
                            )}
                            <div>
                                <label className="inline-flex items-center px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 cursor-pointer transition-colors">
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload Logo
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoChange}
                                        className="hidden"
                                    />
                                </label>
                                <p className="text-sm text-gray-500 mt-2">PNG, JPG, GIF up to 2MB</p>
                                {errors.logo && <p className="text-sm text-red-600 mt-1">{errors.logo}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Basic Information */}
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">School Name *</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                                    required
                                />
                                {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tagline</label>
                                <input
                                    type="text"
                                    value={data.tagline}
                                    onChange={(e) => setData('tagline', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                                    placeholder="e.g., Excellence in Islamic Education"
                                />
                                {errors.tagline && <p className="text-sm text-red-600 mt-1">{errors.tagline}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                                />
                                {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Phone</label>
                                <input
                                    type="text"
                                    value={data.phone_primary}
                                    onChange={(e) => setData('phone_primary', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                                />
                                {errors.phone_primary && <p className="text-sm text-red-600 mt-1">{errors.phone_primary}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Contact Information - Continued */}
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Contact</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Phone</label>
                                <input
                                    type="text"
                                    value={data.phone_secondary}
                                    onChange={(e) => setData('phone_secondary', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Physical Address</label>
                                <textarea
                                    value={data.physical_address}
                                    onChange={(e) => setData('physical_address', e.target.value)}
                                    rows="3"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* School Values */}
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">School Values</h3>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Motto</label>
                                <textarea
                                    value={data.motto}
                                    onChange={(e) => setData('motto', e.target.value)}
                                    rows="2"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                                    placeholder="e.g., Knowledge, Faith, Excellence"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Vision Statement</label>
                                <textarea
                                    value={data.vision}
                                    onChange={(e) => setData('vision', e.target.value)}
                                    rows="3"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                                    placeholder="Our vision for the future..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Mission Statement</label>
                                <textarea
                                    value={data.mission}
                                    onChange={(e) => setData('mission', e.target.value)}
                                    rows="3"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                                    placeholder="Our mission and purpose..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="p-6 bg-gray-50">
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center px-6 py-3 bg-orange text-white font-medium rounded-lg hover:bg-orange/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Save className="w-5 h-5 mr-2" />
                                {processing ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}

