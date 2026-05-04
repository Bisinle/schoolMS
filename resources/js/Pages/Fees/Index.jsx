import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { DollarSign, Receipt, Users, FileText, TrendingUp, Calendar, Plus, AlertCircle, CheckCircle, XCircle, Search } from 'lucide-react';
import { Badge } from '@/Components/UI';

const TERM_COLORS = {
    1: {
        header: 'bg-blue-50 text-blue-700 border-blue-200',
        bar: 'from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500',
        dot: 'bg-blue-500',
    },
    2: {
        header: 'bg-green-50 text-green-700 border-green-200',
        bar: 'from-green-500 to-green-400 hover:from-green-600 hover:to-green-500',
        dot: 'bg-green-500',
    },
    3: {
        header: 'bg-amber-50 text-amber-700 border-amber-200',
        bar: 'from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500',
        dot: 'bg-amber-500',
    },
};

export default function FeeManagementDashboard({ auth, currentTerm, selectedTerm, stats, terms, invoicesByStatus, monthlyCollections, yearTerms, billedGuardians = [], unbilledGuardians = [] }) {
    const { flash } = usePage().props;

    const displayTerm = selectedTerm || currentTerm;

    // Term selector
    const handleTermChange = (e) => {
        const value = e.target.value;
        router.get('/fees', value ? { term_id: value } : {}, { preserveScroll: true });
    };

    // Guardian billing toggle state
    const [billingTab, setBillingTab]       = useState('unbilled');
    const [guardianSearch, setGuardianSearch] = useState('');

    const activeList = billingTab === 'billed' ? billedGuardians : unbilledGuardians;

    const filteredGuardians = useMemo(() => {
        const q = guardianSearch.trim().toLowerCase();
        if (!q) return activeList;
        return activeList.filter(g =>
            g.name.toLowerCase().includes(q) ||
            (g.guardian_number ?? '').toLowerCase().includes(q)
        );
    }, [activeList, guardianSearch]);

    // Calculate collection rate percentage
    const collectionRate = stats.total_billed > 0
        ? ((stats.total_collected / stats.total_billed) * 100).toFixed(1)
        : 0;

    // Find max value for bar chart scaling
    const maxCollection = monthlyCollections?.length > 0
        ? Math.max(...monthlyCollections.map(m => m.total))
        : 0;

    // Group consecutive months by term for the chart
    const termGroups = useMemo(() => {
        if (!monthlyCollections || monthlyCollections.length === 0) return [];
        const groups = [];
        let currentGroup = null;
        monthlyCollections.forEach(item => {
            const termNum = item.term_number ?? 1;
            if (!currentGroup || currentGroup.term_number !== termNum) {
                currentGroup = { term_number: termNum, months: [] };
                groups.push(currentGroup);
            }
            currentGroup.months.push(item);
        });
        return groups;
    }, [monthlyCollections]);

    // Which term numbers actually appear in this dataset (for the legend)
    const activeTermNumbers = useMemo(
        () => [...new Set((monthlyCollections ?? []).map(m => m.term_number).filter(Boolean))].sort(),
        [monthlyCollections]
    );

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
                                {displayTerm
                                    ? `${displayTerm.academic_year?.year} - Term ${displayTerm.term_number}${displayTerm.is_active ? ' (Active)' : ''}`
                                    : 'No active term'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
                        {/* Term Selector */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                            <select
                                onChange={handleTermChange}
                                value={displayTerm?.id ?? ''}
                                className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                            >
                                {terms.map((term) => (
                                    <option key={term.id} value={term.id}>
                                        {term.academic_year?.year} – Term {term.term_number}
                                        {term.is_active ? ' (Active)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

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
<div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
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

    {/* Outstanding */}
    <div className="bg-gradient-to-br from-white to-red-50 rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 sm:mb-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-md">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-red-600 hidden sm:block" />
        </div>
        <p className="text-[10px] sm:text-xs text-gray-600 mb-1 font-semibold uppercase tracking-wide">Outstanding</p>
        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            <span className="text-xs sm:text-base lg:text-2xl">KSh</span> {Number(stats.total_pending).toLocaleString()}
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
                {displayTerm && (
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

                        {/* Annual Collections Chart — grouped by term */}
                        {termGroups.length > 0 && (
                            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm lg:col-span-2">
                                {/* Chart header + legend */}
                                <div className="flex items-center justify-between mb-5">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">Annual Collections Trend</h3>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {displayTerm?.academic_year?.year ?? ''} — all terms
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {activeTermNumbers.map(t => {
                                            const c = TERM_COLORS[t] ?? TERM_COLORS[1];
                                            return (
                                                <div key={t} className="flex items-center gap-1.5">
                                                    <div className={`w-3 h-3 rounded-sm ${c.dot}`} />
                                                    <span className="text-xs text-gray-600 font-medium">Term {t}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Term groups side by side */}
                                <div className="flex gap-3">
                                    {termGroups.map((group, gi) => {
                                        const colors = TERM_COLORS[group.term_number] ?? TERM_COLORS[1];
                                        return (
                                            <div key={gi} className={`flex-1 rounded-lg border ${colors.header.split(' ')[2]} overflow-hidden`}>
                                                {/* Term label header */}
                                                <div className={`text-xs font-bold text-center py-1.5 border-b ${colors.header}`}>
                                                    Term {group.term_number}
                                                </div>

                                                {/* Bars */}
                                                <div className="flex items-end gap-1 px-2 pt-2">
                                                    {group.months.map((item, idx) => {
                                                        const barPx = maxCollection > 0
                                                            ? Math.round((item.total / maxCollection) * 152)
                                                            : 0;
                                                        return (
                                                            <div key={idx} className="flex-1 flex flex-col items-center">
                                                                {/* Bar column — fixed 176px tall, bars bottom-aligned */}
                                                                <div className="w-full flex flex-col items-center justify-end" style={{ height: '176px' }}>
                                                                    {item.total > 0 && (
                                                                        <div className="text-[10px] font-semibold text-gray-600 mb-1 leading-none">
                                                                            {(item.total / 1000).toFixed(0)}K
                                                                        </div>
                                                                    )}
                                                                    <div
                                                                        className={`w-full bg-gradient-to-t ${colors.bar} rounded-t-md cursor-pointer relative group transition-all duration-500`}
                                                                        style={{ height: `${barPx}px` }}
                                                                    >
                                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                                                            KSh {item.total.toLocaleString()}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                {/* Month label */}
                                                                <div className="text-[10px] text-gray-500 font-medium text-center py-1.5">
                                                                    {item.month.split(' ')[0]}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Guardian Billing Status Panel */}
                {displayTerm && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        {/* Toggle tabs */}
                        <div className="flex border-b border-gray-200">
                            <button
                                onClick={() => { setBillingTab('unbilled'); setGuardianSearch(''); }}
                                className={`flex-1 py-3 px-4 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                                    billingTab === 'unbilled'
                                        ? 'border-red-500 text-red-700 bg-red-50'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <XCircle className="w-4 h-4" />
                                Not Billed
                                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${billingTab === 'unbilled' ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-600'}`}>
                                    {unbilledGuardians.length}
                                </span>
                            </button>
                            <button
                                onClick={() => { setBillingTab('billed'); setGuardianSearch(''); }}
                                className={`flex-1 py-3 px-4 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                                    billingTab === 'billed'
                                        ? 'border-green-500 text-green-700 bg-green-50'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <CheckCircle className="w-4 h-4" />
                                Billed
                                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${billingTab === 'billed' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                                    {billedGuardians.length}
                                </span>
                            </button>
                        </div>

                        {/* Search */}
                        <div className="p-3 border-b border-gray-100 bg-gray-50">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={guardianSearch}
                                    onChange={e => setGuardianSearch(e.target.value)}
                                    placeholder="Search by name or guardian number…"
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-white"
                                />
                            </div>
                        </div>

                        {/* List */}
                        <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                            {filteredGuardians.length > 0 ? (
                                filteredGuardians.map(guardian => (
                                    <div key={guardian.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{guardian.name}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {guardian.guardian_number} &middot; {guardian.students_count} student{guardian.students_count !== 1 ? 's' : ''}
                                            </p>
                                        </div>

                                        {billingTab === 'billed' ? (
                                            <Link
                                                href={`/invoices/${guardian.invoice_id}`}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
                                            >
                                                <Receipt className="w-3.5 h-3.5" />
                                                View Invoice
                                            </Link>
                                        ) : (
                                            <Link
                                                href={`/invoices/create?guardian_id=${guardian.id}`}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-100 text-orange-800 hover:bg-orange-200 transition-colors"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                Invoice Parent
                                            </Link>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="py-12 text-center">
                                    <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-400">
                                        {guardianSearch ? 'No guardians match your search' : `All guardians are ${billingTab === 'billed' ? 'unbilled' : 'already billed'}`}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer count */}
                        {filteredGuardians.length > 0 && (
                            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-500 text-right">
                                Showing {filteredGuardians.length} of {activeList.length} guardian{activeList.length !== 1 ? 's' : ''}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}