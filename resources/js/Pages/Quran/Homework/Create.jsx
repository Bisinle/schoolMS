import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, BookOpen, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function Create({ students, surahs }) {
    const [selectedSurahFrom, setSelectedSurahFrom] = useState(null);
    const [selectedSurahTo, setSelectedSurahTo] = useState(null);
    const [verseFromOptions, setVerseFromOptions] = useState([]);
    const [verseToOptions, setVerseToOptions] = useState([]);

    const { data, setData, post, processing, errors } = useForm({
        student_id: '',
        assigned_date: new Date().toISOString().split('T')[0],
        due_date: '',
        homework_type: 'memorize',
        surah_from: '',
        surah_to: '',
        verse_from: '',
        verse_to: '',
        page_from: '',
        page_to: '',
        teacher_instructions: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/quran-homework');
    };

    const handleSurahFromChange = (e) => {
        const surahNumber = e.target.value;
        setData('surah_from', surahNumber);
        setData('verse_from', '');
        setData('verse_to', '');

        if (!surahNumber) {
            setSelectedSurahFrom(null);
            setVerseFromOptions([]);
            return;
        }

        const surah = surahs.find(s => s.id == surahNumber);
        setSelectedSurahFrom(surah);

        if (surah) {
            const options = Array.from({ length: surah.verses_count }, (_, i) => i + 1);
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
            // If same surah and verse_from is selected, filter options
            if (data.surah_from == surahNumber && data.verse_from) {
                const options = Array.from({ length: surah.verses_count }, (_, i) => i + 1)
                    .filter(v => v > parseInt(data.verse_from));
                setVerseToOptions(options);
            } else {
                const options = Array.from({ length: surah.verses_count }, (_, i) => i + 1);
                setVerseToOptions(options);
            }
        }
    };

    const handleVerseFromChange = (e) => {
        const verseNumber = parseInt(e.target.value);
        setData('verse_from', verseNumber);

        // If same surah, update verse_to options to only show verses after verse_from
        if (data.surah_from && data.surah_to && data.surah_from == data.surah_to && selectedSurahTo) {
            const options = Array.from({ length: selectedSurahTo.verses_count }, (_, i) => i + 1)
                .filter(v => v > verseNumber);
            setVerseToOptions(options);

            // Reset verse_to if it's now invalid
            if (data.verse_to && data.verse_to <= verseNumber) {
                setData('verse_to', '');
            }
        }
    };

    return (
        <AuthenticatedLayout header="Assign Quran Homework">
            <Head title="Assign Quran Homework" />

            <div className="py-6 sm:py-8">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <BookOpen className="w-8 h-8 text-orange" />
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Assign Homework</h2>
                                <p className="text-sm text-gray-600">Create a new Quran homework assignment</p>
                            </div>
                        </div>
                        <Link
                            href="/quran-homework"
                            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Link>
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

                        {/* Homework Type */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Homework Type <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { value: 'memorize', label: 'Memorization', color: 'purple' },
                                    { value: 'revise', label: 'Revision', color: 'blue' },
                                    { value: 'read', label: 'Reading', color: 'green' },
                                ].map((type) => (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => setData('homework_type', type.value)}
                                        className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                                            data.homework_type === type.value
                                                ? `bg-${type.color}-500 text-white shadow-md`
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                            {errors.homework_type && <p className="mt-1 text-sm text-red-600">{errors.homework_type}</p>}
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Assigned Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={data.assigned_date}
                                    onChange={(e) => setData('assigned_date', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                                />
                                {errors.assigned_date && <p className="mt-1 text-sm text-red-600">{errors.assigned_date}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Due Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={data.due_date}
                                    onChange={(e) => setData('due_date', e.target.value)}
                                    min={data.assigned_date}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                                />
                                {errors.due_date && <p className="mt-1 text-sm text-red-600">{errors.due_date}</p>}
                            </div>
                        </div>

                        {/* Surah Range */}
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-6 border border-orange-200/50">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Surah & Verse Range</h3>

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
                                        {surahs.map((surah) => (
                                            <option key={surah.id} value={surah.id}>
                                                {surah.id}. {surah.name_arabic} ({surah.name_simple})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.surah_from && <p className="mt-1 text-sm text-red-600">{errors.surah_from}</p>}
                                </div>

                                {/* To Surah */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        To Surah <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={data.surah_to}
                                        onChange={handleSurahToChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                                    >
                                        <option value="">Select Surah</option>
                                        {surahs.map((surah) => (
                                            <option key={surah.id} value={surah.id}>
                                                {surah.id}. {surah.name_arabic} ({surah.name_simple})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.surah_to && <p className="mt-1 text-sm text-red-600">{errors.surah_to}</p>}
                                </div>

                                {/* From Verse */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        From Verse <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={data.verse_from}
                                        onChange={handleVerseFromChange}
                                        disabled={!selectedSurahFrom}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent disabled:bg-gray-100"
                                    >
                                        <option value="">Select Verse</option>
                                        {verseFromOptions.map((verse) => (
                                            <option key={verse} value={verse}>
                                                Verse {verse}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.verse_from && <p className="mt-1 text-sm text-red-600">{errors.verse_from}</p>}
                                </div>

                                {/* To Verse */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        To Verse <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={data.verse_to}
                                        onChange={(e) => setData('verse_to', e.target.value)}
                                        disabled={!selectedSurahTo}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent disabled:bg-gray-100"
                                    >
                                        <option value="">Select Verse</option>
                                        {verseToOptions.map((verse) => (
                                            <option key={verse} value={verse}>
                                                Verse {verse}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.verse_to && <p className="mt-1 text-sm text-red-600">{errors.verse_to}</p>}
                                </div>
                            </div>

                            {/* Verse Range Validation Error */}
                            {errors.verse_range && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <p className="text-sm text-red-600">{errors.verse_range}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            </div>
                        </div>

                        {/* Optional Page Range */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    From Page (Optional)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="604"
                                    value={data.page_from}
                                    onChange={(e) => setData('page_from', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                                    placeholder="1-604"
                                />
                                {errors.page_from && <p className="mt-1 text-sm text-red-600">{errors.page_from}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    To Page (Optional)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="604"
                                    value={data.page_to}
                                    onChange={(e) => setData('page_to', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                                    placeholder="1-604"
                                />
                                {errors.page_to && <p className="mt-1 text-sm text-red-600">{errors.page_to}</p>}
                            </div>
                        </div>

                        {/* Teacher Instructions */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Instructions (Optional)
                            </label>
                            <textarea
                                value={data.teacher_instructions}
                                onChange={(e) => setData('teacher_instructions', e.target.value)}
                                rows="4"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                                placeholder="Add any special instructions for the student..."
                            />
                            {errors.teacher_instructions && <p className="mt-1 text-sm text-red-600">{errors.teacher_instructions}</p>}
                        </div>

                        {/* Submit Button */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                            <Link
                                href="/quran-homework"
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
                                        Assigning...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Assign Homework
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

