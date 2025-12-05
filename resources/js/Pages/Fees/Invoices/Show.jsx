import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Plus, Download, Trash2, Edit, Save, X, User, DollarSign, Receipt, AlertCircle } from 'lucide-react';
import Badge from '@/Components/UI/Badge';
import InvoiceHeader from '@/Components/Invoice/InvoiceHeader';
import ConfirmationModal from '@/Components/ConfirmationModal';
import { useState, useEffect } from 'react';

export default function InvoiceShow({ auth, invoice, school }) {
    const [isEditMode, setIsEditMode] = useState(false);
    const [editedLineItems, setEditedLineItems] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

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

    // Helper to get fee amount (supports both old and new format)
    const getFeeAmount = (feeData) => {
        if (typeof feeData === 'object' && feeData !== null && 'amount' in feeData) {
            return feeData.amount;
        }
        return feeData || 0;
    };

    // Helper to get fee type (supports both old and new format)
    const getFeeType = (feeData) => {
        if (typeof feeData === 'object' && feeData !== null && 'type' in feeData) {
            return feeData.type;
        }
        return null;
    };

    // Handle fee amount change
    const handleFeeChange = (lineItemIndex, category, value) => {
        const newLineItems = [...editedLineItems];
        const numValue = parseFloat(value) || 0;

        // Preserve type if it exists
        const currentFee = newLineItems[lineItemIndex].fee_breakdown[category];
        if (typeof currentFee === 'object' && currentFee !== null) {
            newLineItems[lineItemIndex].fee_breakdown[category] = {
                ...currentFee,
                amount: numValue,
            };
        } else {
            newLineItems[lineItemIndex].fee_breakdown[category] = numValue;
        }

        // Recalculate total for this line item
        newLineItems[lineItemIndex].total_amount = Object.values(newLineItems[lineItemIndex].fee_breakdown)
            .reduce((sum, val) => sum + getFeeAmount(val), 0);

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

        // Normalize fee_breakdown to ensure all values are numbers
        const payload = {
            line_items: editedLineItems.map(item => {
                const normalizedFeeBreakdown = {};

                // Convert fee_breakdown values to numbers
                Object.entries(item.fee_breakdown).forEach(([category, value]) => {
                    // If value is an object with amount property, extract the amount
                    if (typeof value === 'object' && value !== null && 'amount' in value) {
                        normalizedFeeBreakdown[category] = parseFloat(value.amount) || 0;
                    } else {
                        // Otherwise, ensure it's a number
                        normalizedFeeBreakdown[category] = parseFloat(value) || 0;
                    }
                });

                return {
                    id: item.id,
                    fee_breakdown: normalizedFeeBreakdown
                };
            })
        };

        router.put(`/invoices/${invoice.id}/line-items`, payload, {
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

    // Handle delete
    const handleDelete = () => {
        router.delete(`/invoices/${invoice.id}`, {
            onSuccess: () => {
                setShowDeleteModal(false);
            },
            preserveScroll: true
        });
    };

    const displayLineItems = isEditMode ? editedLineItems : invoice.line_items;

    return (
        <AuthenticatedLayout header={`Invoice ${invoice.invoice_number}`}>
            <Head title={`Invoice ${invoice.invoice_number}`} />

            <div className="py-4 sm:py-6">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
                    {/* Action Buttons Bar */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                            {/* Back Button */}
                            <Link
                                href={auth.user.role === 'guardian' ? '/guardian/invoices' : '/invoices'}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold text-sm border border-gray-300"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Back to Invoices</span>
                            </Link>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-2">
                                {isEditMode ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        {/* Save Button */}
                                        <button
                                            onClick={handleSave}
                                            disabled={processing}
                                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm border border-green-700"
                                        >
                                            <Save className="w-4 h-4" />
                                            <span>{processing ? 'Saving...' : 'Save'}</span>
                                        </button>

                                        {/* Cancel Button */}
                                        <button
                                            onClick={handleCancel}
                                            disabled={processing}
                                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm border border-gray-700"
                                        >
                                            <X className="w-4 h-4" />
                                            <span>Cancel</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-none sm:flex gap-2">
                                        {/* Edit Button - Admin only, pending invoices only */}
                                        {auth.user.role === 'admin' && invoice.status === 'pending' && (
                                            <button
                                                onClick={() => setIsEditMode(true)}
                                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-bold text-sm border border-indigo-700"
                                            >
                                                <Edit className="w-4 h-4" />
                                                <span>Edit</span>
                                            </button>
                                        )}

                                        {/* Record Payment - Admin only, if balance due */}
                                        {auth.user.role === 'admin' && invoice.balance_due > 0 && (
                                            <Link
                                                href={`/invoices/${invoice.id}/payments/create`}
                                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-bold text-sm border border-orange-700"
                                            >
                                                <Plus className="w-4 h-4" />
                                                <span>Payment</span>
                                            </Link>
                                        )}

                                        {/* Download PDF */}
                                        <Link
                                            href={`/invoices/${invoice.id}/pdf`}
                                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold text-sm border border-blue-700"
                                        >
                                            <Download className="w-4 h-4" />
                                            <span>PDF</span>
                                        </Link>

                                        {/* Delete - Admin only */}
                                        {auth.user.role === 'admin' && (
                                            <button
                                                onClick={() => setShowDeleteModal(true)}
                                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-bold text-sm border border-red-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                <span className="hidden sm:inline">Delete</span>
                                                <span className="sm:hidden">Del</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Invoice Container */}
                    <div className="bg-white shadow-lg rounded-lg border-2 border-gray-300 overflow-hidden">
                        {/* School Header */}
                        <InvoiceHeader school={school} invoice={invoice} />

                        {/* Invoice Items Table */}
                        <div className="p-4 sm:p-6 lg:p-8">
                            {/* Section Header */}
                            <div className="mb-6 pb-3 border-b-2 border-gray-200">
                                <h3 className="text-base sm:text-lg font-bold text-gray-900 uppercase tracking-wide">
                                    Fee Breakdown
                                </h3>
                            </div>

                            {/* Desktop Table */}
                            <div className="hidden lg:block overflow-hidden rounded-lg border-2 border-gray-300">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                                                Student Name
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                                                Grade
                                            </th>
                                            {feeCategories.map(category => (
                                                <th key={category} className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                                                    {category}
                                                </th>
                                            ))}
                                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-900 uppercase tracking-wider bg-gray-200">
                                                Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {displayLineItems?.map((item, index) => (
                                            <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="px-4 py-3 text-sm font-semibold text-gray-900 border-r border-gray-200">
                                                    {item.student_name}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">
                                                    {item.grade_name}
                                                </td>
                                                {feeCategories.map(category => {
                                                    const feeData = item.fee_breakdown?.[category];
                                                    const amount = getFeeAmount(feeData);
                                                    const type = getFeeType(feeData);

                                                    return (
                                                        <td key={category} className="px-4 py-3 text-sm text-right font-mono text-gray-900 border-r border-gray-200">
                                                            {isEditMode ? (
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    value={amount}
                                                                    onChange={(e) => handleFeeChange(index, category, e.target.value)}
                                                                    className="w-full px-2 py-1.5 text-right border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                                                                />
                                                            ) : (
                                                                feeData ? (
                                                                    <div className="text-right">
                                                                        <div className="font-semibold">
                                                                            {Number(amount).toLocaleString()}
                                                                        </div>
                                                                        {type && (
                                                                            <div className="text-xs text-gray-500">
                                                                                ({type})
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-gray-400">-</span>
                                                                )
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-4 py-3 text-sm text-right font-bold font-mono text-gray-900 bg-gray-50">
                                                    {Number(item.total_amount).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="lg:hidden space-y-4">
                                {displayLineItems?.map((item, index) => (
                                    <div key={item.id} className="border-2 border-gray-300 rounded-lg p-4 bg-white">
                                        <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-200">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-gray-900 text-base">{item.student_name}</p>
                                                <p className="text-sm text-gray-600 mt-0.5">{item.grade_name}</p>
                                            </div>
                                            <div className="text-right ml-3">
                                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Total</p>
                                                <p className="font-bold text-lg text-gray-900">
                                                    {Number(item.total_amount).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            {Object.entries(item.fee_breakdown || {}).map(([category, feeData]) => {
                                                const amount = getFeeAmount(feeData);
                                                const type = getFeeType(feeData);

                                                return (
                                                    <div key={category} className="flex flex-col gap-1 py-2 px-3 bg-gray-50 rounded border border-gray-200">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm font-semibold text-gray-700">{category}:</span>
                                                            {isEditMode ? (
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    value={amount}
                                                                    onChange={(e) => handleFeeChange(index, category, e.target.value)}
                                                                    className="w-32 px-2 py-1.5 text-right border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono"
                                                                />
                                                            ) : (
                                                                <span className="font-mono text-sm font-semibold text-gray-900">
                                                                    {Number(amount).toLocaleString()}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {!isEditMode && type && (
                                                            <div className="text-xs text-gray-500">
                                                                {type}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Edit Mode Alert */}
                            {isEditMode && (
                                <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-sm text-blue-900 font-bold">Editing Mode Active</p>
                                            <p className="text-sm text-blue-700 mt-1">New totals will be calculated when you save your changes</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Totals Section */}
                            <div className="mt-8 border-t-2 border-gray-300 pt-6">
                                <div className="flex justify-end">
                                    <div className="w-full sm:w-96 space-y-3 bg-gray-50 p-6 rounded-lg border-2 border-gray-300">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-700 font-semibold">Subtotal:</span>
                                            <span className="font-mono font-bold text-gray-900">
                                                KSh {Number(isEditMode ? newTotals.subtotal : invoice.subtotal_amount).toLocaleString()}
                                            </span>
                                        </div>

                                        {(invoice.discount_amount > 0 || (isEditMode && newTotals.discount > 0)) && (
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-700 font-semibold">
                                                    Discount ({invoice.discount_percentage}%):
                                                </span>
                                                <span className="font-mono font-bold text-green-600">
                                                    - KSh {Number(isEditMode ? newTotals.discount : invoice.discount_amount).toLocaleString()}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center text-base font-bold border-t-2 border-gray-300 pt-3 mt-3">
                                            <span className="text-gray-900">Total:</span>
                                            <span className="font-mono text-gray-900">
                                                KSh {Number(isEditMode ? newTotals.total : invoice.total_amount).toLocaleString()}
                                            </span>
                                        </div>

                                        {invoice.amount_paid > 0 && (
                                            <>
                                                <div className="flex justify-between items-center text-sm pt-2">
                                                    <span className="text-gray-700 font-semibold">Amount Paid:</span>
                                                    <span className="font-mono font-bold text-green-600">
                                                        KSh {Number(invoice.amount_paid).toLocaleString()}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between items-center text-base font-bold border-t-2 border-gray-300 pt-3 mt-3">
                                                    <span className="text-gray-900">Balance:</span>
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
                            <div className="border-t-2 border-gray-300 p-4 sm:p-6 lg:p-8 bg-gray-50">
                                <div className="mb-6 pb-3 border-b-2 border-gray-200">
                                    <h3 className="text-base sm:text-lg font-bold text-gray-900 uppercase tracking-wide">
                                        Payment History
                                    </h3>
                                </div>

                                {/* Desktop Table */}
                                <div className="hidden md:block overflow-hidden rounded-lg border-2 border-gray-300">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                    Date
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                    Method
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                    Reference
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                    Amount
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {invoice.payments.map((payment, index) => (
                                                <tr key={payment.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                                        {new Date(payment.payment_date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-700 capitalize">
                                                        {payment.payment_method.replace('_', ' ')}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-700 font-mono">
                                                        {payment.transaction_reference || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right font-mono font-bold text-green-600">
                                                        KSh {Number(payment.amount).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Cards */}
                                <div className="md:hidden space-y-4">
                                    {invoice.payments.map((payment) => (
                                        <div key={payment.id} className="bg-white border-2 border-gray-300 rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Payment Date</p>
                                                    <p className="text-sm font-bold text-gray-900">
                                                        {new Date(payment.payment_date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Amount</p>
                                                    <p className="text-base font-bold text-green-600">
                                                        KSh {Number(payment.amount).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded border border-gray-200">
                                                    <span className="text-gray-600 font-semibold">Method:</span>
                                                    <span className="font-semibold text-gray-900 capitalize">
                                                        {payment.payment_method.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                {payment.transaction_reference && (
                                                    <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded border border-gray-200">
                                                        <span className="text-gray-600 font-semibold">Reference:</span>
                                                        <span className="font-mono text-gray-900 font-semibold text-xs break-all">
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
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Invoice"
                message={`Are you sure you want to delete invoice ${invoice.invoice_number}? This will also delete all associated payments. This action cannot be undone.`}
                confirmText="Delete Invoice"
                type="danger"
            />

        </AuthenticatedLayout>
    );
}