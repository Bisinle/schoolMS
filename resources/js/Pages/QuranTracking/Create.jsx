import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, BookOpen, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function QuranTrackingCreate({ students, surahs, preSelectedStudentId }) {
    const [selectedSurahFrom, setSelectedSurahFrom] = useState(null);
    const [selectedSurahTo, setSelectedSurahTo] = useState(null);
    const [verseFromOptions, setVerseFromOptions] = useState([]);
    const [verseToOptions, setVerseToOptions] = useState([]);
    const [totalVerses, setTotalVerses] = useState(0);

    const { data, setData, post, processing, errors } = useForm({
        student_id: preSelectedStudentId || '',
        date: new Date().toISOString().split('T')[0],
        reading_type: 'new_learning',
        surah_from: '',
        surah_to: '',
        verse_from: '',
        verse_to: '',
        page_from: '',
        page_to: '',
        difficulty: 'middle',
        pages_memorized: '',
        surahs_memorized: '',
        juz_memorized: '',
        subac_participation: false,
        notes: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/quran-tracking');
    };

    const handleSurahFromChange = (e) => {
        const surahNumber = e.target.value;
        setData('surah_from', surahNumber);
        setData('verse_from', '');

        // Reset surah_to if it's less than surah_from
        if (data.surah_to && parseInt(data.surah_to) < parseInt(surahNumber)) {
            setData('surah_to', surahNumber);
            setData('verse_to', '');
        } else if (!data.surah_to) {
            setData('surah_to', surahNumber);
        }

        if (!surahNumber) {
            setSelectedSurahFrom(null);
            setVerseFromOptions([]);
            return;
        }

        const surah = surahs.find(s => s.id == surahNumber);
        setSelectedSurahFrom(surah);

        if (surah) {
            const options = Array.from({ length: surah.total_verses }, (_, i) => i + 1);
            setVerseFromOptions(options);
        }
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
            const options = Array.from({ length: surah.total_verses }, (_, i) => i + 1);
            setVerseToOptions(options);
        }
    };

    // Calculate total verses when selection changes
    useEffect(() => {
        if (data.surah_from && data.surah_to && data.verse_from && data.verse_to) {
            calculateTotalVerses();
        }
    }, [data.surah_from, data.surah_to, data.verse_from, data.verse_to]);

    const calculateTotalVerses = () => {
        const surahFrom = parseInt(data.surah_from);
        const surahTo = parseInt(data.surah_to);
        const verseFrom = parseInt(data.verse_from);
        const verseTo = parseInt(data.verse_to);

        if (surahFrom === surahTo) {
            setTotalVerses((verseTo - verseFrom) + 1);
            return;
        }

        let total = 0;
        const surahsById = surahs.reduce((acc, s) => ({ ...acc, [s.id]: s }), {});

        // First surah
        const firstSurah = surahsById[surahFrom];
        if (firstSurah) {
            total += (firstSurah.total_verses - verseFrom) + 1;
        }

        // Middle surahs
        for (let i = surahFrom + 1; i < surahTo; i++) {
            const middleSurah = surahsById[i];
            if (middleSurah) {
                total += middleSurah.total_verses;
            }
        }

        // Last surah
        total += verseTo;

        setTotalVerses(total);
    };

    return (
        <AuthenticatedLayout header="Add Quran Tracking">
            <Head title="Add Quran Tracking" />

            <div className="py-6 sm:py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 sm:mb-8">
                        <Link
                            href="/quran-tracking"
                            className="inline-flex items-center text-sm text-gray-600 hover:text-orange transition-colors mb-4"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Quran Tracking
                        </Link>
                        <div className="flex items-center space-x-3">
                            <BookOpen className="w-8 h-8 text-orange" />
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Add Quran Tracking</h2>
                                <p className="text-sm text-gray-600">Record student Quran progress</p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
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
                                    onChange={(e) => setData('student_id', e.target.value)}
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all ${
                                        errors.student_id ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="">Select Student</option>
                                    {students.map((student) => (
                                        <option key={student.id} value={student.id}>
                                            {student.name} ({student.admission_number})
                                        </option>
                                    ))}
                                </select>
                                {errors.student_id && (
                                    <p className="mt-1 text-sm text-red-600">{errors.student_id}</p>
                                )}
                            </div>

                            {/* Date */}
                            <div>
                                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                                    Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    id="date"
                                    value={data.date}
                                    onChange={(e) => setData('date', e.target.value)}
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all ${
                                        errors.date ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                                {errors.date && (
                                    <p className="mt-1 text-sm text-red-600">{errors.date}</p>
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

                            {/* From Surah */}
                            <div>
                                <label htmlFor="surah_from" className="block text-sm font-medium text-gray-700 mb-2">
                                    From Surah <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="surah_from"
                                    value={data.surah_from}
                                    onChange={handleSurahFromChange}
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all ${
                                        errors.surah_from ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="">Select Surah</option>
                                    {surahs.map((surah) => (
                                        <option key={surah.id} value={surah.id}>
                                            {surah.id}. {surah.name} - {surah.total_verses} verses
                                        </option>
                                    ))}
                                </select>
                                {errors.surah_from && (
                                    <p className="mt-1 text-sm text-red-600">{errors.surah_from}</p>
                                )}
                            </div>

                            {/* From Verse */}
                            <div>
                                <label htmlFor="verse_from" className="block text-sm font-medium text-gray-700 mb-2">
                                    From Verse <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="verse_from"
                                    value={data.verse_from}
                                    onChange={(e) => setData('verse_from', e.target.value)}
                                    disabled={!selectedSurahFrom}
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all ${
                                        errors.verse_from ? 'border-red-500' : 'border-gray-300'
                                    } ${!selectedSurahFrom ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                >
                                    <option value="">Select verse</option>
                                    {verseFromOptions.map((verse) => (
                                        <option key={verse} value={verse}>
                                            Verse {verse}
                                        </option>
                                    ))}
                                </select>
                                {errors.verse_from && (
                                    <p className="mt-1 text-sm text-red-600">{errors.verse_from}</p>
                                )}
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
                                    disabled={!data.surah_from}
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all ${
                                        errors.surah_to ? 'border-red-500' : 'border-gray-300'
                                    } ${!data.surah_from ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                >
                                    <option value="">Select Surah</option>
                                    {surahs.filter(s => !data.surah_from || s.id >= parseInt(data.surah_from)).map((surah) => (
                                        <option key={surah.id} value={surah.id}>
                                            {surah.id}. {surah.name} - {surah.total_verses} verses
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

                            {/* Verse Range Error */}
                            {errors.verse_range && (
                                <div className="md:col-span-2">
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <p className="text-sm text-red-600">{errors.verse_range}</p>
                                    </div>
                                </div>
                            )}

                            {/* Page From */}
                            <div>
                                <label htmlFor="page_from" className="block text-sm font-medium text-gray-700 mb-2">
                                    Page From (Optional)
                                </label>
                                <input
                                    type="number"
                                    id="page_from"
                                    value={data.page_from}
                                    onChange={(e) => setData('page_from', e.target.value)}
                                    min="1"
                                    max="604"
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all ${
                                        errors.page_from ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                                {errors.page_from && (
                                    <p className="mt-1 text-sm text-red-600">{errors.page_from}</p>
                                )}
                            </div>

                            {/* Page To */}
                            <div>
                                <label htmlFor="page_to" className="block text-sm font-medium text-gray-700 mb-2">
                                    Page To (Optional)
                                </label>
                                <input
                                    type="number"
                                    id="page_to"
                                    value={data.page_to}
                                    onChange={(e) => setData('page_to', e.target.value)}
                                    min="1"
                                    max="604"
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all ${
                                        errors.page_to ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                                {errors.page_to && (
                                    <p className="mt-1 text-sm text-red-600">{errors.page_to}</p>
                                )}
                            </div>

                            {/* Difficulty */}
                            <div className="md:col-span-2">
                                <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-2">
                                    Difficulty <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setData('difficulty', 'very_well')}
                                        className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                                            data.difficulty === 'very_well'
                                                ? 'border-green-500 bg-green-50 text-green-700'
                                                : 'border-gray-300 bg-white text-gray-700 hover:border-green-300'
                                        }`}
                                    >
                                        😊 Very Well
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setData('difficulty', 'middle')}
                                        className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                                            data.difficulty === 'middle'
                                                ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                                                : 'border-gray-300 bg-white text-gray-700 hover:border-yellow-300'
                                        }`}
                                    >
                                        😐 Middle
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setData('difficulty', 'difficult')}
                                        className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                                            data.difficulty === 'difficult'
                                                ? 'border-red-500 bg-red-50 text-red-700'
                                                : 'border-gray-300 bg-white text-gray-700 hover:border-red-300'
                                        }`}
                                    >
                                        😓 Difficult
                                    </button>
                                </div>
                                {errors.difficulty && (
                                    <p className="mt-1 text-sm text-red-600">{errors.difficulty}</p>
                                )}
                            </div>

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
                                    placeholder="Add any additional notes..."
                                />
                                {errors.notes && (
                                    <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="mt-8 flex justify-end gap-3">
                            <Link
                                href="/quran-tracking"
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
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5 mr-2" />
                                        Save Tracking
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

