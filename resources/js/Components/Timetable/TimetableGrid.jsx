import { Clock, DoorOpen, User, BookOpen, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';

export default function TimetableGrid({ template, slots, periods, editable = false, onSlotClick }) {
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

    // ✅ PHASE 4: Define specialist subjects that likely need specialist teachers
    const specialistSubjects = ['Physical Education', 'Music', 'Art', 'Computer', 'ICT', 'Drama', 'Dance', 'PE'];

    // Detect if this is a blueprint-generated timetable (has sequence_order) or traditional (has period_id)
    const isBlueprintGenerated = slots.length > 0 && slots[0].sequence_order !== undefined;

    // Group slots by day and period/sequence
    const groupedSlots = {};
    daysOfWeek.forEach(day => {
        groupedSlots[day] = {};
        if (isBlueprintGenerated) {
            // For blueprint-generated, group by sequence_order
            slots.filter(s => s.day_of_week === day).forEach(slot => {
                groupedSlots[day][slot.sequence_order] = slot;
            });
        } else {
            // For traditional, group by period_id
            periods.forEach(period => {
                groupedSlots[day][period.id] = null;
            });
            slots.forEach(slot => {
                if (groupedSlots[slot.day_of_week] && slot.period_id) {
                    groupedSlots[slot.day_of_week][slot.period_id] = slot;
                }
            });
        }
    });

    // Get unique periods/sequences for blueprint-generated timetables
    const displayPeriods = isBlueprintGenerated
        ? [...new Set(slots.map(s => s.sequence_order))].sort((a, b) => a - b).map(seq => {
            const slot = slots.find(s => s.sequence_order === seq);
            return {
                id: seq,
                sequence_order: seq,
                start_time: slot.start_time,
                end_time: slot.end_time,
                duration_minutes: slot.duration_minutes,
                slot_type: slot.slot_type,
                is_teachable: slot.is_teachable,
            };
        })
        : periods;

    // Get slot status styling based on assignment state
    const getSlotStyling = (slot) => {
        if (!slot) return 'bg-white border-gray-200 border-dashed';

        // Non-teachable slots (breaks, lunch, prayer, sports, etc.)
        if (!slot.is_teachable || ['break', 'short_break', 'lunch', 'prayer', 'sports', 'activity', 'other'].includes(slot.slot_type)) {
            return 'bg-blue-50 border-blue-200 text-blue-800';
        }

        // Teachable slots - check assignment status
        const hasSubject = slot.subject_id && slot.subject;
        const hasTeacher = slot.teacher_id && slot.teacher;

        if (hasSubject && hasTeacher) {
            // Fully assigned - green border
            return 'border-green-500 border-2';
        } else if (hasSubject && !hasTeacher) {
            // Partially assigned - yellow border
            return 'border-yellow-500 border-2';
        } else {
            // Empty lesson slot - gray
            return 'bg-gray-50 border-gray-300 border-dashed';
        }
    };

    const getSubjectColor = (subjectName) => {
        const colors = [
            'bg-blue-100 text-blue-900',
            'bg-green-100 text-green-900',
            'bg-purple-100 text-purple-900',
            'bg-pink-100 text-pink-900',
            'bg-yellow-100 text-yellow-900',
            'bg-indigo-100 text-indigo-900',
            'bg-red-100 text-red-900',
            'bg-teal-100 text-teal-900',
        ];

        if (!subjectName) return 'bg-gray-100 text-gray-900';

        const hash = subjectName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    };

    const getSlotTypeLabel = (slotType) => {
        const labels = {
            'lesson': 'Lesson',
            'break': 'Break',
            'short_break': 'Short Break',
            'lunch': 'Lunch',
            'prayer': 'Prayer',
            'sports': 'Sports',
            'activity': 'Activity',
            'assembly': 'Assembly',
            'study': 'Study',
            'other': 'Other',
        };
        return labels[slotType] || slotType.charAt(0).toUpperCase() + slotType.slice(1);
    };

    // ✅ PHASE 4: Check if subject needs specialist review
    const needsSpecialistReview = (subjectName) => {
        if (!subjectName) return false;
        return specialistSubjects.some(specialist =>
            subjectName.toLowerCase().includes(specialist.toLowerCase())
        );
    };

    const handleSlotClick = (slot, day, period) => {
        if (editable && onSlotClick) {
            onSlotClick(slot, day, period);
        }
    };

    return (
        <div className="overflow-x-auto">
            <div className="min-w-[1000px]">
                {/* Header */}
                <div className="grid grid-cols-8 gap-2 mb-2">
                    <div className="font-semibold text-gray-700 text-sm p-2">Time</div>
                    {daysOfWeek.map(day => (
                        <div key={day} className="font-semibold text-gray-700 text-sm p-2 text-center capitalize">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Grid */}
                <div className="space-y-1">
                    {displayPeriods.map((period, index) => {
                        const periodKey = isBlueprintGenerated ? period.sequence_order : period.id;

                        return (
                            <div key={periodKey} className="grid grid-cols-8 gap-2">
                                {/* Time Column */}
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange text-white text-[10px] font-bold flex-shrink-0">
                                            {isBlueprintGenerated ? period.sequence_order : period.order}
                                        </span>
                                        <div className="text-xs font-medium text-gray-900 truncate">
                                            {isBlueprintGenerated ? getSlotTypeLabel(period.slot_type) : period.name}
                                        </div>
                                    </div>
                                    {!isBlueprintGenerated && period.lesson_number && (
                                        <div className="text-[10px] text-gray-500 mb-1">
                                            Lesson {period.lesson_number}
                                        </div>
                                    )}
                                    <div className="text-xs text-gray-600 flex items-center">
                                        <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                                        <span className="text-[10px]">{period.start_time} - {period.end_time}</span>
                                    </div>
                                    {isBlueprintGenerated && period.duration_minutes && (
                                        <div className="text-[10px] text-gray-500 mt-1">
                                            {period.duration_minutes} min
                                        </div>
                                    )}
                                    {!isBlueprintGenerated && period.period_type !== 'lesson' && (
                                        <div className="text-[10px] text-gray-500 mt-1 capitalize">
                                            ({period.period_type})
                                        </div>
                                    )}
                                </div>

                                {/* Day Columns */}
                                {daysOfWeek.map(day => {
                                    const slot = groupedSlots[day][periodKey];
                                    const slotStyling = getSlotStyling(slot);
                                    // ✅ PHASE 4: Check if this slot needs specialist review
                                    const needsReview = slot && needsSpecialistReview(slot.subject?.name);

                                    return (
                                        <div
                                            key={`${day}-${periodKey}`}
                                            onClick={() => handleSlotClick(slot, day, period)}
                                            className={`rounded-lg p-2 min-h-[80px] transition-all ${slotStyling} ${
                                                slot && editable ? 'cursor-pointer hover:shadow-md' : ''
                                            } ${!slot && editable ? 'hover:bg-gray-50 cursor-pointer' : ''} ${
                                                needsReview ? 'ring-2 ring-orange-300 ring-offset-1' : ''
                                            }`}
                                        >
                                            {slot ? (
                                                <div className="space-y-1">
                                                    {/* Non-teachable slots */}
                                                    {!slot.is_teachable || ['break', 'short_break', 'lunch', 'prayer', 'sports', 'activity', 'other'].includes(slot.slot_type) ? (
                                                        <div className="flex items-center justify-center h-full">
                                                            <span className="text-xs font-semibold capitalize">
                                                                {getSlotTypeLabel(slot.slot_type)}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        /* Teachable slots */
                                                        <>
                                                            <div className="flex items-start justify-between">
                                                                <div className={`flex items-center text-xs font-semibold ${getSubjectColor(slot.subject?.name)} px-2 py-1 rounded`}>
                                                                    <BookOpen className="w-3 h-3 mr-1 flex-shrink-0" />
                                                                    <span className="line-clamp-1">{slot.subject?.name || 'No Subject'}</span>
                                                                </div>
                                                                {slot.subject && slot.teacher && (
                                                                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                                                )}
                                                                {slot.subject && !slot.teacher && (
                                                                    <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                                                                )}
                                                            </div>

                                                            {slot.teacher ? (
                                                                <div className="space-y-0.5">
                                                                    <div className="flex items-center text-xs text-gray-700">
                                                                        <User className="w-3 h-3 mr-1 flex-shrink-0" />
                                                                        <span className="line-clamp-1">{slot.teacher.user?.name || slot.teacher.name}</span>
                                                                    </div>
                                                                    {/* ✅ PHASE 4: Auto-assigned teacher indicator */}
                                                                    {slot.auto_assigned_teacher && (
                                                                        <div className="flex items-center text-[10px] text-yellow-600" title="Auto-assigned to class teacher - review if specialist needed">
                                                                            <AlertTriangle className="w-3 h-3 mr-1 flex-shrink-0" />
                                                                            <span>Auto-assigned</span>
                                                                        </div>
                                                                    )}
                                                                    {/* ✅ PHASE 4: Specialist subject warning */}
                                                                    {needsReview && (
                                                                        <div className="flex items-center text-[10px] text-orange-600 font-medium" title="This subject may need a specialist teacher">
                                                                            <AlertTriangle className="w-3 h-3 mr-1 flex-shrink-0" />
                                                                            <span>Needs specialist?</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center text-xs text-gray-400 italic">
                                                                    <User className="w-3 h-3 mr-1 flex-shrink-0" />
                                                                    <span>No teacher</span>
                                                                </div>
                                                            )}

                                                            {slot.room && (
                                                                <div className="flex items-center text-xs text-gray-600">
                                                                    <DoorOpen className="w-3 h-3 mr-1 flex-shrink-0" />
                                                                    <span className="line-clamp-1">{slot.room.room_number}</span>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            ) : (
                                                editable && (
                                                    <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                                                        + Add
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>

                {/* Statistics Panel */}
                {isBlueprintGenerated && (
                    <div className="mt-6 bg-white p-4 rounded-lg shadow border border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-800 mb-3">Generation Summary</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-blue-50 p-3 rounded-lg">
                                <div className="text-xs text-blue-600 font-medium mb-1">Total Slots</div>
                                <div className="text-2xl font-bold text-blue-900">{slots.length}</div>
                            </div>
                            <div className="bg-green-50 p-3 rounded-lg">
                                <div className="text-xs text-green-600 font-medium mb-1">Lesson Slots</div>
                                <div className="text-2xl font-bold text-green-900">
                                    {slots.filter(s => s.is_teachable && s.slot_type === 'lesson').length}
                                </div>
                            </div>
                            <div className="bg-purple-50 p-3 rounded-lg">
                                <div className="text-xs text-purple-600 font-medium mb-1">Fully Assigned</div>
                                <div className="text-2xl font-bold text-purple-900">
                                    {slots.filter(s => s.subject_id && s.teacher_id).length}
                                </div>
                            </div>
                            <div className="bg-yellow-50 p-3 rounded-lg">
                                <div className="text-xs text-yellow-600 font-medium mb-1">Unassigned</div>
                                <div className="text-2xl font-bold text-yellow-900">
                                    {slots.filter(s => s.is_teachable && s.slot_type === 'lesson' && !s.subject_id).length}
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-4">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>Assignment Progress</span>
                                <span>
                                    {Math.round((slots.filter(s => s.subject_id && s.teacher_id).length /
                                        Math.max(slots.filter(s => s.is_teachable && s.slot_type === 'lesson').length, 1)) * 100)}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-green-600 h-2 rounded-full transition-all"
                                    style={{
                                        width: `${(slots.filter(s => s.subject_id && s.teacher_id).length /
                                            Math.max(slots.filter(s => s.is_teachable && s.slot_type === 'lesson').length, 1)) * 100}%`
                                    }}
                                />
                            </div>
                        </div>

                        {/* ✅ PHASE 4: Specialist Subjects Warning */}
                        {(() => {
                            const specialistSlots = slots.filter(s =>
                                s.is_teachable &&
                                s.slot_type === 'lesson' &&
                                s.subject?.name &&
                                needsSpecialistReview(s.subject.name)
                            );
                            const uniqueSpecialistSubjects = [...new Set(specialistSlots.map(s => s.subject.name))];
                            const autoAssignedCount = slots.filter(s => s.auto_assigned_teacher).length;

                            if (uniqueSpecialistSubjects.length > 0 || autoAssignedCount > 0) {
                                return (
                                    <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
                                        <div className="flex items-start">
                                            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 mr-3 flex-shrink-0" />
                                            <div className="flex-1">
                                                <h4 className="text-sm font-semibold text-orange-800 mb-2">Review Needed</h4>
                                                {autoAssignedCount > 0 && (
                                                    <p className="text-xs text-orange-700 mb-2">
                                                        ✓ {autoAssignedCount} slot(s) auto-assigned to class teacher
                                                    </p>
                                                )}
                                                {uniqueSpecialistSubjects.length > 0 && (
                                                    <>
                                                        <p className="text-xs text-orange-700 mb-2">
                                                            ⚠️ {uniqueSpecialistSubjects.length} subject(s) may need specialist teachers:
                                                        </p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {uniqueSpecialistSubjects.map((subject, idx) => (
                                                                <span key={idx} className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">
                                                                    {subject}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>
                )}

                {/* Legend */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Legend</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <div className="text-xs font-medium text-gray-600 mb-1">Slot Status</div>
                            <div className="flex items-center gap-2">
                                <div className="w-12 h-8 border-2 border-green-500 rounded bg-white"></div>
                                <span className="text-xs text-gray-700">Fully Assigned (Subject + Teacher)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-12 h-8 border-2 border-yellow-500 rounded bg-white"></div>
                                <span className="text-xs text-gray-700">Partially Assigned (Subject Only)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-12 h-8 bg-blue-50 border border-blue-200 rounded"></div>
                                <span className="text-xs text-gray-700">Break/Lunch/Non-teachable</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-12 h-8 bg-gray-50 border border-gray-300 border-dashed rounded"></div>
                                <span className="text-xs text-gray-700">Empty Lesson Slot</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-xs font-medium text-gray-600 mb-1">Icons</div>
                            <div className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-gray-600" />
                                <span className="text-xs text-gray-700">Subject</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-600" />
                                <span className="text-xs text-gray-700">Teacher</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <DoorOpen className="w-4 h-4 text-gray-600" />
                                <span className="text-xs text-gray-700">Room</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-xs text-gray-700">Complete Assignment</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-yellow-600" />
                                <span className="text-xs text-gray-700">Needs Teacher</span>
                            </div>
                            {/* ✅ PHASE 4: New indicators */}
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                <span className="text-xs text-gray-700">Auto-assigned Teacher</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-orange-300 rounded"></div>
                                <span className="text-xs text-gray-700">Needs Specialist Review</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

