import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Pencil, Check, Undo2 } from 'lucide-react';

export default function MonthlyFeesIndex({
    auth, year, month, monthLabel, isOpenMonth, canBrowseNext, prev, next, rows, totalCollected,
    collectedThisPeriod, arrearsCollectedThisPeriod, creditRecognizedThisPeriod, arrearsActivity,
}) {
    const [openRows, setOpenRows] = useState({});
    const [editingExpected, setEditingExpected] = useState(null);
    const [editingAmount, setEditingAmount] = useState(null);
    const [showArrearsDrilldown, setShowArrearsDrilldown] = useState(false);
    const [openArrearsGuardians, setOpenArrearsGuardians] = useState({});

    const fmt = (n) => 'KES ' + Number(n || 0).toLocaleString('en-KE');

    const goToMonth = (target) => {
        router.get('/monthly-fees', { year: target.year, month: target.month });
    };

    const openNextMonth = () => {
        router.post('/monthly-fees/open-next-month');
    };

    const toggleRow = (guardianId) => {
        setOpenRows((prevState) => ({ ...prevState, [guardianId]: !prevState[guardianId] }));
    };

    const toggleArrearsGuardian = (guardianId) => {
        setOpenArrearsGuardians((prevState) => ({ ...prevState, [guardianId]: !prevState[guardianId] }));
    };

    const saveExpected = (guardianId, value) => {
        router.put(
            `/monthly-fees/guardians/${guardianId}/expected-fee`,
            { expected_fee: value },
            { preserveScroll: true, onSuccess: () => setEditingExpected(null) }
        );
    };

    const markPaid = (entryId) => {
        router.post(`/monthly-fees/entries/${entryId}/mark-paid`, {}, { preserveScroll: true });
    };

    const undoPaid = (entryId) => {
        router.post(`/monthly-fees/entries/${entryId}/undo`, {}, { preserveScroll: true });
    };

    const saveAmount = (entryId, value) => {
        router.put(
            `/monthly-fees/entries/${entryId}`,
            { amount: value },
            { preserveScroll: true, onSuccess: () => setEditingAmount(null) }
        );
    };

    const statusMeta = (row) => {
        const map = {
            paid: { style: 'bg-green-100 text-green-700 border-green-200', label: row.outstanding_balance > 0 ? 'This month paid' : 'Paid' },
            partial: { style: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Partial' },
            unpaid: { style: 'bg-gray-100 text-gray-600 border-gray-200', label: 'Unpaid' },
            needs_fee: { style: 'bg-red-100 text-red-700 border-red-200', label: 'Needs fee' },
        };
        return map[row.status];
    };

    const StatusBadge = ({ row }) => {
        const meta = statusMeta(row);
        return (
            <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.style}`}>
                {meta.label}
            </span>
        );
    };

    // Shared across the desktop and mobile layouts so the two views can
    // never drift out of sync with each other.
    const ExpectedCell = ({ row, align = 'end' }) => (
        <div className={`flex flex-col gap-1 ${align === 'end' ? 'items-end' : 'items-start'}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-1.5">
                {isOpenMonth && editingExpected === row.guardian_id ? (
                    <InlineAmountEditor initial={row.expected_amount} onSave={(value) => saveExpected(row.guardian_id, value)} />
                ) : row.expected_amount ? (
                    <>
                        <span className="font-mono text-sm font-semibold text-gray-900">{fmt(row.expected_amount)}</span>
                        {isOpenMonth && (
                            <button onClick={() => setEditingExpected(row.guardian_id)} className="text-gray-400 hover:text-indigo-600" title="Edit expected fee">
                                <Pencil className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </>
                ) : isOpenMonth ? (
                    <button
                        onClick={() => setEditingExpected(row.guardian_id)}
                        className="rounded border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:border-red-400 hover:bg-red-100"
                    >
                        Set fee
                    </button>
                ) : (
                    <span className="text-gray-400">&mdash;</span>
                )}
            </div>
            {row.outstanding_balance > 0 && (
                <span className="whitespace-nowrap text-xs font-semibold text-red-600" title="Owed from earlier months">
                    +{fmt(row.outstanding_balance)} owed
                </span>
            )}
        </div>
    );

    const CollectedControls = ({ row, align = 'end' }) => (
        <div className={`flex flex-wrap items-center gap-1.5 ${align === 'end' ? 'justify-end' : 'justify-start'}`} onClick={(e) => e.stopPropagation()}>
            {row.status === 'needs_fee' && <StatusBadge row={row} />}

            {row.status !== 'needs_fee' && editingAmount === row.entry_id && (
                <InlineAmountEditor initial={row.amount_collected || 0} onSave={(value) => saveAmount(row.entry_id, value)} />
            )}

            {row.status !== 'needs_fee' && editingAmount !== row.entry_id && (
                <>
                    {row.status === 'paid' && (
                        <>
                            <StatusBadge row={row} />
                            <button onClick={() => setEditingAmount(row.entry_id)} className="text-gray-400 hover:text-indigo-600" title="Adjust amount">
                                <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => undoPaid(row.entry_id)} className="text-gray-400 hover:text-red-600" title="Undo — this was marked paid by mistake">
                                <Undo2 className="h-3.5 w-3.5" />
                            </button>
                        </>
                    )}
                    {row.status === 'partial' && (
                        <>
                            <span className="font-mono text-sm font-semibold text-amber-700">{fmt(row.amount_collected)}</span>
                            <button onClick={() => setEditingAmount(row.entry_id)} className="text-gray-400 hover:text-indigo-600" title="Adjust amount">
                                <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <StatusBadge row={row} />
                        </>
                    )}
                    {row.status === 'unpaid' && (
                        <>
                            <button
                                onClick={() => markPaid(row.entry_id)}
                                className="rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:border-green-500 hover:bg-green-50 hover:text-green-700"
                            >
                                Mark paid
                            </button>
                            <button onClick={() => setEditingAmount(row.entry_id)} className="text-gray-400 hover:text-indigo-600" title="Enter a specific amount">
                                <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <StatusBadge row={row} />
                        </>
                    )}
                </>
            )}
        </div>
    );

    const ExpandedDetail = ({ row }) => (
        <div className="space-y-3 border-t border-gray-200 bg-gray-50 p-4">
            <div>
                <div className="mb-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">Children</div>
                <div className="space-y-1.5">
                    {row.children.map((child) => (
                        <div key={child.name} className="flex items-center justify-between rounded border border-gray-200 bg-white px-3 py-1.5 text-sm">
                            <span className="font-semibold text-gray-800">{child.name}</span>
                            <span className="text-gray-500">{child.grade}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-500">Phone</span>
                <span className="font-mono text-gray-700">{row.phone}</span>
            </div>
            {row.outstanding_balance > 0 && (
                <div className="space-y-1 rounded border border-red-200 bg-red-50 p-3 text-sm">
                    <div className="flex justify-between text-gray-700">
                        <span>This month</span>
                        <span className="font-mono">{fmt(row.expected_amount)}</span>
                    </div>
                    <div className="flex justify-between text-red-700">
                        <span>Owed from earlier months</span>
                        <span className="font-mono">{fmt(row.outstanding_balance)}</span>
                    </div>
                    <div className="flex justify-between border-t border-red-200 pt-1 font-bold text-gray-900">
                        <span>Total due</span>
                        <span className="font-mono">{fmt(row.total_due)}</span>
                    </div>
                </div>
            )}
        </div>
    );

    const ExpandToggle = ({ row }) => {
        const open = !!openRows[row.guardian_id];
        return (
            <button
                onClick={() => toggleRow(row.guardian_id)}
                className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-600 hover:border-indigo-300 hover:text-indigo-600"
            >
                {open ? 'Hide details' : `${row.children.length} ${row.children.length === 1 ? 'child' : 'children'}`}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
        );
    };

    return (
        <AuthenticatedLayout auth={auth} header={<h2 className="text-xl font-semibold text-gray-800">Monthly Fees</h2>}>
            <Head title="Monthly Fees" />

            <div className="py-4 sm:py-6">
                <div className="mx-auto max-w-6xl px-3 sm:px-6 lg:px-8">
                    {/* Toolbar */}
                    <div className="mb-4 rounded-lg border-2 border-gray-300 bg-white p-3 sm:p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center justify-center gap-2">
                                <button
                                    onClick={() => goToMonth(prev)}
                                    className="rounded border border-gray-300 p-2 text-gray-500 hover:border-indigo-400 hover:text-indigo-600"
                                    aria-label="Previous month"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <div className="min-w-[9rem] text-center text-lg font-bold text-gray-900">{monthLabel}</div>
                                <button
                                    onClick={() => goToMonth(next)}
                                    disabled={!canBrowseNext}
                                    className="rounded border border-gray-300 p-2 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
                                    aria-label="Next month"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                            <button
                                onClick={openNextMonth}
                                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
                            >
                                Open next month &rarr;
                            </button>
                        </div>
                        <p className="mt-2 text-center text-xs text-gray-500 sm:text-left">
                            {isOpenMonth
                                ? "This month is re-checked for new guardians every time it's opened."
                                : 'Viewing a past month — new guardians are not added here.'}
                        </p>
                    </div>

                    {/* Desktop table */}
                    <div className="hidden overflow-hidden rounded-lg border-2 border-gray-300 bg-white lg:block">
                        <div className="grid grid-cols-[28px_2fr_0.9fr_1.1fr_1.5fr] gap-3 border-b-2 border-gray-300 bg-gray-100 px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-600">
                            <span></span>
                            <span>Guardian</span>
                            <span>Children</span>
                            <span className="text-right">Expected</span>
                            <span className="text-right">Collected</span>
                        </div>

                        <div className="divide-y divide-gray-200">
                            {rows.map((row, index) => (
                                <div key={row.guardian_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <div className="grid grid-cols-[28px_2fr_0.9fr_1.1fr_1.5fr] items-center gap-3 px-4 py-3">
                                        <span />
                                        <div>
                                            <div className="font-bold text-gray-900">{row.guardian_name}</div>
                                            <div className="text-xs text-gray-400">{row.guardian_number}</div>
                                        </div>
                                        <div>
                                            <ExpandToggle row={row} />
                                        </div>
                                        <ExpectedCell row={row} />
                                        <CollectedControls row={row} />
                                    </div>

                                    {openRows[row.guardian_id] && <ExpandedDetail row={row} />}
                                </div>
                            ))}

                            {rows.length === 0 && (
                                <div className="px-4 py-10 text-center text-sm text-gray-400">No guardians with active students yet.</div>
                            )}
                        </div>
                    </div>

                    {/* Mobile cards */}
                    <div className="space-y-3 lg:hidden">
                        {rows.map((row) => (
                            <div key={row.guardian_id} className="overflow-hidden rounded-lg border-2 border-gray-300 bg-white">
                                <div className="p-4">
                                    <div className="mb-3 flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="truncate font-bold text-gray-900">{row.guardian_name}</div>
                                            <div className="text-xs text-gray-400">{row.guardian_number}</div>
                                        </div>
                                        <StatusBadge row={row} />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between rounded border border-gray-200 bg-gray-50 px-3 py-2">
                                            <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Expected</span>
                                            <ExpectedCell row={row} />
                                        </div>
                                        <div className="flex items-center justify-between rounded border border-gray-200 bg-gray-50 px-3 py-2">
                                            <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Collected</span>
                                            <CollectedControls row={row} />
                                        </div>
                                    </div>

                                    <div className="mt-3">
                                        <ExpandToggle row={row} />
                                    </div>
                                </div>

                                {openRows[row.guardian_id] && <ExpandedDetail row={row} />}
                            </div>
                        ))}

                        {rows.length === 0 && (
                            <div className="rounded-lg border-2 border-gray-300 bg-white px-4 py-10 text-center text-sm text-gray-400">
                                No guardians with active students yet.
                            </div>
                        )}
                    </div>

                    {/* Analytics cards */}
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-lg border-2 border-gray-300 bg-white p-4">
                            <div className="text-xs font-bold uppercase tracking-wider text-gray-500">Collected this period</div>
                            <div className="mt-1 font-mono text-xl font-bold text-green-700">{fmt(collectedThisPeriod)}</div>
                        </div>

                        <button
                            onClick={() => setShowArrearsDrilldown((prevState) => !prevState)}
                            className="rounded-lg border-2 border-gray-300 bg-white p-4 text-left hover:border-indigo-300"
                        >
                            <div className="flex items-center justify-between">
                                <div className="text-xs font-bold uppercase tracking-wider text-gray-500">Arrears</div>
                                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showArrearsDrilldown ? 'rotate-180' : ''}`} />
                            </div>
                            <div className="mt-1 text-sm text-amber-700">Collected: <span className="font-mono font-bold">{fmt(arrearsCollectedThisPeriod)}</span></div>
                            <div className="text-sm text-red-600">Still owed: <span className="font-mono font-bold">{fmt(arrearsActivity.reduce((sum, g) => sum + g.still_owing, 0))}</span></div>
                            <div className="mt-1 text-xs text-gray-400">{arrearsActivity.length} {arrearsActivity.length === 1 ? 'guardian' : 'guardians'}</div>
                        </button>

                        <div className="rounded-lg border-2 border-gray-300 bg-white p-4">
                            <div className="text-xs font-bold uppercase tracking-wider text-gray-500">Credit outstanding</div>
                            <div className="mt-1 font-mono text-xl font-bold text-indigo-700">{fmt(rows.reduce((sum, row) => sum + (row.credit_balance || 0), 0))}</div>
                            {creditRecognizedThisPeriod > 0 && (
                                <div className="mt-1 text-xs text-gray-400">{fmt(creditRecognizedThisPeriod)} recognized from credit this period</div>
                            )}
                        </div>
                    </div>

                    {/* Arrears drill-down */}
                    {showArrearsDrilldown && (
                        <div className="mt-3 space-y-2">
                            {arrearsActivity.length === 0 && (
                                <div className="rounded-lg border-2 border-gray-300 bg-white px-4 py-6 text-center text-sm text-gray-400">
                                    No arrears activity for this period.
                                </div>
                            )}
                            {arrearsActivity.map((g) => (
                                <div key={g.guardian_id} className="overflow-hidden rounded-lg border-2 border-gray-300 bg-white">
                                    <button
                                        onClick={() => toggleArrearsGuardian(g.guardian_id)}
                                        className="flex w-full items-center justify-between p-3 text-left hover:bg-gray-50"
                                    >
                                        <div>
                                            <div className="font-bold text-gray-900">{g.guardian_name}</div>
                                            <div className="text-xs text-gray-400">{g.guardian_number}</div>
                                        </div>
                                        <div className="text-right text-sm">
                                            {g.still_owing > 0 && <div className="font-mono font-semibold text-red-600">{fmt(g.still_owing)} owed</div>}
                                        </div>
                                    </button>
                                    {openArrearsGuardians[g.guardian_id] && (
                                        <div className="space-y-1.5 border-t border-gray-200 bg-gray-50 p-3">
                                            {g.months.map((m) => (
                                                <div key={m.entry_id} className="flex items-center justify-between rounded border border-gray-200 bg-white px-3 py-1.5 text-sm">
                                                    <span className="font-semibold text-gray-800">{m.label}</span>
                                                    <div className="flex items-center gap-2">
                                                        {m.credit_applied > 0 && (
                                                            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">from credit</span>
                                                        )}
                                                        <span className="font-mono text-gray-600">
                                                            {m.paid_date ? `Settled ${m.paid_date}` : 'Still owed'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function InlineAmountEditor({ initial, onSave }) {
    const [value, setValue] = useState(initial);

    return (
        <div className="flex items-center gap-1">
            <input
                type="number"
                min="0"
                step="0.01"
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-24 rounded border border-indigo-400 px-1.5 py-1 text-right font-mono text-sm"
            />
            <button onClick={() => onSave(value)} className="text-green-600 hover:text-green-800">
                <Check className="h-4 w-4" />
            </button>
        </div>
    );
}
