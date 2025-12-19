import { TrendingUp, Calendar, ArrowUpRight } from "lucide-react";
import { Link } from "@inertiajs/react";

export default function MonthlyRevenueChart({ monthlyCollections }) {
    // Find max value for scaling
    const maxCollection = monthlyCollections?.length > 0
        ? Math.max(...monthlyCollections.map(m => m.total))
        : 0;

    // Calculate total for the period
    const totalPeriod = monthlyCollections?.reduce((sum, item) => sum + item.total, 0) || 0;

    // Calculate trend (comparing last month to previous)
    const trend = monthlyCollections?.length >= 2
        ? ((monthlyCollections[monthlyCollections.length - 1].total - monthlyCollections[monthlyCollections.length - 2].total) / monthlyCollections[monthlyCollections.length - 2].total * 100).toFixed(1)
        : 0;

    return (
        <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-2xl shadow-lg border-2 border-orange-200 overflow-hidden">
            {/* Header with Icon Badge */}
            <div className="px-6 py-4 bg-gradient-to-r from-orange-600 to-amber-600">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Revenue Trend</h3>
                            <p className="text-orange-100 text-sm">Last 6 Months</p>
                        </div>
                    </div>
                    {trend > 0 && (
                        <div className="flex items-center gap-1 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
                            <ArrowUpRight className="w-4 h-4 text-white" />
                            <span className="text-white font-bold text-sm">+{trend}%</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Total Period Collection */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-orange-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                                    <Calendar className="w-4 h-4 text-white" />
                                </div>
                                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">6-Month Total</p>
                            </div>
                            <p className="text-3xl font-bold text-navy">
                                <span className="text-lg">KSh</span> {Number(totalPeriod).toLocaleString()}
                            </p>
                        </div>
                        <Link
                            href="/fees"
                            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                            View Reports
                        </Link>
                    </div>
                </div>

                {/* Monthly Breakdown */}
                {monthlyCollections && monthlyCollections.length > 0 ? (
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-100">
                        <h4 className="text-sm font-bold text-gray-700 mb-4">Monthly Breakdown</h4>
                        <div className="space-y-3">
                            {monthlyCollections.map((item, index) => {
                                const barWidth = maxCollection > 0 ? (item.total / maxCollection * 100) : 0;

                                return (
                                    <div key={index}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-xs font-semibold text-gray-600 min-w-[70px]">
                                                {item.month}
                                            </span>
                                            <span className="text-xs font-bold text-navy">
                                                KSh {item.total.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="w-full h-6 bg-gray-100 rounded-full overflow-hidden relative group">
                                            <div
                                                className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500 hover:from-orange-500 hover:to-orange-600 flex items-center justify-end pr-2"
                                                style={{ width: `${barWidth}%`, minWidth: item.total > 0 ? '40px' : '0' }}
                                            >
                                                <span className="text-[10px] font-bold text-white">
                                                    {item.total > 0 ? `${(item.total / 1000).toFixed(0)}K` : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl p-8 shadow-sm border border-orange-100">
                        <p className="text-gray-500 text-center">
                            No collection data available
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

