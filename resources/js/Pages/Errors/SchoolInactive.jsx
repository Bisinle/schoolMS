import { Head } from '@inertiajs/react';
import { AlertCircle, Mail, Phone } from 'lucide-react';

export default function SchoolInactive({ message }) {
    return (
        <>
            <Head title="School Inactive" />
            
            <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
                        {/* Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-12 h-12 text-red-600" />
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">
                            School Access Suspended
                        </h1>

                        {/* Message */}
                        <p className="text-gray-600 mb-6 leading-relaxed">
                            {message || 'Your school subscription has expired or been deactivated. Please contact your administrator.'}
                        </p>

                        {/* Divider */}
                        <div className="border-t border-gray-200 my-6"></div>

                        {/* Contact Information */}
                        <div className="space-y-3">
                            <p className="text-sm font-semibold text-gray-700">
                                Need Help?
                            </p>
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                                <Mail className="w-4 h-4" />
                                <span>Contact your school administrator</span>
                            </div>
                        </div>

                        {/* Additional Info */}
                        <div className="mt-6 p-4 bg-red-50 rounded-lg">
                            <p className="text-xs text-red-800">
                                <strong>Note:</strong> All users are currently blocked from accessing this school. 
                                Access will be restored once the subscription is renewed.
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-sm text-gray-500 mt-6">
                        School Management System
                    </p>
                </div>
            </div>
        </>
    );
}

