import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Save, Loader2 } from 'lucide-react';

export default function Edit({ practice, students, surahs }) {
    const [selectedSurahFrom, setSelectedSurahFrom] = useState(null);
    const [selectedSurahTo, setSelectedSurahTo] = useState(null);
    const [verseFromOptions, setVerseFromOptions] = useState([]);
    const [verseToOptions, setVerseToOptions] = useState([]);

    const { data, setData, put, processing, errors } = useForm({
        student_id: practice.student_id || '',
        practice_date: practice.practice_date || '',
        duration_minutes: practice.duration_minutes || '',
        practice_type: practice.practice_type || 'memorize',
        surah_from: practice.surah_from || '',
        surah_to: practice.surah_to || '',
        verse_from: practice.verse_from || '',
        verse_to: practice.verse_to || '',
        page_from: practice.page_from || '',
        page_to: practice.page_to || '',
        notes: practice.notes || '',
    });

    // Initialize surah selections on mount
    useEffect(() => {
        if (data.surah_from) {
            const surah = surahs.find(s => s.id == data.surah_from);
            setSelectedSurahFrom(surah);
            if (surah) {
                const options = Array.from({ length: surah.total_verses }, (_, i) => i + 1);
                setVerseFromOptions(options);
            }
        }

        if (data.surah_to) {
            const surah = surahs.find(s => s.id == data.surah_to);
            setSelectedSurahTo(surah);
            if (surah) {
                const options = Array.from({ length: surah.total_verses }, (_, i) => i + 1);
                setVerseToOptions(options);
            }
        }
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        put(`/quran-home-practice/${practice.id}`);
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

    const today = new Date().toISOString().split('T')[0];

    return (
        <AuthenticatedLayout header="Edit Home Practice">
            <Head title="Edit Home Practice" />

            <div className="py-6 sm:py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 sm:mb-8">
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
                            Edit Home Practice
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Update your child's practice session details
                        </p>
                    </div>

                    {/* Form - Same structure as Create.jsx */}
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
                                        {student.first_name} {student.last_name} - {student.grade?.name}
                                    </option>
                                ))}
                            </select>
                            {errors.student_id && <p className="mt-1 text-sm text-red-600">{errors.student_id}</p>}
                        </div>

                        {/* Practice Date and Duration */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Practice Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={data.practice_date}
                                    onChange={(e) => setData('practice_date', e.target.value)}
                                    max={today}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                                />
                                {errors.practice_date && <p className="mt-1 text-sm text-red-600">{errors.practice_date}</p>}
                                <p className="mt-1 text-xs text-gray-500">Cannot select future dates</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Duration (minutes) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="480"
                                    value={data.duration_minutes}
                                    onChange={(e) => setData('duration_minutes', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                                    placeholder="e.g., 30"
                                />
                                {errors.duration_minutes && <p className="mt-1 text-sm text-red-600">{errors.duration_minutes}</p>}
                                <p className="mt-1 text-xs text-gray-500">Max 480 minutes (8 hours)</p>
                            </div>
                        </div>

                        {/* Practice Type */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Practice Type <span className="text-red-500">*</span>
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
                                        onClick={() => setData('practice_type', type.value)}
                                        className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                                            data.practice_type === type.value
                                                ? `bg-${type.color}-500 text-white shadow-md`
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                            {errors.practice_type && <p className="mt-1 text-sm text-red-600">{errors.practice_type}</p>}
                        </div>

                        {/* Surah Range (Optional) - Same as Create.jsx */}
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-6 border border-orange-200/50">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Surah & Verse Range (Optional)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">From Surah</label>
                                    <select value={data.surah_from} onChange={handleSurahFromChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent">
                                        <option value="">Select Surah</option>
                                        {surahs.map((surah) => (
                                            <option key={surah.id} value={surah.id}>{surah.id}. {surah.name_english} ({surah.name_arabic})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">To Surah</label>
                                    <select value={data.surah_to} onChange={handleSurahToChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent">
                                        <option value="">Select Surah</option>
                                        {surahs.map((surah) => (
                                            <option key={surah.id} value={surah.id}>{surah.id}. {surah.name_english} ({surah.name_arabic})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">From Verse</label>
                                    <select value={data.verse_from} onChange={(e) => setData('verse_from', e.target.value)} disabled={!selectedSurahFrom} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent disabled:bg-gray-100">
                                        <option value="">Select Verse</option>
                                        {verseFromOptions.map((verse) => (<option key={verse} value={verse}>Verse {verse}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">To Verse</label>
                                    <select value={data.verse_to} onChange={(e) => setData('verse_to', e.target.value)} disabled={!selectedSurahTo} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent disabled:bg-gray-100">
                                        <option value="">Select Verse</option>
                                        {verseToOptions.map((verse) => (<option key={verse} value={verse}>Verse {verse}</option>))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Notes (Optional)</label>
                            <textarea value={data.notes} onChange={(e) => setData('notes', e.target.value)} rows={4} maxLength={1000} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent" placeholder="Add any notes about the practice session..." />
                            {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes}</p>}
                            <p className="mt-1 text-xs text-gray-500">{data.notes.length}/1000 characters</p>
                        </div>

                        {/* Submit Button */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                            <Link href="/quran-home-practice" className="px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">Cancel</Link>
                            <button type="submit" disabled={processing} className="inline-flex items-center px-6 py-2 bg-orange text-white font-bold rounded-lg hover:bg-orange-dark transition-colors shadow-sm disabled:opacity-50">
                                {processing ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating...</>) : (<><Save className="w-4 h-4 mr-2" />Update Practice</>)}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}


