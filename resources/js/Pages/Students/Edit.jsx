import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import TextInput from '@/Components/Forms/TextInput';
import SelectInput from '@/Components/Forms/SelectInput';
import FormSection, { FormField } from '@/Components/Forms/FormSection';
import FormActions from '@/Components/Forms/FormActions';
import ReadOnlyField from '@/Components/Forms/ReadOnlyField';
import ImageUpload from '@/Components/Forms/ImageUpload';

export default function StudentsEdit({ student, guardians, grades, streams }) {
    const { data, setData, post, processing, errors } = useForm({
        first_name: student.first_name || '',
        last_name: student.last_name || '',
        gender: student.gender || 'male',
        date_of_birth: student.date_of_birth || '',
        stream_id: student.stream_id || '',
        guardian_id: student.guardian_id || '',
        enrollment_date: student.enrollment_date || '',
        status: student.status || 'active',
        profile_picture: null,
        _method: 'PUT',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(`/students/${student.id}`, {
            forceFormData: true,
        });
    };

    return (
        <AuthenticatedLayout header="Edit Student">
            <Head title={`Edit ${student.first_name} ${student.last_name}`} />

            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Edit Student Information</h2>
                            <Link
                                href={route('students.index')}
                                className="inline-flex items-center px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to List
                            </Link>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Personal Information Section */}
                        <FormSection title="Personal Information">
                            <FormField span="full">
                                <ReadOnlyField
                                    label="Admission Number"
                                    value={student.admission_number}
                                    badge="Read-only"
                                    badgeColor="blue"
                                    helperText="Admission number cannot be changed"
                                    copyable
                                />
                            </FormField>

                            <TextInput
                                label="First Name"
                                name="first_name"
                                value={data.first_name}
                                onChange={(e) => setData('first_name', e.target.value)}
                                error={errors.first_name}
                                required
                                placeholder="e.g., John"
                            />

                            <TextInput
                                label="Last Name"
                                name="last_name"
                                value={data.last_name}
                                onChange={(e) => setData('last_name', e.target.value)}
                                error={errors.last_name}
                                required
                                placeholder="e.g., Doe"
                            />

                            <SelectInput
                                label="Gender"
                                name="gender"
                                value={data.gender}
                                onChange={(e) => setData('gender', e.target.value)}
                                error={errors.gender}
                                required
                                options={[
                                    { value: 'male', label: 'Male' },
                                    { value: 'female', label: 'Female' }
                                ]}
                                showPlaceholder={false}
                            />

                            <TextInput
                                label="Date of Birth"
                                name="date_of_birth"
                                type="date"
                                value={data.date_of_birth}
                                onChange={(e) => setData('date_of_birth', e.target.value)}
                                error={errors.date_of_birth}
                                required
                            />

                            <FormField span="full">
                                <ImageUpload
                                    label="Profile Picture"
                                    name="profile_picture"
                                    value={data.profile_picture}
                                    onChange={(file) => setData('profile_picture', file)}
                                    error={errors.profile_picture}
                                    currentImage={student.profile_picture}
                                    required={false}
                                />
                            </FormField>
                        </FormSection>

                        {/* Academic Information Section */}
                        <FormSection title="Academic Information">
                            <SelectInput
                                label="Stream"
                                name="stream_id"
                                value={data.stream_id}
                                onChange={(e) => setData('stream_id', e.target.value)}
                                error={errors.stream_id}
                                required
                                placeholder="Select Stream"
                                optionRenderer={(stream) => (
                                    <option key={stream.id} value={stream.id}>
                                        {stream.grade?.name} {stream.name}
                                    </option>
                                )}
                                options={streams}
                            />

                            <TextInput
                                label="Enrollment Date"
                                name="enrollment_date"
                                type="date"
                                value={data.enrollment_date}
                                onChange={(e) => setData('enrollment_date', e.target.value)}
                                error={errors.enrollment_date}
                                required
                            />

                            <SelectInput
                                label="Status"
                                name="status"
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                error={errors.status}
                                required
                                options={['active', 'inactive']}
                                showPlaceholder={false}
                            />
                        </FormSection>

                        {/* Guardian Information Section */}
                        <FormSection title="Guardian Information" gridCols="1">
                            <SelectInput
                                label="Guardian"
                                name="guardian_id"
                                value={data.guardian_id}
                                onChange={(e) => setData('guardian_id', e.target.value)}
                                error={errors.guardian_id}
                                required
                                placeholder="Select Guardian"
                                optionRenderer={(guardian) => (
                                    <option key={guardian.id} value={guardian.id}>
                                        {guardian.guardian_number} - {guardian.name} ({guardian.relationship})
                                    </option>
                                )}
                                options={guardians}
                            />
                        </FormSection>

                        {/* Submit Button */}
                        <FormActions
                            submitLabel="Update Student"
                            cancelHref="/students"
                            processing={processing}
                        />
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}