import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import TextInput from '@/Components/Forms/TextInput';
import SelectInput from '@/Components/Forms/SelectInput';
import TextareaInput from '@/Components/Forms/TextareaInput';
import FormSection, { FormField } from '@/Components/Forms/FormSection';
import FormActions from '@/Components/Forms/FormActions';
import ReadOnlyField from '@/Components/Forms/ReadOnlyField';

export default function GuardiansEdit({ guardian }) {
    const { data, setData, put, processing, errors } = useForm({
        name: guardian.user?.name || '',
        email: guardian.user?.email || '',
        phone_number: guardian.phone_number || '',
        address: guardian.address || '',
        occupation: guardian.occupation || '',
        relationship: guardian.relationship || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(`/guardians/${guardian.id}`);
    };

    return (
        <AuthenticatedLayout header="Edit Guardian">
            <Head title="Edit Guardian" />

            <div className="max-w-4xl">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <FormSection title="Guardian Information">
                            <FormField span="full">
                                <ReadOnlyField
                                    label="Guardian Number"
                                    value={guardian.guardian_number}
                                    badge="Read-only"
                                    badgeColor="blue"
                                    helperText="Guardian number cannot be changed"
                                    copyable
                                />
                            </FormField>

                            <TextInput
                                label="Full Name"
                                name="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                error={errors.name}
                                required
                            />

                            <TextInput
                                label="Email"
                                name="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                error={errors.email}
                                required
                            />

                            <TextInput
                                label="Phone Number"
                                name="phone_number"
                                value={data.phone_number}
                                onChange={(e) => setData('phone_number', e.target.value)}
                                error={errors.phone_number}
                                required
                            />

                            <SelectInput
                                label="Relationship"
                                name="relationship"
                                value={data.relationship}
                                onChange={(e) => setData('relationship', e.target.value)}
                                error={errors.relationship}
                                required
                                placeholder="Select Relationship"
                                options={['Father', 'Mother', 'Uncle', 'Aunt', 'Grandparent', 'Other']}
                            />

                            <TextInput
                                label="Occupation"
                                name="occupation"
                                value={data.occupation}
                                onChange={(e) => setData('occupation', e.target.value)}
                                error={errors.occupation}
                            />

                            <FormField span="full">
                                <TextareaInput
                                    label="Address"
                                    name="address"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    error={errors.address}
                                    rows={3}
                                />
                            </FormField>
                        </FormSection>

                        <FormActions
                            submitLabel="Update Guardian"
                            cancelHref="/guardians"
                            processing={processing}
                        />
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}