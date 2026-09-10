import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { ChevronRight, ChevronLeft, Pencil, Check, Undo2 } from 'lucide-react';

export default function MonthlyFeesIndex({
    auth, year, month, monthLabel, isOpenMonth, canBrowseNext, prev, next, rows, totalCollected,
}) {
    const [openRows, setOpenRows] = useState({});
    const [editingExpected, setEditingExpected] = useState(null);
    const [editingAmount, setEditingAmount] = useState(null);

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

    const statusBadge = (status) => {
        const styles = {
            paid: 'bg-green-100 text-green-700',
            partial: 'bg-amber-100 text-amber-700',
            unpaid: 'bg-gray-100 text-gray-600',
            needs_fee: 'bg-red-100 text-red-700',
        };
        const labels = { paid: 'Paid', partial: 'Partial', unpaid: 'Unpaid', needs_fee: 'Needs fee' };
        return (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    return (
        <AuthenticatedLayout auth={auth} header={<h2 className="text-xl font-semibold text-gray-800">Monthly Fees</h2>}>
            <Head title="Monthly Fees" />

            <div className="py-6">
                <div className="mx-auto max-w-6xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-4">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => goToMonth(prev)}
                                    className="rounded border border-gray-300 p-1.5 text-gray-500 hover:border-indigo-400 hover:text-indigo-600"
                                    aria-label="Previous month"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <div className="min-w-[10rem] text-center text-lg font-semibold text-gray-900">{monthLabel}</div>
                                <button
                                    onClick={() => goToMonth(next)}
                                    disabled={!canBrowseNext}
                                    className="rounded border border-gray-300 p-1.5 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
                                    aria-label="Next month"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                            <p className="max-w-xs text-xs text-gray-500">
                                {isOpenMonth
                                    ? "This month is re-checked for new guardians every time it's opened."
                                    : 'Viewing a past month — new guardians are not added here.'}
                            </p>
                            <button
                                onClick={openNextMonth}
                                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                            >
                                Open next month &rarr;
                            </button>
                        </div>

                        <div className="hidden grid-cols-[20px_2fr_1fr_1.1fr_1fr] gap-3 border-b border-gray-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 sm:grid">
                            <span></span>
                            <span>Guardian</span>
                            <span>Children</span>
                            <span className="text-right">Expected</span>
                            <span className="text-right">Collected</span>
                        </div>

                        <div className="divide-y divide-gray-200">
                            {rows.map((row) => (
                                <div key={row.guardian_id}>
                                    <div
                                        className="grid cursor-pointer grid-cols-[20px_1fr] items-center gap-2 px-4 py-3 hover:bg-gray-50 sm:grid-cols-[20px_2fr_1fr_1.1fr_1fr] sm:gap-3"
                                        onClick={() => toggleRow(row.guardian_id)}
                                    >
                                        <ChevronRight
                                            className={`h-3.5 w-3.5 text-gray-400 transition-transform ${openRows[row.guardian_id] ? 'rotate-90' : ''}`}
                                        />
                                        <div>
                                            <div className="font-semibold text-gray-900">{row.guardian_name}</div>
                                            <div className="text-xs text-gray-400">{row.guardian_number}</div>
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {row.children.length} {row.children.length === 1 ? 'child' : 'children'}
                                        </div>

                                        <div className="flex items-center justify-end gap-1.5 text-sm" onClick={(e) => e.stopPropagation()}>
                                            {isOpenMonth && editingExpected === row.guardian_id ? (
                                                <InlineAmountEditor
                                                    initial={row.expected_amount}
                                                    onSave={(value) => saveExpected(row.guardian_id, value)}
                                                />
                                            ) : (
                                                <>
                                                    <span>{row.expected_amount ? fmt(row.expected_amount) : '—'}</span>
                                                    {isOpenMonth && (
                                                        <button
                                                            onClick={() => setEditingExpected(row.guardian_id)}
                                                            className="text-gray-400 hover:text-indigo-600"
                                                            title="Edit expected fee"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                            {row.status === 'needs_fee' && statusBadge('needs_fee')}

                                            {row.status !== 'needs_fee' && editingAmount === row.entry_id && (
                                                <InlineAmountEditor
                                                    initial={row.amount_collected || 0}
                                                    onSave={(value) => saveAmount(row.entry_id, value)}
                                                />
                                            )}

                                            {row.status !== 'needs_fee' && editingAmount !== row.entry_id && (
                                                <>
                                                    {row.status === 'paid' && (
                                                        <>
                                                            <span className="text-sm font-medium text-green-700">{fmt(row.amount_collected)}</span>
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
                                                            <span className="text-sm font-medium text-amber-700">{fmt(row.amount_collected)}</span>
                                                            <button onClick={() => setEditingAmount(row.entry_id)} className="text-gray-400 hover:text-indigo-600" title="Adjust amount">
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </button>
                                                        </>
                                                    )}
                                                    {row.status === 'unpaid' && (
                                                        <>
                                                            <button
                                                                onClick={() => markPaid(row.entry_id)}
                                                                className="rounded border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 hover:border-green-500 hover:text-green-700"
                                                            >
                                                                Mark paid
                                                            </button>
                                                            <button onClick={() => setEditingAmount(row.entry_id)} className="text-gray-400 hover:text-indigo-600" title="Enter a specific amount">
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </button>
                                                        </>
                                                    )}
                                                    {statusBadge(row.status)}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {openRows[row.guardian_id] && (
                                        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 pl-10 text-sm">
                                            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Children</div>
                                            {row.children.map((child) => (
                                                <div key={child.name} className="flex justify-between text-gray-600">
                                                    <span className="font-medium text-gray-800">{child.name}</span>
                                                    <span>{child.grade}</span>
                                                </div>
                                            ))}
                                            <div className="mt-2 flex justify-between text-gray-400">
                                                <span>Phone</span>
                                                <span>{row.phone}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {rows.length === 0 && (
                                <div className="px-4 py-10 text-center text-sm text-gray-400">
                                    No guardians with active students yet.
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3">
                            <span className="text-sm font-semibold text-gray-600">Collected so far — {monthLabel}</span>
                            <span className="text-lg font-bold text-gray-900">{fmt(totalCollected)}</span>
                        </div>
                    </div>
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
                className="w-24 rounded border border-indigo-400 px-1.5 py-0.5 text-right text-sm"
            />
            <button onClick={() => onSave(value)} className="text-green-600 hover:text-green-800">
                <Check className="h-4 w-4" />
            </button>
        </div>
    );
}
