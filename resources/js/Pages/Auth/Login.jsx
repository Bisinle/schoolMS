import { useState } from "react";
import InputError from "@/Components/InputError";
import GuestLayout from "@/Components/GuestLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { Mail, Lock, Eye, EyeOff, LogIn, ShieldCheck } from "lucide-react";

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route("login"), { onFinish: () => reset("password") });
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            <div className="w-full">
                {/* Header */}
                <div className="mb-5 sm:mb-7 lg:mb-8">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0b1a34] mb-1">
                        Welcome back
                    </h2>
                    <p className="text-gray-500 text-sm">
                        Sign in to continue to your dashboard
                    </p>
                </div>

                {/* Status Message */}
                {status && (
                    <div className="mb-5 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
                        <p className="text-sm font-medium text-green-800">{status}</p>
                    </div>
                )}

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    {/* Orange accent bar */}
                    <div className="h-1 w-full bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400" />

                    <form onSubmit={submit} className="p-5 sm:p-7 lg:p-8 space-y-4 sm:space-y-5">

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Mail className="h-4.5 w-4.5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    onChange={(e) => setData("email", e.target.value)}
                                    className={`block w-full pl-10 pr-4 py-3 text-sm border rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition-all bg-gray-50 focus:bg-white ${
                                        errors.email ? "border-red-400 bg-red-50" : "border-gray-200"
                                    }`}
                                    placeholder="you@example.com"
                                    autoComplete="username"
                                    autoFocus
                                />
                            </div>
                            <InputError message={errors.email} className="mt-1.5" />
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                                    Password
                                </label>
                                {canResetPassword && (
                                    <Link
                                        href={route("password.request")}
                                        className="text-xs font-medium text-orange-500 hover:text-orange-600 transition-colors"
                                    >
                                        Forgot password?
                                    </Link>
                                )}
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Lock className="h-4.5 w-4.5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={data.password}
                                    onChange={(e) => setData("password", e.target.value)}
                                    className={`block w-full pl-10 pr-11 py-3 text-sm border rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition-all bg-gray-50 focus:bg-white ${
                                        errors.password ? "border-red-400 bg-red-50" : "border-gray-200"
                                    }`}
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                                </button>
                            </div>
                            <InputError message={errors.password} className="mt-1.5" />
                        </div>

                        {/* Remember me */}
                        <label className="flex items-center gap-2.5 cursor-pointer select-none w-fit">
                            <input
                                type="checkbox"
                                name="remember"
                                checked={data.remember}
                                onChange={(e) => setData("remember", e.target.checked)}
                                className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-400"
                            />
                            <span className="text-sm text-gray-600">Keep me signed in</span>
                        </label>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0b1a34] text-white text-sm font-semibold rounded-xl hover:bg-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#0b1a34] focus:ring-offset-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                        >
                            {processing ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Signing in…
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-4 h-4" />
                                    Sign In
                                </>
                            )}
                        </button>

                    </form>
                </div>

                {/* Trust indicator */}
                <div className="mt-4 sm:mt-5 flex items-center justify-center gap-2 text-xs text-gray-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    <span>Your connection is secure &amp; encrypted</span>
                </div>

                {/* Footer */}
                <div className="mt-4 sm:mt-6 text-center">
                    <p className="text-xs text-gray-400">
                        © {new Date().getFullYear()} School Management System. All rights reserved.
                    </p>
                </div>
            </div>
        </GuestLayout>
    );
}
