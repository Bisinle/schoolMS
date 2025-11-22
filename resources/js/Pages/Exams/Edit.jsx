import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { filterSubjectsBySchoolType } from '@/Utils/subjectFilters';

export default function ExamsEdit({ exam, grades, subjects: initialSubjects }) {
    const { school } = usePage().props;
    const { data, setData, put, processing, errors } = useForm({
        name: exam.name || '',
        exam_type: exam.exam_type || 'opening',
        term: exam.term?.toString() || '1',
        academic_year: exam.academic_year || new Date().getFullYear(),
        exam_date: exam.exam_date || '',
        grade_id: exam.grade_id || '',
        subject_id: exam.subject_id || '',
    });

    const [subjects, setSubjects] = useState(() => {
        // Filter initial subjects based on school type
        return filterSubjectsBySchoolType(initialSubjects || [], school?.school_type);
    });
    const [loadingSubjects, setLoadingSubjects] = useState(false);

    // Fetch subjects when grade changes
    useEffect(() => {
        if (data.grade_id && data.grade_id != exam.grade_id) {
            setLoadingSubjects(true);
            fetch(`/api/grades/${data.grade_id}/subjects`)
                .then(res => res.json())
                .then(fetchedSubjects => {
                    // Filter subjects based on school type
                    const filteredSubjects = filterSubjectsBySchoolType(fetchedSubjects, school?.school_type);
                    setSubjects(filteredSubjects);
                    setLoadingSubjects(false);
                })
                .catch(() => {
                    setLoadingSubjects(false);
                });
        }
    }, [data.grade_id, school?.school_type]);

    // Restrict exam_type for Term 3
    useEffect(() => {
        if (data.term === '3' && data.exam_type !== 'end_term') {
            setData('exam_type', 'end_term');
        }
    }, [data.term]);

    const handleSubmit = (e) => {
        e.preventDefault();
        put(`/exams/${exam.id}`);
    };

    return (
        <AuthenticatedLayout header="Edit Exam">
            <Head title={`Edit ${exam.name}`} />

            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Edit Exam Details</h2>
                            <Link
                                href="/exams"
                                className="inline-flex items-center px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to List
                            </Link>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Warning if exam has results */}
                        {exam.results_count > 0 && (
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
                                <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-yellow-800">
                                    <p className="font-medium">Warning: This exam has existing results</p>
                                    <p className="mt-1">
                                        Changes to this exam will affect {exam.results_count} student result(s) and their reports.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Term 3 Warning */}
                        {data.term === '3' && (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start">
                                <AlertCircle className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-blue-800">
                                    <p className="font-medium">Term 3 Restriction</p>
                                    <p className="mt-1">Term 3 can only have End-Term exams.</p>
                                </div>
                            </div>
                        )}

                        {/* Academic Year */}
                        <div>
                            <label htmlFor="academic_year" className="block text-sm font-medium text-gray-700 mb-2">
                                Academic Year <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                id="academic_year"
                                value={data.academic_year}
                                onChange={(e) => setData('academic_year', e.target.value)}
                                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all ${
                                    errors.academic_year ? 'border-red-500' : 'border-gray-300'
                                }`}
                                min="2020"
                                max="2100"
                            />
                            {errors.academic_year && (
                                <p className="mt-1 text-sm text-red-600">{errors.academic_year}</p>
                            )}
                        </div>

                        {/* Term */}
                        <div>
                            <label htmlFor="term" className="block text-sm font-medium text-gray-700 mb-2">
                                Term <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="term"
                                value={data.term}
                                onChange={(e) => setData('term', e.target.value)}
                                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all ${
                                    errors.term ? 'border-red-500' : 'border-gray-300'
                                }`}
                            >
                                <option value="1">Term 1</option>
                                <option value="2">Term 2</option>
                                <option value="3">Term 3</option>
                            </select>
                            {errors.term && (
                                <p className="mt-1 text-sm text-red-600">{errors.term}</p>
                            )}
                        </div>

                        {/* Exam Type */}
                        <div>
                            <label htmlFor="exam_type" className="block text-sm font-medium text-gray-700 mb-2">
                                Exam Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="exam_type"
                                value={data.exam_type}
                                onChange={(e) => setData('exam_type', e.target.value)}
                                disabled={data.term === '3'}
                                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all ${
                                    errors.exam_type ? 'border-red-500' : 'border-gray-300'
                                } ${data.term === '3' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            >
                                <option value="opening">Opening Exam</option>
                                <option value="midterm">Midterm Exam</option>
                                <option value="end_term">End-Term Exam</option>
                            </select>
                            {errors.exam_type && (
                                <p className="mt-1 text-sm text-red-600">{errors.exam_type}</p>
                            )}
                        </div>

                        {/* Grade */}
                        <div>
                            <label htmlFor="grade_id" className="block text-sm font-medium text-gray-700 mb-2">
                                Grade <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="grade_id"
                                value={data.grade_id}
                                onChange={(e) => setData('grade_id', e.target.value)}
                                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all ${
                                    errors.grade_id ? 'border-red-500' : 'border-gray-300'
                                }`}
                            >
                                <option value="">Select Grade</option>
                                {grades.map((grade) => (
                                    <option key={grade.id} value={grade.id}>
                                        {grade.name}
                                    </option>
                                ))}
                            </select>
                            {errors.grade_id && (
                                <p className="mt-1 text-sm text-red-600">{errors.grade_id}</p>
                            )}
                        </div>

                        {/* Subject */}
                        <div>
                            <label htmlFor="subject_id" className="block text-sm font-medium text-gray-700 mb-2">
                                Subject <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="subject_id"
                                value={data.subject_id}
                                onChange={(e) => setData('subject_id', e.target.value)}
                                disabled={!data.grade_id || loadingSubjects}
                                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all ${
                                    errors.subject_id ? 'border-red-500' : 'border-gray-300'
                                } ${!data.grade_id || loadingSubjects ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            >
                                <option value="">
                                    {loadingSubjects ? 'Loading subjects...' : data.grade_id ? 'Select Subject' : 'Select grade first'}
                                </option>
                                {subjects.map((subject) => (
                                    <option key={subject.id} value={subject.id}>
                                        {subject.name} ({subject.category})
                                    </option>
                                ))}
                            </select>
                            {errors.subject_id && (
                                <p className="mt-1 text-sm text-red-600">{errors.subject_id}</p>
                            )}
                        </div>

                        {/* Exam Date */}
                        <div>
                            <label htmlFor="exam_date" className="block text-sm font-medium text-gray-700 mb-2">
                                Exam Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                id="exam_date"
                                value={data.exam_date}
                                onChange={(e) => setData('exam_date', e.target.value)}
                                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all ${
                                    errors.exam_date ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {errors.exam_date && (
                                <p className="mt-1 text-sm text-red-600">{errors.exam_date}</p>
                            )}
                        </div>

                        {/* Exam Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                Exam Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all ${
                                    errors.name ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Enter exam name"
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                            <Link
                                href="/exams"
                                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center px-6 py-2.5 text-sm font-medium text-white bg-orange rounded-lg hover:bg-orange-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {processing ? 'Updating...' : 'Update Exam'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}