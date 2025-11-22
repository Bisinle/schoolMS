import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { shouldShowAcademicSubjects } from '@/Utils/subjectFilters';

export default function SubjectsCreate({ grades }) {
    const { school } = usePage().props;
    const showAcademicSubjects = shouldShowAcademicSubjects(school?.school_type);
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        category: showAcademicSubjects ? 'academic' : 'islamic',
        code: '',
        status: 'active',
        grade_ids: [],
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/subjects');
    };

    const handleGradeToggle = (gradeId) => {
        const currentGrades = [...data.grade_ids];
        const index = currentGrades.indexOf(gradeId);
        
        if (index > -1) {
            currentGrades.splice(index, 1);
        } else {
            currentGrades.push(gradeId);
        }
        
        setData('grade_ids', currentGrades);
    };

    const selectAllGrades = () => {
        setData('grade_ids', grades.map(g => g.id));
    };

    const deselectAllGrades = () => {
        setData('grade_ids', []);
    };

    return (
        <AuthenticatedLayout header="Add New Subject">
            <Head title="Add Subject" />

            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Subject Information</h2>
                            <Link
                                href="/subjects"
                                className="inline-flex items-center px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to List
                            </Link>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Subject Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                Subject Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all ${
                                    errors.name ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="e.g., Mathematics, Qur'an"
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                            )}
                        </div>

                        {/* Category */}
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                                Category <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="category"
                                value={data.category}
                                onChange={(e) => setData('category', e.target.value)}
                                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all ${
                                    errors.category ? 'border-red-500' : 'border-gray-300'
                                }`}
                            >
                                {showAcademicSubjects && <option value="academic">Academic</option>}
                                <option value="islamic">Islamic</option>
                            </select>
                            {errors.category && (
                                <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                            )}
                        </div>

                        {/* Subject Code */}
                        <div>
                            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                                Subject Code
                            </label>
                            <input
                                type="text"
                                id="code"
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value)}
                                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all ${
                                    errors.code ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="e.g., MATH101, QUR201"
                            />
                            {errors.code && (
                                <p className="mt-1 text-sm text-red-600">{errors.code}</p>
                            )}
                        </div>

                        {/* Status */}
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                                Status <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="status"
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all ${
                                    errors.status ? 'border-red-500' : 'border-gray-300'
                                }`}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                            {errors.status && (
                                <p className="mt-1 text-sm text-red-600">{errors.status}</p>
                            )}
                        </div>

                        {/* Assign to Grades */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    Assign to Grades
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={selectAllGrades}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        Select All
                                    </button>
                                    <span className="text-gray-300">|</span>
                                    <button
                                        type="button"
                                        onClick={deselectAllGrades}
                                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                                    >
                                        Deselect All
                                    </button>
                                </div>
                            </div>

                            <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                                {grades.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {grades.map((grade) => (
                                            <label
                                                key={grade.id}
                                                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={data.grade_ids.includes(grade.id)}
                                                    onChange={() => handleGradeToggle(grade.id)}
                                                    className="w-4 h-4 text-orange border-gray-300 rounded focus:ring-orange"
                                                />
                                                <span className="ml-3 text-sm text-gray-900">{grade.name}</span>
                                                <span className="ml-auto text-xs text-gray-500">Level {grade.level}</span>
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 text-center py-8">
                                        No grades available. Create grades first to assign subjects to them.
                                    </p>
                                )}
                            </div>

                            <p className="mt-2 text-sm text-gray-500">
                                Selected: {data.grade_ids.length} grade(s)
                            </p>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                            <Link
                                href="/subjects"
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
                                {processing ? 'Saving...' : 'Save Subject'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}