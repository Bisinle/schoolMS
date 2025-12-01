import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Eye, Trash2, Search, Filter } from 'lucide-react';
import { Badge } from '@/Components/UI';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function InvoicesIndex({ auth, invoices, terms, filters }) {
    const [deleteModal, setDeleteModal] = useState({ show: false, invoice: null });
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedTerm, setSelectedTerm] = useState(filters.term_id || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');

    const handleSearch = () => {
        router.get('/invoices', {
            search: searchTerm,
            term_id: selectedTerm,
            status: selectedStatus,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDelete = (invoice) => {
        setDeleteModal({ show: true, invoice });
    };

    const confirmDelete = () => {
        if (deleteModal.invoice) {
            router.delete(`/invoices/${deleteModal.invoice.id}`, {
                onSuccess: () => setDeleteModal({ show: false, invoice: null }),
            });
        }
    };

    const getStatusBadge = (status) => {
        return <Badge variant="invoiceStatus" value={status} />;
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        {auth.user.role === 'guardian' ? 'My Invoices' : 'Invoices'}
                    </h2>
                    {auth.user.role === 'admin' && (
                        <Link
                            href="/invoices/create"
                            className="inline-flex items-center px-4 py-2 bg-orange-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-orange-700"
                        >
                            Create Invoice
                        </Link>
                    )}
                </div>
            }
        >
            <Head title="Invoices" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Filters - Admin Only */}
                    {auth.user.role === 'admin' && (
                        <div className="bg-white shadow-sm sm:rounded-lg p-4 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search by invoice number or guardian name..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                                    />
                                    <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                                </div>
                            </div>
                            <select
                                value={selectedTerm}
                                onChange={(e) => setSelectedTerm(e.target.value)}
                                className="border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                            >
                                <option value="">All Terms</option>
                                {terms.map((term) => (
                                    <option key={term.id} value={term.id}>
                                        {term.academic_year?.year} - Term {term.term_number}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="partial">Partial</option>
                                <option value="paid">Paid</option>
                                <option value="overdue">Overdue</option>
                            </select>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={handleSearch}
                                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                    )}

                    {/* Invoices Table */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Invoice #
                                        </th>
                                        {auth.user.role !== 'guardian' && (
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Guardian
                                            </th>
                                        )}
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Term
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total Amount
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Amount Paid
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Balance
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {invoices.data.map((invoice) => (
                                        <tr key={invoice.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {invoice.invoice_number}
                                            </td>
                                            {auth.user.role !== 'guardian' && (
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {invoice.guardian?.user?.name}
                                                </td>
                                            )}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {invoice.academic_term?.academic_year?.year} - T{invoice.academic_term?.term_number}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                KSh {invoice.total_amount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                                                KSh {invoice.amount_paid.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                                KSh {invoice.balance_due.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(invoice.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-2">
                                                    <Link
                                                        href={`/invoices/${invoice.id}`}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Link>
                                                    {auth.user.role === 'admin' && invoice.amount_paid === 0 && (
                                                        <button
                                                            onClick={() => handleDelete(invoice)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                show={deleteModal.show}
                onClose={() => setDeleteModal({ show: false, invoice: null })}
                onConfirm={confirmDelete}
                title="Delete Invoice"
                message={`Are you sure you want to delete invoice ${deleteModal.invoice?.invoice_number}?`}
            />
        </AuthenticatedLayout>
    );
}

