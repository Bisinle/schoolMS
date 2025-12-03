import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useState, useMemo } from "react";
import {
    Plus,
    Receipt,
    Eye,
    Trash2,
    DollarSign,
    Calendar,
    User,
    FileText,
} from "lucide-react";
import { Badge, EmptyState } from "@/Components/UI";
//lets get ArrowLeft from lucide-react
import { ArrowLeft } from "lucide-react";
import { SearchInput, FilterSelect, FilterBar } from "@/Components/Filters";
import {
    SwipeableListItem,
    ExpandableCard,
    MobileListContainer,
} from "@/Components/Mobile";
import ConfirmationModal from "@/Components/ConfirmationModal";
import useFilters from "@/Hooks/useFilters";

// Mobile Invoice Item Component
function MobileInvoiceItem({ invoice, auth, onDelete }) {
    const primaryActions = [
        {
            icon: Eye,
            label: "View",
            href: `/invoices/${invoice.id}`,
            color: "indigo",
        },
    ];

    // Always show delete for admins (for development)
    if (auth.user.role === "admin") {
        primaryActions.push({
            icon: Trash2,
            label: "Delete",
            onClick: () => onDelete(invoice),
            color: "red",
        });
    }

    return (
        <SwipeableListItem primaryActions={primaryActions}>
            <ExpandableCard
                header={
                    <div className="flex-1 min-w-0">
                        {/* Top Row: Invoice Number & Status */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-sm">
                                    <Receipt className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-sm font-bold text-gray-900">
                                    {invoice.invoice_number}
                                </span>
                            </div>
                            <Badge
                                variant="invoiceStatus"
                                value={invoice.status}
                                size="sm"
                            />
                        </div>

                        {/* Guardian Name (Admin only) */}
                        {auth.user.role !== "guardian" && (
                            <h3 className="text-base font-semibold text-gray-900 truncate mb-2">
                                {invoice.guardian?.user?.name}
                            </h3>
                        )}

                        {/* Amount Summary */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-xs">
                                <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-gray-600">Total:</span>
                                <span className="font-semibold text-gray-900">
                                    KSh {invoice.total_amount.toLocaleString()}
                                </span>
                            </div>
                            <div className="text-xs">
                                <span className="text-gray-600">Balance:</span>
                                <span className="font-semibold text-red-600 ml-1">
                                    KSh {invoice.balance_due.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                }
            >
                {/* Expanded Details */}
                <div className="px-4 pb-4 pt-3 space-y-3">
                    <div className="grid grid-cols-1 gap-2">
                        {/* Term */}
                        <div className="flex items-center gap-2.5 text-sm">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                                <Calendar className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 mb-0.5">
                                    Academic Term
                                </p>
                                <p className="text-sm font-medium text-gray-900">
                                    {invoice.academic_term?.academic_year?.year}{" "}
                                    - Term {invoice.academic_term?.term_number}
                                </p>
                            </div>
                        </div>

                        {/* Amount Paid */}
                        <div className="flex items-center gap-2.5 text-sm">
                            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                                <DollarSign className="w-4 h-4 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 mb-0.5">
                                    Amount Paid
                                </p>
                                <p className="text-sm font-medium text-green-600">
                                    KSh {invoice.amount_paid.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </ExpandableCard>
        </SwipeableListItem>
    );
}

export default function InvoicesIndex({
    auth,
    invoices,
    terms,
    filters: initialFilters,
}) {
    const [deleteModal, setDeleteModal] = useState({
        show: false,
        invoice: null,
    });

    // Use the useFilters hook for consistent filter management
    const { filters, updateFilter, applyFilters, clearFilters } = useFilters({
        route: "/invoices",
        initialFilters: {
            search: initialFilters?.search || "",
            term_id: initialFilters?.term_id || "",
            status: initialFilters?.status || "",
        },
    });

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

    return (
        <AuthenticatedLayout
            header={auth.user.role === "guardian" ? "My Invoices" : "Invoices"}
        >
            <Head title="Invoices" />

            <div className="space-y-6">
                {/* Header */}
                    <Link
                        href="/fees"
                        className="inline-flex items-center px-4 py-2 bg-orange text-white font-medium rounded-lg hover:bg-orange-dark transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to Fees
                    </Link>
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  
                    <div className="flex items-center space-x-3">
                        <Receipt className="w-8 h-8 text-orange" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                {auth.user.role === "guardian"
                                    ? "My Invoices"
                                    : "Invoices"}
                            </h2>
                            <p className="text-sm text-gray-600">
                                {auth.user.role === "guardian"
                                    ? "View and manage your fee invoices"
                                    : "Manage student fee invoices and payments"}
                            </p>
                        </div>
                    </div>

                    {/* Action Button - Admin Only */}
                    {auth.user.role === "admin" && (
                        <Link
                            href="/invoices/create"
                            className="inline-flex items-center px-6 py-3 bg-orange text-white rounded-lg hover:bg-orange-dark transition-colors shadow-md hover:shadow-lg"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Create Invoice
                        </Link>
                    )}
                </div>

                {/* Filters - Admin Only */}
                {auth.user.role === "admin" && (
                    <FilterBar>
                        <SearchInput
                            value={filters.search}
                            onChange={(value) => updateFilter("search", value)}
                            onSearch={applyFilters}
                            placeholder="Search by invoice number or guardian name..."
                            className="flex-1"
                        />
                        <FilterSelect
                            value={filters.term_id}
                            onChange={(e) =>
                                updateFilter("term_id", e.target.value)
                            }
                            options={[
                                { value: "", label: "All Terms" },
                                ...terms.map((term) => ({
                                    value: term.id,
                                    label: `${term.academic_year?.year} - Term ${term.term_number}`,
                                })),
                            ]}
                            className="w-full sm:w-48"
                        />
                        <FilterSelect
                            value={filters.status}
                            onChange={(e) =>
                                updateFilter("status", e.target.value)
                            }
                            options={[
                                { value: "", label: "All Statuses" },
                                { value: "pending", label: "Pending" },
                                { value: "partial", label: "Partial" },
                                { value: "paid", label: "Paid" },
                                { value: "overdue", label: "Overdue" },
                            ]}
                            className="w-full sm:w-40"
                        />
                    </FilterBar>
                )}

                {/* Empty State */}
                {invoices.data.length === 0 && (
                    <EmptyState
                        icon={Receipt}
                        title="No invoices found"
                        message={
                            auth.user.role === "guardian"
                                ? "You don't have any invoices yet."
                                : "No invoices match your search criteria."
                        }
                        action={
                            auth.user.role === "admin"
                                ? {
                                      label: "Create Invoice",
                                      href: "/invoices/create",
                                  }
                                : null
                        }
                    />
                )}

                {/* Mobile View */}
                {invoices.data.length > 0 && (
                    <MobileListContainer className="sm:hidden">
                        {invoices.data.map((invoice) => (
                            <MobileInvoiceItem
                                key={invoice.id}
                                invoice={invoice}
                                auth={auth}
                                onDelete={handleDelete}
                            />
                        ))}
                    </MobileListContainer>
                )}

                {/* Desktop Table View */}
                {invoices.data.length > 0 && (
                    <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Invoice #
                                        </th>
                                        {auth.user.role !== "guardian" && (
                                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Guardian
                                            </th>
                                        )}
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Term
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Total Amount
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Amount Paid
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Balance
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {invoices.data.map((invoice) => (
                                        <tr
                                            key={invoice.id}
                                            className="hover:bg-gray-50 transition-colors duration-150"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-sm">
                                                        <Receipt className="w-4 h-4 text-white" />
                                                    </div>
                                                    <span className="text-sm font-semibold text-gray-900">
                                                        {invoice.invoice_number}
                                                    </span>
                                                </div>
                                            </td>
                                            {auth.user.role !== "guardian" && (
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-4 h-4 text-gray-400" />
                                                        <span className="text-sm text-gray-900">
                                                            {
                                                                invoice.guardian
                                                                    ?.user?.name
                                                            }
                                                        </span>
                                                    </div>
                                                </td>
                                            )}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-600">
                                                        {
                                                            invoice
                                                                .academic_term
                                                                ?.academic_year
                                                                ?.year
                                                        }{" "}
                                                        - T
                                                        {
                                                            invoice
                                                                .academic_term
                                                                ?.term_number
                                                        }
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-semibold text-gray-900">
                                                    KSh{" "}
                                                    {invoice.total_amount.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-semibold text-green-600">
                                                    KSh{" "}
                                                    {invoice.amount_paid.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-semibold text-red-600">
                                                    KSh{" "}
                                                    {invoice.balance_due.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge
                                                    variant="invoiceStatus"
                                                    value={invoice.status}
                                                    size="sm"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link
                                                        href={`/invoices/${invoice.id}`}
                                                        className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition-colors duration-150"
                                                        title="View Invoice"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Link>
                                                    {/* Always show delete for admins (for development) */}
                                                    {auth.user.role === "admin" && (
                                                        <button
                                                            onClick={() =>
                                                                handleDelete(
                                                                    invoice
                                                                )
                                                            }
                                                            className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors duration-150"
                                                            title="Delete Invoice"
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
                )}
                {/* Delete Confirmation Modal */}
                <ConfirmationModal
                    show={deleteModal.show}
                    onClose={() =>
                        setDeleteModal({ show: false, invoice: null })
                    }
                    onConfirm={confirmDelete}
                    title="Delete Invoice"
                    message={`Are you sure you want to delete invoice ${deleteModal.invoice?.invoice_number}? This action cannot be undone.`}
                />
            </div>
        </AuthenticatedLayout>
    );
}
