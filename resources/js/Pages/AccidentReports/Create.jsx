import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SearchableMultiSelect from '@/Components/SearchableMultiSelect';
import { AlertTriangle, Upload, X, ArrowLeft } from 'lucide-react';

export default function Create({ auth, users, students }) {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        incident_date: '',
        incident_time: '',
        location: '',
        incident_type: '',
        severity: '',
        people_involved: [],
        description: '',
        immediate_action_taken: '',
        witnesses: [],
        medical_attention_required: false,
        medical_facility: '',
        medical_notes: '',
        parent_notified: false,
        parent_notified_at: '',
        parent_notification_method: '',
        follow_up_required: false,
        follow_up_notes: '',
        follow_up_date: '',
        attachments: [],
    });

    const [selectedFiles, setSelectedFiles] = useState([]);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (key === 'attachments') {
                selectedFiles.forEach(file => {
                    formData.append('attachments[]', file);
                });
            } else if (Array.isArray(data[key])) {
                data[key].forEach(item => {
                    formData.append(`${key}[]`, item);
                });
            } else {
                formData.append(key, data[key]);
            }
        });

        post(route('accident-reports.store'), {
            data: formData,
            forceFormData: true,
        });
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles(prev => [...prev, ...files]);
    };

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const togglePerson = (personId) => {
        setData('people_involved', 
            data.people_involved.includes(personId)
                ? data.people_involved.filter(id => id !== personId)
                : [...data.people_involved, personId]
        );
    };

    const toggleWitness = (personId) => {
        setData('witnesses', 
            data.witnesses.includes(personId)
                ? data.witnesses.filter(id => id !== personId)
                : [...data.witnesses, personId]
        );
    };

    // Combine users and students for selection
    const allPeople = [
        ...users.map(u => ({
            id: u.id,
            name: u.name,
            type: 'staff',
            role: u.role,
            email: u.email
        })),
        ...students.map(s => ({
            id: s.id,
            name: s.name || `${s.first_name} ${s.last_name}`,
            type: 'student',
            grade: s.grade?.name || s.grade,
            admission_number: s.admission_number
        })),
    ];

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Create Accident Report" />

            <div className="py-6">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6">
                        <button
                            onClick={() => router.visit(route('accident-reports.index'))}
                            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Back to Reports
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Create Accident Report
                        </h1>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Document an accident or injury incident
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Information */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Incident Details
                            </h2>
                            <div className="grid grid-cols-1 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Report Title <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.title}
                                        onChange={e => setData('title', e.target.value)}
                                        placeholder="e.g., Student fell on playground"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                        required
                                    />
                                    {errors.title && (
                                        <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Incident Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={data.incident_date}
                                        onChange={e => setData('incident_date', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                        required
                                    />
                                    {errors.incident_date && (
                                        <p className="mt-1 text-sm text-red-600">{errors.incident_date}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Incident Time <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="time"
                                        value={data.incident_time}
                                        onChange={e => setData('incident_time', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                        required
                                    />
                                    {errors.incident_time && (
                                        <p className="mt-1 text-sm text-red-600">{errors.incident_time}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Location <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.location}
                                        onChange={e => setData('location', e.target.value)}
                                        placeholder="e.g., Playground, Classroom 3A, Cafeteria"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                        required
                                    />
                                    {errors.location && (
                                        <p className="mt-1 text-sm text-red-600">{errors.location}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Incident Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={data.incident_type}
                                        onChange={e => setData('incident_type', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                        required
                                    >
                                        <option value="">Select type...</option>
                                        <option value="fall">Fall</option>
                                        <option value="collision">Collision</option>
                                        <option value="cut">Cut/Laceration</option>
                                        <option value="burn">Burn</option>
                                        <option value="sports_injury">Sports Injury</option>
                                        <option value="playground_injury">Playground Injury</option>
                                        <option value="medical_emergency">Medical Emergency</option>
                                        <option value="other">Other</option>
                                    </select>
                                    {errors.incident_type && (
                                        <p className="mt-1 text-sm text-red-600">{errors.incident_type}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Severity <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={data.severity}
                                        onChange={e => setData('severity', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                        required
                                    >
                                        <option value="">Select severity...</option>
                                        <option value="minor">Minor - First aid only</option>
                                        <option value="moderate">Moderate - Medical attention advised</option>
                                        <option value="severe">Severe - Medical attention required</option>
                                        <option value="critical">Critical - Emergency response</option>
                                    </select>
                                    {errors.severity && (
                                        <p className="mt-1 text-sm text-red-600">{errors.severity}</p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    rows={4}
                                    placeholder="Describe what happened in detail..."
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                    required
                                />
                                {errors.description && (
                                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                                )}
                            </div>

                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Immediate Action Taken <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={data.immediate_action_taken}
                                    onChange={e => setData('immediate_action_taken', e.target.value)}
                                    rows={3}
                                    placeholder="What actions were taken immediately after the incident?"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                    required
                                />
                                {errors.immediate_action_taken && (
                                    <p className="mt-1 text-sm text-red-600">{errors.immediate_action_taken}</p>
                                )}
                            </div>
                        </div>

                        {/* People Involved */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                            <SearchableMultiSelect
                                label="People Involved"
                                required
                                options={allPeople}
                                selected={data.people_involved}
                                onChange={(selected) => setData('people_involved', selected)}
                                placeholder="Search by name, ID, role, or grade..."
                                getOptionLabel={(person) => person.name}
                                getOptionSubLabel={(person) =>
                                    person.type === 'staff'
                                        ? `${person.role}${person.email ? ` - ${person.email}` : ''}`
                                        : `Student - ${person.grade}${person.admission_number ? ` (${person.admission_number})` : ''}`
                                }
                                getOptionId={(person) => person.id}
                                error={errors.people_involved}
                            />
                        </div>

                        {/* Witnesses */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                            <SearchableMultiSelect
                                label="Witnesses (Optional)"
                                options={allPeople}
                                selected={data.witnesses}
                                onChange={(selected) => setData('witnesses', selected)}
                                placeholder="Search by name, ID, role, or grade..."
                                getOptionLabel={(person) => person.name}
                                getOptionSubLabel={(person) =>
                                    person.type === 'staff'
                                        ? `${person.role}${person.email ? ` - ${person.email}` : ''}`
                                        : `Student - ${person.grade}${person.admission_number ? ` (${person.admission_number})` : ''}`
                                }
                                getOptionId={(person) => person.id}
                            />
                        </div>

                        {/* Medical Information */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Medical Information
                            </h2>
                            <div className="space-y-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={data.medical_attention_required}
                                        onChange={e => setData('medical_attention_required', e.target.checked)}
                                        className="mr-3 rounded text-orange-600 focus:ring-orange-500"
                                    />
                                    <span className="text-gray-900 dark:text-white">Medical attention required</span>
                                </label>

                                {data.medical_attention_required && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Medical Facility
                                            </label>
                                            <input
                                                type="text"
                                                value={data.medical_facility}
                                                onChange={e => setData('medical_facility', e.target.value)}
                                                placeholder="e.g., School Nurse, City Hospital"
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Medical Notes
                                            </label>
                                            <textarea
                                                value={data.medical_notes}
                                                onChange={e => setData('medical_notes', e.target.value)}
                                                rows={3}
                                                placeholder="Treatment provided, diagnosis, recommendations..."
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Parent Notification */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Parent/Guardian Notification
                            </h2>
                            <div className="space-y-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={data.parent_notified}
                                        onChange={e => setData('parent_notified', e.target.checked)}
                                        className="mr-3 rounded text-orange-600 focus:ring-orange-500"
                                    />
                                    <span className="text-gray-900 dark:text-white">Parent/Guardian notified</span>
                                </label>

                                {data.parent_notified && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Notification Date & Time
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={data.parent_notified_at}
                                                onChange={e => setData('parent_notified_at', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Notification Method
                                            </label>
                                            <select
                                                value={data.parent_notification_method}
                                                onChange={e => setData('parent_notification_method', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                            >
                                                <option value="">Select method...</option>
                                                <option value="phone">Phone Call</option>
                                                <option value="email">Email</option>
                                                <option value="sms">SMS</option>
                                                <option value="in_person">In Person</option>
                                            </select>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Follow-up */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Follow-up
                            </h2>
                            <div className="space-y-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={data.follow_up_required}
                                        onChange={e => setData('follow_up_required', e.target.checked)}
                                        className="mr-3 rounded text-orange-600 focus:ring-orange-500"
                                    />
                                    <span className="text-gray-900 dark:text-white">Follow-up required</span>
                                </label>

                                {data.follow_up_required && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Follow-up Date
                                            </label>
                                            <input
                                                type="date"
                                                value={data.follow_up_date}
                                                onChange={e => setData('follow_up_date', e.target.value)}
                                                min={new Date().toISOString().split('T')[0]}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Follow-up Notes
                                            </label>
                                            <textarea
                                                value={data.follow_up_notes}
                                                onChange={e => setData('follow_up_notes', e.target.value)}
                                                rows={3}
                                                placeholder="What follow-up actions are needed?"
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Attachments */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Attachments (Optional)
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Upload photos, documents, or other relevant files (max 5MB each)
                            </p>
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <label className="cursor-pointer">
                                    <span className="text-orange-600 hover:text-orange-700 font-medium">
                                        Click to upload
                                    </span>
                                    <input
                                        type="file"
                                        multiple
                                        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </label>
                                <p className="text-sm text-gray-500 mt-1">
                                    JPG, PNG, PDF, DOC up to 5MB
                                </p>
                            </div>

                            {selectedFiles.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    {selectedFiles.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <span className="text-sm text-gray-900 dark:text-white truncate">
                                                {file.name}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeFile(index)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => router.visit(route('accident-reports.index'))}
                                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition disabled:opacity-50"
                            >
                                {processing ? 'Creating...' : 'Create Report'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

