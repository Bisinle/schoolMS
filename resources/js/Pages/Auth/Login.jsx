import { useState } from "react";
import InputError from "@/Components/InputError";
import GuestLayout from "@/Components/GuestLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { Mail, Lock, Eye, EyeOff, LogIn, ShieldCheck, ArrowRight } from "lucide-react";

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
                <div className="mb-7 sm:mb-8">
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-orange-500 mb-2">
                        Welcome back
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight mb-2">
                        Sign in to your account
                    </h2>
                    <p className="text-slate-500 text-sm leading-relaxed">
                        Enter your credentials to access your dashboard.
                    </p>
                </div>

                {/* Status Message */}
                {status && (
                    <div className="mb-6 flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm font-medium text-emerald-800">{status}</p>
                    </div>
                )}

                {/* Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/60 overflow-hidden">

                    {/* Gradient accent bar */}
                    <div className="h-1 w-full"
                         style={{ background: 'linear-gradient(90deg, #f97316 0%, #fb923c 50%, #fdba74 100%)' }} />

                    <form onSubmit={submit} className="p-6 sm:p-8 space-y-5">

                        {/* Email */}
                        <div>
                            <label htmlFor="email"
                                   className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                                Email Address
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className={`h-4 w-4 transition-colors ${errors.email ? 'text-red-400' : 'text-slate-400 group-focus-within:text-orange-500'}`} />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    onChange={(e) => setData("email", e.target.value)}
                                    className={`block w-full pl-11 pr-4 py-3 text-sm rounded-xl border outline-none transition-all
                                        focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400
                                        ${errors.email
                                            ? 'border-red-300 bg-red-50 text-red-900 placeholder-red-300'
                                            : 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white'
                                        }`}
                                    placeholder="you@example.com"
                                    autoComplete="username"
                                    autoFocus
                                />
                            </div>
                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label htmlFor="password"
                                       className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Password
                                </label>
                                {canResetPassword && (
                                    <Link
                                        href={route("password.request")}
                                        className="text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors"
                                    >
                                        Forgot password?
                                    </Link>
                                )}
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className={`h-4 w-4 transition-colors ${errors.password ? 'text-red-400' : 'text-slate-400 group-focus-within:text-orange-500'}`} />
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={data.password}
                                    onChange={(e) => setData("password", e.target.value)}
                                    className={`block w-full pl-11 pr-12 py-3 text-sm rounded-xl border outline-none transition-all
                                        focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400
                                        ${errors.password
                                            ? 'border-red-300 bg-red-50 text-red-900 placeholder-red-300'
                                            : 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white'
                                        }`}
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword
                                        ? <EyeOff className="h-4 w-4" />
                                        : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <InputError message={errors.password} className="mt-2" />
                        </div>

                        {/* Remember me + Submit row */}
                        <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData("remember", e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400 focus:ring-offset-0"
                                />
                                <span className="text-sm text-slate-600">Keep me signed in</span>
                            </label>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl text-sm font-bold text-white transition-all
                                       disabled:opacity-60 disabled:cursor-not-allowed
                                       focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
                            style={{
                                background: processing
                                    ? 'linear-gradient(135deg, #6b7280, #9ca3af)'
                                    : 'linear-gradient(135deg, #ea580c 0%, #f97316 60%, #fb923c 100%)',
                                boxShadow: processing ? 'none' : '0 4px 14px 0 rgba(249,115,22,0.35)',
                            }}
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
                                    Sign In
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>

                    </form>
                </div>

                {/* Trust + footer */}
                <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-center gap-2">
                        <div className="h-px flex-1 bg-slate-200" />
                        <div className="flex items-center gap-1.5 px-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                            <span className="text-xs text-slate-400 font-medium">Secure &amp; encrypted connection</span>
                        </div>
                        <div className="h-px flex-1 bg-slate-200" />
                    </div>
                    <p className="text-center text-xs text-slate-400">
                        © {new Date().getFullYear()} School Management System. All rights reserved.
                    </p>
                </div>

            </div>
        </GuestLayout>
    );
}
