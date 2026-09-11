import Modal from '@/Components/Modal';
import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function RecordPaymentModal({ show, onClose, guardian }) {
    const { flash } = usePage().props;
    const [amount, setAmount] = useState(guardian?.total_due || 0);
    const [receivedAt, setReceivedAt] = useState(new Date().toISOString().slice(0, 10));
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    const fmt = (n) => 'KES ' + Number(n || 0).toLocaleString('en-KE');

    if (!guardian) {
        return null;
    }

    const submit = () => {
        setProcessing(true);
        router.post(
            `/monthly-fees/guardians/${guardian.guardian_id}/record-payment`,
            { amount, received_at: receivedAt, notes },
            {
                preserveScroll: true,
                onSuccess: () => setProcessing(false),
                onError: () => setProcessing(false),
            }
        );
    };

    const receipt = flash?.payment_receipt;

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <div className="p-6">
                <h2 className="text-lg font-bold text-gray-900">Record Payment — {guardian.guardian_name}</h2>

                <div className="mt-3 space-y-1 rounded border border-gray-200 bg-gray-50 p-3 text-sm">
                    <div className="flex justify-between text-gray-600"><span>This month</span><span className="font-mono">{fmt(guardian.expected_amount)}</span></div>
                    {guardian.outstanding_balance > 0 && (
                        <div className="flex justify-between text-red-600"><span>Owed from earlier months</span><span className="font-mono">{fmt(guardian.outstanding_balance)}</span></div>
                    )}
                    <div className="flex justify-between border-t border-gray-200 pt-1 font-bold text-gray-900"><span>Total due</span><span className="font-mono">{fmt(guardian.total_due)}</span></div>
                </div>

                <label className="mt-4 block text-sm font-semibold text-gray-700" htmlFor="record-payment-amount">Amount received</label>
                <input
                    id="record-payment-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 font-mono"
                />
                {Number(amount) > guardian.total_due && (
                    <p className="mt-1 text-xs text-indigo-600">
                        This covers everything owed, with {fmt(Number(amount) - guardian.total_due)} left over as credit for future months.
                    </p>
                )}

                <label className="mt-3 block text-sm font-semibold text-gray-700" htmlFor="record-payment-date">Date received</label>
                <input
                    id="record-payment-date"
                    type="date"
                    value={receivedAt}
                    onChange={(e) => setReceivedAt(e.target.value)}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                />

                <label className="mt-3 block text-sm font-semibold text-gray-700" htmlFor="record-payment-notes">Notes (optional)</label>
                <textarea
                    id="record-payment-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                />

                {receipt && (
                    <div className="mt-4 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                        Recorded {fmt(receipt.amount_received)}.
                        {receipt.total_arrears_cleared > 0 && ` Cleared ${fmt(receipt.total_arrears_cleared)} of arrears.`}
                        {receipt.applied_to_credit > 0 && ` ${fmt(receipt.applied_to_credit)} left over as credit.`}
                    </div>
                )}

                <div className="mt-5 flex justify-end gap-2">
                    <button onClick={onClose} className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                        Close
                    </button>
                    <button
                        onClick={submit}
                        disabled={processing || !amount || Number(amount) <= 0}
                        className="rounded bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
                    >
                        {processing ? 'Recording…' : 'Record Payment'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
