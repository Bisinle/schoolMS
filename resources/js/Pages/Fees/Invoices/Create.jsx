import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, AlertCircle, Check, ChevronDown } from 'lucide-react';
import { Combobox } from '@headlessui/react';
import { useState } from 'react';

export default function CreateInvoice({ auth, guardians, terms }) {
    const { data, setData, post, processing, errors } = useForm({
        guardian_id: '',
        academic_term_id: terms.find(t => t.is_active)?.id || '',
        payment_plan: 'full',
    });

    const [guardianQuery, setGuardianQuery] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/invoices');
    };

    const selectedGuardian = guardians.find(g => g.id === parseInt(data.guardian_id));

    // Filter guardians based on search query
    const filteredGuardians = guardianQuery === ''
        ? guardians
        : guardians.filter((guardian) => {
            const searchTerm = guardianQuery.toLowerCase();
            return (
                guardian.name.toLowerCase().includes(searchTerm) ||
                guardian.guardian_number.toLowerCase().includes(searchTerm)
            );
        });

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center gap-4">
                    <a
                        href="/invoices"
                        className="text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </a>
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Create Invoice
                    </h2>
                </div>
            }
        >
            <Head title="Create Invoice" />

            <div className="py-12">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Info Alert */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-blue-900">
                                            Invoice Generation
                                        </p>
                                        <p className="text-xs text-blue-700 mt-1">
                                            This will generate an invoice for the selected guardian based on their active students and applicable fee categories.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Guardian Selection - Searchable */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Guardian *
                                </label>
                                <Combobox
                                    value={selectedGuardian}
                                    onChange={(guardian) => setData('guardian_id', guardian?.id || '')}
                                >
                                    <div className="relative">
                                        <div className="relative w-full">
                                            <Combobox.Input
                                                className="w-full border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500 pr-10"
                                                displayValue={(guardian) =>
                                                    guardian ? `${guardian.name} (${guardian.guardian_number})` : ''
                                                }
                                                onChange={(event) => setGuardianQuery(event.target.value)}
                                                placeholder="Search by name or ID..."
                                                required
                                            />
                                            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                                                <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                            </Combobox.Button>
                                        </div>
                                        <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                            {filteredGuardians.length === 0 && guardianQuery !== '' ? (
                                                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                                    No guardians found.
                                                </div>
                                            ) : (
                                                filteredGuardians.map((guardian) => (
                                                    <Combobox.Option
                                                        key={guardian.id}
                                                        value={guardian}
                                                        className={({ active }) =>
                                                            `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                                                                active ? 'bg-orange-600 text-white' : 'text-gray-900'
                                                            }`
                                                        }
                                                    >
                                                        {({ selected, active }) => (
                                                            <>
                                                                <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                                    {guardian.name} ({guardian.guardian_number})
                                                                </span>
                                                                <span className={`block text-xs ${active ? 'text-orange-200' : 'text-gray-500'}`}>
                                                                    {guardian.students_count} student(s)
                                                                </span>
                                                                {selected ? (
                                                                    <span
                                                                        className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                                            active ? 'text-white' : 'text-orange-600'
                                                                        }`}
                                                                    >
                                                                        <Check className="h-5 w-5" aria-hidden="true" />
                                                                    </span>
                                                                ) : null}
                                                            </>
                                                        )}
                                                    </Combobox.Option>
                                                ))
                                            )}
                                        </Combobox.Options>
                                    </div>
                                </Combobox>
                                {errors.guardian_id && (
                                    <p className="mt-1 text-sm text-red-600">{errors.guardian_id}</p>
                                )}
                                {selectedGuardian && (
                                    <p className="mt-2 text-sm text-gray-600">
                                        This guardian has {selectedGuardian.students_count} active student(s)
                                    </p>
                                )}
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
                                <div className="space-y-3">
                                    <label className="flex items-start gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="radio"
                                            name="payment_plan"
                                            value="full"
                                            checked={data.payment_plan === 'full'}
                                            onChange={(e) => setData('payment_plan', e.target.value)}
                                            className="mt-1 text-orange-600 focus:ring-orange-500"
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">Full Payment</p>
                                            <p className="text-xs text-gray-600">Pay entire amount upfront and get 5% discount</p>
                                        </div>
                                    </label>

                                    <label className="flex items-start gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="radio"
                                            name="payment_plan"
                                            value="half_half"
                                            checked={data.payment_plan === 'half_half'}
                                            onChange={(e) => setData('payment_plan', e.target.value)}
                                            className="mt-1 text-orange-600 focus:ring-orange-500"
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">Half-Half Payment</p>
                                            <p className="text-xs text-gray-600">Pay in two installments (no discount)</p>
                                        </div>
                                    </label>

                                    <label className="flex items-start gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="radio"
                                            name="payment_plan"
                                            value="monthly"
                                            checked={data.payment_plan === 'monthly'}
                                            onChange={(e) => setData('payment_plan', e.target.value)}
                                            className="mt-1 text-orange-600 focus:ring-orange-500"
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">Monthly Payment</p>
                                            <p className="text-xs text-gray-600">Pay in monthly installments (no discount)</p>
                                        </div>
                                    </label>
                                </div>
                                {errors.payment_plan && (
                                    <p className="mt-1 text-sm text-red-600">{errors.payment_plan}</p>
                                )}
                            </div>

                            {/* Error Display */}
                            {errors.error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <p className="text-sm text-red-800">{errors.error}</p>
                                </div>
                            )}

                            {/* Submit Buttons */}
                            <div className="flex justify-end gap-3">
                                <a
                                    href="/invoices"
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </a>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-orange-600 border border-transparent rounded-md font-semibold text-sm text-white hover:bg-orange-700 disabled:opacity-50"
                                >
                                    {processing ? 'Generating...' : 'Generate Invoice'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

