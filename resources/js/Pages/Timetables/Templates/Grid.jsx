import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Calendar, ArrowLeft, Printer, Download, Edit, AlertTriangle, Filter, Copy, Trash2, RefreshCw, X, CheckCircle, XCircle, Sparkles, Users } from 'lucide-react';
import TimetableGrid from '@/Components/Timetable/TimetableGrid';
import BulkTeacherChangeModal from '@/Components/Timetable/BulkTeacherChangeModal';
import ConfirmationModal from '@/Components/ConfirmationModal';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function TimetableGridView({ template, slots, periods, conflicts, subjects, teachers, classTeacher, generationValidation, priorityStats, priorityRecommendations, auth }) {
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [showConflicts, setShowConflicts] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [filterDay, setFilterDay] = useState('all');
    const [filterTeacher, setFilterTeacher] = useState('all');
    const [selectedSlots, setSelectedSlots] = useState([]);
    const [showBulkChangeModal, setShowBulkChangeModal] = useState(false);
    const [showValidationErrors, setShowValidationErrors] = useState(true);

    // Confirmation modal states
    const [confirmModal, setConfirmModal] = useState({
        show: false,
        title: '',
        message: '',
        type: 'warning',
        onConfirm: () => {},
    });

    // ============================================
    // LAYER 1: FRONTEND VALIDATION
    // ============================================
    // Use validation prop passed from controller
    // This provides immediate feedback without API calls
    const validation = generationValidation || { can_generate: false, errors: [], warnings: [] };
    const canGenerate = validation.can_generate;

    const handleSlotClick = (slot, day, period) => {
        if (slot) {
            // Edit existing slot
            router.visit(route('timetables.slots.edit', slot.id));
        } else {
            // Create new slot
            router.visit(route('timetables.slots.create', {
                template_id: template.id,
                day_of_week: day,
                period_id: period.id
            }));
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExport = () => {
        setConfirmModal({
            show: true,
            title: 'Export Coming Soon',
            message: 'Export functionality is currently under development and will be available soon.',
            type: 'info',
            onConfirm: () => setConfirmModal({ ...confirmModal, show: false }),
        });
    };

    const handleGenerate = () => {
        setConfirmModal({
            show: true,
            title: 'Generate Weekly Timetable',
            message: 'This will create slots for all periods across the week based on your blueprint. Continue?',
            type: 'warning',
            onConfirm: () => {
                router.post(route('timetables.templates.generate', template.id));
                setConfirmModal({ ...confirmModal, show: false });
            },
        });
    };

    const handleRegenerate = () => {
        setConfirmModal({
            show: true,
            title: 'Regenerate Timetable',
            message: 'This will delete all auto-generated slots and recreate them. Manual edits will be preserved. Are you sure?',
            type: 'danger',
            onConfirm: () => {
                router.post(route('timetables.templates.regenerate', template.id));
                setConfirmModal({ ...confirmModal, show: false });
            },
        });
    };

    const getStatusColor = (status) => {
        const colors = {
            draft: 'bg-gray-100 text-gray-800',
            published: 'bg-green-100 text-green-800',
            archived: 'bg-red-100 text-red-800',
        };
        return colors[status] || colors.draft;
    };

    return (
        <AuthenticatedLayout header="Timetable Grid View">
            <Head title={`Grid View: ${template.name}`} />

            <div className="max-w-[1600px] mx-auto space-y-6">
                {/* ============================================ */}
                {/* LAYER 1: FRONTEND VALIDATION FEEDBACK       */}
                {/* ============================================ */}
                {/* Show validation errors if generation not possible */}
                {slots.length === 0 && !canGenerate && validation.errors && validation.errors.length > 0 && showValidationErrors && (
                    <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 sm:p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start">
                                <XCircle className="w-6 h-6 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-red-900 mb-2">
                                        Cannot Generate Timetable for {template.grade?.name}
                                    </h3>
                                    <p className="text-sm font-semibold text-red-800 mb-3">
                                        Missing Requirements:
                                    </p>
                                    <ul className="space-y-3 text-sm text-red-800">
                                        {validation.errors.map((error, idx) => (
                                            <li key={idx} className="flex flex-col">
                                                <div className="flex items-start">
                                                    <span className="text-red-600 mr-2 flex-shrink-0">❌</span>
                                                    <span className="flex-1 font-medium">
                                                        {typeof error === 'object' ? error.message : error}
                                                    </span>
                                                </div>
                                                {typeof error === 'object' && error.action && (
                                                    <div className="ml-6 mt-1">
                                                        <span className="text-red-700 italic">→ {error.action}</span>
                                                        {(error.type === 'class_teacher' || error.type === 'default_room') && (
                                                            <Link
                                                                href={route('grades.edit', template.grade?.id)}
                                                                className="ml-2 inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                                                            >
                                                                Fix Now →
                                                            </Link>
                                                        )}
                                                        {error.type === 'subjects' && (
                                                            <Link
                                                                href={route('grades.subjects.index', template.grade?.id)}
                                                                className="ml-2 inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                                                            >
                                                                Fix Now →
                                                            </Link>
                                                        )}
                                                        {error.type === 'curriculum_rules' && (
                                                            <Link
                                                                href={route('grades.subjects.index', template.grade?.id)}
                                                                className="ml-2 inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                                                            >
                                                                Configure Subjects →
                                                            </Link>
                                                        )}
                                                        {error.type === 'blueprint' && (
                                                            <Link
                                                                href={route('blueprints.index')}
                                                                className="ml-2 inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                                                            >
                                                                Create Blueprint →
                                                            </Link>
                                                        )}
                                                        {error.type === 'periods' && (
                                                            <Link
                                                                href={route('blueprints.index')}
                                                                className="ml-2 inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                                                            >
                                                                Generate Periods →
                                                            </Link>
                                                        )}
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>

                                    {/* Show successes (what's already configured) */}
                                    {validation.successes && validation.successes.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-red-200">
                                            <p className="text-sm font-semibold text-green-800 mb-2">
                                                Already Configured:
                                            </p>
                                            <ul className="space-y-1 text-sm text-green-700">
                                                {validation.successes.map((success, idx) => (
                                                    <li key={idx} className="flex items-start">
                                                        <span className="text-green-600 mr-2">✅</span>
                                                        <span>{success}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => setShowValidationErrors(false)}
                                className="text-red-600 hover:text-red-800"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Show warnings even if can generate */}
                {validation.warnings && validation.warnings.length > 0 && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4">
                        <div className="flex items-start">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                            <div className="flex-1">
                                <h4 className="font-semibold text-yellow-800 mb-2">Warnings</h4>
                                <ul className="space-y-2 text-sm text-yellow-800">
                                    {validation.warnings.map((warning, idx) => (
                                        <li key={idx} className="flex flex-col">
                                            <div className="flex items-start">
                                                <span className="text-yellow-600 mr-2 flex-shrink-0">⚠️</span>
                                                <span className="flex-1 font-medium">
                                                    {typeof warning === 'object' ? warning.message : warning}
                                                </span>
                                            </div>
                                            {typeof warning === 'object' && warning.action && (
                                                <div className="ml-6 mt-1">
                                                    <span className="text-yellow-700 italic">→ {warning.action}</span>
                                                    {warning.type === 'teacher_specializations' && warning.teacher_ids && warning.teacher_ids.length > 0 && (
                                                        <Link
                                                            href={route('teachers.edit', warning.teacher_ids[0])}
                                                            className="ml-2 inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-md transition-colors"
                                                        >
                                                            Edit Teacher →
                                                        </Link>
                                                    )}
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Calendar className="w-8 h-8 text-orange" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{template.name}</h2>
                            <p className="text-sm text-gray-600">
                                {template.grade?.name} - {template.academic_term?.name}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* ============================================ */}
                        {/* LAYER 1: VALIDATION-AWARE GENERATE BUTTON   */}
                        {/* ============================================ */}
                        {/* Generate/Regenerate Buttons */}
                        {slots.length === 0 ? (
                            <button
                                onClick={handleGenerate}
                                disabled={!canGenerate}
                                title={!canGenerate ? 'Fix validation errors before generating' : 'Generate timetable from blueprint'}
                                className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                    canGenerate
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Generate Timetable
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handleRegenerate}
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-orange rounded-lg hover:bg-orange-600"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Regenerate
                                </button>
                                {/* ✅ PHASE 4: Bulk Teacher Change Button */}
                                <button
                                    onClick={() => setShowBulkChangeModal(true)}
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                                >
                                    <Users className="w-4 h-4 mr-2" />
                                    Bulk Change Teachers
                                </button>
                            </>
                        )}

                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <Printer className="w-4 h-4 mr-2" />
                            Print
                        </button>
                        <button
                            onClick={handleExport}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </button>
                        <Link
                            href={route('timetables.templates.edit', template.id)}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-navy rounded-lg hover:bg-navy-light"
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Template
                        </Link>
                        <Link
                            href={route('timetables.templates.index')}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Link>
                    </div>
                </div>

                {/* Template Info */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div>
                                <p className="text-sm text-gray-600">Status</p>
                                <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(template.status)}`}>
                                    {template.status}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Effective From</p>
                                <p className="mt-1 font-medium text-gray-900">
                                    {new Date(template.effective_from).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Slots</p>
                                <p className="mt-1 font-medium text-gray-900">{slots.length}</p>
                            </div>
                        </div>
                        <div className="text-sm text-gray-600">
                            Click on any cell to add or edit a slot
                        </div>
                    </div>
                </div>

                {/* Conflict Resolution Panel */}
                {conflicts && conflicts.length > 0 && showConflicts && (
                    <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 sm:p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                                <div>
                                    <h3 className="text-lg font-bold text-red-900">
                                        {conflicts.length} Conflict{conflicts.length > 1 ? 's' : ''} Detected
                                    </h3>
                                    <p className="text-sm text-red-700">
                                        These conflicts need your attention
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowConflicts(false)}
                                className="text-red-600 hover:text-red-800"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {conflicts.map((conflict, index) => (
                                <div
                                    key={index}
                                    className={`bg-white rounded-lg p-4 border-2 ${
                                        conflict.severity === 'critical' || conflict.severity === 'error'
                                            ? 'border-red-300'
                                            : 'border-yellow-300'
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span
                                                    className={`px-2 py-1 rounded text-xs font-bold ${
                                                        conflict.severity === 'critical' || conflict.severity === 'error'
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                    }`}
                                                >
                                                    {conflict.severity?.toUpperCase() || 'WARNING'}
                                                </span>
                                                <span className="text-xs text-gray-600 capitalize">
                                                    {conflict.conflict_type?.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-900 font-medium mb-1">
                                                {conflict.message}
                                            </p>
                                            {conflict.details && (
                                                <p className="text-xs text-gray-600">
                                                    {conflict.details}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            <button
                                                onClick={() => {
                                                    // Navigate to edit the conflicting slot
                                                    if (conflict.slot_id) {
                                                        router.visit(route('timetables.slots.edit', conflict.slot_id));
                                                    }
                                                }}
                                                className="px-3 py-1 text-xs font-medium text-white bg-orange rounded hover:bg-orange-600"
                                            >
                                                Resolve
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Priority Allocation Stats */}
                {priorityStats && priorityStats.total_slots > 0 && (
                    <div className={`rounded-lg p-4 sm:p-6 border-l-4 ${
                        priorityStats.match_percentage >= 90 ? 'bg-green-50 border-green-500' :
                        priorityStats.match_percentage >= 70 ? 'bg-blue-50 border-blue-500' :
                        'bg-orange-50 border-orange-500'
                    }`}>
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <Sparkles className={`w-6 h-6 ${
                                    priorityStats.match_percentage >= 90 ? 'text-green-600' :
                                    priorityStats.match_percentage >= 70 ? 'text-blue-600' :
                                    'text-orange-600'
                                }`} />
                                <div>
                                    <h3 className={`text-lg font-bold ${
                                        priorityStats.match_percentage >= 90 ? 'text-green-900' :
                                        priorityStats.match_percentage >= 70 ? 'text-blue-900' :
                                        'text-orange-900'
                                    }`}>
                                        Priority Matching: {priorityStats.match_percentage}%
                                    </h3>
                                    <p className={`text-sm ${
                                        priorityStats.match_percentage >= 90 ? 'text-green-700' :
                                        priorityStats.match_percentage >= 70 ? 'text-blue-700' :
                                        'text-orange-700'
                                    }`}>
                                        {priorityStats.perfect_matches} perfect matches, {priorityStats.acceptable_matches} acceptable, {priorityStats.poor_matches} suboptimal
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Recommendations */}
                        {priorityRecommendations && priorityRecommendations.length > 0 && (
                            <div className="space-y-2">
                                {priorityRecommendations.map((rec, index) => (
                                    <div key={index} className={`p-3 rounded-lg ${
                                        rec.type === 'success' ? 'bg-green-100' :
                                        rec.type === 'warning' ? 'bg-orange-100' :
                                        'bg-blue-100'
                                    }`}>
                                        <p className={`text-sm font-medium ${
                                            rec.type === 'success' ? 'text-green-900' :
                                            rec.type === 'warning' ? 'text-orange-900' :
                                            'text-blue-900'
                                        }`}>
                                            {rec.message}
                                        </p>
                                        {rec.action && (
                                            <p className={`text-xs mt-1 ${
                                                rec.type === 'success' ? 'text-green-700' :
                                                rec.type === 'warning' ? 'text-orange-700' :
                                                'text-blue-700'
                                            }`}>
                                                💡 {rec.action}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Filters & Bulk Operations Bar */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                                    showFilters
                                        ? 'bg-orange text-white border-orange'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <Filter className="w-4 h-4 mr-2" />
                                Filters
                            </button>

                            {selectedSlots.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">
                                        {selectedSlots.length} selected
                                    </span>
                                    <button
                                        onClick={() => {
                                            setConfirmModal({
                                                show: true,
                                                title: 'Copy Slots',
                                                message: 'Copy functionality is currently under development and will be available soon.',
                                                type: 'info',
                                                onConfirm: () => setConfirmModal({ ...confirmModal, show: false }),
                                            });
                                        }}
                                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        <Copy className="w-3 h-3 mr-1" />
                                        Copy
                                    </button>
                                    <button
                                        onClick={() => {
                                            setConfirmModal({
                                                show: true,
                                                title: 'Delete Selected Slots',
                                                message: `Are you sure you want to delete ${selectedSlots.length} selected slot${selectedSlots.length > 1 ? 's' : ''}? This action cannot be undone.`,
                                                type: 'danger',
                                                onConfirm: () => {
                                                    // Implement delete logic here when ready
                                                    setConfirmModal({ ...confirmModal, show: false });
                                                },
                                            });
                                        }}
                                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                                    >
                                        <Trash2 className="w-3 h-3 mr-1" />
                                        Delete
                                    </button>
                                    <button
                                        onClick={() => setSelectedSlots([])}
                                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        <X className="w-3 h-3 mr-1" />
                                        Clear
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setConfirmModal({
                                        show: true,
                                        title: 'Copy from Previous Term',
                                        message: 'Copy from previous term functionality is currently under development and will be available soon.',
                                        type: 'info',
                                        onConfirm: () => setConfirmModal({ ...confirmModal, show: false }),
                                    });
                                }}
                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Copy from Previous
                            </button>
                        </div>
                    </div>

                    {/* Filter Options */}
                    {showFilters && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Filter by Day
                                    </label>
                                    <select
                                        value={filterDay}
                                        onChange={(e) => setFilterDay(e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange focus:ring-orange"
                                    >
                                        <option value="all">All Days</option>
                                        <option value="monday">Monday</option>
                                        <option value="tuesday">Tuesday</option>
                                        <option value="wednesday">Wednesday</option>
                                        <option value="thursday">Thursday</option>
                                        <option value="friday">Friday</option>
                                        <option value="saturday">Saturday</option>
                                        <option value="sunday">Sunday</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Filter by Teacher
                                    </label>
                                    <select
                                        value={filterTeacher}
                                        onChange={(e) => setFilterTeacher(e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange focus:ring-orange"
                                    >
                                        <option value="all">All Teachers</option>
                                        {/* Dynamically populate teachers from slots */}
                                        {[...new Set(slots.filter(s => s.teacher).map(s => s.teacher.id))].map(teacherId => {
                                            const teacher = slots.find(s => s.teacher?.id === teacherId)?.teacher;
                                            return teacher ? (
                                                <option key={teacherId} value={teacherId}>
                                                    {teacher.name}
                                                </option>
                                            ) : null;
                                        })}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        View Mode
                                    </label>
                                    <select className="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange focus:ring-orange">
                                        <option value="grade">Grade View</option>
                                        <option value="teacher">Teacher View</option>
                                        <option value="room">Room View</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Timetable Grid */}
                <div id="timetable-print-area" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    {/* Print-only header — hidden on screen */}
                    <div className="hidden print:block mb-6 border-b-2 border-gray-800 pb-4">
                        <h1 className="text-xl font-bold text-gray-900">{template.name}</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            {template.grade?.name}
                            {template.academic_term?.name ? ` — ${template.academic_term.name}` : ''}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Printed: {new Date().toLocaleDateString()}</p>
                    </div>
                    <TimetableGrid
                        template={template}
                        slots={slots.filter(slot => {
                            if (filterDay !== 'all' && slot.day_of_week !== filterDay) return false;
                            if (filterTeacher !== 'all' && slot.teacher?.id != filterTeacher) return false;
                            return true;
                        })}
                        periods={periods}
                        editable={true}
                        onSlotClick={handleSlotClick}
                    />
                </div>

                {/* Help Text */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 print:hidden">
                    <h3 className="text-sm font-medium text-blue-900 mb-2">Tips</h3>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                        <li>Click on an empty cell to add a new slot</li>
                        <li>Click on a filled cell to edit the slot</li>
                        <li>Use the Print button to print this timetable</li>
                        <li>Colors are automatically assigned to different subjects</li>
                    </ul>
                </div>
            </div>

            {/* ✅ PHASE 4: Bulk Teacher Change Modal */}
            <BulkTeacherChangeModal
                isOpen={showBulkChangeModal}
                onClose={() => setShowBulkChangeModal(false)}
                template={template}
                subjects={subjects || []}
                teachers={teachers || []}
                classTeacher={classTeacher}
            />

            {/* Confirmation Modal */}
            <ConfirmationModal
                show={confirmModal.show}
                onClose={() => setConfirmModal({ ...confirmModal, show: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText="Confirm"
                cancelText="Cancel"
            />

            {/* Print Styles */}
            <style>{`
                @media print {
                    /* Hide everything on the page */
                    body * {
                        visibility: hidden !important;
                    }
                    /* Show only the timetable print area */
                    #timetable-print-area,
                    #timetable-print-area * {
                        visibility: visible !important;
                    }
                    /* Position it at the top-left of the page */
                    #timetable-print-area {
                        position: absolute;
                        inset: 0;
                        width: 100%;
                        padding: 1cm;
                        background: white !important;
                        box-shadow: none !important;
                        border: none !important;
                        border-radius: 0 !important;
                    }
                    /* Preserve subject colours */
                    body {
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                }
            `}</style>
        </AuthenticatedLayout>
    );
}

