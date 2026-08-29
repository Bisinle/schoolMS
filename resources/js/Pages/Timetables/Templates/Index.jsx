import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Eye, Edit, Trash2, Calendar, Clock, CheckCircle, Archive, RefreshCw, Send, ArchiveRestore } from 'lucide-react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import PasswordConfirmationModal from '@/Components/PasswordConfirmationModal';
import useFilters from '@/Hooks/useFilters';
import { SearchInput, FilterSelect, FilterBar } from '@/Components/Filters';
import { Badge } from '@/Components/UI';
import usePermissions from '@/Hooks/usePermissions';

export default function TimetableTemplatesIndex({ templates, grades, streams, filters: initialFilters = {}, auth }) {
    const { can } = usePermissions();
    // Use the new useFilters hook
    const { filters, updateFilter, clearFilters } = useFilters({
        route: '/timetables/templates',
        initialFilters: {
            search: initialFilters.search || '',
            grade_id: initialFilters.grade_id || '',
            stream_id: initialFilters.stream_id || '',
            status: initialFilters.status || '',
        },
    });

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [showArchiveModal, setShowArchiveModal] = useState(false);
    const [showUnarchiveModal, setShowUnarchiveModal] = useState(false);
    const [showDeleteArchivedModal, setShowDeleteArchivedModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [passwordError, setPasswordError] = useState(null);

    const confirmDelete = (template) => {
        setSelectedTemplate(template);
        setShowDeleteModal(true);
    };

    const confirmPublish = (template) => {
        setSelectedTemplate(template);
        setShowPublishModal(true);
    };

    const confirmArchive = (template) => {
        setSelectedTemplate(template);
        setShowArchiveModal(true);
    };

    const confirmUnarchive = (template) => {
        setSelectedTemplate(template);
        setShowUnarchiveModal(true);
    };

    const confirmDeleteArchived = (template) => {
        setSelectedTemplate(template);
        setPasswordError(null);
        setShowDeleteArchivedModal(true);
    };

    const handleDelete = () => {
        if (selectedTemplate) {
            router.delete(route('timetables.templates.destroy', selectedTemplate.id), {
                onSuccess: () => {
                    setShowDeleteModal(false);
                    setSelectedTemplate(null);
                },
            });
        }
    };

    const handlePublish = () => {
        if (selectedTemplate) {
            router.post(route('timetables.templates.publish', selectedTemplate.id), {}, {
                onSuccess: () => {
                    setShowPublishModal(false);
                    setSelectedTemplate(null);
                },
            });
        }
    };

    const handleArchive = () => {
        if (selectedTemplate) {
            router.post(route('timetables.templates.archive', selectedTemplate.id), {}, {
                onSuccess: () => {
                    setShowArchiveModal(false);
                    setSelectedTemplate(null);
                },
            });
        }
    };

    const handleUnarchive = () => {
        if (selectedTemplate) {
            router.post(route('timetables.templates.unarchive', selectedTemplate.id), {}, {
                onSuccess: () => {
                    setShowUnarchiveModal(false);
                    setSelectedTemplate(null);
                },
            });
        }
    };

    const handleDeleteArchived = (password) => {
        if (selectedTemplate) {
            router.delete(route('timetables.templates.delete-archived', selectedTemplate.id), {
                data: { password },
                onSuccess: () => {
                    setShowDeleteArchivedModal(false);
                    setSelectedTemplate(null);
                    setPasswordError(null);
                },
                onError: (errors) => {
                    setPasswordError(errors.password || 'An error occurred. Please try again.');
                },
            });
        }
    };

    const getStatusBadgeColor = (status) => {
        const colors = {
            'draft': 'bg-gray-100 text-gray-800',
            'published': 'bg-green-100 text-green-800',
            'archived': 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <AuthenticatedLayout header="Timetable Templates">
            <Head title="Timetable Templates" />

            <div className="space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex items-center space-x-3">
                        <Calendar className="w-8 h-8 text-orange" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Timetable Templates</h2>
                            <p className="text-sm text-gray-600">
                                Manage timetable templates for different grades
                            </p>
                        </div>
                    </div>

                    {can('timetable-templates.manage') && (
                        <Link
                            href={route('timetables.templates.create')}
                            className="inline-flex items-center px-6 py-3 bg-orange text-white rounded-lg hover:bg-orange-dark transition-colors shadow-md hover:shadow-lg"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Create Template
                        </Link>
                    )}
                </div>

                {/* Filters */}
                <FilterBar onClear={clearFilters} gridCols="4">
                    <SearchInput
                        value={filters.search}
                        onChange={(e) => updateFilter('search', e.target.value)}
                        placeholder="Search templates..."
                    />
                    <FilterSelect
                        value={filters.grade_id}
                        onChange={(e) => updateFilter('grade_id', e.target.value)}
                        options={grades.map(grade => ({ value: grade.id, label: grade.name }))}
                        allLabel="All Grades"
                        hideLabel
                    />
                    <FilterSelect
                        value={filters.stream_id}
                        onChange={(e) => updateFilter('stream_id', e.target.value)}
                        options={streams?.map(stream => ({ value: stream.id, label: stream.name })) || []}
                        allLabel="All Streams"
                        hideLabel
                    />
                    <FilterSelect
                        value={filters.status}
                        onChange={(e) => updateFilter('status', e.target.value)}
                        options={[
                            { value: 'draft', label: 'Draft' },
                            { value: 'published', label: 'Published' },
                            { value: 'archived', label: 'Archived' }
                        ]}
                        allLabel="All Statuses"
                        hideLabel
                    />
                </FilterBar>

                {/* Templates Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
                    {templates.data && templates.data.length > 0 ? (
                        templates.data.map((template) => (
                            <div
                                key={template.id}
                                className={`rounded-xl border-2 overflow-hidden transition-all duration-300 ${
                                    template.status === 'archived'
                                        ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-300 shadow-md hover:shadow-xl hover:border-red-400'
                                        : template.status === 'published'
                                        ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-300 shadow-md hover:shadow-xl hover:border-green-400'
                                        : 'bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-sm hover:shadow-lg hover:border-blue-300'
                                }`}
                            >
                                {/* Card Header */}
                                <div className={`p-4 md:p-5 border-b ${
                                    template.status === 'archived' ? 'border-red-200/60' : template.status === 'published' ? 'border-green-200/60' : 'border-gray-200/60'
                                }`}>
                                    <div className="flex items-start justify-between mb-2.5">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1.5 truncate">
                                                {template.name}
                                            </h3>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100/80 text-blue-600 border border-blue-200/50">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    {template.grade?.name}
                                                    {template.stream && ` ${template.stream.name}`}
                                                </span>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100/80 text-purple-600 border border-purple-200/50">
                                                    {template.academic_term?.name}
                                                </span>
                                            </div>
                                        </div>
                                        <Badge
                                            variant="status"
                                            value={template.status}
                                            size="sm"
                                        />
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-3 text-sm flex-wrap mt-3">
                                        <div className="flex items-center text-blue-600 bg-blue-50/80 px-2.5 py-1 rounded border border-blue-200/50">
                                            <Clock className="w-3.5 h-3.5 mr-1.5" />
                                            <span className="font-semibold text-xs md:text-sm">
                                                {template.slots_count || 0}
                                            </span>
                                            <span className="ml-1 text-xs font-medium hidden sm:inline">
                                                slot{template.slots_count !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        {template.effective_from && (
                                            <div className="flex items-center text-gray-600 text-xs">
                                                <span className="font-medium">From:</span>
                                                <span className="ml-1">{new Date(template.effective_from).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="p-3 md:p-4">
                                    {/* Actions */}
                                    <div className="flex gap-2 flex-wrap">
                                        <Link
                                            href={`/timetables/templates/${template.id}`}
                                            className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs md:text-sm font-medium text-blue-600 bg-blue-50/80 border border-blue-200/50 rounded hover:bg-blue-100 transition-colors"
                                        >
                                            <Eye className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5" />
                                            <span className="hidden sm:inline">View</span>
                                        </Link>
                                        {can('timetable-templates.manage') && (
                                            <>
                                                {template.status === 'draft' && (
                                                    <>
                                                        <Link
                                                            href={`/timetables/templates/${template.id}/edit`}
                                                            className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs md:text-sm font-medium text-orange bg-orange-50/80 border border-orange-200/50 rounded hover:bg-orange-100 transition-colors"
                                                        >
                                                            <Edit className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5" />
                                                            <span className="hidden sm:inline">Edit</span>
                                                        </Link>
                                                        <button
                                                            onClick={() => confirmPublish(template)}
                                                            className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs md:text-sm font-medium text-green-600 bg-green-50/80 border border-green-200/50 rounded hover:bg-green-100 transition-colors"
                                                        >
                                                            <Send className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5" />
                                                            <span className="hidden sm:inline">Publish</span>
                                                        </button>
                                                    </>
                                                )}
                                                {template.status === 'published' && (
                                                    <button
                                                        onClick={() => confirmArchive(template)}
                                                        className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs md:text-sm font-medium text-red-600 bg-red-50/80 border border-red-200/50 rounded hover:bg-red-100 transition-colors"
                                                    >
                                                        <Archive className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5" />
                                                        <span className="hidden sm:inline">Archive</span>
                                                    </button>
                                                )}
                                                {template.status === 'archived' && (
                                                    <>
                                                        <button
                                                            onClick={() => confirmUnarchive(template)}
                                                            className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs md:text-sm font-medium text-green-600 bg-green-50/80 border border-green-200/50 rounded hover:bg-green-100 transition-colors"
                                                        >
                                                            <ArchiveRestore className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5" />
                                                            <span className="hidden sm:inline">Unarchive</span>
                                                        </button>
                                                        <button
                                                            onClick={() => confirmDeleteArchived(template)}
                                                            className="inline-flex items-center justify-center px-3 py-2 text-xs md:text-sm font-medium text-red-600 bg-red-50/80 border border-red-200/50 rounded hover:bg-red-100 transition-colors"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                                        </button>
                                                    </>
                                                )}
                                                {template.status === 'draft' && (
                                                    <button
                                                        onClick={() => confirmDelete(template)}
                                                        className="inline-flex items-center justify-center px-3 py-2 text-xs md:text-sm font-medium text-red-600 bg-red-50/80 border border-red-200/50 rounded hover:bg-red-100 transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                                <p className="text-gray-600 mb-6">
                                    {filters.search || filters.grade_id || filters.status ? 'Try adjusting your filters' : 'Get started by creating your first timetable template'}
                                </p>
                                {can('timetable-templates.manage') && !filters.search && !filters.grade_id && !filters.status && (
                                    <Link
                                        href={route('timetables.templates.create')}
                                        className="inline-flex items-center px-6 py-3 bg-orange text-white text-sm font-medium rounded-lg hover:bg-orange-dark transition-colors"
                                    >
                                        <Plus className="w-5 h-5 mr-2" />
                                        Create First Template
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Template"
                message={
                    <div className="space-y-3">
                        <p>Are you sure you want to delete <strong>{selectedTemplate?.name}</strong>?</p>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4">
                            <p className="text-xs md:text-sm text-red-800">
                                ⚠️ This action cannot be undone. All timetable slots will be permanently deleted.
                            </p>
                        </div>
                    </div>
                }
                confirmText="Delete Template"
                type="danger"
            />

            {/* Publish Confirmation Modal */}
            <ConfirmationModal
                show={showPublishModal}
                onClose={() => setShowPublishModal(false)}
                onConfirm={handlePublish}
                title="Publish Template"
                message={
                    <div className="space-y-3">
                        <p>Are you sure you want to publish <strong>{selectedTemplate?.name}</strong>?</p>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 md:p-4">
                            <p className="text-xs md:text-sm text-green-800">
                                ✓ This will make the timetable visible to teachers and students.
                            </p>
                        </div>
                    </div>
                }
                confirmText="Publish Template"
                type="success"
            />

            {/* Archive Confirmation Modal */}
            <ConfirmationModal
                show={showArchiveModal}
                onClose={() => setShowArchiveModal(false)}
                onConfirm={handleArchive}
                title="Archive Template"
                message={
                    <div className="space-y-3">
                        <p>Are you sure you want to archive <strong>{selectedTemplate?.name}</strong>?</p>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 md:p-4">
                            <p className="text-xs md:text-sm text-yellow-800">
                                ⚠️ This will hide the timetable from active use but preserve all data.
                            </p>
                        </div>
                    </div>
                }
                confirmText="Archive Template"
                type="warning"
            />

            {/* Unarchive Confirmation Modal */}
            <ConfirmationModal
                show={showUnarchiveModal}
                onClose={() => setShowUnarchiveModal(false)}
                onConfirm={handleUnarchive}
                title="Unarchive Template"
                message={
                    <div className="space-y-3">
                        <p>Are you sure you want to unarchive <strong>{selectedTemplate?.name}</strong>?</p>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 md:p-4">
                            <p className="text-xs md:text-sm text-green-800">
                                ✓ This will restore the template to draft status. You can then edit and publish it again.
                            </p>
                        </div>
                    </div>
                }
                confirmText="Unarchive Template"
                type="success"
            />

            {/* Delete Archived Template with Password Confirmation Modal */}
            <PasswordConfirmationModal
                show={showDeleteArchivedModal}
                onClose={() => {
                    setShowDeleteArchivedModal(false);
                    setPasswordError(null);
                }}
                onConfirm={handleDeleteArchived}
                title="Delete Archived Template"
                message={
                    <div className="space-y-3">
                        <p>Are you sure you want to permanently delete <strong>{selectedTemplate?.name}</strong>?</p>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4">
                            <p className="text-xs md:text-sm text-red-800 font-semibold">
                                ⚠️ WARNING: This action cannot be undone!
                            </p>
                            <p className="text-xs md:text-sm text-red-800 mt-2">
                                All timetable slots and associated data will be permanently deleted.
                            </p>
                        </div>
                    </div>
                }
                confirmText="Delete Permanently"
                type="danger"
                error={passwordError}
            />
        </AuthenticatedLayout>
    );
}


