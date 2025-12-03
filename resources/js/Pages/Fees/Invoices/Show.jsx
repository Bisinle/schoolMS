import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Plus, Download, Trash2, Edit, Save, X, User, DollarSign, Receipt, AlertCircle } from 'lucide-react';
import { Badge } from '@/Components/UI';
import InvoiceHeader from '@/Components/Invoice/InvoiceHeader';
import { useState, useEffect } from 'react';

export default function InvoiceShow({ auth, invoice, school }) {
    const [isEditMode, setIsEditMode] = useState(false);
    const [editedLineItems, setEditedLineItems] = useState([]);
    const [processing, setProcessing] = useState(false);

    // Initialize edited line items from invoice data
    useEffect(() => {
        if (invoice.line_items) {
            setEditedLineItems(invoice.line_items.map(item => ({
                id: item.id,
                student_name: item.student_name,
                grade_name: item.grade_name,
                fee_breakdown: { ...item.fee_breakdown },
                total_amount: item.total_amount
            })));
        }
    }, [invoice.line_items]);

    const getStatusBadge = (status) => {
        return <Badge variant="invoiceStatus" value={status} />;
    };

    // Get all unique fee categories from all line items
    const getAllFeeCategories = () => {
        const categories = new Set();
        invoice.line_items?.forEach(item => {
            if (item.fee_breakdown) {
                Object.keys(item.fee_breakdown).forEach(cat => categories.add(cat));
            }
        });
        return Array.from(categories).sort();
    };

    const feeCategories = getAllFeeCategories();

    // Handle fee amount change
    const handleFeeChange = (lineItemIndex, category, value) => {
        const newLineItems = [...editedLineItems];
        const numValue = parseFloat(value) || 0;
        newLineItems[lineItemIndex].fee_breakdown[category] = numValue;

        // Recalculate total for this line item
        newLineItems[lineItemIndex].total_amount = Object.values(newLineItems[lineItemIndex].fee_breakdown)
            .reduce((sum, amount) => sum + parseFloat(amount || 0), 0);

        setEditedLineItems(newLineItems);
    };

    // Calculate new invoice totals
    const calculateNewTotals = () => {
        const subtotal = editedLineItems.reduce((sum, item) => sum + item.total_amount, 0);
        const discount = subtotal * (invoice.discount_percentage / 100);
        const total = subtotal - discount;
        return { subtotal, discount, total };
    };

    const newTotals = isEditMode ? calculateNewTotals() : null;

    // Save changes
    const handleSave = () => {
        setProcessing(true);

        const payload = {
            line_items: editedLineItems.map(item => ({
                id: item.id,
                fee_breakdown: item.fee_breakdown
            }))
        };

        router.put(route('invoices.updateLineItems', invoice.id), payload, {
            onSuccess: () => {
                setIsEditMode(false);
                setProcessing(false);
            },
            onError: (errors) => {
                console.error('Save failed:', errors);
                setProcessing(false);
            },
            preserveScroll: true
        });
    };

    // Cancel editing
    const handleCancel = () => {
        // Reset to original values
        setEditedLineItems(invoice.line_items.map(item => ({
            id: item.id,
            student_name: item.student_name,
            grade_name: item.grade_name,
            fee_breakdown: { ...item.fee_breakdown },
            total_amount: item.total_amount
        })));
        setIsEditMode(false);
    };

    const displayLineItems = isEditMode ? editedLineItems : invoice.line_items;

    return (
        <AuthenticatedLayout header={`Invoice ${invoice.invoice_number}`}>
            <Head title={`Invoice ${invoice.invoice_number}`} />

            <div className="space-y-6">
                {/* Action Buttons Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                    {/* Back Button */}
                    <Link
                        href={auth.user.role === 'guardian' ? '/guardian/invoices' : '/invoices'}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Back to Invoices</span>
                        <span className="sm:hidden">Back</span>
                    </Link>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                        {isEditMode ? (
                            <>
                                {/* Save Button */}
                                <button
                                    onClick={handleSave}
                                    disabled={processing}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                                >
                                    <Save className="w-4 h-4" />
                                    <span className="hidden sm:inline">{processing ? 'Saving...' : 'Save Changes'}</span>
                                    <span className="sm:hidden">{processing ? '...' : 'Save'}</span>
                                </button>

                                {/* Cancel Button */}
                                <button
                                    onClick={handleCancel}
                                    disabled={processing}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                                >
                                    <X className="w-4 h-4" />
                                    <span>Cancel</span>
                                </button>
                            </>
                        ) : (
                            <>
                                {/* Edit Button - Admin only, pending invoices only */}
                                {auth.user.role === 'admin' && invoice.status === 'pending' && (
                                    <button
                                        onClick={() => setIsEditMode(true)}
                                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
                                    >
                                        <Edit className="w-4 h-4" />
                                        <span className="hidden sm:inline">Edit Invoice</span>
                                        <span className="sm:hidden">Edit</span>
                                    </button>
                                )}

                                {/* Record Payment - Admin only, if balance due */}
                                {auth.user.role === 'admin' && invoice.balance_due > 0 && (
                                    <Link
                                        href={`/invoices/${invoice.id}/payments/create`}
                                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange text-white rounded-lg hover:bg-orange-dark shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span className="hidden sm:inline">Record Payment</span>
                                        <span className="sm:hidden">Payment</span>
                                    </Link>
                                )}

                                {/* Download PDF */}
                                <Link
                                    href={`/invoices/${invoice.id}/pdf`}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
                                >
                                    <Download className="w-4 h-4" />
                                    <span className="hidden sm:inline">Download PDF</span>
                                    <span className="sm:hidden">PDF</span>
                                </Link>

                                {/* Delete - Admin only (always visible for development) */}
                                {auth.user.role === 'admin' && (
                                    <Link
                                        href={`/invoices/${invoice.id}`}
                                        method="delete"
                                        as="button"
                                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
                                        onBefore={() => confirm('Are you sure you want to delete this invoice? This will also delete all associated payments. This action cannot be undone.')}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span className="hidden sm:inline">Delete Invoice</span>
                                        <span className="sm:hidden">Delete</span>
                                    </Link>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Invoice Container */}
                <div className="bg-white shadow-2xl rounded-2xl border border-gray-100 overflow-hidden">
                    {/* School Header */}
                    <InvoiceHeader school={school} invoice={invoice} />

                    {/* Invoice Items Table */}
                    <div className="p-6 lg:p-8">
                        {/* Section Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Receipt className="w-5 h-5 text-white" />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 uppercase tracking-wide">
                                Fee Breakdown
                            </h4>
                        </div>

                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-navy via-navy/95 to-navy/90">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Student Name
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Grade
                                        </th>
                                        {feeCategories.map(category => (
                                            <th key={category} className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">
                                                {category}
                                            </th>
                                        ))}
                                        <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider bg-gradient-to-r from-orange-600 to-orange-700">
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {displayLineItems?.map((item, index) => (
                                        <tr key={item.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-orange-50 transition-colors duration-150`}>
                                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center">
                                                        <User className="w-4 h-4 text-orange-600" />
                                                    </div>
                                                    {item.student_name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-navy/5 text-navy font-medium">
                                                    {item.grade_name}
                                                </span>
                                            </td>
                                            {feeCategories.map(category => (
                                                <td key={category} className="px-6 py-4 text-sm text-right font-mono text-gray-900">
                                                    {isEditMode ? (
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={item.fee_breakdown?.[category] || 0}
                                                            onChange={(e) => handleFeeChange(index, category, e.target.value)}
                                                            className="w-full px-3 py-2.5 text-right border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-150 font-mono"
                                                        />
                                                    ) : (
                                                        item.fee_breakdown?.[category]
                                                            ? `KSh ${Number(item.fee_breakdown[category]).toLocaleString()}`
                                                            : '-'
                                                    )}
                                                </td>
                                            ))}
                                            <td className={`px-6 py-4 text-sm text-right font-bold font-mono ${isEditMode ? 'text-indigo-600' : 'text-orange-600'} bg-gradient-to-r from-orange-50/50 to-orange-100/50`}>
                                                KSh {Number(item.total_amount).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-4">
                            {displayLineItems?.map((item, index) => (
                                <div key={item.id} className="border-2 border-gray-200 rounded-2xl p-5 bg-gradient-to-br from-white to-gray-50/50 shadow-md hover:shadow-lg transition-all duration-200">
                                    <div className="flex justify-between items-start mb-4 pb-4 border-b-2 border-gray-200">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                                                <User className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-lg">{item.student_name}</p>
                                                <p className="text-sm text-gray-600 font-medium">{item.grade_name}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wider">Total</p>
                                            <p className={`font-bold text-xl ${isEditMode ? 'text-indigo-600' : 'text-orange-600'}`}>
                                                KSh {Number(item.total_amount).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {Object.entries(item.fee_breakdown || {}).map(([category, amount]) => (
                                            <div key={category} className="flex justify-between items-center gap-3 py-2 px-3 bg-white rounded-lg border border-gray-100">
                                                <span className="text-sm font-semibold text-gray-700">{category}:</span>
                                                {isEditMode ? (
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={amount || 0}
                                                        onChange={(e) => handleFeeChange(index, category, e.target.value)}
                                                        className="w-36 px-3 py-2.5 text-right border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono"
                                                    />
                                                ) : (
                                                    <span className="font-mono text-sm font-bold text-gray-900">
                                                        KSh {Number(amount).toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Edit Mode Alert */}
                        {isEditMode && (
                            <div className="mt-6 p-5 bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 border-l-4 border-indigo-600 rounded-xl shadow-md">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                                        <AlertCircle className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-indigo-900 font-bold mb-1">Editing Mode Active</p>
                                        <p className="text-sm text-indigo-700">New totals will be calculated when you save your changes</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Totals Section */}
                        <div className="mt-8 border-t-2 border-gray-200 pt-8">
                            <div className="flex justify-end">
                                <div className="w-full md:w-1/2 lg:w-1/3 space-y-4 bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl border-2 border-gray-200 shadow-xl">
                                    <div className="flex justify-between items-center text-base">
                                        <span className="text-gray-600 font-semibold">Subtotal:</span>
                                        <span className={`font-mono font-bold text-lg ${isEditMode ? 'text-indigo-600' : 'text-gray-900'}`}>
                                            KSh {Number(isEditMode ? newTotals.subtotal : invoice.subtotal_amount).toLocaleString()}
                                        </span>
                                    </div>

                                    {(invoice.discount_amount > 0 || (isEditMode && newTotals.discount > 0)) && (
                                        <div className="flex justify-between items-center text-base">
                                            <span className="text-gray-600 font-semibold">
                                                Discount ({invoice.discount_percentage}%):
                                            </span>
                                            <span className={`font-mono font-bold text-lg ${isEditMode ? 'text-indigo-600' : 'text-green-600'}`}>
                                                - KSh {Number(isEditMode ? newTotals.discount : invoice.discount_amount).toLocaleString()}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center text-xl font-bold border-t-2 border-gray-300 pt-4 mt-4">
                                        <span className="text-gray-900">Total Amount:</span>
                                        <span className={`font-mono ${isEditMode ? 'text-indigo-600' : 'text-orange-600'}`}>
                                            KSh {Number(isEditMode ? newTotals.total : invoice.total_amount).toLocaleString()}
                                        </span>
                                    </div>

                                    {invoice.amount_paid > 0 && (
                                        <>
                                            <div className="flex justify-between items-center text-base pt-3">
                                                <span className="text-gray-600 font-semibold">Amount Paid:</span>
                                                <span className="font-mono font-bold text-lg text-green-600">
                                                    KSh {Number(invoice.amount_paid).toLocaleString()}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center text-xl font-bold border-t-2 border-gray-300 pt-4 mt-4">
                                                <span className="text-gray-900">Balance Due:</span>
                                                <span className={`font-mono ${invoice.balance_due > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                    KSh {Number(invoice.balance_due).toLocaleString()}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment History */}
                    {invoice.payments && invoice.payments.length > 0 && (
                        <div className="border-t-2 border-gray-200 p-6 lg:p-8 bg-gradient-to-br from-green-50/50 to-white">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <DollarSign className="w-5 h-5 text-white" />
                                </div>
                                <h4 className="text-xl font-bold text-gray-900 uppercase tracking-wide">
                                    Payment History
                                </h4>
                            </div>

                            {/* Desktop Table */}
                            <div className="hidden sm:block overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gradient-to-r from-green-600 via-green-600 to-green-700">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                                Method
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                                Reference
                                            </th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">
                                                Amount
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {invoice.payments.map((payment, index) => (
                                            <tr key={payment.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-green-50/50'} hover:bg-green-100/50 transition-colors duration-150`}>
                                                <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                                                    {new Date(payment.payment_date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 font-medium capitalize">
                                                        {payment.payment_method.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700 font-mono">
                                                    {payment.transaction_reference || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-right font-mono font-bold text-green-600">
                                                    KSh {Number(payment.amount).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="sm:hidden space-y-4">
                                {invoice.payments.map((payment) => (
                                    <div key={payment.id} className="bg-white border-2 border-gray-200 rounded-2xl p-5 shadow-md hover:shadow-lg transition-all duration-200">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wider">Payment Date</p>
                                                <p className="text-sm font-bold text-gray-900">
                                                    {new Date(payment.payment_date).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wider">Amount</p>
                                                <p className="text-xl font-bold text-green-600">
                                                    KSh {Number(payment.amount).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                                                <span className="text-gray-600 font-semibold">Method:</span>
                                                <span className="font-medium text-gray-900 capitalize">
                                                    {payment.payment_method.replace('_', ' ')}
                                                </span>
                                            </div>
                                            {payment.transaction_reference && (
                                                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                                                    <span className="text-gray-600 font-semibold">Reference:</span>
                                                    <span className="font-mono text-gray-900">
                                                        {payment.transaction_reference}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
        </AuthenticatedLayout>
    );
}