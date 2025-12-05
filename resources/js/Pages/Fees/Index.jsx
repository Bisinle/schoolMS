import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { DollarSign, Receipt, Users, FileText, TrendingUp, Calendar, Plus, AlertCircle } from 'lucide-react';
import { Badge } from '@/Components/UI';

export default function FeeManagementDashboard({ auth, currentTerm, stats, terms }) {
    const { flash } = usePage().props;

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
            </div>
        </AuthenticatedLayout>
    );
}