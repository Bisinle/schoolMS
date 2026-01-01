import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { Calendar, ArrowLeft, Save } from 'lucide-react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

export default function EditTimetableTemplate({ template, grades, academicTerms, auth }) {
    const { data, setData, put, processing, errors } = useForm({
        grade_id: template.grade_id || '',
        academic_term_id: template.academic_term_id || '',
        name: template.name || '',
        effective_from: template.effective_from || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('timetables.templates.update', template.id));
    };

    return (
        <AuthenticatedLayout header="Edit Timetable Template">
            <Head title="Edit Timetable Template" />

            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Calendar className="w-8 h-8 text-orange" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Edit Timetable Template</h2>
                            <p className="text-sm text-gray-600">Update template: {template.name}</p>
                        </div>
                    </div>
                    <Link
                        href={route('timetables.templates.index')}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Link>
                </div>

                {template.status !== 'draft' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800">
                            ⚠️ This template is currently <strong>{template.status}</strong>. Changes may affect existing schedules.
                        </p>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div>
                            <InputLabel htmlFor="grade_id" value="Grade *" />
                            <select
                                id="grade_id"
                                value={data.grade_id}
                                onChange={(e) => setData('grade_id', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:border-orange focus:ring focus:ring-orange focus:ring-opacity-50"
                            >
                                <option value="">Select a grade</option>
                                {grades.map((grade) => (
                                    <option key={grade.id} value={grade.id}>{grade.name}</option>
                                ))}
                            </select>
                            <InputError message={errors.grade_id} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="academic_term_id" value="Academic Term *" />
                            <select
                                id="academic_term_id"
                                value={data.academic_term_id}
                                onChange={(e) => setData('academic_term_id', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:border-orange focus:ring focus:ring-orange focus:ring-opacity-50"
                            >
                                <option value="">Select an academic term</option>
                                {academicTerms.map((term) => (
                                    <option key={term.id} value={term.id}>
                                        {term.name} ({term.academic_year?.year_name})
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.academic_term_id} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="name" value="Template Name *" />
                            <TextInput
                                id="name"
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.name} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="effective_from" value="Effective From *" />
                            <TextInput
                                id="effective_from"
                                type="date"
                                value={data.effective_from}
                                onChange={(e) => setData('effective_from', e.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.effective_from} className="mt-2" />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                            <Link
                                href={route('timetables.templates.index')}
                                className="inline-flex items-center px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </Link>
                            <PrimaryButton disabled={processing} className="inline-flex items-center">
                                <Save className="w-4 h-4 mr-2" />
                                {processing ? 'Saving...' : 'Save Changes'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
