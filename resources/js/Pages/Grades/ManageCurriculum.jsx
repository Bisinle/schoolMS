import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { ArrowLeft, Save, BookOpen, AlertCircle, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export default function ManageCurriculum({ grade, subjects }) {
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Initialize form data with existing pivot data
    const initialData = {};
    subjects.forEach(subject => {
        initialData[subject.id] = {
            sessions_per_week: subject.pivot?.sessions_per_week || 4,
            priority: subject.pivot?.priority || 'neutral',
            must_be_daily: subject.pivot?.must_be_daily || false,
            can_repeat_same_day: subject.pivot?.can_repeat_same_day || false,
        };
    });

    const { data, setData, post, processing, errors } = useForm({
        subjects: initialData
    });

    const handleSubjectChange = (subjectId, field, value) => {
        setData('subjects', {
            ...data.subjects,
            [subjectId]: {
                ...data.subjects[subjectId],
                [field]: value
            }
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSaving(true);
        
        post(route('grades.curriculum.update', grade.id), {
            onSuccess: () => {
                setSuccessMessage('Curriculum rules updated successfully!');
                setTimeout(() => setSuccessMessage(''), 3000);
                setSaving(false);
            },
            onError: () => {
                setSaving(false);
            }
        });
    };

    const getTotalSessions = () => {
        return Object.values(data.subjects).reduce((sum, subject) => {
            return sum + parseInt(subject.sessions_per_week || 0);
        }, 0);
    };

    const getPriorityBadgeColor = (priority) => {
        const colors = {
            high: 'bg-orange-100 text-orange-800 border-orange-300',
            neutral: 'bg-blue-100 text-blue-800 border-blue-300',
            low: 'bg-green-100 text-green-800 border-green-300',
        };
        return colors[priority] || colors.neutral;
    };

    const getPriorityLabel = (priority) => {
        const labels = {
            high: 'High (Morning)',
            neutral: 'Neutral (Anytime)',
            low: 'Low (Afternoon)',
        };
        return labels[priority] || priority;
    };

    return (
        <AuthenticatedLayout header={`Manage Curriculum: ${grade.name}`}>
            <Head title={`Curriculum: ${grade.name}`} />

            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => router.visit(route('grades.show', grade.id))}
                        className="flex items-center text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to Grade
                    </button>
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                        <p className="text-green-800 font-medium">{successMessage}</p>
                    </div>
                )}

                {/* Info Card */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                    <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-blue-900 mb-1">
                                Configure Curriculum Rules for Timetable Generation
                            </h3>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• <strong>Sessions per Week:</strong> How many times this subject should appear in the timetable</li>
                                <li>• <strong>Priority:</strong> High priority subjects get morning slots, low priority get afternoon slots</li>
                                <li>• <strong>Must be Daily:</strong> Subject should appear every day (e.g., Math, English)</li>
                                <li>• <strong>Can Repeat Same Day:</strong> Subject can appear multiple times in one day</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Summary Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Total Weekly Sessions</h3>
                            <p className="text-sm text-gray-600">Sum of all subject sessions</p>
                        </div>
                        <div className="text-3xl font-bold text-orange">{getTotalSessions()}</div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center">
                                <BookOpen className="w-6 h-6 mr-2 text-orange" />
                                Subject Curriculum Rules
                            </h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            Subject
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            Sessions/Week
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            Priority
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            Must be Daily
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            Can Repeat Same Day
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {subjects.map((subject) => (
                                        <tr key={subject.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className={`w-3 h-3 rounded-full mr-3 ${
                                                        subject.category === 'academic' ? 'bg-blue-500' : 'bg-green-500'
                                                    }`}></div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{subject.name}</div>
                                                        <div className="text-xs text-gray-500">{subject.code}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="10"
                                                    value={data.subjects[subject.id]?.sessions_per_week || 0}
                                                    onChange={(e) => handleSubjectChange(subject.id, 'sessions_per_week', parseInt(e.target.value))}
                                                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <select
                                                    value={data.subjects[subject.id]?.priority || 'neutral'}
                                                    onChange={(e) => handleSubjectChange(subject.id, 'priority', e.target.value)}
                                                    className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent ${
                                                        getPriorityBadgeColor(data.subjects[subject.id]?.priority || 'neutral')
                                                    }`}
                                                >
                                                    <option value="high">High (Morning)</option>
                                                    <option value="neutral">Neutral (Anytime)</option>
                                                    <option value="low">Low (Afternoon)</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={data.subjects[subject.id]?.must_be_daily || false}
                                                    onChange={(e) => handleSubjectChange(subject.id, 'must_be_daily', e.target.checked)}
                                                    className="w-5 h-5 text-orange border-gray-300 rounded focus:ring-orange"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={data.subjects[subject.id]?.can_repeat_same_day || false}
                                                    onChange={(e) => handleSubjectChange(subject.id, 'can_repeat_same_day', e.target.checked)}
                                                    className="w-5 h-5 text-orange border-gray-300 rounded focus:ring-orange"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Form Actions */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                                {subjects.length} subject{subjects.length !== 1 ? 's' : ''} configured
                            </p>
                            <button
                                type="submit"
                                disabled={processing || saving}
                                className="flex items-center px-6 py-2.5 bg-orange text-white rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Save className="w-5 h-5 mr-2" />
                                {processing || saving ? 'Saving...' : 'Save Curriculum Rules'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}

