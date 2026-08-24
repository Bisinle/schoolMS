import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import QuranPageText from '../Shared/QuranPageText';
import QuranPageTextViewer from '../Shared/QuranPageTextViewer';

export default function QuranHomeworkCreate({ students, surahs, preSelectedStudentId }) {
    const [selectedSurahTo, setSelectedSurahTo] = useState(null);
    const [verseToOptions, setVerseToOptions] = useState([]);
    const [totalVerses, setTotalVerses] = useState(0);
    const [fullscreenPage, setFullscreenPage] = useState(null);
    const [calculatingPageRange, setCalculatingPageRange] = useState(false);
    const [pageRangeError, setPageRangeError] = useState(false);

    // The Homework's starting point is never typed in — it's always derived
    // from the student's active Schedule (first entry) or their previous
    // Homework entry (every entry after that), via GET next-from/{student}.
    const [nextFrom, setNextFrom] = useState(null);
    const [loadingNextFrom, setLoadingNextFrom] = useState(false);
    const [nextFromError, setNextFromError] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        student_id: preSelectedStudentId || '',
        reading_type: 'new_learning',
        surah_to: '',
        verse_to: '',
        page_from: '',
        page_to: '',
        notes: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/quran-homework');
    };

    const surahFromName = (() => {
        if (!nextFrom) return null;
        const surah = surahs.find(s => s.id == nextFrom.surah_from);
        return surah ? `${surah.name_simple || surah.name_arabic} (${surah.name_arabic})` : null;
    })();

    const handleStudentChange = (e) => {
        const studentId = e.target.value;

        // A new student means a new (or no) starting point — clear
        // everything downstream so a stale To selection can't be submitted
        // against the wrong From point.
        setData((prevData) => ({ ...prevData, student_id: studentId, surah_to: '', verse_to: '', page_from: '', page_to: '' }));
        setSelectedSurahTo(null);
        setVerseToOptions([]);
        setNextFrom(null);
        setNextFromError(false);
    };

    // Resolve the read-only "Starting from" point whenever the student changes.
    useEffect(() => {
        if (!data.student_id) {
            setNextFrom(null);
            setNextFromError(false);
            return;
        }

        setLoadingNextFrom(true);
        setNextFromError(false);

        const timeoutId = setTimeout(() => {
            axios
                .get(`/api/quran/homework/next-from/${data.student_id}`)
                .then((response) => {
                    setNextFrom(response.data);
                    setLoadingNextFrom(false);
                })
                .catch(() => {
                    setNextFrom(null);
                    setNextFromError(true);
                    setLoadingNextFrom(false);
                });
        }, 200);

        return () => clearTimeout(timeoutId);
    }, [data.student_id]);

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
            if (nextFrom && nextFrom.surah_from == surahNumber) {
                const options = Array.from({ length: surah.verses_count }, (_, i) => i + 1)
                    .filter(v => v > nextFrom.verse_from);
                setVerseToOptions(options);
            } else {
                const options = Array.from({ length: surah.verses_count }, (_, i) => i + 1);
                setVerseToOptions(options);
            }
        }
    };

    // Calculate total verses when selection changes
    useEffect(() => {
        if (nextFrom && data.surah_to && data.verse_to) {
            calculateTotalVerses();
        } else {
            setTotalVerses(0);
        }
    }, [nextFrom, data.surah_to, data.verse_to]);

    // Derive page_from/page_to from the verse selection instead of asking
    // the teacher to look them up and type them in.
    useEffect(() => {
        if (!(nextFrom && data.surah_to && data.verse_to)) {
            return;
        }

        setCalculatingPageRange(true);
        setPageRangeError(false);

        const timeoutId = setTimeout(() => {
            axios
                .get('/api/quran/page-range', {
                    params: {
                        surah_from: nextFrom.surah_from,
                        surah_to: data.surah_to,
                        verse_from: nextFrom.verse_from,
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
    }, [nextFrom, data.surah_to, data.verse_to]);

    const calculateTotalVerses = () => {
        const surahFrom = parseInt(nextFrom.surah_from);
        const surahTo = parseInt(data.surah_to);
        const verseFrom = parseInt(nextFrom.verse_from);
        const verseTo = parseInt(data.verse_to);

        // Same surah - works for both ascending and descending
        if (surahFrom === surahTo) {
            setTotalVerses(Math.abs(verseTo - verseFrom) + 1);
            return;
        }

        let total = 0;
        const surahsById = surahs.reduce((acc, s) => ({ ...acc, [s.id]: s }), {});

        // Ascending order (e.g., Surah 2 → Surah 5)
        if (surahFrom < surahTo) {
            const firstSurah = surahsById[surahFrom];
            if (firstSurah) {
                total += (firstSurah.verses_count - verseFrom) + 1;
            }

            for (let i = surahFrom + 1; i < surahTo; i++) {
                const middleSurah = surahsById[i];
                if (middleSurah) {
                    total += middleSurah.verses_count;
                }
            }

            total += verseTo;
        }

        // Descending order (e.g., Surah 114 → Surah 90)
        if (surahFrom > surahTo) {
            total += verseFrom;

            for (let i = surahFrom - 1; i > surahTo; i--) {
                const middleSurah = surahsById[i];
                if (middleSurah) {
                    total += middleSurah.verses_count;
                }
            }

            const lastSurah = surahsById[surahTo];
            if (lastSurah) {
                total += (lastSurah.verses_count - verseTo) + 1;
            }
        }

        setTotalVerses(total);
    };

    const noEligibleStudents = students.length === 0;

    return (
        <AuthenticatedLayout header="Assign Quran Homework">
            <Head title="Assign Quran Homework" />

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
                                <h2 className="text-2xl font-bold text-gray-900">Assign Quran Homework</h2>
                                <p className="text-sm text-gray-600">Continue a student's Quran schedule with a new assignment</p>
                            </div>
                        </div>
                    </div>

                    {noEligibleStudents ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                            <AlertCircle className="w-10 h-10 text-orange mx-auto mb-3" />
                            <p className="text-gray-700 font-medium mb-1">
                                No students have an active Quran schedule yet — create one first.
                            </p>
                            <Link
                                href="/quran-schedule/create"
                                className="inline-flex items-center mt-4 px-4 py-2 bg-orange text-white text-sm font-medium rounded-lg hover:bg-orange-dark transition-colors"
                            >
                                Create a Schedule
                            </Link>
                        </div>
                    ) : (
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Student */}
                            <div className="md:col-span-2">
                                <label htmlFor="student_id" className="block text-sm font-medium text-gray-700 mb-2">
                                    Student <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="student_id"
                                    value={data.student_id}
                                    onChange={handleStudentChange}
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all ${
                                        errors.student_id ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="">Select Student</option>
                                    {students.map((student) => (
                                        <option key={student.id} value={student.id}>
                                            {student.first_name} {student.last_name} ({student.admission_number})
                                        </option>
                                    ))}
                                </select>
                                {errors.student_id && (
                                    <p className="mt-1 text-sm text-red-600">{errors.student_id}</p>
                                )}
                            </div>

                            {/* Reading Type */}
                            <div>
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

                            {/* Starting From (read-only, derived) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Starting From <span className="text-red-500">*</span>
                                </label>
                                {loadingNextFrom ? (
                                    <div className="flex items-center gap-2 text-sm text-gray-500 px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Determining starting point…
                                    </div>
                                ) : nextFromError ? (
                                    <div className="px-4 py-2.5 border border-red-200 rounded-lg bg-red-50 text-sm text-red-600">
                                        This student has no active Quran schedule. Create one before assigning homework.
                                    </div>
                                ) : nextFrom ? (
                                    <div className="px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                                        Surah {nextFrom.surah_from}{surahFromName ? ` — ${surahFromName}` : ''}, Verse {nextFrom.verse_from}
                                    </div>
                                ) : (
                                    <div className="px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-400">
                                        Select a student to determine the starting point
                                    </div>
                                )}
                                <p className="mt-1 text-xs text-gray-500">
                                    Continues automatically from the schedule's start, or the previous homework entry.
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
                                    disabled={!nextFrom}
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all ${
                                        errors.surah_to ? 'border-red-500' : 'border-gray-300'
                                    } ${!nextFrom ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
                            {/* Total Verses Display */}
                            {totalVerses > 0 && (
                                <div className="md:col-span-2">
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <p className="text-sm font-medium text-green-800">
                                            📖 Total Verses Selected: <span className="text-lg font-bold">{totalVerses}</span>
                                        </p>
                                    </div>
                                </div>
                            )}

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
                                            className={`w-full px-4 py-2.5 border rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed ${
                                                errors.page_from ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            placeholder="Select verses to calculate"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            {calculatingPageRange ? 'Calculating from verse selection…' : 'Auto-calculated from verse selection'}
                                        </p>
                                        {errors.page_from && (
                                            <p className="mt-1 text-sm text-red-600">{errors.page_from}</p>
                                        )}
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
                                            className={`w-full px-4 py-2.5 border rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed ${
                                                errors.page_to ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            placeholder="Select verses to calculate"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            {calculatingPageRange ? 'Calculating from verse selection…' : 'Auto-calculated from verse selection'}
                                        </p>
                                        {errors.page_to && (
                                            <p className="mt-1 text-sm text-red-600">{errors.page_to}</p>
                                        )}
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

                            {/* Page Preview Section */}
                            {data.page_from && data.page_to && (
                                <div className="md:col-span-2 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-indigo-600" />
                                        Quran Page Preview
                                    </h3>

                                    {/* dir="rtl" mirrors Starting/Ending to match the page inputs above. */}
                                    <div dir="rtl" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Starting Page */}
                                        <div dir="ltr">
                                            <QuranPageText
                                                pageNumber={parseInt(data.page_from)}
                                                title={`Starting Page ${data.page_from}`}
                                                onExpand={() => setFullscreenPage(parseInt(data.page_from))}
                                                className="w-full"
                                            />
                                        </div>

                                        {/* Ending Page (only if different) */}
                                        {data.page_from !== data.page_to && (
                                            <div dir="ltr">
                                                <QuranPageText
                                                    pageNumber={parseInt(data.page_to)}
                                                    title={`Ending Page ${data.page_to}`}
                                                    onExpand={() => setFullscreenPage(parseInt(data.page_to))}
                                                    className="w-full"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Page Range Summary */}
                                    <div className="mt-4 p-4 bg-white rounded-lg border border-indigo-200">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">Total Pages:</span>
                                            <span className="font-bold text-indigo-600 text-lg">
                                                {Math.abs(parseInt(data.page_to) - parseInt(data.page_from)) + 1} {Math.abs(parseInt(data.page_to) - parseInt(data.page_from)) + 1 === 1 ? 'page' : 'pages'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* General Notes */}
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
                                disabled={processing || !nextFrom}
                                className="inline-flex items-center px-6 py-2.5 bg-orange text-white rounded-lg hover:bg-orange-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5 mr-2" />
                                        Assign Homework
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                    )}
                </div>
            </div>

            {fullscreenPage && (
                <QuranPageTextViewer pageNumber={fullscreenPage} onClose={() => setFullscreenPage(null)} />
            )}
        </AuthenticatedLayout>
    );
}
