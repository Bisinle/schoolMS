import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    TextInput,
    SelectInput,
    TextareaInput,
    FormSection,
    FormField,
    FormActions,
    ReadOnlyField,
    ReadOnlyFieldGroup,
    ReadOnlyInfo
} from '@/Components/Forms';

/**
 * Form Components Test Page
 * 
 * Visual testing page for all form components.
 * This file can be deleted after verification.
 * 
 * To test: Add a route to this component and view in browser.
 */
export default function FormComponentsTest({ auth }) {
    const { data, setData, post, processing, errors, setError } = useForm({
        first_name: '',
        last_name: '',
        email: '',
        gender: '',
        grade_id: '',
        description: '',
        notes: '',
        status: 'active',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        // Simulate validation errors
        setError('first_name', 'This field is required');
        setError('email', 'Please enter a valid email address');
    };

    const sampleGrades = [
        { id: 1, name: 'Grade 1' },
        { id: 2, name: 'Grade 2' },
        { id: 3, name: 'Grade 3' },
    ];

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Form Components Test" />

            <div className="py-6 max-w-4xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Form Components Test
                    </h1>
                    <p className="text-sm text-gray-600">
                        Test all form components with various configurations.
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Read-Only Fields */}
                        <FormSection
                            title="Auto-Generated Fields"
                            description="These fields are automatically generated"
                        >
                            <FormField span="full">
                                <ReadOnlyField
                                    label="Student ID"
                                    value="STU-2025-001"
                                    copyable
                                    badge="Auto-generated"
                                    helperText="This ID is automatically assigned upon registration"
                                />
                            </FormField>

                            <ReadOnlyFieldGroup cols="2">
                                <ReadOnlyInfo
                                    label="Created At"
                                    value="2025-01-15 10:30 AM"
                                />
                                <ReadOnlyInfo
                                    label="Last Updated"
                                    value="2025-01-20 03:45 PM"
                                />
                            </ReadOnlyFieldGroup>
                        </FormSection>

                        {/* Text Inputs */}
                        <FormSection
                            title="Personal Information"
                            description="Enter the student's personal details"
                        >
                            <TextInput
                                label="First Name"
                                name="first_name"
                                value={data.first_name}
                                onChange={(e) => setData('first_name', e.target.value)}
                                error={errors.first_name}
                                required
                                placeholder="e.g., John"
                                isFocused
                            />

                            <TextInput
                                label="Last Name"
                                name="last_name"
                                value={data.last_name}
                                onChange={(e) => setData('last_name', e.target.value)}
                                required
                                placeholder="e.g., Doe"
                            />

                            <FormField span="full">
                                <TextInput
                                    label="Email Address"
                                    name="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    error={errors.email}
                                    required
                                    placeholder="student@example.com"
                                    helperText="We'll never share your email with anyone else"
                                />
                            </FormField>
                        </FormSection>

                        {/* Select Inputs */}
                        <FormSection
                            title="Academic Information"
                            gridCols="2"
                        >
                            <SelectInput
                                label="Gender"
                                name="gender"
                                value={data.gender}
                                onChange={(e) => setData('gender', e.target.value)}
                                options={['male', 'female']}
                                required
                                placeholder="Select gender"
                            />

                            <SelectInput
                                label="Grade"
                                name="grade_id"
                                value={data.grade_id}
                                onChange={(e) => setData('grade_id', e.target.value)}
                                options={sampleGrades.map(g => ({ value: g.id, label: g.name }))}
                                required
                                placeholder="Select grade"
                            />

                            <SelectInput
                                label="Status"
                                name="status"
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                options={[
                                    { value: 'active', label: 'Active' },
                                    { value: 'inactive', label: 'Inactive' }
                                ]}
                                required
                            />
                        </FormSection>

                        {/* Textarea Inputs */}
                        <FormSection
                            title="Additional Information"
                            collapsible
                            defaultExpanded={true}
                        >
                            <FormField span="full">
                                <TextareaInput
                                    label="Description"
                                    name="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={4}
                                    maxLength={500}
                                    showCharCount
                                    placeholder="Enter a brief description..."
                                    helperText="Maximum 500 characters"
                                />
                            </FormField>

                            <FormField span="full">
                                <TextareaInput
                                    label="Notes (Auto-resize)"
                                    name="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    autoResize
                                    rows={3}
                                    placeholder="Type to see auto-resize..."
                                />
                            </FormField>
                        </FormSection>

                        {/* Form Actions */}
                        <FormActions
                            submitLabel="Save Student"
                            cancelHref="/students"
                            processing={processing}
                        />
                    </form>
                </div>

                {/* Testing Instructions */}
                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">
                        Testing Instructions
                    </h3>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                        <li>Test all input types (text, email, select, textarea)</li>
                        <li>Verify error display (submit form to see errors)</li>
                        <li>Test copy-to-clipboard on read-only field</li>
                        <li>Test collapsible section (Additional Information)</li>
                        <li>Test character counter on description field</li>
                        <li>Test auto-resize on notes field</li>
                        <li>Verify focus ring color matches orange theme</li>
                        <li>Test disabled state on submit button</li>
                        <li>Delete this file after testing</li>
                    </ul>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

