import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import { ArrowLeft, UserPlus, Mail, User, Phone, Shield, Lock, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export default function Create({ auth, roles }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        role: 'teacher',
        password_setup_method: 'generate',
        password: '',
        password_confirmation: '',
        must_change_password: false,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('users.store'));
    };

    return (
        <AuthenticatedLayout header="Create New User">
            <Head title="Create User" />

            <div className="max-w-3xl mx-auto">
                {/* Back Button */}
                <Link
                    href={route('users.index')}
                    className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Users
                </Link>

                {/* Form Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-orange rounded-lg flex items-center justify-center">
                                <UserPlus className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-navy">Create New User</h2>
                                <p className="text-sm text-gray-600 mt-0.5">
                                    Add a new user to the system
                                </p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6">
                        {/* Personal Information Section */}
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-navy mb-4 flex items-center gap-2">
                                <User className="w-5 h-5 text-orange" />
                                Personal Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Full Name */}
                                <div className="md:col-span-2">
                                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            id="name"
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                            placeholder="John Doe"
                                            autoFocus
                                        />
                                    </div>
                                    <InputError message={errors.name} className="mt-2" />
                                </div>

                                {/* Email */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Email Address <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                    <InputError message={errors.email} className="mt-2" />
                                </div>

                                {/* Phone */}
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Phone Number
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Phone className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            id="phone"
                                            type="tel"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                            placeholder="+254 712 345 678"
                                        />
                                    </div>
                                    <InputError message={errors.phone} className="mt-2" />
                                </div>
                            </div>
                        </div>

                        {/* Role Section */}
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-navy mb-4 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-orange" />
                                Role & Permissions
                            </h3>
                            <div>
                                <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-2">
                                    User Role <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="role"
                                    value={data.role}
                                    onChange={(e) => setData('role', e.target.value)}
                                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                >
                                    {roles.map((role) => (
                                        <option key={role.value} value={role.value}>
                                            {role.label}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.role} className="mt-2" />
                            </div>
                        </div>

                        {/* Password Setup Section */}
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-navy mb-4 flex items-center gap-2">
                                <Lock className="w-5 h-5 text-orange" />
                                Password Setup
                            </h3>

                            <div className="space-y-4">
                                {/* Password Setup Method */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                        How should the password be set? <span className="text-red-500">*</span>
                                    </label>
                                    <div className="space-y-3">
                                        {/* Generate Password */}
                                        <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-orange hover:bg-orange-50 has-[:checked]:border-orange has-[:checked]:bg-orange-50">
                                            <input
                                                type="radio"
                                                name="password_setup_method"
                                                value="generate"
                                                checked={data.password_setup_method === 'generate'}
                                                onChange={(e) => setData('password_setup_method', e.target.value)}
                                                className="mt-1 w-4 h-4 text-orange border-gray-300 focus:ring-orange"
                                            />
                                            <div className="ml-3">
                                                <div className="text-sm font-semibold text-navy">
                                                    Generate temporary password
                                                </div>
                                                <div className="text-xs text-gray-600 mt-1">
                                                    System will create a strong random password and show it to you. User must change on first login.
                                                </div>
                                            </div>
                                        </label>

                                        {/* Send Email */}
                                        <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-orange hover:bg-orange-50 has-[:checked]:border-orange has-[:checked]:bg-orange-50">
                                            <input
                                                type="radio"
                                                name="password_setup_method"
                                                value="send_email"
                                                checked={data.password_setup_method === 'send_email'}
                                                onChange={(e) => setData('password_setup_method', e.target.value)}
                                                className="mt-1 w-4 h-4 text-orange border-gray-300 focus:ring-orange"
                                            />
                                            <div className="ml-3">
                                                <div className="text-sm font-semibold text-navy">
                                                    Send password setup email
                                                </div>
                                                <div className="text-xs text-gray-600 mt-1">
                                                    User will receive an email with a link to create their own password. Most secure option.
                                                </div>
                                            </div>
                                        </label>

                                        {/* Custom Password */}
                                        <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-orange hover:bg-orange-50 has-[:checked]:border-orange has-[:checked]:bg-orange-50">
                                            <input
                                                type="radio"
                                                name="password_setup_method"
                                                value="custom"
                                                checked={data.password_setup_method === 'custom'}
                                                onChange={(e) => setData('password_setup_method', e.target.value)}
                                                className="mt-1 w-4 h-4 text-orange border-gray-300 focus:ring-orange"
                                            />
                                            <div className="ml-3">
                                                <div className="text-sm font-semibold text-navy">
                                                    Set custom password
                                                </div>
                                                <div className="text-xs text-gray-600 mt-1">
                                                    You choose the password. Good for non-technical users you'll contact directly.
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                    <InputError message={errors.password_setup_method} className="mt-2" />
                                </div>

                                {/* Custom Password Fields */}
                                {data.password_setup_method === 'custom' && (
                                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Password */}
                                            <div>
                                                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Password <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <Lock className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                    <input
                                                        id="password"
                                                        type={showPassword ? 'text' : 'password'}
                                                        value={data.password}
                                                        onChange={(e) => setData('password', e.target.value)}
                                                        className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                                        placeholder="Enter password"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                                    >
                                                        {showPassword ? (
                                                            <EyeOff className="h-5 w-5" />
                                                        ) : (
                                                            <Eye className="h-5 w-5" />
                                                        )}
                                                    </button>
                                                </div>
                                                <InputError message={errors.password} className="mt-2" />
                                            </div>

                                            {/* Confirm Password */}
                                            <div>
                                                <label htmlFor="password_confirmation" className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Confirm Password <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <Lock className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                    <input
                                                        id="password_confirmation"
                                                        type={showPasswordConfirmation ? 'text' : 'password'}
                                                        value={data.password_confirmation}
                                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                                        className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                                        placeholder="Confirm password"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                                    >
                                                        {showPasswordConfirmation ? (
                                                            <EyeOff className="h-5 w-5" />
                                                        ) : (
                                                            <Eye className="h-5 w-5" />
                                                        )}
                                                    </button>
                                                </div>
                                                <InputError message={errors.password_confirmation} className="mt-2" />
                                            </div>
                                        </div>

                                        <div className="mt-4 text-xs text-gray-600">
                                            <p className="font-semibold mb-1">Password requirements:</p>
                                            <ul className="list-disc list-inside space-y-0.5 ml-2">
                                                <li>Minimum 8 characters</li>
                                                <li>At least one uppercase letter</li>
                                                <li>At least one lowercase letter</li>
                                                <li>At least one number</li>
                                                <li>At least one special character (!@#$%^&*)</li>
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
                            <Link
                                href={route('users.index')}
                                className="px-6 py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2.5 bg-orange text-white font-semibold rounded-lg hover:bg-orange-dark transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <UserPlus className="w-5 h-5" />
                                {processing ? 'Creating User...' : 'Create User'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}