import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { Calendar, ArrowLeft, Save } from 'lucide-react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

export default function CreateTimetableTemplate({ grade, stream, academicTerms, auth }) {
    const { data, setData, post, processing, errors } = useForm({
        grade_id: grade?.id || '',
        stream_id: stream?.id || '',
        academic_term_id: '',
        name: '',
        effective_from: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('timetables.templates.store'));
    };

    return (
        <AuthenticatedLayout header="Create Timetable Template">
            <Head title="Create Timetable Template" />

            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Calendar className="w-8 h-8 text-orange" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Create Timetable Template</h2>
                            <p className="text-sm text-gray-600">
                                {grade && stream
                                    ? `Creating template for ${grade.name} ${stream.name}`
                                    : grade
                                    ? `Creating template for ${grade.name}`
                                    : 'Create a new timetable template for a grade'
                                }
                            </p>
                        </div>
                    </div>
                    <Link
                        href={grade ? route('timetables.templates.select-stream', grade.id) : route('timetables.templates.create')}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Link>
                </div>

                {/* Form */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Grade Display (Read-only) */}
                        {grade && (
                            <div>
                                <InputLabel value="Grade" />
                                <div className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                                    {grade.name} {stream && stream.name}
                                </div>
                                <p className="mt-1 text-sm text-gray-500">
                                    {stream
                                        ? `This template will be created for ${grade.name} ${stream.name}`
                                        : `This template will be created for ${grade.name} (no stream)`
                                    }
                                </p>
                            </div>
                        )}

                        {/* Academic Term Selection */}
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

                        {/* Template Name */}
                        <div>
                            <InputLabel htmlFor="name" value="Template Name *" />
                            <TextInput
                                id="name"
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="mt-1 block w-full"
                                placeholder="e.g., Grade 1 - Term 1 Timetable"
                            />
                            <InputError message={errors.name} className="mt-2" />
                            <p className="mt-1 text-sm text-gray-500">
                                A descriptive name for this timetable template
                            </p>
                        </div>

                        {/* Effective From Date */}
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
                            <p className="mt-1 text-sm text-gray-500">
                                The date when this timetable becomes active
                            </p>
                        </div>

                        {/* Form Actions */}
                        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                            <Link
                                href={route('timetables.templates.index')}
                                className="inline-flex items-center px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </Link>
                            <PrimaryButton disabled={processing} className="inline-flex items-center">
                                <Save className="w-4 h-4 mr-2" />
                                {processing ? 'Creating...' : 'Create Template'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>

                {/* Help Text */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-blue-900 mb-2">Next Steps</h3>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                        <li>After creating the template, you can add timetable slots</li>
                        <li>Assign subjects, teachers, and rooms to each period</li>
                        <li>Publish the template when ready to make it visible to teachers and students</li>
                    </ul>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

