import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import GuestLayout from "@/Components/GuestLayout";
import { Head, useForm, Link } from "@inertiajs/react";
import { Mail, ArrowLeft } from "lucide-react";

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("password.email"));
    };

    return (
        <GuestLayout>
            <Head title="Forgot Password" />

            <div className="mb-6 text-center">
                <div className="w-16 h-16 bg-orange rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-navy mb-2">
                    Forgot Your Password?
                </h2>
                <p className="text-gray-600 text-sm">
                    No problem. Enter your email address and we'll send you a
                    password reset link.
                </p>
            </div>

            {status && (
                <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <svg
                                className="h-5 w-5 text-green-500"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-green-800">
                                {status}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={submit} className="space-y-6">
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
                            className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                            isFocused={true}
                            onChange={(e) => setData("email", e.target.value)}
                            placeholder="your.email@example.com"
                        />
                    </div>
                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="flex flex-col gap-4">
                    <PrimaryButton
                        className=" w-full justify-center py-3 text-base font-semibold items-center px-4 py-2 bg-orange text-white rounded-lg hover:bg-orange-dark transition-colors"

                        disabled={processing}
                    >
                        {processing ? (
                            <span className="flex items-center gap-2">
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
                                Sending...
                            </span>
                        ) : (
                            "Send Password Reset Link"
                        )}
                    </PrimaryButton>

                    {/* Fixed Back to Login Link */}
                    <Link
                        href={route("login")}
                        className="inline-flex items-center justify-center text-sm font-medium text-gray-600 hover:text-navy transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Login
                    </Link>
                </div>
            </form>

            <div className="mt-8 text-center">
                <p className="text-xs text-gray-500">
                    Need help?{" "}
                    <a
                        href="mailto:support@schoolms.com"
                        className="text-orange hover:text-orange-dark font-medium"
                    >
                        Contact Support
                    </a>
                </p>
            </div>
        </GuestLayout>
    );
}
