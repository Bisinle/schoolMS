import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Calendar, ArrowLeft, Printer, Download, Edit, AlertTriangle, Filter, Copy, Trash2, RefreshCw, X, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import TimetableGrid from '@/Components/Timetable/TimetableGrid';
import { useState } from 'react';

export default function TimetableGridView({ template, slots, periods, conflicts, auth }) {
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [showConflicts, setShowConflicts] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [filterDay, setFilterDay] = useState('all');
    const [filterTeacher, setFilterTeacher] = useState('all');
    const [selectedSlots, setSelectedSlots] = useState([]);

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
        // Export functionality can be implemented later
        alert('Export functionality coming soon!');
    };

    const handleGenerate = () => {
        if (confirm('Generate weekly timetable from blueprint? This will create slots for all periods across the week.')) {
            router.post(route('timetables.templates.generate', template.id));
        }
    };

    const handleRegenerate = () => {
        if (confirm('Regenerate timetable? This will delete all auto-generated slots and recreate them. Manual edits will be preserved.')) {
            router.post(route('timetables.templates.regenerate', template.id));
        }
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
                        {/* Generate/Regenerate Buttons */}
                        {slots.length === 0 ? (
                            <button
                                onClick={handleGenerate}
                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Generate Timetable
                            </button>
                        ) : (
                            <button
                                onClick={handleRegenerate}
                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-orange rounded-lg hover:bg-orange-600"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Regenerate
                            </button>
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
                                            if (confirm('Copy selected slots to another day?')) {
                                                // Implement copy logic
                                                alert('Copy functionality coming soon!');
                                            }
                                        }}
                                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        <Copy className="w-3 h-3 mr-1" />
                                        Copy
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm(`Delete ${selectedSlots.length} selected slots?`)) {
                                                // Implement delete logic
                                                alert('Delete functionality coming soon!');
                                            }
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
                                    if (confirm('Copy timetable from previous term?')) {
                                        alert('Copy from previous term functionality coming soon!');
                                    }
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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

            {/* Print Styles */}
            <style>{`
                @media print {
                    .print\\:hidden {
                        display: none !important;
                    }
                    body {
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                }
            `}</style>
        </AuthenticatedLayout>
    );
}

