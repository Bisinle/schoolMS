import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SearchableMultiSelect from '@/Components/SearchableMultiSelect';
import { AlertOctagon, Upload, X, ArrowLeft } from 'lucide-react';

export default function Edit({ auth, students, staff, report }) {
    const { data, setData, post, processing, errors } = useForm({
        title: report.title || '',
        incident_date: report.incident_date || '', // Already formatted by controller as YYYY-MM-DD
        incident_time: report.incident_time ? report.incident_time.substring(0, 5) : '', // Strip seconds (HH:MM:SS -> HH:MM)
        location: report.location || '',
        incident_type: report.incident_type || '',
        severity: report.severity || '',
        students_involved: (report.students_involved || []).map(id => Number(id)), // Convert to numbers
        staff_involved: (report.staff_involved || []).map(id => Number(id)), // Convert to numbers
        description: report.description || '',
        action_taken: report.action_taken || '',
        witnesses: report.witnesses || '',
        disciplinary_action: report.disciplinary_action || '',
        parent_contacted: report.parent_contacted || false,
        parent_contacted_at: report.parent_contacted_at || '', // Already formatted by controller as YYYY-MM-DDTHH:MM
        parent_contact_method: report.parent_contact_method || '',
        police_involved: report.police_involved || false,
        police_report_number: report.police_report_number || '',
        follow_up_required: report.follow_up_required || false,
        follow_up_notes: report.follow_up_notes || '',
        _method: 'PUT',
    });

    const [selectedFiles, setSelectedFiles] = useState([]);
    const [existingAttachments, setExistingAttachments] = useState(report.attachments || []);

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
            } else if (key === 'incident_time' && data[key]) {
                // Ensure time is in H:i format (remove seconds if present)
                const timeValue = data[key].substring(0, 5); // Get only HH:MM
                formData.append(key, timeValue);
            } else {
                formData.append(key, data[key]);
            }
        });

        // Add existing attachments to keep
        existingAttachments.forEach(attachment => {
            formData.append('existing_attachments[]', attachment);
        });

        post(route('incident-reports.update', report.id), {
            data: formData,
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles(prev => [...prev, ...files]);
    };

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingAttachment = (index) => {
        setExistingAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleStudentToggle = (studentId) => {
        setData('students_involved', 
            data.students_involved.includes(studentId)
                ? data.students_involved.filter(id => id !== studentId)
                : [...data.students_involved, studentId]
        );
    };

    const handleStaffToggle = (staffId) => {
        setData('staff_involved', 
            data.staff_involved.includes(staffId)
                ? data.staff_involved.filter(id => id !== staffId)
                : [...data.staff_involved, staffId]
        );
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Edit Incident Report" />

            <div className="py-6 sm:py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6">
                        <button
                            onClick={() => router.visit(route('incident-reports.show', report.id))}
                            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Report Details
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                                <AlertOctagon className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                    Edit Incident Report
                                </h1>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {report.report_number}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-6">
                        {/* Incident Details */}
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Incident Details
                            </h2>
                            <div className="space-y-4">
                                {/* Title Field - Full Width */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Incident Title <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.title}
                                        onChange={e => setData('title', e.target.value)}
                                        placeholder="Brief description of the incident (e.g., 'Student fight in cafeteria', 'Vandalism in bathroom')"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                        required
                                    />
                                    {errors.title && (
                                        <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
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
                                        placeholder="e.g., Classroom 3A, Playground, Cafeteria"
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
                                        <option value="">Select Type</option>
                                        <option value="bullying">Bullying</option>
                                        <option value="fighting">Fighting</option>
                                        <option value="theft">Theft</option>
                                        <option value="vandalism">Vandalism</option>
                                        <option value="disrespect">Disrespect</option>
                                        <option value="cheating">Cheating</option>
                                        <option value="truancy">Truancy</option>
                                        <option value="substance_abuse">Substance Abuse</option>
                                        <option value="weapons">Weapons</option>
                                        <option value="harassment">Harassment</option>
                                        <option value="cut_laceration">Cut/Laceration</option>
                                        <option value="broken_bones">Broken Bones</option>
                                        <option value="head_injury">Head Injury</option>
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
                                        <option value="">Select Severity</option>
                                        <option value="minor">Minor</option>
                                        <option value="moderate">Moderate</option>
                                        <option value="severe">Severe</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                    {errors.severity && (
                                        <p className="mt-1 text-sm text-red-600">{errors.severity}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Students Involved */}
                        <div>
                            <SearchableMultiSelect
                                label="Students Involved"
                                required
                                options={students.map(s => ({
                                    id: s.id,
                                    name: s.name || `${s.first_name} ${s.last_name}`,
                                    type: 'student',
                                    grade: s.grade?.name || s.grade || 'No Grade',
                                    admission_number: s.admission_number
                                }))}
                                selected={data.students_involved}
                                onChange={(selected) => setData('students_involved', selected)}
                                placeholder="Search by name, admission number, or grade..."
                                getOptionLabel={(student) => student.name}
                                getOptionSubLabel={(student) =>
                                    `Student - ${student.grade}${student.admission_number ? ` (${student.admission_number})` : ''}`
                                }
                                getOptionId={(student) => student.id}
                                error={errors.students_involved}
                            />
                        </div>

                        {/* Staff Involved (Optional) */}
                        <div>
                            <SearchableMultiSelect
                                label="Staff Involved (Optional)"
                                options={staff.map(s => ({
                                    id: s.id,
                                    name: s.name,
                                    type: 'staff',
                                    role: s.role,
                                    email: s.email
                                }))}
                                selected={data.staff_involved}
                                onChange={(selected) => setData('staff_involved', selected)}
                                placeholder="Search by name, email, or role..."
                                getOptionLabel={(staffMember) => staffMember.name}
                                getOptionSubLabel={(staffMember) =>
                                    `${staffMember.role}${staffMember.email ? ` - ${staffMember.email}` : ''}`
                                }
                                getOptionId={(staffMember) => staffMember.id}
                                error={errors.staff_involved}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={data.description}
                                onChange={e => setData('description', e.target.value)}
                                rows={4}
                                placeholder="Provide a detailed description of what happened..."
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                required
                            />
                            {errors.description && (
                                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                            )}
                        </div>

                        {/* Action Taken */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Immediate Action Taken <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={data.action_taken}
                                onChange={e => setData('action_taken', e.target.value)}
                                rows={3}
                                placeholder="Describe the immediate actions taken..."
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                required
                            />
                            {errors.action_taken && (
                                <p className="mt-1 text-sm text-red-600">{errors.action_taken}</p>
                            )}
                        </div>

                        {/* Witnesses */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Witnesses (Optional)
                            </label>
                            <textarea
                                value={data.witnesses}
                                onChange={e => setData('witnesses', e.target.value)}
                                rows={2}
                                placeholder="List any witnesses..."
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                            />
                            {errors.witnesses && (
                                <p className="mt-1 text-sm text-red-600">{errors.witnesses}</p>
                            )}
                        </div>

                        {/* Disciplinary Action */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Disciplinary Action (Optional)
                            </label>
                            <textarea
                                value={data.disciplinary_action}
                                onChange={e => setData('disciplinary_action', e.target.value)}
                                rows={3}
                                placeholder="Describe any disciplinary actions taken..."
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                            />
                            {errors.disciplinary_action && (
                                <p className="mt-1 text-sm text-red-600">{errors.disciplinary_action}</p>
                            )}
                        </div>

                        {/* Parent Contact */}
                        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                            <label className="flex items-center space-x-2 cursor-pointer mb-4">
                                <input
                                    type="checkbox"
                                    checked={data.parent_contacted}
                                    onChange={e => setData('parent_contacted', e.target.checked)}
                                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Parent/Guardian Contacted
                                </span>
                            </label>

                            {data.parent_contacted && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Contact Date & Time
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={data.parent_contacted_at}
                                            onChange={e => setData('parent_contacted_at', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Contact Method
                                        </label>
                                        <input
                                            type="text"
                                            value={data.parent_contact_method}
                                            onChange={e => setData('parent_contact_method', e.target.value)}
                                            placeholder="e.g., Phone call, Email, In-person"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Police Involvement */}
                        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                            <label className="flex items-center space-x-2 cursor-pointer mb-4">
                                <input
                                    type="checkbox"
                                    checked={data.police_involved}
                                    onChange={e => setData('police_involved', e.target.checked)}
                                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Police Involved
                                </span>
                            </label>

                            {data.police_involved && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Police Report Number
                                    </label>
                                    <input
                                        type="text"
                                        value={data.police_report_number}
                                        onChange={e => setData('police_report_number', e.target.value)}
                                        placeholder="Enter police report number"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Follow-up */}
                        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                            <label className="flex items-center space-x-2 cursor-pointer mb-4">
                                <input
                                    type="checkbox"
                                    checked={data.follow_up_required}
                                    onChange={e => setData('follow_up_required', e.target.checked)}
                                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Follow-up Required
                                </span>
                            </label>

                            {data.follow_up_required && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Follow-up Notes
                                    </label>
                                    <textarea
                                        value={data.follow_up_notes}
                                        onChange={e => setData('follow_up_notes', e.target.value)}
                                        rows={3}
                                        placeholder="Describe what follow-up actions are needed..."
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Attachments */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Attachments (Photos, Documents)
                            </label>

                            {/* Existing Attachments */}
                            {existingAttachments.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Current Attachments:</p>
                                    <div className="space-y-2">
                                        {existingAttachments.map((attachment, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                                <span className="text-sm text-gray-700 dark:text-gray-300">{attachment}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeExistingAttachment(index)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* New File Upload */}
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="file-upload"
                                    accept="image/*,.pdf,.doc,.docx"
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="flex flex-col items-center cursor-pointer"
                                >
                                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        Click to upload new files
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                        Images, PDF, Word documents (Max 10MB each)
                                    </span>
                                </label>
                            </div>

                            {/* New Files Preview */}
                            {selectedFiles.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">New Files to Upload:</p>
                                    {selectedFiles.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                            <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeFile(index)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {errors.attachments && (
                                <p className="mt-1 text-sm text-red-600">{errors.attachments}</p>
                            )}
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50"
                            >
                                {processing ? 'Updating...' : 'Update Report'}
                            </button>
                            <button
                                type="button"
                                onClick={() => router.visit(route('incident-reports.show', report.id))}
                                className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-2 px-4 rounded-lg"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

