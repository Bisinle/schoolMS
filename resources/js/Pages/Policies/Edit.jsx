import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import RichTextEditor from '@/Components/RichTextEditor';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';

export default function Edit({ auth, policy }) {
    const { data, setData, put, processing, errors } = useForm({
        title: policy.title || '',
        type: policy.type || 'school_policy',
        content: policy.content || '',
        summary: policy.summary || '',
        effective_date: policy.effective_date || '',
        review_date: policy.review_date || '',
        requires_acknowledgment: policy.requires_acknowledgment || false,
        tags: policy.tags || [],
        revision_notes: '',
    });

    const [tagInput, setTagInput] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('policies.update', policy.id));
    };

    const addTag = () => {
        if (tagInput.trim() && !data.tags.includes(tagInput.trim())) {
            setData('tags', [...data.tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove) => {
        setData('tags', data.tags.filter(tag => tag !== tagToRemove));
    };

    const policyTypes = {
        school_policy: 'School Policy',
        student_handbook: 'Student Handbook',
        staff_handbook: 'Staff Handbook',
        code_of_conduct: 'Code of Conduct',
        rules_regulations: 'Rules & Regulations',
        safety_policy: 'Safety Policy',
        academic_policy: 'Academic Policy',
        admission_policy: 'Admission Policy',
        fee_policy: 'Fee Policy',
        other: 'Other',
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={`Edit ${policy.title}`} />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            <Link
                                href={route('policies.show', policy.id)}
                                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Edit Policy
                                </h1>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                    {policy.policy_number} • Version {policy.version}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
                            {/* Title */}
                            <div>
                                <InputLabel htmlFor="title" value="Policy Title *" />
                                <TextInput
                                    id="title"
                                    type="text"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    className="mt-1 block w-full"
                                    placeholder="e.g., Student Code of Conduct 2026"
                                    required
                                />
                                <InputError message={errors.title} className="mt-2" />
                            </div>

                            {/* Type */}
                            <div>
                                <InputLabel htmlFor="type" value="Policy Type *" />
                                <select
                                    id="type"
                                    value={data.type}
                                    onChange={(e) => setData('type', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    required
                                >
                                    {Object.entries(policyTypes).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                                <InputError message={errors.type} className="mt-2" />
                            </div>

                            {/* Summary */}
                            <div>
                                <InputLabel htmlFor="summary" value="Summary (Optional)" />
                                <textarea
                                    id="summary"
                                    value={data.summary}
                                    onChange={(e) => setData('summary', e.target.value)}
                                    rows={3}
                                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    placeholder="Brief summary of this policy..."
                                />
                                <InputError message={errors.summary} className="mt-2" />
                            </div>

                            {/* Content - Rich Text Editor */}
                            <div>
                                <InputLabel htmlFor="content" value="Policy Content *" />
                                <div className="mt-1">
                                    <RichTextEditor
                                        value={data.content}
                                        onChange={(value) => setData('content', value)}
                                        error={errors.content}
                                        placeholder="Write your policy content here..."
                                    />
                                </div>
                                <InputError message={errors.content} className="mt-2" />
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputLabel htmlFor="effective_date" value="Effective Date (Optional)" />
                                    <TextInput
                                        id="effective_date"
                                        type="date"
                                        value={data.effective_date}
                                        onChange={(e) => setData('effective_date', e.target.value)}
                                        className="mt-1 block w-full"
                                    />
                                    <InputError message={errors.effective_date} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="review_date" value="Review Date (Optional)" />
                                    <TextInput
                                        id="review_date"
                                        type="date"
                                        value={data.review_date}
                                        onChange={(e) => setData('review_date', e.target.value)}
                                        className="mt-1 block w-full"
                                    />
                                    <InputError message={errors.review_date} className="mt-2" />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        When should this policy be reviewed?
                                    </p>
                                </div>
                            </div>

                            {/* Requires Acknowledgment */}
                            <div className="flex items-center">
                                <input
                                    id="requires_acknowledgment"
                                    type="checkbox"
                                    checked={data.requires_acknowledgment}
                                    onChange={(e) => setData('requires_acknowledgment', e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                                />
                                <label htmlFor="requires_acknowledgment" className="ml-2 block text-sm text-gray-900 dark:text-white">
                                    Require staff acknowledgment
                                </label>
                            </div>

                            {/* Tags */}
                            <div>
                                <InputLabel htmlFor="tags" value="Tags (Optional)" />
                                <div className="mt-1 flex items-center space-x-2">
                                    <TextInput
                                        id="tags"
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addTag();
                                            }
                                        }}
                                        className="flex-1"
                                        placeholder="Add a tag and press Enter"
                                    />
                                    <button
                                        type="button"
                                        onClick={addTag}
                                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg"
                                    >
                                        Add
                                    </button>
                                </div>
                                {data.tags.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {data.tags.map((tag, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                            >
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() => removeTag(tag)}
                                                    className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Revision Notes */}
                            <div>
                                <InputLabel htmlFor="revision_notes" value="Revision Notes (Optional)" />
                                <textarea
                                    id="revision_notes"
                                    value={data.revision_notes}
                                    onChange={(e) => setData('revision_notes', e.target.value)}
                                    rows={2}
                                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    placeholder="Describe what changed in this revision..."
                                />
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    If you modify the content, a new revision will be created automatically.
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end space-x-4">
                            <Link
                                href={route('policies.show', policy.id)}
                                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50"
                            >
                                <Save className="w-5 h-5 mr-2" />
                                {processing ? 'Updating...' : 'Update Policy'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

