import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, FileText, User, Calendar, DollarSign, CreditCard, Plus } from 'lucide-react';
import { Badge } from '@/Components/UI';

export default function InvoiceShow({ auth, invoice }) {
    const getStatusBadge = (status) => {
        return <Badge variant="invoiceStatus" value={status} />;
    };

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
                </div>
            }
        >
            <Head title={`Invoice ${invoice.invoice_number}`} />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Record Payment Button (Admin only, if balance due) */}
                    {auth.user.role === 'admin' && invoice.balance_due > 0 && (
                        <div className="flex justify-end">
                            <Link
                                href={`/invoices/${invoice.id}/payments/create`}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 border border-transparent rounded-md font-semibold text-sm text-white hover:bg-orange-700"
                            >
                                <Plus className="w-4 h-4" />
                                Record Payment
                            </Link>
                        </div>
                    )}

                    {/* Invoice Header */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    {invoice.invoice_number}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Invoice Date: {new Date(invoice.invoice_date).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Due Date: {new Date(invoice.due_date).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="text-right">
                                {getStatusBadge(invoice.status)}
                                <p className="text-sm text-gray-600 mt-2">
                                    Payment Plan: <span className="font-medium capitalize">{invoice.payment_plan.replace('_', ' ')}</span>
                                </p>
                            </div>
                        </div>

                        {/* Guardian Info */}
                        <div className="border-t border-gray-200 pt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Bill To:</h4>
                            <p className="text-base font-semibold text-gray-900">{invoice.guardian?.user?.name}</p>
                            <p className="text-sm text-gray-600">Guardian #{invoice.guardian?.guardian_number}</p>
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Invoice Items</h4>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Description
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Student
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Grade
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                                Qty
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                                Unit Price
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                                Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {invoice.line_items?.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                    {item.category_name}
                                                    {item.is_waived && (
                                                        <span className="ml-2 text-xs text-green-600">(Waived)</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {item.student_name}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {item.grade_name}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                                    {item.quantity}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                                    KSh {item.unit_price.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                                                    KSh {item.total_amount.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Totals */}
                        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                            <div className="space-y-2 max-w-xs ml-auto">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Subtotal:</span>
                                    <span className="font-medium text-gray-900">
                                        KSh {invoice.subtotal_amount.toLocaleString()}
                                    </span>
                                </div>
                                {invoice.discount_amount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">
                                            Discount ({invoice.discount_percentage}%):
                                        </span>
                                        <span className="font-medium text-green-600">
                                            -KSh {invoice.discount_amount.toLocaleString()}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between text-base font-semibold border-t border-gray-300 pt-2">
                                    <span className="text-gray-900">Total:</span>
                                    <span className="text-gray-900">
                                        KSh {invoice.total_amount.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Amount Paid:</span>
                                    <span className="font-medium text-green-600">
                                        KSh {invoice.amount_paid.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between text-base font-semibold border-t border-gray-300 pt-2">
                                    <span className="text-gray-900">Balance Due:</span>
                                    <span className={invoice.balance_due > 0 ? 'text-red-600' : 'text-green-600'}>
                                        KSh {invoice.balance_due.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment History */}
                    {invoice.payments && invoice.payments.length > 0 && (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h4>
                            <div className="space-y-3">
                                {invoice.payments.map((payment) => (
                                    <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                KSh {payment.amount.toLocaleString()}
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                {new Date(payment.payment_date).toLocaleDateString()} • {payment.payment_method}
                                            </p>
                                            {payment.reference_number && (
                                                <p className="text-xs text-gray-500">Ref: {payment.reference_number}</p>
                                            )}
                                        </div>
                                        <CreditCard className="w-5 h-5 text-gray-400" />
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

