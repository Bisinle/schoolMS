import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { DollarSign, Receipt, Users, FileText, TrendingUp, Calendar, Plus } from 'lucide-react';
import { Badge } from '@/Components/UI';

export default function FeeManagementDashboard({ auth, currentTerm, stats, terms }) {
    return (
        <AuthenticatedLayout header="Fee Management">
            <Head title="Fee Management" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex items-center space-x-3">
                        <DollarSign className="w-8 h-8 text-orange" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Fee Management</h2>
                            <p className="text-sm text-gray-600">
                                {currentTerm ? `${currentTerm.academic_year?.year} - Term ${currentTerm.term_number}` : 'No active term'}
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/fees/bulk-generate"
                        className="inline-flex items-center px-6 py-3 bg-orange text-white rounded-lg hover:bg-orange-dark transition-colors shadow-md hover:shadow-lg"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Bulk Generate
                    </Link>
                </div>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {/* Total Guardians */}
                        <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                    <Users className="w-5 h-5 text-white" />
                                </div>
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                            </div>
                            <p className="text-sm text-gray-600 mb-1">Total Guardians</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.total_guardians}</p>
                        </div>

                        {/* Total Invoices */}
                        <div className="bg-gradient-to-br from-white to-orange-50 rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                                    <Receipt className="w-5 h-5 text-white" />
                                </div>
                                <TrendingUp className="w-5 h-5 text-orange-600" />
                            </div>
                            <p className="text-sm text-gray-600 mb-1">Total Invoices</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.total_invoices}</p>
                        </div>

                        {/* Total Billed */}
                        <div className="bg-gradient-to-br from-white to-green-50 rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                                    <DollarSign className="w-5 h-5 text-white" />
                                </div>
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                            <p className="text-sm text-gray-600 mb-1">Total Billed</p>
                            <p className="text-3xl font-bold text-gray-900">
                                KSh {Number(stats.total_billed).toLocaleString()}
                            </p>
                        </div>

                        {/* Total Collected */}
                        <div className="bg-gradient-to-br from-white to-purple-50 rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    <DollarSign className="w-5 h-5 text-white" />
                                </div>
                                <TrendingUp className="w-5 h-5 text-purple-600" />
                            </div>
                            <p className="text-sm text-gray-600 mb-1">Total Collected</p>
                            <p className="text-3xl font-bold text-gray-900">
                                KSh {Number(stats.total_collected).toLocaleString()}
                            </p>
                        </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        <Link
                            href="/invoices"
                            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200 group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200">
                                    <Receipt className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">View Invoices</h3>
                                    <p className="text-sm text-gray-600">Manage all invoices</p>
                                </div>
                            </div>
                        </Link>

                        <Link
                            href="/invoices/create"
                            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200 group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200">
                                    <Plus className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Create Invoice</h3>
                                    <p className="text-sm text-gray-600">Generate new invoice</p>
                                </div>
                            </div>
                        </Link>

                        <Link
                            href="/fees/bulk-generate"
                            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200 group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200">
                                    <FileText className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Bulk Generate</h3>
                                    <p className="text-sm text-gray-600">Generate multiple invoices</p>
                                </div>
                            </div>
                        </Link>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

