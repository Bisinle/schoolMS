import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { Settings, Save } from 'lucide-react';

export default function SystemPreferencesIndex({ preferences, currencyOptions, dateFormatOptions, timeZoneOptions, languageOptions }) {
    const { data, setData, put, processing, errors } = useForm({
        currency: preferences.currency || 'KSh',
        date_format: preferences.date_format || 'DD/MM/YYYY',
        time_zone: preferences.time_zone || 'Africa/Nairobi',
        language: preferences.language || 'English',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('settings.preferences.update'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center space-x-3">
                    <Settings className="w-8 h-8 text-orange" />
                    <h2 className="text-2xl font-bold text-gray-900">System Preferences</h2>
                </div>
            }
        >
            <Head title="System Preferences" />

            <div className="max-w-3xl">
                <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-6 space-y-6">
                        {/* Currency */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Currency
                            </label>
                            <select
                                value={data.currency}
                                onChange={(e) => setData('currency', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                            >
                                {currencyOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {errors.currency && <p className="text-sm text-red-600 mt-1">{errors.currency}</p>}
                            <p className="text-sm text-gray-500 mt-1">
                                This currency will be used throughout the system for fees and payments.
                            </p>
                        </div>

                        {/* Date Format */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Date Format
                            </label>
                            <select
                                value={data.date_format}
                                onChange={(e) => setData('date_format', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                            >
                                {dateFormatOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {errors.date_format && <p className="text-sm text-red-600 mt-1">{errors.date_format}</p>}
                            <p className="text-sm text-gray-500 mt-1">
                                Choose how dates should be displayed throughout the system.
                            </p>
                        </div>

                        {/* Time Zone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Time Zone
                            </label>
                            <select
                                value={data.time_zone}
                                onChange={(e) => setData('time_zone', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                            >
                                {timeZoneOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {errors.time_zone && <p className="text-sm text-red-600 mt-1">{errors.time_zone}</p>}
                            <p className="text-sm text-gray-500 mt-1">
                                Set the time zone for your school location.
                            </p>
                        </div>

                        {/* Language */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Language
                            </label>
                            <select
                                value={data.language}
                                onChange={(e) => setData('language', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                            >
                                {languageOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {errors.language && <p className="text-sm text-red-600 mt-1">{errors.language}</p>}
                            <p className="text-sm text-gray-500 mt-1">
                                Select the primary language for the system interface.
                            </p>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="p-6 bg-gray-50 border-t border-gray-200">
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center px-6 py-3 bg-orange text-white font-medium rounded-lg hover:bg-orange/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Save className="w-5 h-5 mr-2" />
                                {processing ? 'Saving...' : 'Save Preferences'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}

