import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { DollarSign, Receipt, Users, FileText, TrendingUp, Calendar, Plus, AlertCircle } from 'lucide-react';
import { Badge } from '@/Components/UI';

export default function FeeManagementDashboard({ auth, currentTerm, stats, terms, invoicesByStatus, monthlyCollections }) {
    const { flash } = usePage().props;

    // Calculate collection rate percentage
    const collectionRate = stats.total_billed > 0
        ? ((stats.total_collected / stats.total_billed) * 100).toFixed(1)
        : 0;

    // Find max value for bar chart scaling
    const maxCollection = monthlyCollections?.length > 0
        ? Math.max(...monthlyCollections.map(m => m.total))
        : 0;

    return (
        <AuthenticatedLayout header="Fee Management">
            <Head title="Fee Management" />

            <div className="space-y-6">
                {/* Flash Messages */}
                {flash?.error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                        <div className="flex items-start">
                            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-red-800">
                                    {flash.error}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange rounded-lg flex items-center justify-center">
                            <DollarSign className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Fee Management</h2>
                            <p className="text-xs sm:text-sm text-gray-600">
                                {currentTerm ? `${currentTerm.academic_year?.year} - Term ${currentTerm.term_number}` : 'No active term'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Link
                            href="/fees/bulk-generate"
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:bg-orange-dark transition-all duration-200"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Bulk Generate</span>
                        </Link>
                    </div>
                </div>
{/* Stats Cards - Fully Mobile Responsive */}
<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
    {/* Total Guardians */}
    <div className="bg-gradient-to-br from-white to-blue-50 rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 sm:mb-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 hidden sm:block" />
        </div>
        <p className="text-[10px] sm:text-xs text-gray-600 mb-1 font-semibold uppercase tracking-wide">Guardians</p>
        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{stats.total_guardians}</p>
    </div>

    {/* Total Invoices */}
    <div className="bg-gradient-to-br from-white to-orange-50 rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 sm:mb-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
                <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600 hidden sm:block" />
        </div>
        <p className="text-[10px] sm:text-xs text-gray-600 mb-1 font-semibold uppercase tracking-wide">Invoices</p>
        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{stats.total_invoices}</p>
    </div>

    {/* Total Billed */}
    <div className="bg-gradient-to-br from-white to-green-50 rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 sm:mb-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 hidden sm:block" />
        </div>
        <p className="text-[10px] sm:text-xs text-gray-600 mb-1 font-semibold uppercase tracking-wide">Billed</p>
        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            <span className="text-xs sm:text-base lg:text-2xl">KSh</span> {Number(stats.total_billed).toLocaleString()}
        </div>
    </div>

    {/* Total Collected */}
    <div className="bg-gradient-to-br from-white to-purple-50 rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 sm:mb-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 hidden sm:block" />
        </div>
        <p className="text-[10px] sm:text-xs text-gray-600 mb-1 font-semibold uppercase tracking-wide">Collected</p>
        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            <span className="text-xs sm:text-base lg:text-2xl">KSh</span> {Number(stats.total_collected).toLocaleString()}
        </div>
    </div>
</div>

              {/* Quick Actions - Mobile Responsive */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
    <Link
        href="/invoices"
        className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200 group"
    >
        <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
                <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
                <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900">View Invoices</h3>
                <p className="text-xs sm:text-sm text-gray-600 truncate">Manage all invoices</p>
            </div>
        </div>
    </Link>

    <Link
        href="/invoices/create"
        className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200 group"
    >
        <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
                <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
                <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900">Create Invoice</h3>
                <p className="text-xs sm:text-sm text-gray-600 truncate">Generate new invoice</p>
            </div>
        </div>
    </Link>

    <Link
        href="/fees/bulk-generate"
        className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200 group"
    >
        <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
                <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900">Bulk Generate</h3>
                <p className="text-xs sm:text-sm text-gray-600 truncate">Generate multiple invoices</p>
            </div>
        </div>
    </Link>
</div>

                {/* Analytics Section */}
                {currentTerm && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        {/* Collection Rate Progress */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900">Collection Rate</h3>
                                <span className="text-2xl font-bold text-orange">{collectionRate}%</span>
                            </div>

                            {/* Progress Bar */}
                            <div className="relative w-full h-6 bg-gray-200 rounded-full overflow-hidden mb-4">
                                <div
                                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500 rounded-full"
                                    style={{ width: `${collectionRate}%` }}
                                />
                            </div>

                            {/* Breakdown */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-600 mb-1">Total Billed</p>
                                    <p className="text-lg font-bold text-gray-900">
                                        KSh {Number(stats.total_billed).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-600 mb-1">Total Collected</p>
                                    <p className="text-lg font-bold text-green-600">
                                        KSh {Number(stats.total_collected).toLocaleString()}
                                    </p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-gray-600 mb-1">Outstanding</p>
                                    <p className="text-lg font-bold text-red-600">
                                        KSh {Number(stats.total_pending).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Invoice Status Breakdown */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">Invoice Status</h3>

                            <div className="space-y-4">
                                {/* Paid */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                            <span className="text-sm font-medium text-gray-700">Paid</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900">{invoicesByStatus.paid}</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-green-500 rounded-full transition-all duration-500"
                                            style={{
                                                width: `${stats.total_invoices > 0 ? (invoicesByStatus.paid / stats.total_invoices * 100) : 0}%`
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Partial */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                            <span className="text-sm font-medium text-gray-700">Partial</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900">{invoicesByStatus.partial}</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-yellow-500 rounded-full transition-all duration-500"
                                            style={{
                                                width: `${stats.total_invoices > 0 ? (invoicesByStatus.partial / stats.total_invoices * 100) : 0}%`
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Pending */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                            <span className="text-sm font-medium text-gray-700">Pending</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900">{invoicesByStatus.pending}</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-red-500 rounded-full transition-all duration-500"
                                            style={{
                                                width: `${stats.total_invoices > 0 ? (invoicesByStatus.pending / stats.total_invoices * 100) : 0}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Monthly Collections Chart */}
                        {monthlyCollections && monthlyCollections.length > 0 && (
                            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm lg:col-span-2">
                                <h3 className="text-lg font-bold text-gray-900 mb-6">Monthly Collections Trend</h3>

                                <div className="flex items-end justify-between gap-2 h-64">
                                    {monthlyCollections.map((item, index) => {
                                        const barHeight = maxCollection > 0 ? (item.total / maxCollection * 100) : 0;
                                        return (
                                            <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                                {/* Bar */}
                                                <div className="w-full flex flex-col items-center justify-end h-48">
                                                    <div className="text-xs font-semibold text-gray-700 mb-1">
                                                        {(item.total / 1000).toFixed(0)}K
                                                    </div>
                                                    <div
                                                        className="w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-lg transition-all duration-500 hover:from-orange-600 hover:to-orange-500 cursor-pointer relative group"
                                                        style={{ height: `${barHeight}%` }}
                                                    >
                                                        {/* Tooltip */}
                                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                            KSh {item.total.toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Label */}
                                                <div className="text-xs text-gray-600 font-medium text-center">
                                                    {item.month}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}