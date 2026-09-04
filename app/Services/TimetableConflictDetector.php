<?php

namespace App\Services;

use App\Models\Room;
use App\Models\Teacher;
use App\Models\TimetableConflict;
use App\Models\TimetablePeriod;
use App\Models\TimetableSlot;
use App\Models\TimetableTemplate;
use Illuminate\Support\Collection;

/**
 * Service for detecting timetable conflicts
 *
 * Phase 3: Teacher Availability & Conflict Management
 * Purpose: Centralize all conflict detection logic
 */
class TimetableConflictDetector
{
    /**
     * Detect all conflicts for a given slot configuration
     *
     * @param  array  $slotData  Slot data (template_id, day, period_id, teacher_id, room_id, etc.)
     * @param  int|null  $excludeSlotId  Slot ID to exclude (for updates)
     * @return array Array of conflicts with severity and descriptions
     */
    public function detectConflicts(array $slotData, ?int $excludeSlotId = null): array
    {
        $conflicts = [];

        // Only check conflicts for lesson slots
        if (($slotData['slot_type'] ?? 'lesson') !== TimetableSlot::TYPE_LESSON) {
            return $conflicts;
        }

        // 1. Teacher availability check
        if (! empty($slotData['teacher_id'])) {
            $availabilityConflict = $this->checkTeacherAvailability($slotData);
            if ($availabilityConflict) {
                $conflicts[] = $availabilityConflict;
            }
        }

        // 2. Teacher double-booking check
        if (! empty($slotData['teacher_id'])) {
            $teacherConflict = $this->checkTeacherConflict($slotData, $excludeSlotId);
            if ($teacherConflict) {
                $conflicts[] = $teacherConflict;
            }
        }

        // 3. Room double-booking check
        if (! empty($slotData['room_id'])) {
            $roomConflict = $this->checkRoomConflict($slotData, $excludeSlotId);
            if ($roomConflict) {
                $conflicts[] = $roomConflict;
            }
        }

        // 4. Grade/Class conflict check
        $gradeConflict = $this->checkGradeConflict($slotData, $excludeSlotId);
        if ($gradeConflict) {
            $conflicts[] = $gradeConflict;
        }

        return $conflicts;
    }

    /**
     * Check if teacher is available at the specified time
     */
    private function checkTeacherAvailability(array $slotData): ?array
    {
        $teacher = Teacher::find($slotData['teacher_id']);
        if (! $teacher) {
            return null;
        }

        $period = TimetablePeriod::find($slotData['timetable_period_id']);
        if (! $period) {
            return null;
        }

        $day = $slotData['day_of_week'];
        $startTime = $period->start_time->format('H:i:s');
        $endTime = $period->end_time->format('H:i:s');

        // Use the Teacher model's isAvailableAt method
        if (! $teacher->isAvailableAt($day, $startTime, $endTime)) {
            $teacherName = $teacher->user->name ?? 'Unknown';

            return [
                'type' => 'teacher_availability',
                'severity' => 'error',
                'message' => "Teacher {$teacherName} is not available on ".ucfirst($day)." from {$startTime} to {$endTime}",
                'teacher_id' => $teacher->id,
                'teacher_name' => $teacherName,
                'day' => $day,
                'time_range' => "{$startTime} - {$endTime}",
            ];
        }

        return null;
    }

    /**
     * Check if teacher is already booked at this time
     */
    private function checkTeacherConflict(array $slotData, ?int $excludeSlotId): ?array
    {
        $teacher = Teacher::with('user')->find($slotData['teacher_id']);
        if (! $teacher) {
            return null;
        }

        $conflictingSlot = TimetableSlot::where('teacher_id', $slotData['teacher_id'])
            ->where('day_of_week', $slotData['day_of_week'])
            ->where('timetable_period_id', $slotData['timetable_period_id'])
            ->where('timetable_template_id', $slotData['timetable_template_id'])
            ->when($excludeSlotId, function ($query, $excludeSlotId) {
                $query->where('id', '!=', $excludeSlotId);
            })
            ->with(['subject', 'template.grade'])
            ->first();

        if ($conflictingSlot) {
            $teacherName = $teacher->user->name ?? 'Unknown';

            return [
                'type' => 'teacher_double_booking',
                'severity' => 'error',
                'message' => "Teacher {$teacherName} is already teaching {$conflictingSlot->subject->name} for {$conflictingSlot->template->grade->name} at this time",
                'teacher_id' => $teacher->id,
                'teacher_name' => $teacherName,
                'conflicting_slot_id' => $conflictingSlot->id,
                'conflicting_subject' => $conflictingSlot->subject->name ?? 'Unknown',
                'conflicting_grade' => $conflictingSlot->template->grade->name ?? 'Unknown',
            ];
        }

        return null;
    }

    /**
     * Check if room is already booked at this time
     */
    private function checkRoomConflict(array $slotData, ?int $excludeSlotId): ?array
    {
        $room = Room::find($slotData['room_id']);
        if (! $room) {
            return null;
        }

        $conflictingSlot = TimetableSlot::where('room_id', $slotData['room_id'])
            ->where('day_of_week', $slotData['day_of_week'])
            ->where('timetable_period_id', $slotData['timetable_period_id'])
            ->when($excludeSlotId, function ($query, $excludeSlotId) {
                $query->where('id', '!=', $excludeSlotId);
            })
            ->with(['subject', 'teacher.user', 'template.grade'])
            ->first();

        if ($conflictingSlot) {
            $subjectName = $conflictingSlot->subject->name ?? 'Unknown';
            $gradeName = $conflictingSlot->template->grade->name ?? 'Unknown';

            return [
                'type' => 'room_double_booking',
                'severity' => 'warning',
                'message' => "Room {$room->code} is already booked for {$subjectName} ({$gradeName}) at this time",
                'room_id' => $room->id,
                'room_code' => $room->code,
                'conflicting_slot_id' => $conflictingSlot->id,
                'conflicting_subject' => $subjectName,
                'conflicting_grade' => $gradeName,
            ];
        }

        return null;
    }

    /**
     * Check if the grade/class already has a lesson at this time
     */
    private function checkGradeConflict(array $slotData, ?int $excludeSlotId): ?array
    {
        $template = TimetableTemplate::with('grade')->find($slotData['timetable_template_id']);
        if (! $template) {
            return null;
        }

        $conflictingSlot = TimetableSlot::where('timetable_template_id', $slotData['timetable_template_id'])
            ->where('day_of_week', $slotData['day_of_week'])
            ->where('timetable_period_id', $slotData['timetable_period_id'])
            ->when($excludeSlotId, function ($query, $excludeSlotId) {
                $query->where('id', '!=', $excludeSlotId);
            })
            ->with(['subject', 'teacher.user'])
            ->first();

        if ($conflictingSlot) {
            $subjectName = $conflictingSlot->subject->name ?? 'Unknown';
            $teacherName = $conflictingSlot->teacher->user->name ?? 'Unknown';

            return [
                'type' => 'grade_double_booking',
                'severity' => 'error',
                'message' => "Grade {$template->grade->name} already has {$subjectName} scheduled at this time",
                'grade_id' => $template->grade_id,
                'grade_name' => $template->grade->name,
                'conflicting_slot_id' => $conflictingSlot->id,
                'conflicting_subject' => $subjectName,
                'conflicting_teacher' => $teacherName,
            ];
        }

        return null;
    }

    /**
     * Get all conflicts for a teacher on a specific day
     */
    public function getTeacherDayConflicts(int $teacherId, string $dayOfWeek, int $templateId): Collection
    {
        $teacher = Teacher::with('user')->find($teacherId);
        if (! $teacher) {
            return collect();
        }

        $slots = TimetableSlot::where('teacher_id', $teacherId)
            ->where('day_of_week', $dayOfWeek)
            ->where('timetable_template_id', $templateId)
            ->with(['period', 'subject', 'template.grade'])
            ->orderBy('timetable_period_id')
            ->get();

        $conflicts = collect();

        foreach ($slots as $slot) {
            if (! $slot->period) {
                continue;
            }

            $slotConflicts = $this->detectConflicts([
                'timetable_template_id' => $slot->timetable_template_id,
                'day_of_week' => $slot->day_of_week,
                'timetable_period_id' => $slot->timetable_period_id,
                'teacher_id' => $slot->teacher_id,
                'room_id' => $slot->room_id,
                'slot_type' => $slot->slot_type,
            ], $slot->id);

            if (! empty($slotConflicts)) {
                $conflicts->push([
                    'slot' => $slot,
                    'conflicts' => $slotConflicts,
                ]);
            }
        }

        return $conflicts;
    }

    /**
     * Check if conflicts exist (boolean check)
     */
    public function hasConflicts(array $slotData, ?int $excludeSlotId = null): bool
    {
        $conflicts = $this->detectConflicts($slotData, $excludeSlotId);

        // Only return true if there are ERROR-level conflicts
        return collect($conflicts)->contains('severity', 'error');
    }

    /**
     * Get a summary of all conflicts in a template
     */
    public function getTemplateConflictSummary(int $templateId): array
    {
        $slots = TimetableSlot::where('timetable_template_id', $templateId)
            ->where('slot_type', TimetableSlot::TYPE_LESSON)
            ->with(['teacher.user', 'room', 'period', 'subject'])
            ->get();

        $summary = [
            'total_conflicts' => 0,
            'teacher_conflicts' => 0,
            'room_conflicts' => 0,
            'availability_conflicts' => 0,
            'conflicts_by_day' => [],
        ];

        foreach ($slots as $slot) {
            $conflicts = $this->detectConflicts([
                'timetable_template_id' => $slot->timetable_template_id,
                'day_of_week' => $slot->day_of_week,
                'timetable_period_id' => $slot->timetable_period_id,
                'teacher_id' => $slot->teacher_id,
                'room_id' => $slot->room_id,
                'slot_type' => $slot->slot_type,
            ], $slot->id);

            if (! empty($conflicts)) {
                $summary['total_conflicts'] += count($conflicts);

                foreach ($conflicts as $conflict) {
                    if ($conflict['type'] === 'teacher_double_booking') {
                        $summary['teacher_conflicts']++;
                    } elseif ($conflict['type'] === 'room_double_booking') {
                        $summary['room_conflicts']++;
                    } elseif ($conflict['type'] === 'teacher_availability') {
                        $summary['availability_conflicts']++;
                    }
                }

                if (! isset($summary['conflicts_by_day'][$slot->day_of_week])) {
                    $summary['conflicts_by_day'][$slot->day_of_week] = 0;
                }
                $summary['conflicts_by_day'][$slot->day_of_week] += count($conflicts);
            }
        }

        return $summary;
    }

    /**
     * Log a conflict to the database
     *
     * @param  int  $slotId1  Primary slot ID
     * @param  int|null  $slotId2  Secondary slot ID (for double-booking conflicts)
     * @param  string  $conflictType  Type of conflict
     * @param  string  $description  Human-readable description
     * @param  string  $severity  Severity level (low, medium, high, critical)
     */
    public function logConflict(
        int $slotId1,
        ?int $slotId2,
        string $conflictType,
        string $description,
        string $severity = 'medium'
    ): TimetableConflict {
        $slot = TimetableSlot::find($slotId1);

        // Check if this exact conflict already exists
        $existing = TimetableConflict::where('slot_id_1', $slotId1)
            ->where('slot_id_2', $slotId2)
            ->where('conflict_type', $conflictType)
            ->where('status', 'detected')
            ->first();

        if ($existing) {
            return $existing;
        }

        return TimetableConflict::create([
            'school_id' => $slot->school_id,
            'timetable_template_id' => $slot->timetable_template_id,
            'slot_id_1' => $slotId1,
            'slot_id_2' => $slotId2,
            'conflict_type' => $conflictType,
            'description' => $description,
            'severity' => $severity,
            'status' => 'detected',
        ]);
    }

    /**
     * Auto-resolve conflicts for a slot (when slot is updated/deleted)
     */
    public function autoResolveConflictsForSlot(int $slotId): int
    {
        $resolved = TimetableConflict::where(function ($query) use ($slotId) {
            $query->where('slot_id_1', $slotId)
                ->orWhere('slot_id_2', $slotId);
        })
            ->whereIn('status', ['detected', 'acknowledged'])
            ->update([
                'status' => 'resolved',
                'resolved_at' => now(),
                'resolution_notes' => 'Auto-resolved: Slot was modified or deleted',
            ]);

        return $resolved;
    }

    /**
     * Scan and log all conflicts for a template
     */
    public function scanAndLogTemplateConflicts(int $templateId): Collection
    {
        $slots = TimetableSlot::where('timetable_template_id', $templateId)
            ->where('slot_type', TimetableSlot::TYPE_LESSON)
            ->with(['teacher.user', 'room', 'period', 'subject'])
            ->get();

        $loggedConflicts = collect();

        foreach ($slots as $slot) {
            $conflicts = $this->detectConflicts([
                'timetable_template_id' => $slot->timetable_template_id,
                'day_of_week' => $slot->day_of_week,
                'timetable_period_id' => $slot->timetable_period_id,
                'teacher_id' => $slot->teacher_id,
                'room_id' => $slot->room_id,
                'slot_type' => $slot->slot_type,
            ], $slot->id);

            foreach ($conflicts as $conflict) {
                $severity = $conflict['severity'] === 'error' ? 'high' : 'medium';

                $conflictingSlotId = $conflict['conflicting_slot_id'] ?? null;

                $logged = $this->logConflict(
                    $slot->id,
                    $conflictingSlotId,
                    $conflict['type'],
                    $conflict['message'],
                    $severity
                );

                $loggedConflicts->push($logged);
            }
        }

        return $loggedConflicts;
    }
}
