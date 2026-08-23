import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, BookOpen, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function QuranHomeworkEdit({ homework, surahs }) {
    const [selectedSurahTo, setSelectedSurahTo] = useState(null);
    const [verseToOptions, setVerseToOptions] = useState([]);
    const [calculatingPageRange, setCalculatingPageRange] = useState(false);
    const [pageRangeError, setPageRangeError] = useState(false);

    const { data, setData, put, processing, errors } = useForm({
        surah_to: homework.surah_to || '',
        verse_to: homework.verse_to || '',
        page_from: homework.page_from || '',
        page_to: homework.page_to || '',
        reading_type: homework.reading_type || 'new_learning',
        notes: homework.notes || '',
    });

    // Initialize the To surah's verse options on mount.
    useEffect(() => {
        if (data.surah_to) {
            const surahTo = surahs.find(s => s.id == data.surah_to);
            setSelectedSurahTo(surahTo);
            if (surahTo) {
                const options = Array.from({ length: surahTo.verses_count }, (_, i) => i + 1)
                    .filter(v => !(homework.surah_from == surahTo.id) || v > homework.verse_from);
                setVerseToOptions(options);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        put(`/quran-homework/${homework.id}`);
    };

    const handleSurahToChange = (e) => {
        const surahNumber = e.target.value;
        setData('surah_to', surahNumber);
        setData('verse_to', '');

        if (!surahNumber) {
            setSelectedSurahTo(null);
            setVerseToOptions([]);
            return;
        }

        const surah = surahs.find(s => s.id == surahNumber);
        setSelectedSurahTo(surah);

        if (surah) {
            // If continuing within the same surah the From point starts in,
            // only verses after the From verse are valid To choices.
            if (homework.surah_from == surahNumber) {
                const options = Array.from({ length: surah.verses_count }, (_, i) => i + 1)
                    .filter(v => v > homework.verse_from);
                setVerseToOptions(options);
            } else {
                const options = Array.from({ length: surah.verses_count }, (_, i) => i + 1);
                setVerseToOptions(options);
            }
        }
    };

    // Re-derive page_from/page_to whenever the verse selection changes, the
    // same way Create does — the observer won't recompute these on update
    // once they're already set, so the frontend must keep them accurate.
    useEffect(() => {
        if (!(data.surah_to && data.verse_to)) {
            return;
        }

        setCalculatingPageRange(true);
        setPageRangeError(false);

        const timeoutId = setTimeout(() => {
            axios
                .get('/api/quran/page-range', {
                    params: {
                        surah_from: homework.surah_from,
                        surah_to: data.surah_to,
                        verse_from: homework.verse_from,
                        verse_to: data.verse_to,
                    },
                })
                .then((response) => {
                    setData((prevData) => ({
                        ...prevData,
                        page_from: response.data.page_from,
                        page_to: response.data.page_to,
                    }));
                    setCalculatingPageRange(false);
                })
                .catch(() => {
                    setPageRangeError(true);
                    setCalculatingPageRange(false);
                });
        }, 350);

        return () => clearTimeout(timeoutId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.surah_to, data.verse_to]);

    return (
        <AuthenticatedLayout header="Edit Quran Homework">
            <Head title="Edit Quran Homework" />

            <div className="py-6 sm:py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 sm:mb-8">
                        <Link
                            href="/quran-homework"
                            className="inline-flex items-center text-sm text-gray-600 hover:text-orange transition-colors mb-4"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Quran Homework
                        </Link>
                        <div className="flex items-center space-x-3">
                            <BookOpen className="w-8 h-8 text-orange" />
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Edit Quran Homework</h2>
                                <p className="text-sm text-gray-600">
                                    {homework.student.first_name} {homework.student.last_name}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Reading Type */}
                            <div className="md:col-span-2">
                                <label htmlFor="reading_type" className="block text-sm font-medium text-gray-700 mb-2">
                                    Reading Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="reading_type"
                                    value={data.reading_type}
                                    onChange={(e) => setData('reading_type', e.target.value)}
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all ${
                                        errors.reading_type ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="new_learning">New Learning</option>
                                    <option value="revision">Revision</option>
                                    <option value="subac">Subac</option>
                                </select>
                                {errors.reading_type && (
                                    <p className="mt-1 text-sm text-red-600">{errors.reading_type}</p>
                                )}
                            </div>

                            {/* From (read-only — chained, not editable) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Starting From
                                </label>
                                <div className="px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                                    {homework.surah_name || `Surah ${homework.surah_from}`}, Verse {homework.verse_from}
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    Chained to the Schedule / previous entry — not editable here.
                                </p>
                            </div>

                            {/* To Surah */}
                            <div>
                                <label htmlFor="surah_to" className="block text-sm font-medium text-gray-700 mb-2">
                                    To Surah <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="surah_to"
                                    value={data.surah_to}
                                    onChange={handleSurahToChange}
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all ${
                                        errors.surah_to ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="">Select Surah</option>
                                    {surahs.map((surah) => (
                                        <option key={surah.id} value={surah.id}>
                                            {surah.id}. {surah.name_arabic} - {surah.verses_count} verses
                                        </option>
                                    ))}
                                </select>
                                {errors.surah_to && (
                                    <p className="mt-1 text-sm text-red-600">{errors.surah_to}</p>
                                )}
                            </div>

                            {/* To Verse */}
                            <div>
                                <label htmlFor="verse_to" className="block text-sm font-medium text-gray-700 mb-2">
                                    To Verse <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="verse_to"
                                    value={data.verse_to}
                                    onChange={(e) => setData('verse_to', e.target.value)}
                                    disabled={!selectedSurahTo}
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all ${
                                        errors.verse_to ? 'border-red-500' : 'border-gray-300'
                                    } ${!selectedSurahTo ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                >
                                    <option value="">Select verse</option>
                                    {verseToOptions.map((verse) => (
                                        <option key={verse} value={verse}>
                                            Verse {verse}
                                        </option>
                                    ))}
                                </select>
                                {errors.verse_to && (
                                    <p className="mt-1 text-sm text-red-600">{errors.verse_to}</p>
                                )}
                            </div>
                        </div>

                        {/* Verse Range Validation Error */}
                        {errors.verse_range && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
                                <p className="text-sm text-red-600">{errors.verse_range}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            {/* Page From / Page To — dir="rtl" mirrors the pair so From (earlier in
                                the Mushaf) renders on the right and To on the left, matching how a
                                physical Mushaf opens; dir="ltr" on each field keeps its own label/
                                number left-aligned. */}
                            <div className="md:col-span-2">
                                <div dir="rtl" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Page From */}
                                    <div dir="ltr">
                                        <label htmlFor="page_from" className="block text-sm font-medium text-gray-700 mb-2">
                                            Page From
                                        </label>
                                        <input
                                            type="number"
                                            id="page_from"
                                            value={data.page_from}
                                            disabled
                                            readOnly
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            {calculatingPageRange ? 'Calculating from verse selection…' : 'Auto-calculated from verse selection'}
                                        </p>
                                    </div>

                                    {/* Page To */}
                                    <div dir="ltr">
                                        <label htmlFor="page_to" className="block text-sm font-medium text-gray-700 mb-2">
                                            Page To
                                        </label>
                                        <input
                                            type="number"
                                            id="page_to"
                                            value={data.page_to}
                                            disabled
                                            readOnly
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            {calculatingPageRange ? 'Calculating from verse selection…' : 'Auto-calculated from verse selection'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {pageRangeError && (
                                <div className="md:col-span-2">
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <p className="text-sm text-red-600">
                                            Could not calculate the page range for this verse selection. Please try a different range.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            <div className="md:col-span-2">
                                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows="3"
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all ${
                                        errors.notes ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="Add any instructions or notes for this assignment..."
                                />
                                {errors.notes && (
                                    <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="mt-8 flex justify-end gap-3">
                            <Link
                                href="/quran-homework"
                                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center px-6 py-2.5 bg-orange text-white rounded-lg hover:bg-orange-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5 mr-2" />
                                        Update Homework
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
