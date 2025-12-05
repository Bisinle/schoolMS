import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { ArrowLeft, Users, FileText, AlertCircle, CheckCircle, XCircle, Filter } from 'lucide-react';

export default function BulkGenerate({ auth, terms, guardians, activeTerm }) {
    const [selectedGuardians, setSelectedGuardians] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [preferenceFilter, setPreferenceFilter] = useState('all'); // all, with_preferences, without_preferences

    const { data, setData, post, processing, errors } = useForm({
        academic_term_id: terms.find(t => t.is_active)?.id || '',
        payment_plan: 'full',
        guardian_ids: [],
    });

    // Filter guardians based on preference status
    const filteredGuardians = useMemo(() => {
        if (preferenceFilter === 'with_preferences') {
            return guardians.filter(g => g.has_preferences);
        } else if (preferenceFilter === 'without_preferences') {
            return guardians.filter(g => !g.has_preferences);
        }
        return guardians;
    }, [guardians, preferenceFilter]);

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedGuardians([]);
        } else {
            setSelectedGuardians(filteredGuardians.map(g => g.id));
        }
        setSelectAll(!selectAll);
    };

    const handleSelectGuardian = (guardianId) => {
        if (selectedGuardians.includes(guardianId)) {
            setSelectedGuardians(selectedGuardians.filter(id => id !== guardianId));
        } else {
            setSelectedGuardians([...selectedGuardians, guardianId]);
        }
    };

    // Stats
    const stats = useMemo(() => {
        const withPrefs = guardians.filter(g => g.has_preferences).length;
        const withoutPrefs = guardians.filter(g => !g.has_preferences).length;
        return {
            total: guardians.length,
            withPreferences: withPrefs,
            withoutPreferences: withoutPrefs,
        };
    }, [guardians]);

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/fees/bulk-generate', {
            ...data,
            guardian_ids: selectedGuardians.length > 0 ? selectedGuardians : undefined,
        });
    };

    return (
        <AuthenticatedLayout header="Bulk Generate Invoices">
            <Head title="Bulk Generate Invoices" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center space-x-3">
                    <Link
                        href="/fees"
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-150"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <FileText className="w-8 h-8 text-orange" />
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Bulk Generate Invoices
                        </h2>
                        <p className="text-sm text-gray-600">
                            Generate invoices for multiple guardians at once
                        </p>
                    </div>
                </div>

                <div className="max-w-7xl">
                    <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200">
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Info Alert */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-blue-900">
                                            Bulk Invoice Generation
                                        </p>
                                        <p className="text-xs text-blue-700 mt-1">
                                            This will generate invoices for all selected guardians. If no guardians are selected, invoices will be generated for all guardians with active students.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Term Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Academic Term *
                                </label>
                                <select
                                    value={data.academic_term_id}
                                    onChange={(e) => setData('academic_term_id', e.target.value)}
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500"
                                    required
                                >
                                    <option value="">Select Term</option>
                                    {terms.map((term) => (
                                        <option key={term.id} value={term.id}>
                                            {term.academic_year?.year} - Term {term.term_number}
                                            {term.is_active && ' (Active)'}
                                        </option>
                                    ))}
                                </select>
                                {errors.academic_term_id && (
                                    <p className="mt-1 text-sm text-red-600">{errors.academic_term_id}</p>
                                )}
                            </div>

                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-blue-600 font-medium">Total Guardians</p>
                                            <p className="text-2xl font-bold text-blue-900 mt-1">{stats.total}</p>
                                        </div>
                                        <Users className="w-8 h-8 text-blue-400" />
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-green-50 to-white border border-green-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-green-600 font-medium">With Preferences</p>
                                            <p className="text-2xl font-bold text-green-900 mt-1">{stats.withPreferences}</p>
                                        </div>
                                        <CheckCircle className="w-8 h-8 text-green-400" />
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-yellow-50 to-white border border-yellow-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-yellow-600 font-medium">Without Preferences</p>
                                            <p className="text-2xl font-bold text-yellow-900 mt-1">{stats.withoutPreferences}</p>
                                        </div>
                                        <XCircle className="w-8 h-8 text-yellow-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Filter className="w-4 h-4 inline mr-1" />
                                    Filter Guardians
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPreferenceFilter('all')}
                                        className={`flex-1 px-4 py-3 min-h-[48px] rounded-lg border-2 transition-all ${
                                            preferenceFilter === 'all'
                                                ? 'border-orange-500 bg-orange-50 text-orange-700 font-semibold'
                                                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                                        }`}
                                    >
                                        All ({stats.total})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPreferenceFilter('with_preferences')}
                                        className={`flex-1 px-4 py-3 min-h-[48px] rounded-lg border-2 transition-all ${
                                            preferenceFilter === 'with_preferences'
                                                ? 'border-green-500 bg-green-50 text-green-700 font-semibold'
                                                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                                        }`}
                                    >
                                        With Preferences ({stats.withPreferences})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPreferenceFilter('without_preferences')}
                                        className={`flex-1 px-4 py-3 min-h-[48px] rounded-lg border-2 transition-all ${
                                            preferenceFilter === 'without_preferences'
                                                ? 'border-yellow-500 bg-yellow-50 text-yellow-700 font-semibold'
                                                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                                        }`}
                                    >
                                        Without Preferences ({stats.withoutPreferences})
                                    </button>
                                </div>
                            </div>

                            {/* Payment Plan */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Plan *
                                </label>
                                <select
                                    value={data.payment_plan}
                                    onChange={(e) => setData('payment_plan', e.target.value)}
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500"
                                    required
                                >
                                    <option value="full">Full Payment (5% discount)</option>
                                    <option value="half_half">Half-Half Payment</option>
                                    <option value="monthly">Monthly Payment</option>
                                </select>
                                {errors.payment_plan && (
                                    <p className="mt-1 text-sm text-red-600">{errors.payment_plan}</p>
                                )}
                            </div>

                            {/* Guardian Selection */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Select Guardians (Optional)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleSelectAll}
                                        className="text-sm text-orange-600 hover:text-orange-700"
                                    >
                                        {selectAll ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>
                                <div className="border border-gray-300 rounded-md max-h-96 overflow-y-auto">
                                    {filteredGuardians.length > 0 ? (
                                        filteredGuardians.map((guardian) => (
                                            <label
                                                key={guardian.id}
                                                className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-200 last:border-b-0"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedGuardians.includes(guardian.id)}
                                                    onChange={() => handleSelectGuardian(guardian.id)}
                                                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">{guardian.name}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {guardian.guardian_number} • {guardian.students_count} student(s)
                                                            </p>
                                                        </div>
                                                        {guardian.has_preferences ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                                                                <CheckCircle className="w-3 h-3" />
                                                                Preferences Set
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                                                                <XCircle className="w-3 h-3" />
                                                                No Preferences
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </label>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center">
                                            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                            <p className="text-sm text-gray-600">No guardians match the selected filter</p>
                                        </div>
                                    )}
                                </div>
                                <p className="mt-2 text-sm text-gray-500">
                                    {selectedGuardians.length > 0
                                        ? `${selectedGuardians.length} guardian(s) selected`
                                        : 'No guardians selected - will generate for all guardians'}
                                </p>
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end gap-3">
                                <a
                                    href="/fees"
                                    className="px-4 py-3 min-h-[48px] inline-flex items-center border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </a>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-3 min-h-[48px] bg-orange-600 border border-transparent rounded-md font-semibold text-sm text-white hover:bg-orange-700 disabled:opacity-50"
                                >
                                    {processing ? 'Generating...' : 'Generate Invoices'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

