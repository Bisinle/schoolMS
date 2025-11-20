import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, School, User, Mail, Phone, MapPin, Calendar, Shield, Lock, Send } from 'lucide-react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        slug: '',
        domain: '',
        admin_name: '',
        admin_email: '',
        admin_phone: '',
        address: '',
        status: 'trial',
        trial_ends_at: '',
        password_option: 'auto',
        admin_password: '',
        send_email: true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('super-admin.schools.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl sm:text-2xl font-bold leading-tight text-gray-800">
                    Create New School
                </h2>
            }
        >
            <Head title="Create School" />

            <div className="py-6 sm:py-12">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="space-y-6">
                        {/* Back Button */}
                        <Link
                            href={route('super-admin.schools.index')}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Schools
                        </Link>

                        {/* Form Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-6 py-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                                        <School className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl sm:text-2xl font-black text-white">Create New School</h3>
                                        <p className="text-blue-100 text-sm">Add a new school to your network</p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="p-4 sm:p-6 lg:p-8">
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
                                                placeholder="Enter school name"
                                            />
                                            <InputError message={errors.name} className="mt-2" />
                                        </div>

                                        {/* Slug */}
                                        <div>
                                            <InputLabel htmlFor="slug" value="Slug (optional)" className="font-bold" />
                                            <TextInput
                                                id="slug"
                                                type="text"
                                                value={data.slug}
                                                onChange={(e) => setData('slug', e.target.value)}
                                                className="block w-full mt-2 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                                placeholder="auto-generated if empty"
                                            />
                                            <InputError message={errors.slug} className="mt-2" />
                                        </div>

                                        {/* Domain */}
                                        <div className="md:col-span-2">
                                            <InputLabel htmlFor="domain" value="Domain (optional)" className="font-bold" />
                                            <TextInput
                                                id="domain"
                                                type="text"
                                                value={data.domain}
                                                onChange={(e) => setData('domain', e.target.value)}
                                                className="block w-full mt-2 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                                placeholder="auto-generated if empty"
                                            />
                                            <InputError message={errors.domain} className="mt-2" />
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
                                                placeholder="Enter admin name"
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
                                                placeholder="admin@example.com"
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
                                                placeholder="+1234567890"
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

                                        {/* Trial Ends At */}
                                        <div>
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

                                {/* Password Options Section */}
                                <div className="mb-8 p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border-2 border-yellow-200">
                                    <h4 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                                        <Lock className="w-5 h-5 text-yellow-600" />
                                        Admin Password Setup
                                    </h4>

                                    {/* Password Option */}
                                    <div className="mb-6">
                                        <InputLabel htmlFor="password_option" value="Password Option *" className="font-bold" />
                                        <select
                                            id="password_option"
                                            value={data.password_option}
                                            onChange={(e) => setData('password_option', e.target.value)}
                                            className="block w-full mt-2 border-gray-300 rounded-xl shadow-sm focus:border-yellow-500 focus:ring-yellow-500 font-semibold"
                                            required
                                        >
                                            <option value="auto">Auto-generate password</option>
                                            <option value="manual">Set password manually</option>
                                        </select>
                                        <p className="mt-2 text-sm text-gray-600 font-medium">
                                            {data.password_option === 'auto'
                                                ? '✓ A secure random password will be generated automatically'
                                                : '→ You can set a custom password for the admin'}
                                        </p>
                                    </div>

                                    {/* Manual Password Input */}
                                    {data.password_option === 'manual' && (
                                        <div className="mb-6">
                                            <InputLabel htmlFor="admin_password" value="Admin Password *" className="font-bold" />
                                            <TextInput
                                                id="admin_password"
                                                type="password"
                                                value={data.admin_password}
                                                onChange={(e) => setData('admin_password', e.target.value)}
                                                className="block w-full mt-2 rounded-xl border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
                                                required={data.password_option === 'manual'}
                                                placeholder="Enter a secure password"
                                            />
                                            <InputError message={errors.admin_password} className="mt-2" />
                                            <p className="mt-2 text-sm text-gray-600 font-medium">
                                                Password must be at least 8 characters long
                                            </p>
                                        </div>
                                    )}

                                    {/* Send Email Checkbox */}
                                    <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-yellow-200">
                                        <input
                                            id="send_email"
                                            type="checkbox"
                                            checked={data.send_email}
                                            onChange={(e) => setData('send_email', e.target.checked)}
                                            className="mt-1 w-5 h-5 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                                        />
                                        <div className="flex-1">
                                            <label htmlFor="send_email" className="text-sm font-bold text-gray-700 cursor-pointer flex items-center gap-2">
                                                <Send className="w-4 h-4 text-yellow-600" />
                                                Send welcome email with login credentials
                                            </label>
                                            <p className="mt-1 text-xs text-gray-600 font-medium">
                                                {data.send_email
                                                    ? '✓ Admin will receive an email with their login credentials'
                                                    : '⚠ You will need to manually share the credentials with the admin'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t-2 border-gray-200">
                                    <Link
                                        href={route('super-admin.schools.index')}
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
                                        {processing ? 'Creating School...' : 'Create School'}
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