import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { DollarSign, FileText, TrendingUp, AlertCircle, Plus, Users } from 'lucide-react';

export default function FeesIndex({ auth, currentTerm, stats, terms }) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Fee Management
                    </h2>
                    <div className="flex gap-2">
                        <Link
                            href="/fees/bulk-generate"
                            className="inline-flex items-center px-4 py-2 bg-orange-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-orange-700 active:bg-orange-900 focus:outline-none focus:border-orange-900 focus:ring ring-orange-300 disabled:opacity-25 transition ease-in-out duration-150"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Bulk Generate Invoices
                        </Link>
                        <Link
                            href="/invoices/create"
                            className="inline-flex items-center px-4 py-2 bg-navy-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-navy-700 active:bg-navy-900 focus:outline-none focus:border-navy-900 focus:ring ring-navy-300 disabled:opacity-25 transition ease-in-out duration-150"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Invoice
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Fee Management" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Current Term Info */}
                    {currentTerm && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-blue-600" />
                                <div>
                                    <p className="text-sm font-medium text-blue-900">
                                        Current Term: {currentTerm.academic_year?.year} - Term {currentTerm.term_number}
                                    </p>
                                    <p className="text-xs text-blue-700">
                                        {new Date(currentTerm.start_date).toLocaleDateString()} - {new Date(currentTerm.end_date).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Total Guardians */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Guardians</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_guardians}</p>
                                </div>
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                    <Users className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                        </div>

                        {/* Invoices Generated */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Invoices Generated</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.invoices_generated}</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        {/* Total Invoiced */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Invoiced</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">
                                        KSh {stats.total_invoiced.toLocaleString()}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-orange-600" />
                                </div>
                            </div>
                        </div>

                        {/* Total Paid */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Paid</p>
                                    <p className="text-3xl font-bold text-green-600 mt-2">
                                        KSh {stats.total_paid.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Pending: KSh {stats.total_pending.toLocaleString()}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Link
                                href="/invoices"
                                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                            >
                                <FileText className="w-8 h-8 text-orange-600" />
                                <div>
                                    <p className="font-medium text-gray-900">View All Invoices</p>
                                    <p className="text-sm text-gray-500">Manage and track invoices</p>
                                </div>
                            </Link>

                            <Link
                                href="/fees/bulk-generate"
                                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                            >
                                <Plus className="w-8 h-8 text-blue-600" />
                                <div>
                                    <p className="font-medium text-gray-900">Bulk Generate</p>
                                    <p className="text-sm text-gray-500">Generate invoices for all guardians</p>
                                </div>
                            </Link>

                            <Link
                                href="/invoices/create"
                                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                            >
                                <DollarSign className="w-8 h-8 text-green-600" />
                                <div>
                                    <p className="font-medium text-gray-900">Create Invoice</p>
                                    <p className="text-sm text-gray-500">Create invoice for a guardian</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

