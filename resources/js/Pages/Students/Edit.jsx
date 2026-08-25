import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Plus, X, UserPlus, Check, ChevronDown } from 'lucide-react';
import TextInput from '@/Components/Forms/TextInput';
import SelectInput from '@/Components/Forms/SelectInput';
import FormSection, { FormField } from '@/Components/Forms/FormSection';
import FormActions from '@/Components/Forms/FormActions';
import ReadOnlyField from '@/Components/Forms/ReadOnlyField';
import ImageUpload from '@/Components/Forms/ImageUpload';
import { Combobox } from '@headlessui/react';
import { useState } from 'react';

const RELATIONSHIP_OPTIONS = ['Father', 'Mother', 'Uncle', 'Aunt', 'Grandparent', 'Other'];

export default function StudentsEdit({ student, guardians, studentGuardians, grades }) {
    const { data, setData, post, processing, errors } = useForm({
        first_name: student.first_name || '',
        last_name: student.last_name || '',
        gender: student.gender || 'male',
        date_of_birth: student.date_of_birth ? student.date_of_birth.slice(0, 10) : '',
        grade_id: student.grade_id || '',
        guardians: studentGuardians || [],
        enrollment_date: student.enrollment_date ? student.enrollment_date.slice(0, 10) : '',
        status: student.status || 'active',
        profile_picture: null,
        _method: 'PUT',
    });

    const [guardianQuery, setGuardianQuery] = useState('');
    const [selectedGuardian, setSelectedGuardian] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(`/students/${student.id}`, {
            forceFormData: true,
        });
    };

    // Filter guardians based on search query
    const filteredGuardians = guardianQuery === ''
        ? guardians
        : guardians.filter((guardian) => {
            const searchTerm = guardianQuery.toLowerCase();
            return (
                guardian.name.toLowerCase().includes(searchTerm) ||
                guardian.guardian_number.toLowerCase().includes(searchTerm)
            );
        });

    const RELATIONSHIP_OPTIONS = ['Father', 'Mother', 'Uncle', 'Aunt', 'Grandparent', 'Other'];

    // Add guardian to the list
    const addGuardian = (guardian) => {
        if (!guardian) return;

        // Check if guardian already added
        if (data.guardians.some(g => g.guardian_id === guardian.id)) {
            alert('This guardian has already been added');
            return;
        }

        const newGuardian = {
            guardian_id: guardian.id,
            guardian_number: guardian.guardian_number,
            name: guardian.name,
            relationship: guardian.relationship || '',
            is_primary: data.guardians.length === 0,
            can_receive_invoices: true,
            can_pickup: true,
            emergency_contact: false,
        };

        setData('guardians', [...data.guardians, newGuardian]);
        setSelectedGuardian(null);
        setGuardianQuery('');
    };

    // Remove guardian from the list
    const removeGuardian = (index) => {
        const newGuardians = data.guardians.filter((_, i) => i !== index);
        // If we removed the primary guardian, make the first one primary
        if (newGuardians.length > 0 && !newGuardians.some(g => g.is_primary)) {
            newGuardians[0].is_primary = true;
        }
        setData('guardians', newGuardians);
    };

    // Update guardian field
    const updateGuardian = (index, field, value) => {
        const newGuardians = [...data.guardians];

        // If setting a guardian as primary, unset others
        if (field === 'is_primary' && value === true) {
            newGuardians.forEach((g, i) => {
                g.is_primary = i === index;
            });
        } else {
            newGuardians[index][field] = value;
        }

        setData('guardians', newGuardians);
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
                            <div className="space-y-4">
                                {/* Searchable Guardian Selector */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Add Guardian(s) <span className="text-red-500">*</span>
                                    </label>
                                    <Combobox value={selectedGuardian} onChange={addGuardian}>
                                        <div className="relative">
                                            <div className="relative w-full">
                                                <Combobox.Input
                                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500 pr-10"
                                                    displayValue={(guardian) =>
                                                        guardian?.name ? `${guardian.name} (${guardian.guardian_number})` : ''
                                                    }
                                                    onChange={(event) => setGuardianQuery(event.target.value)}
                                                    placeholder="Search by name or guardian number..."
                                                />
                                                <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                                                    <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                                </Combobox.Button>
                                            </div>
                                            <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                                {filteredGuardians.length === 0 && guardianQuery !== '' ? (
                                                    <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                                        No guardians found.
                                                    </div>
                                                ) : (
                                                    filteredGuardians.map((guardian) => (
                                                        <Combobox.Option
                                                            key={guardian.id}
                                                            value={guardian}
                                                            className={({ active }) =>
                                                                `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                                                                    active ? 'bg-orange-600 text-white' : 'text-gray-900'
                                                                }`
                                                            }
                                                        >
                                                            {({ selected, active }) => (
                                                                <>
                                                                    <div className="flex items-center justify-between w-full">
                                                                        <div className="flex-1">
                                                                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                                                {guardian.name} ({guardian.guardian_number})
                                                                            </span>
                                                                            <span className={`text-xs ${active ? 'text-orange-200' : 'text-gray-500'}`}>
                                                                                {guardian.phone} • {guardian.relationship}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    {data.guardians.some(g => g.guardian_id === guardian.id) && (
                                                                        <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                                            active ? 'text-white' : 'text-orange-600'
                                                                        }`}>
                                                                            <Check className="h-5 w-5" aria-hidden="true" />
                                                                        </span>
                                                                    )}
                                                                </>
                                                            )}
                                                        </Combobox.Option>
                                                    ))
                                                )}
                                            </Combobox.Options>
                                        </div>
                                    </Combobox>
                                    {errors.guardians && (
                                        <p className="mt-1 text-sm text-red-600">{errors.guardians}</p>
                                    )}
                                    {guardians.length === 0 && (
                                        <p className="mt-2 text-sm text-gray-600">
                                            No guardians available. Please create a guardian first.
                                        </p>
                                    )}
                                </div>

                                {/* Selected Guardians List */}
                                {data.guardians.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-medium text-gray-700">Selected Guardians ({data.guardians.length})</h4>
                                        {data.guardians.map((guardian, index) => (
                                            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1">
                                                        <h5 className="font-medium text-gray-900">{guardian.name}</h5>
                                                        <p className="text-sm text-gray-600">{guardian.guardian_number}</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeGuardian(index)}
                                                        className="text-red-600 hover:text-red-800 p-1"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                                            Relationship <span className="text-red-500">*</span>
                                                        </label>
                                                        <select
                                                            value={guardian.relationship}
                                                            onChange={(e) => updateGuardian(index, 'relationship', e.target.value)}
                                                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500 text-sm"
                                                            required
                                                        >
                                                            <option value="">Select relationship</option>
                                                            {RELATIONSHIP_OPTIONS.map(opt => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                        {errors[`guardians.${index}.relationship`] && (
                                                            <p className="mt-1 text-xs text-red-600">{errors[`guardians.${index}.relationship`]}</p>
                                                        )}
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={guardian.is_primary}
                                                                onChange={(e) => updateGuardian(index, 'is_primary', e.target.checked)}
                                                                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                                            />
                                                            <span className="ml-2 text-sm text-gray-700">Primary Contact</span>
                                                        </label>
                                                        <label className="flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={guardian.can_receive_invoices}
                                                                onChange={(e) => updateGuardian(index, 'can_receive_invoices', e.target.checked)}
                                                                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                                            />
                                                            <span className="ml-2 text-sm text-gray-700">Can Receive Invoices</span>
                                                        </label>
                                                        <label className="flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={guardian.can_pickup}
                                                                onChange={(e) => updateGuardian(index, 'can_pickup', e.target.checked)}
                                                                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                                            />
                                                            <span className="ml-2 text-sm text-gray-700">Can Pick Up Student</span>
                                                        </label>
                                                        <label className="flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={guardian.emergency_contact}
                                                                onChange={(e) => updateGuardian(index, 'emergency_contact', e.target.checked)}
                                                                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                                            />
                                                            <span className="ml-2 text-sm text-gray-700">Emergency Contact</span>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
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