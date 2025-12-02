import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { ArrowLeft, DollarSign, AlertCircle, CreditCard } from 'lucide-react';

export default function CreatePayment({ auth, invoice }) {
    const { data, setData, post, processing, errors } = useForm({
        amount: invoice.balance_due,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        reference_number: '',
        notes: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(`/invoices/${invoice.id}/payments`);
    };

    const paymentMethods = [
        { value: 'cash', label: 'Cash', icon: '💵' },
        { value: 'mpesa', label: 'M-Pesa', icon: '📱' },
        { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
        { value: 'cheque', label: 'Cheque', icon: '📝' },
    ];

    return (
        <AuthenticatedLayout header="Record Payment">
            <Head title="Record Payment" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center space-x-3">
                    <Link
                        href={`/invoices/${invoice.id}`}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-150"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <DollarSign className="w-8 h-8 text-orange" />
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Record Payment
                        </h2>
                        <p className="text-sm text-gray-600">
                            Invoice {invoice.invoice_number}
                        </p>
                    </div>
                </div>

                <div className="max-w-3xl">
                    {/* Invoice Summary */}
                    <div className="bg-gradient-to-br from-white to-gray-50 overflow-hidden shadow-lg rounded-xl border border-gray-200 mb-6 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                                <CreditCard className="w-4 h-4 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Invoice Details</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Invoice Number</p>
                                <p className="text-base font-medium text-gray-900">{invoice.invoice_number}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Guardian</p>
                                <p className="text-base font-medium text-gray-900">{invoice.guardian?.user?.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Amount</p>
                                <p className="text-base font-medium text-gray-900">KSh {invoice.total_amount.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Amount Paid</p>
                                <p className="text-base font-medium text-green-600">KSh {invoice.amount_paid.toLocaleString()}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-sm text-gray-600">Balance Due</p>
                                <p className="text-2xl font-bold text-red-600">KSh {invoice.balance_due.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Form */}
                    <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200">
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Info Alert */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg p-4 shadow-sm">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-blue-900">
                                            Payment Recording
                                        </p>
                                        <p className="text-xs text-blue-700 mt-1">
                                            Record a payment for this invoice. The invoice balance will be automatically updated.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Amount (KSh) *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <DollarSign className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        max={invoice.balance_due}
                                        value={data.amount}
                                        onChange={(e) => setData('amount', e.target.value)}
                                        className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500"
                                        required
                                    />
                                </div>
                                {errors.amount && (
                                    <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                                )}
                                <p className="mt-1 text-sm text-gray-500">
                                    Maximum: KSh {invoice.balance_due.toLocaleString()}
                                </p>
                            </div>

                            {/* Payment Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Date *
                                </label>
                                <input
                                    type="date"
                                    value={data.payment_date}
                                    onChange={(e) => setData('payment_date', e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500"
                                    required
                                />
                                {errors.payment_date && (
                                    <p className="mt-1 text-sm text-red-600">{errors.payment_date}</p>
                                )}
                            </div>

                            {/* Payment Method */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Method *
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {paymentMethods.map((method) => (
                                        <label
                                            key={method.value}
                                            className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                                                data.payment_method === method.value
                                                    ? 'border-orange-500 bg-orange-50'
                                                    : 'border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="payment_method"
                                                value={method.value}
                                                checked={data.payment_method === method.value}
                                                onChange={(e) => setData('payment_method', e.target.value)}
                                                className="text-orange-600 focus:ring-orange-500"
                                            />
                                            <span className="text-2xl">{method.icon}</span>
                                            <span className="text-sm font-medium text-gray-900">{method.label}</span>
                                        </label>
                                    ))}
                                </div>
                                {errors.payment_method && (
                                    <p className="mt-1 text-sm text-red-600">{errors.payment_method}</p>
                                )}
                            </div>

                            {/* Reference Number */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Reference Number
                                    {data.payment_method !== 'cash' && <span className="text-red-500"> *</span>}
                                </label>
                                <input
                                    type="text"
                                    value={data.reference_number}
                                    onChange={(e) => setData('reference_number', e.target.value)}
                                    placeholder={
                                        data.payment_method === 'mpesa' ? 'e.g., QA12BC3D4E' :
                                        data.payment_method === 'bank_transfer' ? 'e.g., TXN123456789' :
                                        data.payment_method === 'cheque' ? 'e.g., CHQ-001234' :
                                        'Optional'
                                    }
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500"
                                />
                                {errors.reference_number && (
                                    <p className="mt-1 text-sm text-red-600">{errors.reference_number}</p>
                                )}
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={3}
                                    placeholder="Add any additional notes about this payment..."
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500"
                                />
                                {errors.notes && (
                                    <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
                                )}
                            </div>

                            {/* Error Display */}
                            {errors.error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <p className="text-sm text-red-800">{errors.error}</p>
                                </div>
                            )}

                            {/* Submit Buttons */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                <Link
                                    href={`/invoices/${invoice.id}`}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 border border-transparent rounded-md font-semibold text-sm text-white hover:bg-orange-700 disabled:opacity-50"
                                >
                                    <CreditCard className="w-4 h-4" />
                                    {processing ? 'Recording...' : 'Record Payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

