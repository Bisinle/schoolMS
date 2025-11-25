import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import TextInput from '@/Components/Forms/TextInput';
import SelectInput from '@/Components/Forms/SelectInput';
import FormSection from '@/Components/Forms/FormSection';
import FormActions from '@/Components/Forms/FormActions';

export default function SubjectsEdit({ subject, grades }) {
    const { data, setData, put, processing, errors } = useForm({
        name: subject.name || '',
        category: subject.category || 'academic',
        code: subject.code || '',
        status: subject.status || 'active',
        grade_ids: subject.grades?.map(g => g.id) || [],
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(`/subjects/${subject.id}`);
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
        <AuthenticatedLayout header="Edit Subject">
            <Head title={`Edit ${subject.name}`} />

            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Edit Subject Information</h2>
                            <Link
                                href={route('subjects.index')}
                                className="inline-flex items-center px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to List
                            </Link>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <FormSection title="Subject Information" gridCols="1">
                            <TextInput
                                label="Subject Name"
                                name="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                error={errors.name}
                                required
                                placeholder="e.g., Mathematics, Qur'an"
                            />

                            <SelectInput
                                label="Category"
                                name="category"
                                value={data.category}
                                onChange={(e) => setData('category', e.target.value)}
                                error={errors.category}
                                required
                                showPlaceholder={false}
                                options={['academic', 'islamic']}
                            />

                            <TextInput
                                label="Subject Code"
                                name="code"
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value)}
                                error={errors.code}
                                placeholder="e.g., MATH101, QUR201"
                            />

                            <SelectInput
                                label="Status"
                                name="status"
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                error={errors.status}
                                required
                                showPlaceholder={false}
                                options={['active', 'inactive']}
                            />
                        </FormSection>

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

                        <FormActions
                            submitLabel="Update Subject"
                            cancelHref="/subjects"
                            processing={processing}
                        />
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}