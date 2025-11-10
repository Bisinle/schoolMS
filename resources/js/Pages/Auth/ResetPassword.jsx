import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import GuestLayout from "@/Components/GuestLayout";
import { Head, useForm } from "@inertiajs/react";
import { useState } from "react";
import {
    Lock,
    Eye,
    EyeOff,
    CheckCircle,
    XCircle,
    Mail,
} from "lucide-react";

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: "",
        password_confirmation: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] =
        useState(false);

    // Password strength checker
    const getPasswordStrength = (password) => {
        if (!password) return { strength: 0, label: "", color: "" };

        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[!@#$%^&*]/.test(password)) strength++;

        const levels = [
            { strength: 0, label: "Very Weak", color: "bg-red-500" },
            { strength: 1, label: "Weak", color: "bg-orange-500" },
            { strength: 2, label: "Fair", color: "bg-yellow-500" },
            { strength: 3, label: "Good", color: "bg-blue-500" },
            { strength: 4, label: "Strong", color: "bg-green-500" },
        ];

        return levels[strength];
    };

    const passwordStrength = getPasswordStrength(data.password);

    const requirements = [
        { met: data.password.length >= 8, text: "At least 8 characters" },
        { met: /[A-Z]/.test(data.password), text: "One uppercase letter" },
        { met: /[a-z]/.test(data.password), text: "One lowercase letter" },
        { met: /\d/.test(data.password), text: "One number" },
        {
            met: /[!@#$%^&*]/.test(data.password),
            text: "One special character (!@#$%^&*)",
        },
    ];

    const submit = (e) => {
        e.preventDefault();

        post(route("password.store"), {
            onFinish: () => reset("password", "password_confirmation"),
        });
    };

    return (
        <GuestLayout>
            <Head title="Reset Password" />

            <div className="mb-6 text-center">
                <div className="w-16 h-16 bg-orange rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-navy mb-2">
                    Create New Password
                </h2>
                <p className="text-gray-600 text-sm">
                    Choose a strong password to secure your account
                </p>
            </div>

            <form onSubmit={submit} className="space-y-6">
                {/* Email Field */}
                <div>
                    <label
                        htmlFor="email"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                        Email Address
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                            autoComplete="username"
                            readOnly
                        />
                    </div>
                    <InputError message={errors.email} className="mt-2" />
                </div>

                {/* Password Field */}
                <div>
                    <label
                        htmlFor="password"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                        New Password
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <TextInput
                            id="password"
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={data.password}
                            className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                            autoComplete="new-password"
                            isFocused={true}
                            onChange={(e) => setData("password", e.target.value)}
                            placeholder="Enter your new password"
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

                    {/* Password Strength Indicator */}
                    {data.password && (
                        <div className="mt-2">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-gray-600">
                                    Password Strength:
                                </span>
                                <span
                                    className={`text-sm font-medium ${
                                        passwordStrength.strength <= 1
                                            ? "text-red-600"
                                            : passwordStrength.strength === 2
                                            ? "text-yellow-600"
                                            : passwordStrength.strength === 3
                                            ? "text-blue-600"
                                            : "text-green-600"
                                    }`}
                                >
                                    {passwordStrength.label}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                                    style={{
                                        width: `${
                                            (passwordStrength.strength / 4) *
                                            100
                                        }%`,
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    <InputError message={errors.password} className="mt-2" />
                </div>

                {/* Confirm Password Field */}
                <div>
                    <label
                        htmlFor="password_confirmation"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                        Confirm New Password
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <TextInput
                            type={showPasswordConfirmation ? "text" : "password"}
                            id="password_confirmation"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                            autoComplete="new-password"
                            onChange={(e) =>
                                setData("password_confirmation", e.target.value)
                            }
                            placeholder="Confirm your new password"
                        />
                        <button
                            type="button"
                            onClick={() =>
                                setShowPasswordConfirmation(
                                    !showPasswordConfirmation
                                )
                            }
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            {showPasswordConfirmation ? (
                                <EyeOff className="h-5 w-5" />
                            ) : (
                                <Eye className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>

                {/* Password Requirements */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                        Password Requirements:
                    </p>
                    <ul className="space-y-1">
                        {requirements.map((req, index) => (
                            <li
                                key={index}
                                className="flex items-center text-sm"
                            >
                                {req.met ? (
                                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                ) : (
                                    <XCircle className="h-4 w-4 text-gray-300 mr-2 flex-shrink-0" />
                                )}
                                <span
                                    className={
                                        req.met
                                            ? "text-green-700"
                                            : "text-gray-600"
                                    }
                                >
                                    {req.text}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="flex flex-col gap-4 pt-2 ">
                    <PrimaryButton
                        className=" bg-orange text-white rounded-lg hover:bg-orange-dark transition-colors w-full justify-center py-3 text-base font-semibold"
                        disabled={processing}
                        href={route("login")}
                    >
                        {processing ? (
                            <span className=" flex items-center gap-2">
                                <svg
                                    className="animate-spin h-5 w-5 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                                Resetting Password...
                            </span>
                        ) : (
                            "Reset Password"
                        )}
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}