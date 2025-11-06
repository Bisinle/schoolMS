import { useState } from 'react';
import { X, Copy, Check, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function UserPasswordModal({ isOpen, onClose, password, userName }) {
    const [copied, setCopied] = useState(false);
    const [showPassword, setShowPassword] = useState(true);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-xl font-bold text-navy">
                        Temporary Password Generated
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {/* Alert */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-amber-900 mb-1">
                                    Important: Save this password now
                                </p>
                                <p className="text-xs text-amber-800">
                                    This password will not be shown again. Please copy and share it with {userName} securely.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Password Display */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Temporary Password for {userName}
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                readOnly
                                className="w-full px-4 py-3 pr-24 bg-gray-50 border-2 border-gray-300 rounded-lg font-mono text-lg text-center focus:outline-none focus:border-orange"
                            />
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                                <button
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                                    title={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                                <button
                                    onClick={handleCopy}
                                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                                    title="Copy password"
                                >
                                    {copied ? (
                                        <Check className="w-5 h-5 text-green-600" />
                                    ) : (
                                        <Copy className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>
                        {copied && (
                            <p className="text-xs text-green-600 mt-2 text-center font-medium">
                                ✓ Password copied to clipboard
                            </p>
                        )}
                    </div>

                    {/* Instructions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-blue-900 mb-2">
                            Next Steps:
                        </p>
                        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                            <li>Copy the password above</li>
                            <li>Share it securely with the user (email, SMS, WhatsApp)</li>
                            <li>User will be required to change this password on first login</li>
                        </ol>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                    <button
                        onClick={handleCopy}
                        className="px-6 py-2.5 bg-orange text-white font-semibold rounded-lg hover:bg-orange-dark transition-colors flex items-center gap-2"
                    >
                        <Copy className="w-4 h-4" />
                        {copied ? 'Copied!' : 'Copy Password'}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}