import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Save, Loader2, AlertCircle, BookOpen } from 'lucide-react';
import axios from 'axios';
import QuranPageText from '../Shared/QuranPageText';
import QuranPageTextViewer from '../Shared/QuranPageTextViewer';

// The full Surah list (names + verse counts) isn't handed to this page as a
// prop the way it is on the Homework screens, so each end of the range is
// resolved on selection via the existing GET /api/quran/surah/{n} lookup
// instead of a pre-loaded list.
const SURAH_NUMBERS = Array.from({ length: 114 }, (_, i) => i + 1);

export default function Create({ students }) {
    const [surahFromDetail, setSurahFromDetail] = useState(null);
    const [surahToDetail, setSurahToDetail] = useState(null);
    const [loadingSurahFrom, setLoadingSurahFrom] = useState(false);
    const [loadingSurahTo, setLoadingSurahTo] = useState(false);
    const [surahFromError, setSurahFromError] = useState(false);
    const [surahToError, setSurahToError] = useState(false);
    const [verseFromOptions, setVerseFromOptions] = useState([]);
    const [verseToOptions, setVerseToOptions] = useState([]);
    const [fullscreenPage, setFullscreenPage] = useState(null);

    const [pageFrom, setPageFrom] = useState(null);
    const [pageTo, setPageTo] = useState(null);
    const [calculatingPageRange, setCalculatingPageRange] = useState(false);
    const [pageRangeError, setPageRangeError] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        student_id: '',
        surah_from: '',
        verse_from: '',
        surah_to: '',
        verse_to: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        notes: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/quran-schedule');
    };

    const handleSurahFromChange = (e) => {
        const surahNumber = e.target.value;
        setData('surah_from', surahNumber);
        setData('verse_from', '');
        setData('verse_to', '');

        if (!surahNumber) {
            setSurahFromDetail(null);
            setVerseFromOptions([]);
            return;
        }

        setLoadingSurahFrom(true);
        setSurahFromError(false);

        axios.get(`/api/quran/surah/${surahNumber}`)
            .then((response) => {
                setSurahFromDetail(response.data);
                setVerseFromOptions(Array.from({ length: response.data.verses_count }, (_, i) => i + 1));
                setLoadingSurahFrom(false);
            })
            .catch(() => {
                setSurahFromError(true);
                setLoadingSurahFrom(false);
            });
    };

    const handleSurahToChange = (e) => {
        const surahNumber = e.target.value;
        setData('surah_to', surahNumber);
        setData('verse_to', '');

        if (!surahNumber) {
            setSurahToDetail(null);
            setVerseToOptions([]);
            return;
        }

        setLoadingSurahTo(true);
        setSurahToError(false);

        axios.get(`/api/quran/surah/${surahNumber}`)
            .then((response) => {
                setSurahToDetail(response.data);

                let options = Array.from({ length: response.data.verses_count }, (_, i) => i + 1);
                if (data.surah_from == surahNumber && data.verse_from) {
                    options = options.filter(v => v > parseInt(data.verse_from));
                }
                setVerseToOptions(options);
                setLoadingSurahTo(false);
            })
            .catch(() => {
                setSurahToError(true);
                setLoadingSurahTo(false);
            });
    };

    const handleVerseFromChange = (e) => {
        const verseNumber = parseInt(e.target.value);
        setData('verse_from', verseNumber);

        // If same surah, keep verse_to options limited to verses after verse_from
        if (data.surah_from && data.surah_to && data.surah_from == data.surah_to && surahToDetail) {
            const options = Array.from({ length: surahToDetail.verses_count }, (_, i) => i + 1)
                .filter(v => v > verseNumber);
            setVerseToOptions(options);

            if (data.verse_to && data.verse_to <= verseNumber) {
                setData('verse_to', '');
            }
        }
    };

    // Auto-derive the page range purely for the preview below — Schedule
    // doesn't store page_from/page_to, it's computed from the verse range
    // (see QuranSchedule::target_total_pages).
    useEffect(() => {
        if (!(data.surah_from && data.surah_to && data.verse_from && data.verse_to)) {
            setPageFrom(null);
            setPageTo(null);
            return;
        }

        setCalculatingPageRange(true);
        setPageRangeError(false);

        const timeoutId = setTimeout(() => {
            axios
                .get('/api/quran/page-range', {
                    params: {
                        surah_from: data.surah_from,
                        surah_to: data.surah_to,
                        verse_from: data.verse_from,
                        verse_to: data.verse_to,
                    },
                })
                .then((response) => {
                    setPageFrom(response.data.page_from);
                    setPageTo(response.data.page_to);
                    setCalculatingPageRange(false);
                })
                .catch(() => {
                    setPageRangeError(true);
                    setCalculatingPageRange(false);
                });
        }, 350);

        return () => clearTimeout(timeoutId);
    }, [data.surah_from, data.surah_to, data.verse_from, data.verse_to]);

    return (
        <AuthenticatedLayout header="Create Quran Schedule">
            <Head title="Create Quran Schedule" />

            <div className="py-6 sm:py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 sm:mb-8">
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
                            Create Quran Schedule
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Set the long-term memorization range for a student
                        </p>
                    </div>

                    {/* Info Banner */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                            <p className="font-semibold mb-1">Important:</p>
                            <p>Only one active schedule is allowed per student. Creating a new active schedule will automatically deactivate any existing active schedules for the selected student.</p>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                        {/* Student Selection */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Student <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={data.student_id}
                                onChange={(e) => setData('student_id', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                            >
                                <option value="">Select a student</option>
                                {students.map((student) => (
                                    <option key={student.id} value={student.id}>
                                        {student.first_name} {student.last_name} ({student.admission_number}) - {student.grade?.name}
                                    </option>
                                ))}
                            </select>
                            {errors.student_id && <p className="mt-1 text-sm text-red-600">{errors.student_id}</p>}
                        </div>

                        {/* Verse Range */}
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-6 border border-orange-200/50">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Memorization Range</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* From Surah */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        From Surah <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={data.surah_from}
                                        onChange={handleSurahFromChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                                    >
                                        <option value="">Select Surah</option>
                                        {SURAH_NUMBERS.map((n) => (
                                            <option key={n} value={n}>Surah {n}</option>
                                        ))}
                                    </select>
                                    {loadingSurahFrom && <p className="mt-1 text-xs text-gray-500">Loading surah details…</p>}
                                    {surahFromDetail && (
                                        <p className="mt-1 text-xs text-gray-600">
                                            {surahFromDetail.name_simple} ({surahFromDetail.name_arabic}) — {surahFromDetail.verses_count} verses
                                        </p>
                                    )}
                                    {surahFromError && <p className="mt-1 text-xs text-red-600">Could not load this surah's details.</p>}
                                    {errors.surah_from && <p className="mt-1 text-sm text-red-600">{errors.surah_from}</p>}
                                </div>

                                {/* From Verse */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        From Verse <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={data.verse_from}
                                        onChange={handleVerseFromChange}
                                        disabled={!surahFromDetail}
                                        className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent ${!surahFromDetail ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    >
                                        <option value="">Select verse</option>
                                        {verseFromOptions.map((v) => (
                                            <option key={v} value={v}>Verse {v}</option>
                                        ))}
                                    </select>
                                    {errors.verse_from && <p className="mt-1 text-sm text-red-600">{errors.verse_from}</p>}
                                </div>

                                {/* To Surah */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        To Surah <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={data.surah_to}
                                        onChange={handleSurahToChange}
                                        disabled={!data.surah_from}
                                        className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent ${!data.surah_from ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    >
                                        <option value="">Select Surah</option>
                                        {SURAH_NUMBERS.map((n) => (
                                            <option key={n} value={n}>Surah {n}</option>
                                        ))}
                                    </select>
                                    {loadingSurahTo && <p className="mt-1 text-xs text-gray-500">Loading surah details…</p>}
                                    {surahToDetail && (
                                        <p className="mt-1 text-xs text-gray-600">
                                            {surahToDetail.name_simple} ({surahToDetail.name_arabic}) — {surahToDetail.verses_count} verses
                                        </p>
                                    )}
                                    {surahToError && <p className="mt-1 text-xs text-red-600">Could not load this surah's details.</p>}
                                    {errors.surah_to && <p className="mt-1 text-sm text-red-600">{errors.surah_to}</p>}
                                </div>

                                {/* To Verse */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        To Verse <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={data.verse_to}
                                        onChange={(e) => setData('verse_to', e.target.value)}
                                        disabled={!surahToDetail}
                                        className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent ${!surahToDetail ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    >
                                        <option value="">Select verse</option>
                                        {verseToOptions.map((v) => (
                                            <option key={v} value={v}>Verse {v}</option>
                                        ))}
                                    </select>
                                    {errors.verse_to && <p className="mt-1 text-sm text-red-600">{errors.verse_to}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Page Preview */}
                        {pageFrom && pageTo && (
                            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-indigo-600" />
                                    Quran Page Preview
                                </h3>

                                <div dir="rtl" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div dir="ltr">
                                        <QuranPageText
                                            pageNumber={parseInt(pageFrom)}
                                            title={`Starting Page ${pageFrom}`}
                                            onExpand={() => setFullscreenPage(parseInt(pageFrom))}
                                            className="w-full"
                                        />
                                    </div>
                                    {pageFrom !== pageTo && (
                                        <div dir="ltr">
                                            <QuranPageText
                                                pageNumber={parseInt(pageTo)}
                                                title={`Ending Page ${pageTo}`}
                                                onExpand={() => setFullscreenPage(parseInt(pageTo))}
                                                className="w-full"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 p-4 bg-white rounded-lg border border-indigo-200">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Total Pages:</span>
                                        <span className="font-bold text-indigo-600 text-lg">
                                            {Math.abs(pageTo - pageFrom) + 1} {Math.abs(pageTo - pageFrom) + 1 === 1 ? 'page' : 'pages'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                        {pageRangeError && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-sm text-red-600">
                                    Could not calculate the page range for this verse selection.
                                </p>
                            </div>
                        )}
                        {calculatingPageRange && (
                            <p className="text-xs text-gray-500">Calculating page range…</p>
                        )}

                        {/* Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Start Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={data.start_date}
                                    onChange={(e) => setData('start_date', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                                />
                                {errors.start_date && <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    End Date (Optional)
                                </label>
                                <input
                                    type="date"
                                    value={data.end_date}
                                    onChange={(e) => setData('end_date', e.target.value)}
                                    min={data.start_date}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                                />
                                {errors.end_date && <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>}
                                <p className="mt-1 text-xs text-gray-500">Leave empty for an open-ended schedule</p>
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Notes (Optional)
                            </label>
                            <textarea
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                rows={4}
                                maxLength={1000}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                                placeholder="Add any notes about this schedule..."
                            />
                            {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes}</p>}
                            <p className="mt-1 text-xs text-gray-500">{data.notes.length}/1000 characters</p>
                        </div>

                        {/* Submit Button */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                            <Link
                                href="/quran-schedule"
                                className="px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center px-6 py-2 bg-orange text-white font-bold rounded-lg hover:bg-orange-dark transition-colors shadow-sm disabled:opacity-50"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Create Schedule
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {fullscreenPage && (
                <QuranPageTextViewer pageNumber={fullscreenPage} onClose={() => setFullscreenPage(null)} />
            )}
        </AuthenticatedLayout>
    );
}
