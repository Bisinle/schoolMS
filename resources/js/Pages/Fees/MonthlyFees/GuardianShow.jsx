import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

export default function MonthlyFeeGuardianShow({
    auth, monthLabel, guardianName, guardianNumber, phone, amountDue, status,
}) {
    const [payPhone, setPayPhone] = useState(phone || '');
    const [showNote, setShowNote] = useState(false);

    const fmt = (n) => 'KES ' + Number(n || 0).toLocaleString('en-KE');

    return (
        <AuthenticatedLayout auth={auth} header={<h2 className="text-xl font-semibold text-gray-800">Monthly Fee</h2>}>
            <Head title="Monthly Fee" />

            <div className="py-6">
                <div className="mx-auto max-w-md sm:px-6 lg:px-8">
                    <div className="rounded-lg bg-white p-6 shadow">
                        <p className="text-xs uppercase tracking-wide text-gray-400">Monthly fee</p>
                        <p className="mb-4 text-lg font-semibold text-gray-900">{guardianName}</p>

                        <div className="mb-5 border-y border-dashed border-gray-200 py-4 text-center">
                            <p className="text-sm text-gray-500">Amount due for {monthLabel}</p>
                            {status === 'needs_fee' ? (
                                <p className="mt-1 text-sm text-gray-500">
                                    Your fee for this month hasn&apos;t been set yet — please check with the school office.
                                </p>
                            ) : status === 'paid' ? (
                                <p className="mt-1 text-2xl font-bold text-green-700">Fully paid</p>
                            ) : (
                                <p className="mt-1 text-3xl font-bold text-gray-900">{fmt(amountDue)}</p>
                            )}
                        </div>

                        {status !== 'needs_fee' && status !== 'paid' && (
                            <>
                                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="pay-phone">
                                    M-Pesa number to pay from
                                </label>
                                <input
                                    id="pay-phone"
                                    type="tel"
                                    value={payPhone}
                                    onChange={(e) => setPayPhone(e.target.value)}
                                    className="mb-4 w-full rounded border border-gray-300 px-3 py-2"
                                />

                                <button
                                    onClick={() => setShowNote(true)}
                                    className="w-full rounded-md bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-500"
                                >
                                    Pay here
                                </button>

                                {showNote && (
                                    <div className="mt-4 rounded border border-dashed border-gray-300 p-3 text-sm text-gray-600">
                                        <strong className="text-gray-900">Online payments are coming soon.</strong> For now,
                                        please pay at the school office and ask them to record it against your account.
                                    </div>
                                )}
                            </>
                        )}

                        <p className="mt-6 text-center text-xs text-gray-400">Guardian ID {guardianNumber}</p>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
