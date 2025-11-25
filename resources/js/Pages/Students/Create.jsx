import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import TextInput from '@/Components/Forms/TextInput';
import SelectInput from '@/Components/Forms/SelectInput';
import FormSection, { FormField } from '@/Components/Forms/FormSection';
import FormActions from '@/Components/Forms/FormActions';
import ReadOnlyField from '@/Components/Forms/ReadOnlyField';

export default function StudentsCreate({ guardians, grades }) {
    const { data, setData, post, processing, errors } = useForm({
        first_name: '',
        last_name: '',
        gender: 'male',
        date_of_birth: '',
        grade_id: '',
        guardian_id: '',
        enrollment_date: new Date().toISOString().split('T')[0],
        status: 'active',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/students');
    };

    return (
        <AuthenticatedLayout header="Register New Student">
            <Head title="Add Student" />

            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Student Information</h2>
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
                                    value="Will be auto-generated (e.g., STU-25-001)"
                                    badge="Auto-generated"
                                    helperText="A unique admission number will be automatically assigned upon registration"
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
                        </FormSection>

                        {/* Academic Information Section */}
                        <FormSection title="Academic Information">
                            <SelectInput
                                label="Grade"
                                name="grade_id"
                                value={data.grade_id}
                                onChange={(e) => setData('grade_id', e.target.value)}
                                error={errors.grade_id}
                                required
                                placeholder="Select Grade"
                                optionRenderer={(grade) => (
                                    <option key={grade.id} value={grade.id}>
                                        {grade.name} ({grade.level})
                                    </option>
                                )}
                                options={grades}
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
                                helperText={guardians.length === 0 ? "No guardians available. Please create a guardian first." : undefined}
                            />
                        </FormSection>

                        {/* Submit Button */}
                        <FormActions
                            submitLabel="Register Student"
                            cancelHref="/students"
                            processing={processing}
                        />
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}