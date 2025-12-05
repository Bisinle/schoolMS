import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link, router } from '@inertiajs/react';
import { ArrowLeft, AlertCircle, Check, ChevronDown, Receipt, Plus, Eye, CheckCircle, XCircle, Loader } from 'lucide-react';
import { Combobox } from '@headlessui/react';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function CreateInvoice({ auth, guardians = [], activeTerm, tuitionFees, transportRoutes, universalFees }) {
    const { data, setData, post, processing, errors } = useForm({
        guardian_id: '',
        academic_term_id: activeTerm?.id ?? '',
        payment_plan: 'full',
    });

    const [guardianQuery, setGuardianQuery] = useState('');
    const [preview, setPreview] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();

        // Prevent submission if guardian has no preferences
        if (selectedGuardian && !selectedGuardian.has_preferences) {
            alert('Please set fee preferences for this guardian before generating an invoice.');
            return;
        }

        post('/invoices');
    };

    const selectedGuardian = guardians.find(g => g.id === parseInt(data.guardian_id));

    // Load preview when guardian is selected
    useEffect(() => {
        if (data.guardian_id && data.academic_term_id) {
            loadPreview();
        } else {
            setPreview(null);
            setShowPreview(false);
        }
    }, [data.guardian_id]);

    const loadPreview = async () => {
        setLoadingPreview(true);
        try {
            const response = await axios.post('/invoices/preview', {
                guardian_id: data.guardian_id,
                academic_term_id: data.academic_term_id,
            });
            setPreview(response.data);
            setShowPreview(true);
        } catch (error) {
            console.error('Failed to load preview:', error);
            setPreview(null);
            setShowPreview(false);
        } finally {
            setLoadingPreview(false);
        }
    };

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
        <AuthenticatedLayout header="Create Invoice">
            <Head title="Create Invoice" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center space-x-3">
                    <Link
                        href="/invoices"
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-150"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <Plus className="w-8 h-8 text-orange" />
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Create Invoice
                        </h2>
                        <p className="text-sm text-gray-600">
                            Generate a new fee invoice for a guardian
                        </p>
                    </div>
                </div>

                <div className="max-w-3xl">
                    <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200">
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
                                                    guardian?.name ? `${guardian.name} (${guardian.guardian_number})` : ''
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
                                                                <div className="flex items-center justify-between w-full">
                                                                    <div className="flex-1">
                                                                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                                            {guardian.name} ({guardian.guardian_number})
                                                                        </span>
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <span className={`text-xs ${active ? 'text-orange-200' : 'text-gray-500'}`}>
                                                                                {guardian.students_count} student(s)
                                                                            </span>
                                                                            {guardian.has_preferences ? (
                                                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                                                                    active ? 'bg-green-200 text-green-900' : 'bg-green-100 text-green-800'
                                                                                }`}>
                                                                                    <CheckCircle className="w-3 h-3" />
                                                                                    Preferences Set
                                                                                </span>
                                                                            ) : (
                                                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                                                                    active ? 'bg-yellow-200 text-yellow-900' : 'bg-yellow-100 text-yellow-800'
                                                                                }`}>
                                                                                    <XCircle className="w-3 h-3" />
                                                                                    No Preferences
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
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
                                    <div className="mt-2 space-y-1">
                                        <p className="text-sm text-gray-600">
                                            This guardian has {selectedGuardian.students_count} active student(s)
                                        </p>
                                        {!selectedGuardian.has_preferences && activeTerm && (
                                            <div className="flex items-start gap-2 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                                                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold text-red-900 mb-1">
                                                        Fee Preferences Required
                                                    </p>
                                                    <p className="text-xs text-red-800 mb-2">
                                                        This guardian has no fee preferences set. You must set preferences before generating an invoice.
                                                    </p>
                                                    <Link
                                                        href={`/fee-preferences/${selectedGuardian.id}/edit?term=${activeTerm.id}`}
                                                        className="inline-flex items-center gap-1 text-sm text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded font-semibold transition-colors"
                                                    >
                                                        Set Preferences Now →
                                                    </Link>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Invoice Preview */}
                            {loadingPreview && (
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                                    <div className="flex items-center justify-center gap-3">
                                        <Loader className="w-5 h-5 text-orange-600 animate-spin" />
                                        <span className="text-sm text-gray-600">Loading preview...</span>
                                    </div>
                                </div>
                            )}

                            {showPreview && preview && (
                                <div className="bg-gradient-to-br from-orange-50 to-white border border-orange-200 rounded-lg overflow-hidden">
                                    <div className="bg-gradient-to-r from-orange-600 to-orange-500 px-4 py-3 flex items-center gap-2">
                                        <Eye className="w-5 h-5 text-white" />
                                        <h3 className="text-white font-semibold">Invoice Preview</h3>
                                    </div>

                                    <div className="p-4 space-y-3">
                                        {preview.students.map((student, index) => (
                                            <div key={student.id} className="bg-white border border-gray-200 rounded-lg p-4">
                                                {/* Student Header */}
                                                <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900">{student.name}</h4>
                                                        <p className="text-sm text-gray-600">Grade {student.grade}</p>
                                                    </div>
                                                    {!student.has_preference && (
                                                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                                            No Preference
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Fee Breakdown */}
                                                {Object.keys(student.fee_breakdown).length > 0 ? (
                                                    <div className="space-y-2">
                                                        {Object.entries(student.fee_breakdown).map(([feeName, feeData]) => (
                                                            <div key={feeName} className="flex items-center justify-between text-sm">
                                                                <div className="flex-1">
                                                                    <span className="text-gray-700 font-medium">{feeName}</span>
                                                                    {feeData.type && (
                                                                        <span className="ml-2 text-xs text-gray-500">({feeData.type})</span>
                                                                    )}
                                                                    {feeData.route && (
                                                                        <span className="ml-2 text-xs text-gray-500">- {feeData.route}</span>
                                                                    )}
                                                                </div>
                                                                <span className="font-semibold text-gray-900">
                                                                    KSh {feeData.amount.toLocaleString()}
                                                                </span>
                                                            </div>
                                                        ))}

                                                        {/* Student Total */}
                                                        <div className="pt-2 mt-2 border-t border-gray-200 flex items-center justify-between">
                                                            <span className="text-sm font-semibold text-gray-700">Student Total</span>
                                                            <span className="text-base font-bold text-orange-600">
                                                                KSh {student.total.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-4">
                                                        <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                        <p className="text-sm text-gray-500">No fees configured for this student</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {/* Grand Total */}
                                        <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-lg p-4 flex items-center justify-between">
                                            <span className="text-white font-bold text-lg">Grand Total</span>
                                            <span className="text-white font-bold text-2xl">
                                                KSh {preview.grand_total.toLocaleString()}
                                            </span>
                                        </div>

                                        {!preview.has_preferences && (
                                            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                                <p className="text-xs text-yellow-800">
                                                    This invoice will use the default fee structure since no preferences are set.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Term Display (Read-only) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Academic Term
                                </label>
                                <div className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-md text-gray-900">
                                    {activeTerm ? (
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">
                                                {activeTerm.academic_year?.year} - Term {activeTerm.term_number}
                                            </span>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Active Term
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-red-600">No active term found</span>
                                    )}
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    Invoices can only be created for the active academic term
                                </p>
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
                                    className="px-4 py-3 min-h-[48px] inline-flex items-center border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </a>
                                <button
                                    type="submit"
                                    disabled={processing || (selectedGuardian && !selectedGuardian.has_preferences)}
                                    className="px-4 py-3 min-h-[48px] bg-orange-600 border border-transparent rounded-md font-semibold text-sm text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={selectedGuardian && !selectedGuardian.has_preferences ? 'Please set fee preferences first' : ''}
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

