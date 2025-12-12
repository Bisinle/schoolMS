import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Save, Loader2, AlertCircle } from 'lucide-react';

export default function Edit({ schedule, students }) {
    const { data, setData, put, processing, errors } = useForm({
        student_id: schedule.student_id || '',
        schedule_type: schedule.schedule_type || 'weekly',
        target_pages_per_period: schedule.target_pages_per_period || '',
        target_verses_per_period: schedule.target_verses_per_period || '',
        start_date: schedule.start_date || '',
        expected_completion_date: schedule.expected_completion_date || '',
        target_total_pages: schedule.target_total_pages || '',
        notes: schedule.notes || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(`/quran-schedule/${schedule.id}`);
    };

    return (
        <AuthenticatedLayout header="Edit Quran Schedule">
            <Head title="Edit Quran Schedule" />

            <div className="py-6 sm:py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 sm:mb-8">
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
                            Edit Quran Schedule
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Update the schedule details
                        </p>
                    </div>

                    {/* Warning if inactive */}
                    {!schedule.is_active && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-yellow-800">
                                <p className="font-semibold mb-1">This schedule is currently inactive</p>
                                <p>Activate it from the schedule list to start tracking progress.</p>
                            </div>
                        </div>
                    )}

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
                                        {student.first_name} {student.last_name} ({student.admission_number}) - {student.grade?.name}
                                    </option>
                                ))}
                            </select>
                            {errors.student_id && <p className="mt-1 text-sm text-red-600">{errors.student_id}</p>}
                        </div>

                        {/* Schedule Type */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Schedule Type <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { value: 'daily', label: 'Daily', color: 'green' },
                                    { value: 'weekly', label: 'Weekly', color: 'blue' },
                                    { value: 'monthly', label: 'Monthly', color: 'purple' },
                                ].map((type) => (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => setData('schedule_type', type.value)}
                                        className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                                            data.schedule_type === type.value
                                                ? `bg-${type.color}-500 text-white shadow-md`
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                            {errors.schedule_type && <p className="mt-1 text-sm text-red-600">{errors.schedule_type}</p>}
                        </div>

                        {/* Targets */}
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-6 border border-orange-200/50">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Targets per {data.schedule_type === 'daily' ? 'Day' : data.schedule_type === 'weekly' ? 'Week' : 'Month'}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Target Pages</label>
                                    <input type="number" min="1" value={data.target_pages_per_period} onChange={(e) => setData('target_pages_per_period', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent" placeholder="e.g., 5" />
                                    {errors.target_pages_per_period && <p className="mt-1 text-sm text-red-600">{errors.target_pages_per_period}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Target Verses (Optional)</label>
                                    <input type="number" min="1" value={data.target_verses_per_period} onChange={(e) => setData('target_verses_per_period', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent" placeholder="e.g., 20" />
                                    {errors.target_verses_per_period && <p className="mt-1 text-sm text-red-600">{errors.target_verses_per_period}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Start Date <span className="text-red-500">*</span></label>
                                <input type="date" value={data.start_date} onChange={(e) => setData('start_date', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent" />
                                {errors.start_date && <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Expected Completion Date (Optional)</label>
                                <input type="date" value={data.expected_completion_date} onChange={(e) => setData('expected_completion_date', e.target.value)} min={data.start_date} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent" />
                                {errors.expected_completion_date && <p className="mt-1 text-sm text-red-600">{errors.expected_completion_date}</p>}
                            </div>
                        </div>

                        {/* Target Total Pages */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Target Total Pages (Optional)</label>
                            <input type="number" min="1" max="604" value={data.target_total_pages} onChange={(e) => setData('target_total_pages', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent" placeholder="e.g., 100" />
                            {errors.target_total_pages && <p className="mt-1 text-sm text-red-600">{errors.target_total_pages}</p>}
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Notes (Optional)</label>
                            <textarea value={data.notes} onChange={(e) => setData('notes', e.target.value)} rows={4} maxLength={1000} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent" placeholder="Add any notes..." />
                            {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes}</p>}
                            <p className="mt-1 text-xs text-gray-500">{data.notes.length}/1000 characters</p>
                        </div>

                        {/* Submit Button */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                            <Link href="/quran-schedule" className="px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">Cancel</Link>
                            <button type="submit" disabled={processing} className="inline-flex items-center px-6 py-2 bg-orange text-white font-bold rounded-lg hover:bg-orange-dark transition-colors shadow-sm disabled:opacity-50">
                                {processing ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating...</>) : (<><Save className="w-4 h-4 mr-2" />Update Schedule</>)}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

