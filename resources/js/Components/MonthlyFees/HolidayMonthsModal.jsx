import Modal from '@/Components/Modal';
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const MONTHS = [
    { number: 1, label: 'January' }, { number: 2, label: 'February' }, { number: 3, label: 'March' },
    { number: 4, label: 'April' }, { number: 5, label: 'May' }, { number: 6, label: 'June' },
    { number: 7, label: 'July' }, { number: 8, label: 'August' }, { number: 9, label: 'September' },
    { number: 10, label: 'October' }, { number: 11, label: 'November' }, { number: 12, label: 'December' },
];

export default function HolidayMonthsModal({ show, onClose, holidayMonths }) {
    const [selected, setSelected] = useState(holidayMonths || []);
    const [processing, setProcessing] = useState(false);

    // Re-seed from the current prop every time the modal opens, so a
    // second open always starts from the school's real saved state rather
    // than whatever was left selected (but not saved) last time.
    useEffect(() => {
        if (show) {
            setSelected(holidayMonths || []);
        }
    }, [show]);

    const toggleMonth = (monthNumber) => {
        setSelected((prev) =>
            prev.includes(monthNumber) ? prev.filter((m) => m !== monthNumber) : [...prev, monthNumber].sort((a, b) => a - b)
        );
    };

    const submit = () => {
        setProcessing(true);
        router.put(
            '/monthly-fees/holiday-months',
            { holiday_months: selected },
            {
                preserveScroll: true,
                onSuccess: () => { setProcessing(false); onClose(); },
                onError: () => setProcessing(false),
            }
        );
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <div className="p-6">
                <h2 className="text-lg font-bold text-gray-900">Holiday Months</h2>
                <p className="mt-1 text-sm text-gray-600">
                    Months you mark here are treated as fee-free every year — no fee is expected, no "needs fee" alert, and no
                    prepaid credit is spent against them. Guardians can still record a payment during a holiday month; it's
                    simply held as credit for the next real month.
                </p>

                <div className="mt-4 grid grid-cols-3 gap-2">
                    {MONTHS.map((month) => (
                        <label
                            key={month.number}
                            className="flex items-center gap-2 rounded border border-gray-200 px-2.5 py-2 text-sm hover:bg-gray-50"
                        >
                            <input
                                type="checkbox"
                                checked={selected.includes(month.number)}
                                onChange={() => toggleMonth(month.number)}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-gray-700">{month.label}</span>
                        </label>
                    ))}
                </div>

                <div className="mt-5 flex justify-end gap-2">
                    <button onClick={onClose} className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                        Close
                    </button>
                    <button
                        onClick={submit}
                        disabled={processing}
                        className="rounded bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {processing ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
