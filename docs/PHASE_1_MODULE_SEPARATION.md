# 🎯 PHASE 1: MODULE ROLES & SEPARATION OF CONCERNS

**Created:** 2025-12-26  
**Status:** In Progress  
**Goal:** Establish clear boundaries and responsibilities between Grade and Timetable modules

---

## 📋 STEP 1.1: GRADE MODULE RESPONSIBILITIES

### **✅ OWNERSHIP (What Grade Module Controls)**

#### **1. Curriculum Management**
- **What subjects belong to each grade**
  - Managed via `grade_subject` pivot table
  - Includes `sessions_per_week` quota
  - Example: "Grade 5 has Math (5 sessions/week), English (4 sessions/week)"

#### **2. Teacher Pool**
- **Which teachers are assigned to the grade**
  - Managed via `grade_teacher` pivot table
  - Includes `is_class_teacher` designation
  - Example: "Teacher A and Teacher B teach Grade 5, Teacher A is class teacher"

#### **3. Session Quotas**
- **How many sessions per week each subject should have**
  - Stored in `grade_subject.sessions_per_week`
  - Currently orphaned - NOT enforced
  - Example: "Math should have 5 sessions per week"

#### **4. Administrative Roles**
- **Class teacher designation**
  - One teacher per grade can be class teacher
  - Managed via `grade_teacher.is_class_teacher`

#### **5. Student Management**
- **Student enrollment and capacity limits**
  - `grade.capacity` defines max students
  - `students` relationship tracks enrolled students
  - `hasCapacity()` method checks availability

---

### **❌ DOES NOT INCLUDE (What Grade Module Should NOT Do)**

1. **Scheduling Logic**
   - No time/period/day information
   - No room assignments
   - No actual lesson scheduling

2. **Timetable Slot Creation**
   - Grade defines WHAT and WHO
   - Timetable defines WHEN and WHERE

---

### **🔧 VALIDATION HELPERS (To Be Added)**

Grade module must provide helper methods for Timetable module to validate against:

```php
// app/Models/Grade.php

/**
 * Check if a subject is allowed for this grade
 */
public function isSubjectAllowed(int $subjectId): bool
{
    return $this->subjects()->where('subjects.id', $subjectId)->exists();
}

/**
 * Check if a teacher is allowed for this grade
 */
public function isTeacherAllowed(int $teacherId): bool
{
    return $this->teachers()->where('teachers.id', $teacherId)->exists();
}

/**
 * Get required sessions per week for a subject
 */
public function getRequiredSessionsForSubject(int $subjectId): ?int
{
    $subject = $this->subjects()->where('subjects.id', $subjectId)->first();
    return $subject ? $subject->pivot->sessions_per_week : null;
}

/**
 * Get actual scheduled sessions for a subject in a term
 */
public function getActualSessionsForSubject(int $subjectId, int $termId): int
{
    return $this->timetableSlots()
        ->whereHas('timetableTemplate', function ($query) use ($termId) {
            $query->where('academic_term_id', $termId)
                  ->where('is_active', true);
        })
        ->where('subject_id', $subjectId)
        ->where('slot_type', TimetableSlot::TYPE_LESSON)
        ->count();
}

/**
 * Check if all subjects meet their session requirements for a term
 */
public function hasMetSessionRequirements(int $termId): bool
{
    foreach ($this->subjects as $subject) {
        $required = $subject->pivot->sessions_per_week;
        $actual = $this->getActualSessionsForSubject($subject->id, $termId);
        
        if ($actual !== $required) {
            return false;
        }
    }
    
    return true;
}

/**
 * Get session compliance report for a term
 */
public function getSessionComplianceReport(int $termId): array
{
    $report = [];
    
    foreach ($this->subjects as $subject) {
        $required = $subject->pivot->sessions_per_week;
        $actual = $this->getActualSessionsForSubject($subject->id, $termId);
        
        $report[] = [
            'subject_id' => $subject->id,
            'subject_name' => $subject->name,
            'required_sessions' => $required,
            'actual_sessions' => $actual,
            'difference' => $actual - $required,
            'status' => $actual === $required ? 'complete' : ($actual < $required ? 'under' : 'over'),
        ];
    }
    
    return $report;
}

/**
 * Get all allowed subjects for this grade (for dropdowns)
 */
public function getAllowedSubjects()
{
    return $this->subjects()->where('status', 'active')->get();
}

/**
 * Get all allowed teachers for this grade (for dropdowns)
 */
public function getAllowedTeachers()
{
    return $this->teachers()->whereHas('user', function ($query) {
        $query->where('is_active', true);
    })->get();
}
```

---

## 📋 STEP 1.2: TIMETABLE MODULE RESPONSIBILITIES

### **✅ OWNERSHIP (What Timetable Module Controls)**

#### **1. Scheduling**
- **Actual day/period/time of lessons**
  - `timetable_slots.day_of_week` (monday-sunday)
  - `timetable_slots.timetable_period_id` (links to time slot)
  - Example: "Math on Monday at Period 1 (8:00-8:40)"

#### **2. Room Assignment**
- **Physical location of lessons**
  - `timetable_slots.room_id`
  - Example: "Math in Room 101"

#### **3. Teacher Assignment to Period**
- **Which teacher teaches which subject at which time**
  - `timetable_slots.teacher_id`
  - Must validate against `grade_teacher`
  - Example: "Teacher A teaches Math on Monday Period 1"

#### **4. Non-Academic Slots**
- **Breaks, lunch, assembly, activities**
  - `timetable_slots.slot_type` (break, lunch, assembly, etc.)
  - These slots have `subject_id = NULL` and `teacher_id = NULL`

#### **5. Conflict Detection**
- **Teacher double-booking**
  - Same teacher, same day, same period, different grades
- **Room conflicts**
  - Same room, same day, same period
- **Teacher availability**
  - Teacher marked unavailable at that time

#### **6. Substitutions**
- **Temporary teacher replacements**
  - `timetable_slots.is_substitution`
  - `timetable_slots.original_teacher_id`

---

### **❌ DOES NOT INCLUDE (What Timetable Module Should NOT Do)**

1. **Curriculum Planning**
   - Does not define which subjects belong to grade
   - Does not set session quotas

2. **Teacher Assignment to Grade**
   - Does not assign teachers to grades
   - Only validates and uses existing assignments

---

### **🔧 VALIDATION REQUIREMENTS (To Be Enforced)**

Timetable module must validate against Grade module before saving:

```php
// Before saving a TimetableSlot:

$grade = $slot->timetableTemplate->grade;

// 1. Validate subject is allowed
if ($slot->subject_id && !$grade->isSubjectAllowed($slot->subject_id)) {
    throw new ValidationException('Subject not assigned to this grade');
}

// 2. Validate teacher is allowed
if ($slot->teacher_id && !$grade->isTeacherAllowed($slot->teacher_id)) {
    throw new ValidationException('Teacher not assigned to this grade');
}

// 3. Warn if session count doesn't match quota (non-blocking)
$required = $grade->getRequiredSessionsForSubject($slot->subject_id);
$actual = $grade->getActualSessionsForSubject($slot->subject_id, $slot->timetableTemplate->academic_term_id);
if ($actual > $required) {
    session()->flash('warning', "This subject now has {$actual} sessions but should have {$required}");
}
```

---

## 📋 STEP 1.3: REDUNDANCY ANALYSIS

### **🔴 IDENTIFIED OVERLAPS**

#### **Overlap #1: Teacher Assignment**
- **Grade Module:** `grade_teacher` table says "Teacher A teaches Grade 5"
- **Timetable Module:** `timetable_slots` table says "Teacher A teaches Math on Monday Period 1 in Grade 5"
- **Resolution:** 
  - ✅ Grade module is SOURCE OF TRUTH for "who CAN teach this grade"
  - ✅ Timetable module is SOURCE OF TRUTH for "who IS teaching what and when"
  - ✅ Timetable MUST validate against Grade before saving

#### **Overlap #2: Subject Assignment**
- **Grade Module:** `grade_subject` table says "Grade 5 has Math"
- **Timetable Module:** `timetable_slots` table says "Math is taught on Monday Period 1"
- **Resolution:**
  - ✅ Grade module is SOURCE OF TRUTH for "what subjects this grade has"
  - ✅ Timetable module is SOURCE OF TRUTH for "when subjects are taught"
  - ✅ Timetable MUST validate against Grade before saving

---

### **🗑️ REDUNDANT CODE TO REMOVE (Future Phase)**

#### **1. Direct TimetableSlot → Grade Relationship**
**Current Code:**
```php
// app/Models/Grade.php (lines 98-143)
public function timetableSlots(): HasMany
{
    return $this->hasMany(TimetableSlot::class);
}
```

**Issue:** This creates a direct relationship that bypasses TimetableTemplate
**Resolution:** Keep for now, but document that it should go through `timetableTemplates()->slots()`

#### **2. Weak Subject Specialization Check**
**Current Code:**
```php
// TimetableSlotController.php (assumed from analysis)
if ($teacher->subject_specialization !== $subject->name) {
    // Just a warning
}
```

**Issue:** Free text comparison, easy to bypass
**Resolution:** Replace with `$grade->isTeacherAllowed($teacherId)` check

---

## 📋 STEP 1.4: MODULE COMMUNICATION PROTOCOL

### **Grade → Timetable Communication**

#### **Validation Methods (Grade provides)**
```php
// Grade model provides these methods for Timetable to call:
$grade->isSubjectAllowed($subjectId)           // Returns bool
$grade->isTeacherAllowed($teacherId)           // Returns bool
$grade->getRequiredSessionsForSubject($id)     // Returns int
$grade->getActualSessionsForSubject($id, $term) // Returns int
$grade->hasMetSessionRequirements($termId)     // Returns bool
$grade->getSessionComplianceReport($termId)    // Returns array
$grade->getAllowedSubjects()                   // Returns Collection
$grade->getAllowedTeachers()                   // Returns Collection
```

#### **Usage in Timetable Module**
```php
// TimetableSlotController::store()
$template = TimetableTemplate::findOrFail($request->timetable_template_id);
$grade = $template->grade;

// Validate subject
if (!$grade->isSubjectAllowed($request->subject_id)) {
    return back()->withErrors([
        'subject_id' => 'This subject is not assigned to ' . $grade->name
    ]);
}

// Validate teacher
if (!$grade->isTeacherAllowed($request->teacher_id)) {
    return back()->withErrors([
        'teacher_id' => 'This teacher is not assigned to ' . $grade->name
    ]);
}
```

---

### **Timetable → Grade Communication**

#### **Query Methods (Timetable provides)**
```php
// Grade can query timetable data:
$grade->getActualSessionsForSubject($subjectId, $termId)
$grade->hasMetSessionRequirements($termId)
$grade->getSessionComplianceReport($termId)
```

**Note:** These methods are defined in Grade model but query Timetable data

---

## 📋 STEP 1.5: UI FORM UPDATES

### **🎨 Dropdown Filtering Rules**

#### **1. Subject Dropdown (Timetable Slot Creation)**

**Current Behavior:**
```blade
<!-- Shows ALL subjects in school -->
<select name="subject_id">
    @foreach($subjects as $subject)
        <option value="{{ $subject->id }}">{{ $subject->name }}</option>
    @endforeach
</select>
```

**New Behavior:**
```blade
<!-- Shows ONLY subjects assigned to this grade -->
<select name="subject_id">
    @foreach($grade->getAllowedSubjects() as $subject)
        <option value="{{ $subject->id }}">
            {{ $subject->name }}
            ({{ $subject->pivot->sessions_per_week }} sessions/week)
        </option>
    @endforeach
</select>
```

**Controller Change:**
```php
// TimetableSlotController::create()
public function create(Request $request)
{
    $template = TimetableTemplate::findOrFail($request->template_id);
    $grade = $template->grade;

    return view('timetables.slots.create', [
        'template' => $template,
        'grade' => $grade,
        'subjects' => $grade->getAllowedSubjects(),  // ✅ Filtered
        'teachers' => $grade->getAllowedTeachers(),  // ✅ Filtered
        'periods' => TimetablePeriod::forGradeLevel($grade->level)->ordered()->get(),
        'rooms' => Room::active()->get(),
    ]);
}
```

---

#### **2. Teacher Dropdown (Timetable Slot Creation)**

**Current Behavior:**
```blade
<!-- Shows ALL teachers in school -->
<select name="teacher_id">
    @foreach($teachers as $teacher)
        <option value="{{ $teacher->id }}">{{ $teacher->user->name }}</option>
    @endforeach
</select>
```

**New Behavior:**
```blade
<!-- Shows ONLY teachers assigned to this grade -->
<select name="teacher_id">
    @foreach($grade->getAllowedTeachers() as $teacher)
        <option value="{{ $teacher->id }}">
            {{ $teacher->user->name }}
            @if($teacher->pivot->is_class_teacher)
                <span class="text-blue-600">(Class Teacher)</span>
            @endif
        </option>
    @endforeach
</select>
```

---

#### **3. Slot Type Handling**

**Rules:**
- **Lesson slots:** MUST have subject_id and teacher_id
- **Break/Lunch slots:** MUST NOT have subject_id or teacher_id (enforced in model boot)
- **Assembly/Activity slots:** MAY have teacher_id, SHOULD NOT have subject_id

**UI Implementation:**
```blade
<div x-data="{ slotType: '{{ old('slot_type', 'lesson') }}' }">
    <select name="slot_type" x-model="slotType">
        <option value="lesson">Lesson</option>
        <option value="break">Break</option>
        <option value="lunch">Lunch</option>
        <option value="assembly">Assembly</option>
        <option value="activity">Activity</option>
    </select>

    <!-- Subject dropdown - only show for lessons -->
    <div x-show="slotType === 'lesson'">
        <select name="subject_id" :required="slotType === 'lesson'">
            @foreach($grade->getAllowedSubjects() as $subject)
                <option value="{{ $subject->id }}">{{ $subject->name }}</option>
            @endforeach
        </select>
    </div>

    <!-- Teacher dropdown - show for lessons and activities -->
    <div x-show="['lesson', 'assembly', 'activity'].includes(slotType)">
        <select name="teacher_id" :required="slotType === 'lesson'">
            @foreach($grade->getAllowedTeachers() as $teacher)
                <option value="{{ $teacher->id }}">{{ $teacher->user->name }}</option>
            @endforeach
        </select>
    </div>
</div>
```

---

## 📋 STEP 1.6: VALIDATION LOGIC OUTLINE

### **🔒 TimetableSlot Validation Rules**

#### **Controller Validation (TimetableSlotController::store)**

```php
use App\Rules\SubjectAssignedToGrade;
use App\Rules\TeacherAssignedToGrade;

public function store(Request $request)
{
    // Get template and grade
    $template = TimetableTemplate::findOrFail($request->timetable_template_id);
    $grade = $template->grade;

    // Base validation rules
    $rules = [
        'timetable_template_id' => 'required|exists:timetable_templates,id',
        'timetable_period_id' => 'required|exists:timetable_periods,id',
        'day_of_week' => 'required|in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
        'slot_type' => 'required|in:lesson,break,lunch,assembly,activity,study,other',
        'room_id' => 'nullable|exists:rooms,id',
        'notes' => 'nullable|string|max:500',
    ];

    // Conditional validation based on slot_type
    if ($request->slot_type === 'lesson') {
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
        $rules['topic'] = 'nullable|string|max:255';
    } else {
        // Non-lesson slots should not have subject/teacher
        $rules['subject_id'] = 'nullable';
        $rules['teacher_id'] = 'nullable';
    }

    $validated = $request->validate($rules);

    // Create slot
    $slot = TimetableSlot::create($validated);

    // Check session count compliance (warning, not blocking)
    if ($slot->slot_type === 'lesson') {
        $required = $grade->getRequiredSessionsForSubject($slot->subject_id);
        $actual = $grade->getActualSessionsForSubject(
            $slot->subject_id,
            $template->academic_term_id
        );

        if ($actual !== $required) {
            $subject = Subject::find($slot->subject_id);
            session()->flash('warning',
                "{$subject->name} now has {$actual} sessions but should have {$required} sessions per week"
            );
        }
    }

    return redirect()->route('timetables.slots.index')
        ->with('success', 'Timetable slot created successfully');
}
```

---

### **🔒 Custom Validation Rules**

#### **SubjectAssignedToGrade Rule**
```php
// app/Rules/SubjectAssignedToGrade.php
namespace App\Rules;

use App\Models\Grade;
use App\Models\Subject;
use Illuminate\Contracts\Validation\Rule;

class SubjectAssignedToGrade implements Rule
{
    protected $gradeId;
    protected $message;

    public function __construct($gradeId)
    {
        $this->gradeId = $gradeId;
    }

    public function passes($attribute, $value)
    {
        $grade = Grade::find($this->gradeId);

        if (!$grade) {
            $this->message = 'Grade not found.';
            return false;
        }

        if (!$grade->isSubjectAllowed($value)) {
            $subject = Subject::find($value);
            $this->message = "Subject '{$subject->name}' is not assigned to grade '{$grade->name}'. Please assign it in the Grade management section first.";
            return false;
        }

        return true;
    }

    public function message()
    {
        return $this->message;
    }
}
```

#### **TeacherAssignedToGrade Rule**
```php
// app/Rules/TeacherAssignedToGrade.php
namespace App\Rules;

use App\Models\Grade;
use App\Models\Teacher;
use Illuminate\Contracts\Validation\Rule;

class TeacherAssignedToGrade implements Rule
{
    protected $gradeId;
    protected $message;

    public function __construct($gradeId)
    {
        $this->gradeId = $gradeId;
    }

    public function passes($attribute, $value)
    {
        $grade = Grade::find($this->gradeId);

        if (!$grade) {
            $this->message = 'Grade not found.';
            return false;
        }

        if (!$grade->isTeacherAllowed($value)) {
            $teacher = Teacher::with('user')->find($value);
            $this->message = "Teacher '{$teacher->user->name}' is not assigned to grade '{$grade->name}'. Please assign them in the Grade management section first.";
            return false;
        }

        return true;
    }

    public function message()
    {
        return $this->message;
    }
}
```

---

## 📊 SUMMARY: PHASE 1 OUTPUT

### **✅ Deliverables**

1. **Grade Module Responsibilities** - Clearly defined
2. **Timetable Module Responsibilities** - Clearly defined
3. **Redundancy Analysis** - Identified overlaps and resolutions
4. **Validation Helper Methods** - 8 new methods for Grade model
5. **UI Form Filters** - Dropdown filtering rules
6. **Validation Logic** - Custom validation rules and controller logic

---

### **📝 Implementation Checklist**

- [ ] Add 8 validation helper methods to Grade model
- [ ] Create SubjectAssignedToGrade validation rule
- [ ] Create TeacherAssignedToGrade validation rule
- [ ] Update TimetableSlotController::store() with new validation
- [ ] Update TimetableSlotController::update() with new validation
- [ ] Update TimetableSlotController::create() to filter dropdowns
- [ ] Update TimetableSlotController::edit() to filter dropdowns
- [ ] Update slot creation form view with filtered dropdowns
- [ ] Update slot edit form view with filtered dropdowns
- [ ] Add Alpine.js logic for conditional field display
- [ ] Add session count warning system
- [ ] Test all validation rules
- [ ] Test UI dropdown filtering
- [ ] Test warning messages

---

### **🚨 Important Notes**

1. **Non-Breaking:** All changes are additive - existing slots remain functional
2. **Validation Only for New Slots:** Existing slots are not re-validated
3. **Warnings, Not Errors:** Session count mismatches show warnings, not blocking errors
4. **Grade is Source of Truth:** For curriculum and teacher assignments
5. **Timetable is Source of Truth:** For scheduling and actual lessons

---

**Status:** ✅ PHASE 1 COMPLETE - Ready for Implementation
**Next Phase:** Implement validation helpers and rules
**Estimated Effort:** 4-6 hours


