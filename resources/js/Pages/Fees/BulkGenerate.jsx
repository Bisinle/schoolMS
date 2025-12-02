import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft, Users, FileText, AlertCircle } from 'lucide-react';

export default function BulkGenerate({ auth, terms, guardians }) {
    const [selectedGuardians, setSelectedGuardians] = useState([]);
    const [selectAll, setSelectAll] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        academic_term_id: terms.find(t => t.is_active)?.id || '',
        payment_plan: 'full',
        guardian_ids: [],
    });

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedGuardians([]);
        } else {
            setSelectedGuardians(guardians.map(g => g.id));
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
                                    {guardians.map((guardian) => (
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
                                                <p className="text-sm font-medium text-gray-900">{guardian.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {guardian.guardian_number} • {guardian.students_count} student(s)
                                                </p>
                                            </div>
                                        </label>
                                    ))}
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
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </a>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-orange-600 border border-transparent rounded-md font-semibold text-sm text-white hover:bg-orange-700 disabled:opacity-50"
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

