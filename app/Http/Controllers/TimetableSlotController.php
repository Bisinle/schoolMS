<?php

namespace App\Http\Controllers;

use App\Models\TimetableSlot;
use App\Models\TimetableTemplate;
use App\Models\TimetablePeriod;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\Room;
use App\Rules\SubjectAssignedToGrade;
use App\Rules\TeacherAssignedToGrade;
use App\Services\TimetableConflictDetector;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;

class TimetableSlotController extends Controller
{
    use AuthorizesRequests;

    protected TimetableConflictDetector $conflictDetector;

    public function __construct(TimetableConflictDetector $conflictDetector)
    {
        $this->conflictDetector = $conflictDetector;
    }

    /**
     * Display a listing of timetable slots.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', TimetableSlot::class);

        $slots = TimetableSlot::with(['template.grade', 'period', 'subject', 'teacher', 'room'])
            ->when($request->template_id, function ($query, $templateId) {
                $query->where('timetable_template_id', $templateId);
            })
            ->when($request->day_of_week, function ($query, $day) {
                $query->where('day_of_week', $day);
            })
            ->when($request->teacher_id, function ($query, $teacherId) {
                $query->where('teacher_id', $teacherId);
            })
            ->orderBy('day_of_week')
            ->orderBy('period_id')
            ->paginate(50)
            ->withQueryString();

        $templates = TimetableTemplate::with('grade')
            ->where('school_id', auth()->user()->school_id)
            ->get();

        return Inertia::render('Timetables/Slots/Index', [
            'slots' => $slots,
            'templates' => $templates,
            'filters' => $request->only(['template_id', 'day_of_week', 'teacher_id']),
            'daysOfWeek' => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        ]);
    }

    /**
     * Show the form for creating a new timetable slot.
     *
     * Phase 1 Update: Now filters subjects and teachers by grade assignment
     */
    public function create(Request $request)
    {
        $this->authorize('create', TimetableSlot::class);

        $schoolId = auth()->user()->school_id;

        // Get the specific template if template_id is provided
        $template = null;
        $gradeLevel = null;
        $grade = null;
        $defaultRoomId = null;
        $classTeacherId = null;

        if ($request->template_id) {
            $template = TimetableTemplate::with(['grade.defaultRoom', 'grade.teachers'])
                ->where('school_id', $schoolId)
                ->findOrFail($request->template_id);

            // Get the grade and grade level from the template
            $grade = $template->grade;
            $gradeLevel = $grade->level;

            // Get default room ID from grade
            $defaultRoomId = $grade->default_room_id;

            // Get class teacher ID from grade
            $classTeacher = $grade->teachers()->wherePivot('is_class_teacher', true)->first();
            $classTeacherId = $classTeacher ? $classTeacher->id : null;
        }

        // Filter periods by grade level if template is provided
        $periods = TimetablePeriod::where('school_id', $schoolId)
            ->active()
            ->when($gradeLevel, function ($query, $gradeLevel) {
                $query->where('grade_level', $gradeLevel);
            })
            ->orderBy('order')
            ->get();

        // ✅ PHASE 1: Filter subjects by grade assignment
        $subjects = $grade
            ? $grade->getAllowedSubjects()->map(function ($subject) {
                return [
                    'id' => $subject->id,
                    'name' => $subject->name,
                    'sessions_per_week' => $subject->pivot->sessions_per_week,
                ];
            })
            : Subject::where('school_id', $schoolId)
                ->where('status', 'active')
                ->orderBy('name')
                ->get();

        // Get all active teachers, marking which one is the class teacher
        $teachers = Teacher::with('user')
            ->where('school_id', $schoolId)
            ->where('status', 'active')
            ->get()
            ->map(function ($teacher) use ($classTeacherId) {
                return [
                    'id' => $teacher->id,
                    'name' => $teacher->user->name,
                    'is_class_teacher' => $teacher->id === $classTeacherId,
                ];
            })
            ->sortByDesc('is_class_teacher') // Class teacher appears first
            ->values();

        // If grade has a default room, only show that room. Otherwise show all rooms.
        $rooms = $defaultRoomId
            ? Room::where('school_id', $schoolId)
                ->where('id', $defaultRoomId)
                ->active()
                ->get()
            : Room::where('school_id', $schoolId)
                ->active()
                ->orderBy('code')
                ->get();

        return Inertia::render('Timetables/Slots/Create', [
            'template' => $template,
            'grade' => $grade,
            'periods' => $periods,
            'subjects' => $subjects,
            'teachers' => $teachers,
            'rooms' => $rooms,
            'defaultRoomId' => $defaultRoomId,
            'classTeacherId' => $classTeacherId,
            'slotTypes' => [
                ['value' => 'lesson', 'label' => 'Lesson'],
                ['value' => 'break', 'label' => 'Break'],
                ['value' => 'short_break', 'label' => 'Short Break'],
                ['value' => 'breakfast', 'label' => 'Breakfast Break'],
                ['value' => 'lunch', 'label' => 'Lunch Break'],
                ['value' => 'assembly', 'label' => 'Assembly'],
                ['value' => 'activity', 'label' => 'Activity'],
                ['value' => 'study', 'label' => 'Study Period'],
                ['value' => 'prayer', 'label' => 'Prayer Break'],
                ['value' => 'sports', 'label' => 'Sports Block'],
                ['value' => 'homework', 'label' => 'Homework'],
                ['value' => 'other', 'label' => 'Other'],
            ],
        ]);
    }

    /**
     * Store a newly created timetable slot.
     *
     * Phase 1 Update: Now validates subject and teacher against grade assignments
     * Phase 3 Update: Now detects and reports conflicts
     */
    public function store(Request $request)
    {
        $this->authorize('create', TimetableSlot::class);

        // Get template and grade for validation
        $template = TimetableTemplate::with('grade')->findOrFail($request->timetable_template_id);
        $grade = $template->grade;

        // Base validation rules
        $rules = [
            'timetable_template_id' => 'required|exists:timetable_templates,id',
            'timetable_period_id' => 'required|exists:timetable_periods,id',
            'day_of_week' => 'required|in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
            'slot_type' => 'required|in:lesson,break,short_break,breakfast,lunch,assembly,activity,study,prayer,sports,homework,other',
            'room_id' => 'nullable|exists:rooms,id',
            'notes' => 'nullable|string',
            'topic' => 'nullable|string',
        ];

        // ✅ PHASE 1: Conditional validation with grade assignment checks
        if ($request->slot_type === TimetableSlot::TYPE_LESSON) {
            $rules['subject_id'] = [
                'required',
                'exists:subjects,id',
                new SubjectAssignedToGrade($grade->id),  // ✅ NEW VALIDATION
            ];
            $rules['teacher_id'] = [
                'required',
                'exists:teachers,id',
                new TeacherAssignedToGrade($grade->id),  // ✅ NEW VALIDATION
            ];
        } else {
            // For non-lesson slots, subject and teacher should be null
            $rules['subject_id'] = 'nullable';
            $rules['teacher_id'] = 'nullable';
        }

        $validated = $request->validate($rules);

        // Set grade_id from template
        $validated['grade_id'] = $template->grade_id;
        $validated['school_id'] = auth()->user()->school_id;

        // Enforce business rules: breaks cannot have subjects or teachers
        if (in_array($validated['slot_type'], TimetableSlot::NON_ACADEMIC_TYPES)) {
            $validated['subject_id'] = null;
            $validated['teacher_id'] = null;
            $validated['topic'] = null;
            $validated['is_teachable'] = false;
        } else {
            // If slot_type is 'lesson', set is_teachable to true
            $validated['is_teachable'] = ($validated['slot_type'] === TimetableSlot::TYPE_LESSON);
        }

        // ✅ PHASE 3: Detect conflicts before creating
        $conflicts = $this->conflictDetector->detectConflicts($validated);

        // Block creation if there are ERROR-level conflicts
        $errorConflicts = collect($conflicts)->where('severity', 'error');
        if ($errorConflicts->isNotEmpty()) {
            return back()->withErrors([
                'conflicts' => $errorConflicts->pluck('message')->toArray()
            ])->withInput();
        }

        $slot = TimetableSlot::create($validated);

        // ✅ PHASE 3: Log warning-level conflicts
        $warningConflicts = collect($conflicts)->where('severity', 'warning');
        if ($warningConflicts->isNotEmpty()) {
            session()->flash('warning', $warningConflicts->pluck('message')->implode(' '));
        }

        // ✅ PHASE 1: Check session count compliance (warning, not blocking)
        if ($slot->slot_type === TimetableSlot::TYPE_LESSON && $slot->subject_id) {
            $required = $grade->getRequiredSessionsForSubject($slot->subject_id);
            $actual = $grade->getActualSessionsForSubject(
                $slot->subject_id,
                $template->academic_term_id
            );

            if ($required && $actual !== $required) {
                $subject = Subject::find($slot->subject_id);
                $status = $actual < $required ? 'under' : 'over';
                session()->flash('warning',
                    "{$subject->name} now has {$actual} sessions but should have {$required} sessions per week (currently {$status})"
                );
            }
        }

        return redirect()->route('timetables.templates.show', $template)
            ->with('success', 'Timetable slot created successfully.');
    }

    /**
     * Display the specified timetable slot.
     */
    public function show(TimetableSlot $slot)
    {
        $this->authorize('view', $slot);

        $slot->load(['template.grade', 'period', 'subject', 'teacher.user', 'room', 'grade']);

        return Inertia::render('Timetables/Slots/Show', [
            'slot' => $slot,
        ]);
    }

    /**
     * Show the form for editing the specified timetable slot.
     *
     * Phase 1 Update: Now filters subjects and teachers by grade assignment
     */
    public function edit(TimetableSlot $slot)
    {
        $this->authorize('update', $slot);

        $slot->load(['template.grade.defaultRoom', 'template.grade.teachers', 'period', 'subject', 'teacher', 'room']);

        $schoolId = auth()->user()->school_id;
        $template = $slot->template;
        $grade = $template->grade;
        $gradeLevel = $grade->level;

        // Get default room ID from grade
        $defaultRoomId = $grade->default_room_id;

        // Get class teacher ID from grade
        $classTeacher = $grade->teachers()->wherePivot('is_class_teacher', true)->first();
        $classTeacherId = $classTeacher ? $classTeacher->id : null;

        // Filter periods by grade level
        $periods = TimetablePeriod::where('school_id', $schoolId)
            ->active()
            ->where('grade_level', $gradeLevel)
            ->orderBy('order')
            ->get();

        // ✅ PHASE 1: Filter subjects by grade assignment
        $subjects = $grade->getAllowedSubjects()->map(function ($subject) {
            return [
                'id' => $subject->id,
                'name' => $subject->name,
                'sessions_per_week' => $subject->pivot->sessions_per_week,
            ];
        });

        // Get all active teachers, marking which one is the class teacher
        $teachers = Teacher::with('user')
            ->where('school_id', $schoolId)
            ->where('status', 'active')
            ->get()
            ->map(function ($teacher) use ($classTeacherId) {
                return [
                    'id' => $teacher->id,
                    'name' => $teacher->user->name,
                    'is_class_teacher' => $teacher->id === $classTeacherId,
                ];
            })
            ->sortByDesc('is_class_teacher') // Class teacher appears first
            ->values();

        // If grade has a default room, only show that room. Otherwise show all rooms.
        $rooms = $defaultRoomId
            ? Room::where('school_id', $schoolId)
                ->where('id', $defaultRoomId)
                ->active()
                ->get()
            : Room::where('school_id', $schoolId)
                ->active()
                ->orderBy('code')
                ->get();

        return Inertia::render('Timetables/Slots/Edit', [
            'slot' => $slot,
            'template' => $template,
            'grade' => $grade,
            'periods' => $periods,
            'subjects' => $subjects,
            'teachers' => $teachers,
            'rooms' => $rooms,
            'defaultRoomId' => $defaultRoomId,
            'classTeacherId' => $classTeacherId,
            'daysOfWeek' => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
            'slotTypes' => [
                ['value' => 'lesson', 'label' => 'Lesson'],
                ['value' => 'break', 'label' => 'Break'],
                ['value' => 'short_break', 'label' => 'Short Break'],
                ['value' => 'breakfast', 'label' => 'Breakfast Break'],
                ['value' => 'lunch', 'label' => 'Lunch Break'],
                ['value' => 'assembly', 'label' => 'Assembly'],
                ['value' => 'activity', 'label' => 'Activity'],
                ['value' => 'study', 'label' => 'Study Period'],
                ['value' => 'prayer', 'label' => 'Prayer Break'],
                ['value' => 'sports', 'label' => 'Sports Block'],
                ['value' => 'homework', 'label' => 'Homework'],
                ['value' => 'other', 'label' => 'Other'],
            ],
        ]);
    }

    /**
     * Update the specified timetable slot.
     *
     * Phase 1 Update: Now validates subject and teacher against grade assignments
     * Phase 3 Update: Now detects and reports conflicts
     */
    public function update(Request $request, TimetableSlot $slot)
    {
        $this->authorize('update', $slot);

        // Load relationships for validation
        $slot->load('template.grade');
        $template = $slot->template;
        $grade = $template->grade;

        // Base validation rules
        $rules = [
            'timetable_period_id' => 'required|exists:timetable_periods,id',
            'day_of_week' => 'required|in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
            'slot_type' => 'required|in:lesson,break,short_break,breakfast,lunch,assembly,activity,study,prayer,sports,homework,other',
            'room_id' => 'nullable|exists:rooms,id',
            'notes' => 'nullable|string',
            'topic' => 'nullable|string',
        ];

        // ✅ PHASE 1: Conditional validation with grade assignment checks
        if ($request->slot_type === TimetableSlot::TYPE_LESSON) {
            $rules['subject_id'] = [
                'required',
                'exists:subjects,id',
                new SubjectAssignedToGrade($grade->id),  // ✅ NEW VALIDATION
            ];
            $rules['teacher_id'] = [
                'required',
                'exists:teachers,id',
                new TeacherAssignedToGrade($grade->id),  // ✅ NEW VALIDATION
            ];
        } else {
            // For non-lesson slots, subject and teacher should be null
            $rules['subject_id'] = 'nullable';
            $rules['teacher_id'] = 'nullable';
        }

        $validated = $request->validate($rules);

        // Enforce business rules: breaks cannot have subjects or teachers
        if (in_array($validated['slot_type'], TimetableSlot::NON_ACADEMIC_TYPES)) {
            $validated['subject_id'] = null;
            $validated['teacher_id'] = null;
            $validated['topic'] = null;
            $validated['is_teachable'] = false;
        } else {
            // If slot_type is 'lesson', set is_teachable to true
            $validated['is_teachable'] = ($validated['slot_type'] === TimetableSlot::TYPE_LESSON);
        }

        // ✅ PHASE 3: Detect conflicts before updating (exclude current slot)
        $conflictData = array_merge($validated, [
            'timetable_template_id' => $slot->timetable_template_id,
            'school_id' => $slot->school_id,
        ]);

        $conflicts = $this->conflictDetector->detectConflicts($conflictData, $slot->id);

        // Block update if there are ERROR-level conflicts
        $errorConflicts = collect($conflicts)->where('severity', 'error');
        if ($errorConflicts->isNotEmpty()) {
            return back()->withErrors([
                'conflicts' => $errorConflicts->pluck('message')->toArray()
            ])->withInput();
        }

        $slot->update($validated);

        // ✅ PHASE 3: Log warning-level conflicts
        $warningConflicts = collect($conflicts)->where('severity', 'warning');
        if ($warningConflicts->isNotEmpty()) {
            session()->flash('warning', $warningConflicts->pluck('message')->implode(' '));
        }

        // ✅ PHASE 1: Check session count compliance (warning, not blocking)
        if ($slot->slot_type === TimetableSlot::TYPE_LESSON && $slot->subject_id) {
            $required = $grade->getRequiredSessionsForSubject($slot->subject_id);
            $actual = $grade->getActualSessionsForSubject(
                $slot->subject_id,
                $template->academic_term_id
            );

            if ($required && $actual !== $required) {
                $subject = Subject::find($slot->subject_id);
                $status = $actual < $required ? 'under' : 'over';
                session()->flash('warning',
                    "{$subject->name} now has {$actual} sessions but should have {$required} sessions per week (currently {$status})"
                );
            }
        }

        return redirect()->route('timetables.templates.show', $slot->template)
            ->with('success', 'Timetable slot updated successfully.');
    }

    /**
     * Remove the specified timetable slot.
     */
    public function destroy(TimetableSlot $slot)
    {
        $this->authorize('delete', $slot);

        $templateId = $slot->timetable_template_id;
        $slot->delete();

        return redirect()->route('timetables.templates.show', $templateId)
            ->with('success', 'Timetable slot deleted successfully.');
    }
}
