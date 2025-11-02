import { useState } from 'react';
import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Mail, Lock, Eye, EyeOff, LogIn, School } from 'lucide-react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            <div className="max-w-md w-full">
                {/* Mobile Logo - Only visible on mobile */}
                <div className="lg:hidden text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="w-20 h-20 bg-[#0b1a34] rounded-full flex items-center justify-center shadow-lg">
                            <School className="w-12 h-12 text-orange" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold text-[#0b1a34] mb-2">
                        Welcome Back
                    </h2>
                    <p className="text-gray-600">
                        Sign in to your account
                    </p>
                </div>

                {/* Desktop Header - Only visible on desktop */}
                <div className="hidden lg:block mb-10">
                    <h2 className="text-4xl font-bold text-[#0b1a34] mb-2">
                        Welcome Back
                    </h2>
                    <p className="text-gray-600 text-lg">
                        Sign in to continue to your dashboard
                    </p>
                </div>

                {/* Status Message */}
                {status && (
                    <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
                        <p className="text-sm font-medium text-green-800">{status}</p>
                    </div>
                )}

                {/* Login Form Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
                    <form onSubmit={submit} className="space-y-6">
                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className={`block w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all ${
                                        errors.email ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="you@example.com"
                                    autoComplete="username"
                                    autoFocus
                                />
                            </div>
                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className={`block w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all ${
                                        errors.password ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
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

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="w-4 h-4 text-orange border-gray-300 rounded focus:ring-orange"
                                />
                                <span className="ml-2 text-sm text-gray-600">
                                    Remember me
                                </span>
                            </label>

                            {canResetPassword && (
                                <Link
                                    href={route('password.request')}
                                    className="text-sm font-medium text-orange hover:text-orange-dark transition-colors"
                                >
                                    Forgot password?
                                </Link>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full flex items-center justify-center px-4 py-3 bg-orange text-white font-semibold rounded-lg hover:bg-orange-dark focus:outline-none focus:ring-2 focus:ring-orange focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                        >
                            <LogIn className="w-5 h-5 mr-2" />
                            {processing ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                </div>

                {/* Register Link */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link
                            href={route('register')}
                            className="font-semibold text-orange hover:text-orange-dark transition-colors"
                        >
                            Create an account
                        </Link>
                    </p>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-gray-500">
                        © {new Date().getFullYear()} School Management System. All rights reserved.
                    </p>
                </div>
            </div>
        </GuestLayout>
    );
}