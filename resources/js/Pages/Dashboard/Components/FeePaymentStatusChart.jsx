import { DollarSign, Receipt, TrendingUp, AlertCircle } from "lucide-react";
import { Link } from "@inertiajs/react";

export default function FeePaymentStatusChart({ invoicesByStatus, feeStats }) {
    // Calculate total invoices and collection rate
    const totalInvoices = feeStats?.total_invoices || 0;
    const collectionRate = feeStats?.total_billed > 0
        ? ((feeStats.total_collected / feeStats.total_billed) * 100).toFixed(1)
        : 0;

    return (
        <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl shadow-lg border-2 border-emerald-200 overflow-hidden">
            {/* Header with Icon Badge */}
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <DollarSign className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Fee Overview</h3>
                            <p className="text-emerald-100 text-sm">Financial Summary</p>
                        </div>
                    </div>
                    <Link
                        href="/fees"
                        className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg text-sm font-semibold transition-all duration-200"
                    >
                        View Details
                    </Link>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Main Financial Stats */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Total Billed */}
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                <Receipt className="w-4 h-4 text-white" />
                            </div>
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Billed</p>
                        </div>
                        <p className="text-2xl font-bold text-navy">
                            <span className="text-sm">KSh</span> {Number(feeStats?.total_billed || 0).toLocaleString()}
                        </p>
                    </div>

                    {/* Total Collected */}
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                                <DollarSign className="w-4 h-4 text-white" />
                            </div>
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Collected</p>
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                            <span className="text-sm">KSh</span> {Number(feeStats?.total_collected || 0).toLocaleString()}
                        </p>
                    </div>

                    {/* Outstanding */}
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                                <AlertCircle className="w-4 h-4 text-white" />
                            </div>
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Outstanding</p>
                        </div>
                        <p className="text-2xl font-bold text-red-600">
                            <span className="text-sm">KSh</span> {Number(feeStats?.total_pending || 0).toLocaleString()}
                        </p>
                    </div>

                    {/* Collection Rate */}
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-white" />
                            </div>
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Collection Rate</p>
                        </div>
                        <p className="text-2xl font-bold text-purple-600">
                            {collectionRate}%
                        </p>
                    </div>
                </div>

                {/* Invoice Status Breakdown */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100">
                    <h4 className="text-sm font-bold text-gray-700 mb-3">Invoice Status Breakdown</h4>
                    <div className="grid grid-cols-4 gap-3">
                        <div className="text-center">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-1">
                                <span className="text-lg font-bold text-green-600">{invoicesByStatus?.paid || 0}</span>
                            </div>
                            <p className="text-xs text-gray-600 font-medium">Paid</p>
                        </div>
                        <div className="text-center">
                            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-1">
                                <span className="text-lg font-bold text-yellow-600">{invoicesByStatus?.partial || 0}</span>
                            </div>
                            <p className="text-xs text-gray-600 font-medium">Partial</p>
                        </div>
                        <div className="text-center">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-1">
                                <span className="text-lg font-bold text-red-600">{invoicesByStatus?.pending || 0}</span>
                            </div>
                            <p className="text-xs text-gray-600 font-medium">Pending</p>
                        </div>
                        <div className="text-center">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-1">
                                <span className="text-lg font-bold text-gray-600">{invoicesByStatus?.overdue || 0}</span>
                            </div>
                            <p className="text-xs text-gray-600 font-medium">Overdue</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

