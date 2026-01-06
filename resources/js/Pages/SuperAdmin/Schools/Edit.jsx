import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, School, User, Mail, Phone, MapPin, Calendar, Shield, Upload, X } from 'lucide-react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import { useState } from 'react';

export default function Edit({ school }) {
    const { data, setData, post, processing, errors } = useForm({
        name: school.name || '',
        slug: school.slug || '',
        domain: school.domain || '',
        admin_name: school.admin_name || '',
        admin_email: school.admin_email || '',
        admin_phone: school.admin_phone || '',
        address: school.address || '',
        status: school.status || 'trial',
        school_type: school.school_type || 'islamic_school',
        is_active: school.is_active || false,
        trial_ends_at: school.trial_ends_at ? school.trial_ends_at.split('T')[0] : '',
        logo: null,
        _method: 'PUT',
    });

    const [previewLogo, setPreviewLogo] = useState(
        school.logo_path ? `/storage/${school.logo_path}` : null
    );

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
        setPreviewLogo(school.logo_path ? `/storage/${school.logo_path}` : null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('super-admin.schools.update', school.id), {
            forceFormData: true,
            onError: (errors) => {
                console.error('Validation errors:', errors);
            },
            onSuccess: () => {
                console.log('School updated successfully');
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl sm:text-2xl font-bold leading-tight text-gray-800">
                    Edit School: {school.name}
                </h2>
            }
        >
            <Head title={`Edit School: ${school.name}`} />

            <div className="py-6 sm:py-12">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="space-y-6">
                        {/* Back Button */}
                        <div className="flex items-center justify-between">
                            <Link
                                href={route('super-admin.schools.show', school.id)}
                                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to School Details
                            </Link>
                        </div>

                        {/* Form Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-6 py-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                                        <School className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl sm:text-2xl font-black text-white">Edit School Information</h3>
                                        <p className="text-blue-100 text-sm">Update school details and settings</p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="p-4 sm:p-6 lg:p-8">
                                {/* Error Display */}
                                {Object.keys(errors).length > 0 && (
                                    <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4">
                                        <h4 className="text-red-800 font-bold mb-2">Please fix the following errors:</h4>
                                        <ul className="list-disc list-inside text-red-700 text-sm">
                                            {Object.entries(errors).map(([key, value]) => (
                                                <li key={key}>{value}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* School Information Section */}
                                <div className="mb-8">
                                    <h4 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                                        <School className="w-5 h-5 text-blue-600" />
                                        School Information
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* School Name */}
                                        <div>
                                            <InputLabel htmlFor="name" value="School Name *" className="font-bold" />
                                            <TextInput
                                                id="name"
                                                type="text"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                className="block w-full mt-2 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                                required
                                            />
                                            <InputError message={errors.name} className="mt-2" />
                                        </div>

                                        {/* Slug */}
                                        <div>
                                            <InputLabel htmlFor="slug" value="Slug" className="font-bold" />
                                            <TextInput
                                                id="slug"
                                                type="text"
                                                value={data.slug}
                                                onChange={(e) => setData('slug', e.target.value)}
                                                className="block w-full mt-2 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                            />
                                            <InputError message={errors.slug} className="mt-2" />
                                        </div>

                                        {/* Domain */}
                                        <div className="md:col-span-2">
                                            <InputLabel htmlFor="domain" value="Domain" className="font-bold" />
                                            <TextInput
                                                id="domain"
                                                type="text"
                                                value={data.domain}
                                                onChange={(e) => setData('domain', e.target.value)}
                                                className="block w-full mt-2 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                            />
                                            <InputError message={errors.domain} className="mt-2" />
                                        </div>

                                        {/* School Logo */}
                                        <div className="md:col-span-2">
                                            <InputLabel htmlFor="logo" value="School Logo (optional)" className="font-bold" />
                                            <div className="mt-2 flex items-start gap-4">
                                                {previewLogo ? (
                                                    <div className="relative">
                                                        <img src={previewLogo} alt="Logo preview" className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300" />
                                                        {data.logo && (
                                                            <button
                                                                type="button"
                                                                onClick={handleRemoveLogo}
                                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="w-32 h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                                        <Upload className="w-8 h-8 text-gray-400" />
                                                    </div>
                                                )}
                                                <div>
                                                    <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                                                        <Upload className="w-4 h-4 mr-2" />
                                                        {previewLogo ? 'Change Logo' : 'Upload Logo'}
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
                                    </div>
                                </div>

                                {/* Admin Information Section */}
                                <div className="mb-8 pb-8 border-b-2 border-gray-200">
                                    <h4 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                                        <User className="w-5 h-5 text-green-600" />
                                        Admin Information
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Admin Name */}
                                        <div>
                                            <InputLabel htmlFor="admin_name" value="Admin Name *" className="font-bold" />
                                            <TextInput
                                                id="admin_name"
                                                type="text"
                                                value={data.admin_name}
                                                onChange={(e) => setData('admin_name', e.target.value)}
                                                className="block w-full mt-2 rounded-xl border-gray-300 focus:border-green-500 focus:ring-green-500"
                                                required
                                            />
                                            <InputError message={errors.admin_name} className="mt-2" />
                                        </div>

                                        {/* Admin Email */}
                                        <div>
                                            <InputLabel htmlFor="admin_email" value="Admin Email *" className="font-bold" />
                                            <TextInput
                                                id="admin_email"
                                                type="email"
                                                value={data.admin_email}
                                                onChange={(e) => setData('admin_email', e.target.value)}
                                                className="block w-full mt-2 rounded-xl border-gray-300 focus:border-green-500 focus:ring-green-500"
                                                required
                                            />
                                            <InputError message={errors.admin_email} className="mt-2" />
                                        </div>

                                        {/* Admin Phone */}
                                        <div className="md:col-span-2">
                                            <InputLabel htmlFor="admin_phone" value="Admin Phone" className="font-bold" />
                                            <TextInput
                                                id="admin_phone"
                                                type="text"
                                                value={data.admin_phone}
                                                onChange={(e) => setData('admin_phone', e.target.value)}
                                                className="block w-full mt-2 rounded-xl border-gray-300 focus:border-green-500 focus:ring-green-500"
                                            />
                                            <InputError message={errors.admin_phone} className="mt-2" />
                                        </div>
                                    </div>
                                </div>

                                {/* Status & Settings Section */}
                                <div className="mb-8">
                                    <h4 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-purple-600" />
                                        Status & Settings
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {/* Status */}
                                        <div>
                                            <InputLabel htmlFor="status" value="Subscription Status *" className="font-bold" />
                                            <select
                                                id="status"
                                                value={data.status}
                                                onChange={(e) => setData('status', e.target.value)}
                                                className="block w-full mt-2 border-gray-300 rounded-xl shadow-sm focus:border-purple-500 focus:ring-purple-500 font-semibold"
                                                required
                                            >
                                                <option value="trial">Trial</option>
                                                <option value="active">Active</option>
                                                <option value="suspended">Suspended</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                            <InputError message={errors.status} className="mt-2" />
                                        </div>

                                        {/* School Type */}
                                        <div>
                                            <InputLabel htmlFor="school_type" value="School Type *" className="font-bold" />
                                            <select
                                                id="school_type"
                                                value={data.school_type}
                                                onChange={(e) => setData('school_type', e.target.value)}
                                                className="block w-full mt-2 border-gray-300 rounded-xl shadow-sm focus:border-purple-500 focus:ring-purple-500 font-semibold"
                                                required
                                            >
                                                <option value="islamic_school">Islamic School</option>
                                                <option value="madrasah">Madrasah</option>
                                            </select>
                                            <InputError message={errors.school_type} className="mt-2" />
                                            <p className="mt-2 text-sm text-gray-600">
                                                Madrasah mode hides academic subjects in reports and forms
                                            </p>
                                        </div>

                                        {/* Is Active */}
                                        <div>
                                            <InputLabel htmlFor="is_active" value="Active Status *" className="font-bold" />
                                            <select
                                                id="is_active"
                                                value={data.is_active ? '1' : '0'}
                                                onChange={(e) => setData('is_active', e.target.value === '1')}
                                                className="block w-full mt-2 border-gray-300 rounded-xl shadow-sm focus:border-purple-500 focus:ring-purple-500 font-semibold"
                                                required
                                            >
                                                <option value="1">Active</option>
                                                <option value="0">Inactive</option>
                                            </select>
                                            <InputError message={errors.is_active} className="mt-2" />
                                        </div>

                                        {/* Trial Ends At */}
                                        <div className="sm:col-span-2">
                                            <InputLabel htmlFor="trial_ends_at" value="Trial End Date" className="font-bold" />
                                            <TextInput
                                                id="trial_ends_at"
                                                type="date"
                                                value={data.trial_ends_at}
                                                onChange={(e) => setData('trial_ends_at', e.target.value)}
                                                className="block w-full mt-2 rounded-xl border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                                            />
                                            <InputError message={errors.trial_ends_at} className="mt-2" />
                                        </div>
                                    </div>
                                </div>

                                {/* Address */}
                                <div className="mb-8">
                                    <h4 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-orange-600" />
                                        Location
                                    </h4>
                                    <div>
                                        <InputLabel htmlFor="address" value="School Address" className="font-bold" />
                                        <textarea
                                            id="address"
                                            value={data.address}
                                            onChange={(e) => setData('address', e.target.value)}
                                            className="block w-full mt-2 border-gray-300 rounded-xl shadow-sm focus:border-orange-500 focus:ring-orange-500 resize-none"
                                            rows="3"
                                            placeholder="Enter complete school address..."
                                        />
                                        <InputError message={errors.address} className="mt-2" />
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t-2 border-gray-200">
                                    <Link
                                        href={route('super-admin.schools.show', school.id)}
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all duration-300"
                                    >
                                        Cancel
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Save className="w-5 h-5" />
                                        {processing ? 'Updating...' : 'Update School'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}