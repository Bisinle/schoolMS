import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Plus, Download, Trash2, Edit, Save, X } from 'lucide-react';
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

        console.log('Saving invoice changes:', payload);
        console.log('Route:', route('invoices.updateLineItems', invoice.id));

        router.put(route('invoices.updateLineItems', invoice.id), payload, {
            onSuccess: (page) => {
                console.log('Save successful!', page);
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
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center gap-4">
                    <Link
                        href={auth.user.role === 'guardian' ? '/guardian/invoices' : '/invoices'}
                        className="text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Invoice {invoice.invoice_number}
                    </h2>
                    {getStatusBadge(invoice.status)}
                </div>
            }
        >
            <Head title={`Invoice ${invoice.invoice_number}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 no-print">
                        {isEditMode ? (
                            <>
                                {/* Save Button */}
                                <button
                                    onClick={handleSave}
                                    disabled={processing}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-sm text-white hover:bg-green-700 disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </button>

                                {/* Cancel Button */}
                                <button
                                    onClick={handleCancel}
                                    disabled={processing}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 border border-transparent rounded-md font-semibold text-sm text-white hover:bg-gray-700 disabled:opacity-50"
                                >
                                    <X className="w-4 h-4" />
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <>
                                {/* Edit Button - Admin only, pending invoices only */}
                                {auth.user.role === 'admin' && invoice.status === 'pending' && (
                                    <button
                                        onClick={() => setIsEditMode(true)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-sm text-white hover:bg-indigo-700"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit Invoice
                                    </button>
                                )}

                                {/* Record Payment - Admin only, if balance due */}
                                {auth.user.role === 'admin' && invoice.balance_due > 0 && (
                                    <Link
                                        href={`/invoices/${invoice.id}/payments/create`}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 border border-transparent rounded-md font-semibold text-sm text-white hover:bg-orange-700"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Record Payment
                                    </Link>
                                )}

                                {/* Download PDF */}
                                <Link
                                    href={`/invoices/${invoice.id}/pdf`}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-sm text-white hover:bg-blue-700"
                                >
                                    <Download className="w-4 h-4" />
                                    Download PDF
                                </Link>

                                {/* Delete - Admin only */}
                                {auth.user.role === 'admin' && (
                                    <Link
                                        href={`/invoices/${invoice.id}`}
                                        method="delete"
                                        as="button"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 border border-transparent rounded-md font-semibold text-sm text-white hover:bg-red-700"
                                        onBefore={() => confirm('Are you sure you want to delete this invoice? This action cannot be undone.')}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </Link>
                                )}
                            </>
                        )}
                    </div>

                    {/* Invoice Container */}
                    <div className="bg-white shadow-lg sm:rounded-lg overflow-hidden">
                        {/* School Header */}
                        <InvoiceHeader school={school} invoice={invoice} />

                        {/* Invoice Items Table - Horizontal Layout */}
                        <div className="p-6">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4 uppercase tracking-wide">
                                Fee Breakdown
                            </h4>
                            
                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-300 border border-gray-300">
                                    <thead className="bg-gray-800">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                                Student Name
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                                Grade
                                            </th>
                                            {feeCategories.map(category => (
                                                <th key={category} className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
                                                    {category}
                                                </th>
                                            ))}
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider bg-gray-900">
                                                Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {displayLineItems?.map((item, index) => (
                                            <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                    {item.student_name}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    {item.grade_name}
                                                </td>
                                                {feeCategories.map(category => (
                                                    <td key={category} className="px-4 py-3 text-sm text-right font-mono text-gray-900">
                                                        {isEditMode ? (
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={item.fee_breakdown?.[category] || 0}
                                                                onChange={(e) => handleFeeChange(index, category, e.target.value)}
                                                                className="w-full px-2 py-1 text-right border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                            />
                                                        ) : (
                                                            item.fee_breakdown?.[category]
                                                                ? `KSh ${Number(item.fee_breakdown[category]).toLocaleString()}`
                                                                : '-'
                                                        )}
                                                    </td>
                                                ))}
                                                <td className={`px-4 py-3 text-sm text-right font-bold font-mono ${isEditMode ? 'text-indigo-600' : 'text-gray-900'} bg-gray-100`}>
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
                                    <div key={item.id} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="font-bold text-gray-900">{item.student_name}</p>
                                                <p className="text-sm text-gray-600">{item.grade_name}</p>
                                            </div>
                                            <p className={`font-bold text-lg ${isEditMode ? 'text-indigo-600' : 'text-orange-600'}`}>
                                                KSh {Number(item.total_amount).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="space-y-1 text-sm">
                                            {Object.entries(item.fee_breakdown || {}).map(([category, amount]) => (
                                                <div key={category} className="flex justify-between items-center gap-2">
                                                    <span className="text-gray-600">{category}:</span>
                                                    {isEditMode ? (
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={amount || 0}
                                                            onChange={(e) => handleFeeChange(index, category, e.target.value)}
                                                            className="w-32 px-2 py-1 text-right border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                                                        />
                                                    ) : (
                                                        <span className="font-mono text-gray-900">
                                                            KSh {Number(amount).toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Totals Section */}
                            <div className="mt-8 border-t-2 border-gray-300 pt-6">
                                {isEditMode && (
                                    <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                                        <p className="text-sm text-indigo-800 font-semibold">
                                            ✏️ Editing Mode - New totals will be calculated when you save
                                        </p>
                                    </div>
                                )}
                                <div className="flex justify-end">
                                    <div className="w-full md:w-1/2 lg:w-1/3 space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Subtotal:</span>
                                            <span className={`font-mono font-semibold ${isEditMode ? 'text-indigo-600' : 'text-gray-900'}`}>
                                                KSh {Number(isEditMode ? newTotals.subtotal : invoice.subtotal_amount).toLocaleString()}
                                            </span>
                                        </div>

                                        {(invoice.discount_amount > 0 || (isEditMode && newTotals.discount > 0)) && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">
                                                    Discount ({invoice.discount_percentage}%):
                                                </span>
                                                <span className={`font-mono font-semibold ${isEditMode ? 'text-indigo-600' : 'text-green-600'}`}>
                                                    - KSh {Number(isEditMode ? newTotals.discount : invoice.discount_amount).toLocaleString()}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex justify-between text-lg font-bold border-t-2 border-gray-300 pt-3">
                                            <span className="text-gray-900">Total Amount:</span>
                                            <span className={`font-mono ${isEditMode ? 'text-indigo-600' : 'text-orange-600'}`}>
                                                KSh {Number(isEditMode ? newTotals.total : invoice.total_amount).toLocaleString()}
                                            </span>
                                        </div>

                                        {invoice.amount_paid > 0 && (
                                            <>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Amount Paid:</span>
                                                    <span className="font-mono font-semibold text-green-600">
                                                        KSh {Number(invoice.amount_paid).toLocaleString()}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-3">
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
                            <div className="border-t border-gray-200 p-6 bg-gray-50">
                                <h4 className="text-lg font-semibold text-gray-900 mb-4 uppercase tracking-wide">
                                    Payment History
                                </h4>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                                                    Date
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                                                    Method
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                                                    Reference
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                                                    Amount
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {invoice.payments.map((payment) => (
                                                <tr key={payment.id}>
                                                    <td className="px-4 py-3 text-sm text-gray-900">
                                                        {new Date(payment.payment_date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-700 capitalize">
                                                        {payment.payment_method.replace('_', ' ')}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-700 font-mono">
                                                        {payment.transaction_reference || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right font-mono font-semibold text-green-600">
                                                        KSh {Number(payment.amount).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

