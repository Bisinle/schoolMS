# 🚀 PHASE 1: IMPLEMENTATION GUIDE

**Created:** 2025-12-26  
**Status:** Ready to Implement  
**Estimated Time:** 4-6 hours

---

## 📋 IMPLEMENTATION ORDER

### **STEP 1: Add Validation Helpers to Grade Model** (1 hour)
**File:** `app/Models/Grade.php`  
**Action:** Add 8 new methods

### **STEP 2: Create Custom Validation Rules** (30 minutes)
**Files:** 
- `app/Rules/SubjectAssignedToGrade.php`
- `app/Rules/TeacherAssignedToGrade.php`

### **STEP 3: Update TimetableSlotController** (1.5 hours)
**File:** `app/Http/Controllers/TimetableSlotController.php`  
**Actions:**
- Update `create()` method to filter dropdowns
- Update `store()` method with new validation
- Update `edit()` method to filter dropdowns
- Update `update()` method with new validation

### **STEP 4: Update UI Forms** (1.5 hours)
**Files:**
- `resources/views/timetables/slots/create.blade.php`
- `resources/views/timetables/slots/edit.blade.php`

### **STEP 5: Testing** (1.5 hours)
- Manual testing
- Edge case testing
- UI testing

---

## 🔧 DETAILED IMPLEMENTATION

### **STEP 1: Grade Model Validation Helpers**

Open `app/Models/Grade.php` and add these methods before the closing brace:

```php
// ============================================
// VALIDATION HELPERS FOR TIMETABLE MODULE
// Added: Phase 1 - Module Separation
// ============================================

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

**Test:**
```php
// In tinker or test
$grade = Grade::find(1);
$grade->isSubjectAllowed(1); // Should return true/false
$grade->getAllowedSubjects(); // Should return collection
```

---

### **STEP 2: Create Validation Rules**

#### **File 1:** `app/Rules/SubjectAssignedToGrade.php`

```php
<?php

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
            $subjectName = $subject ? $subject->name : 'Unknown';
            $this->message = "Subject '{$subjectName}' is not assigned to grade '{$grade->name}'. Please assign it in the Grade management section first.";
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

#### **File 2:** `app/Rules/TeacherAssignedToGrade.php`

```php
<?php

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
            $teacherName = $teacher ? $teacher->user->name : 'Unknown';
            $this->message = "Teacher '{$teacherName}' is not assigned to grade '{$grade->name}'. Please assign them in the Grade management section first.";
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

**Test:**
```php
// In a controller or test
use App\Rules\SubjectAssignedToGrade;

$validator = Validator::make(['subject_id' => 1], [
    'subject_id' => [new SubjectAssignedToGrade($gradeId)]
]);

$validator->fails(); // Should return true if subject not in grade
```

---

### **STEP 3: Update TimetableSlotController**

This is the most critical step. We need to update 4 methods.

#### **3.1: Update `create()` Method**

Find the `create()` method and update it to filter dropdowns:

```php
public function create(Request $request)
{
    // Get template
    $templateId = $request->query('template_id');
    if (!$templateId) {
        return redirect()->route('timetables.templates.index')
            ->with('error', 'Please select a timetable template first.');
    }

    $template = TimetableTemplate::with('grade')->findOrFail($templateId);
    $grade = $template->grade;

    // Check authorization
    $this->authorize('create', TimetableSlot::class);

    // Get filtered data
    $subjects = $grade->getAllowedSubjects();  // ✅ FILTERED
    $teachers = $grade->getAllowedTeachers();  // ✅ FILTERED
    $periods = TimetablePeriod::forGradeLevel($grade->level)
        ->active()
        ->ordered()
        ->get();
    $rooms = Room::active()->get();

    return view('timetables.slots.create', compact(
        'template',
        'grade',
        'subjects',
        'teachers',
        'periods',
        'rooms'
    ));
}
```

#### **3.2: Update `store()` Method**

Find the `store()` method and replace with this:

```php
use App\Rules\SubjectAssignedToGrade;
use App\Rules\TeacherAssignedToGrade;

public function store(Request $request)
{
    // Get template and grade
    $template = TimetableTemplate::with('grade')->findOrFail($request->timetable_template_id);
    $grade = $template->grade;

    // Check authorization
    $this->authorize('create', TimetableSlot::class);

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
        $rules['topic'] = 'nullable|string|max:255';
    } else {
        // Non-lesson slots should not have subject/teacher
        $rules['subject_id'] = 'nullable';
        $rules['teacher_id'] = 'nullable';
    }

    $validated = $request->validate($rules);

    // Create slot
    $slot = TimetableSlot::create($validated);

    // ✅ NEW: Check session count compliance (warning, not blocking)
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

    return redirect()->route('timetables.slots.index', ['template_id' => $template->id])
        ->with('success', 'Timetable slot created successfully');
}
```

#### **3.3: Update `edit()` Method**

Find the `edit()` method and update it:

```php
public function edit(TimetableSlot $slot)
{
    // Load relationships
    $slot->load(['timetableTemplate.grade', 'subject', 'teacher', 'room', 'period']);
    $template = $slot->timetableTemplate;
    $grade = $template->grade;

    // Check authorization
    $this->authorize('update', $slot);

    // Get filtered data
    $subjects = $grade->getAllowedSubjects();  // ✅ FILTERED
    $teachers = $grade->getAllowedTeachers();  // ✅ FILTERED
    $periods = TimetablePeriod::forGradeLevel($grade->level)
        ->active()
        ->ordered()
        ->get();
    $rooms = Room::active()->get();

    return view('timetables.slots.edit', compact(
        'slot',
        'template',
        'grade',
        'subjects',
        'teachers',
        'periods',
        'rooms'
    ));
}
```

#### **3.4: Update `update()` Method**

Find the `update()` method and replace with this:

```php
use App\Rules\SubjectAssignedToGrade;
use App\Rules\TeacherAssignedToGrade;

public function update(Request $request, TimetableSlot $slot)
{
    // Load relationships
    $slot->load('timetableTemplate.grade');
    $template = $slot->timetableTemplate;
    $grade = $template->grade;

    // Check authorization
    $this->authorize('update', $slot);

    // Base validation rules
    $rules = [
        'timetable_period_id' => 'required|exists:timetable_periods,id',
        'day_of_week' => 'required|in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
        'slot_type' => 'required|in:lesson,break,lunch,assembly,activity,study,other',
        'room_id' => 'nullable|exists:rooms,id',
        'notes' => 'nullable|string|max:500',
    ];

    // Conditional validation based on slot_type
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
        $rules['topic'] = 'nullable|string|max:255';
    } else {
        $rules['subject_id'] = 'nullable';
        $rules['teacher_id'] = 'nullable';
    }

    $validated = $request->validate($rules);

    // Update slot
    $slot->update($validated);

    // ✅ NEW: Check session count compliance (warning, not blocking)
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

    return redirect()->route('timetables.slots.index', ['template_id' => $template->id])
        ->with('success', 'Timetable slot updated successfully');
}
```

---

### **STEP 4: Update UI Forms**

#### **4.1: Update Create Form**

Open `resources/views/timetables/slots/create.blade.php`

Find the subject dropdown and replace with:

```blade
<!-- Subject Dropdown - Only for lesson slots -->
<div x-show="slotType === 'lesson'" class="mb-4">
    <label for="subject_id" class="block text-sm font-medium text-gray-700">
        Subject <span class="text-red-500">*</span>
    </label>
    <select
        name="subject_id"
        id="subject_id"
        :required="slotType === 'lesson'"
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
    >
        <option value="">Select Subject</option>
        @foreach($subjects as $subject)
            <option value="{{ $subject->id }}" {{ old('subject_id') == $subject->id ? 'selected' : '' }}>
                {{ $subject->name }}
                ({{ $subject->pivot->sessions_per_week }} sessions/week required)
            </option>
        @endforeach
    </select>
    @error('subject_id')
        <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
    @enderror

    @if($subjects->isEmpty())
        <p class="mt-1 text-sm text-yellow-600">
            ⚠️ No subjects assigned to {{ $grade->name }}.
            <a href="{{ route('grades.edit', $grade) }}" class="underline">Assign subjects first</a>
        </p>
    @endif
</div>
```

Find the teacher dropdown and replace with:

```blade
<!-- Teacher Dropdown - For lesson, assembly, activity slots -->
<div x-show="['lesson', 'assembly', 'activity'].includes(slotType)" class="mb-4">
    <label for="teacher_id" class="block text-sm font-medium text-gray-700">
        Teacher <span x-show="slotType === 'lesson'" class="text-red-500">*</span>
    </label>
    <select
        name="teacher_id"
        id="teacher_id"
        :required="slotType === 'lesson'"
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
    >
        <option value="">Select Teacher</option>
        @foreach($teachers as $teacher)
            <option value="{{ $teacher->id }}" {{ old('teacher_id') == $teacher->id ? 'selected' : '' }}>
                {{ $teacher->user->name }}
                @if($teacher->pivot->is_class_teacher)
                    <span class="text-blue-600">(Class Teacher)</span>
                @endif
            </option>
        @endforeach
    </select>
    @error('teacher_id')
        <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
    @enderror

    @if($teachers->isEmpty())
        <p class="mt-1 text-sm text-yellow-600">
            ⚠️ No teachers assigned to {{ $grade->name }}.
            <a href="{{ route('grades.edit', $grade) }}" class="underline">Assign teachers first</a>
        </p>
    @endif
</div>
```

Add Alpine.js data if not already present:

```blade
<div x-data="{ slotType: '{{ old('slot_type', 'lesson') }}' }">
    <!-- Slot Type Dropdown -->
    <div class="mb-4">
        <label for="slot_type" class="block text-sm font-medium text-gray-700">
            Slot Type <span class="text-red-500">*</span>
        </label>
        <select
            name="slot_type"
            id="slot_type"
            x-model="slotType"
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
            <option value="lesson">Lesson</option>
            <option value="break">Break</option>
            <option value="lunch">Lunch</option>
            <option value="assembly">Assembly</option>
            <option value="activity">Activity</option>
            <option value="study">Study Period</option>
            <option value="other">Other</option>
        </select>
    </div>

    <!-- Subject and Teacher dropdowns here -->
</div>
```

#### **4.2: Update Edit Form**

Apply the same changes to `resources/views/timetables/slots/edit.blade.php`

---

### **STEP 5: Testing**

#### **5.1: Manual Testing Checklist**

- [ ] Create a grade with subjects and teachers
- [ ] Create a timetable template for that grade
- [ ] Try to create a lesson slot with a subject NOT in the grade → Should fail
- [ ] Try to create a lesson slot with a teacher NOT in the grade → Should fail
- [ ] Try to create a lesson slot with valid subject and teacher → Should succeed
- [ ] Check if warning appears when session count doesn't match quota
- [ ] Try to create a break slot → Should not require subject/teacher
- [ ] Edit an existing slot and change subject to invalid one → Should fail
- [ ] Check that dropdowns only show grade's subjects and teachers

#### **5.2: Edge Cases**

- [ ] Grade with no subjects assigned → Should show warning in form
- [ ] Grade with no teachers assigned → Should show warning in form
- [ ] Soft-deleted subject → Should not appear in dropdown
- [ ] Inactive teacher → Should not appear in dropdown
- [ ] Changing slot type from lesson to break → Should clear subject/teacher

#### **5.3: UI Testing**

- [ ] Subject dropdown shows session quota
- [ ] Teacher dropdown shows class teacher badge
- [ ] Warning messages display correctly
- [ ] Error messages are clear and actionable
- [ ] Links to grade management work

---

## ✅ COMPLETION CHECKLIST

- [ ] All 8 validation helper methods added to Grade model
- [ ] SubjectAssignedToGrade rule created
- [ ] TeacherAssignedToGrade rule created
- [ ] TimetableSlotController::create() updated
- [ ] TimetableSlotController::store() updated
- [ ] TimetableSlotController::edit() updated
- [ ] TimetableSlotController::update() updated
- [ ] Create form updated with filtered dropdowns
- [ ] Edit form updated with filtered dropdowns
- [ ] Alpine.js conditional display working
- [ ] Warning system functional
- [ ] All manual tests passed
- [ ] All edge cases handled
- [ ] UI feedback clear and helpful

---

## 🚨 TROUBLESHOOTING

### **Issue: Validation rule not found**
**Solution:** Make sure you imported the rules at the top of the controller:
```php
use App\Rules\SubjectAssignedToGrade;
use App\Rules\TeacherAssignedToGrade;
```

### **Issue: Method not found on Grade model**
**Solution:** Clear cache and check that methods are added:
```bash
php artisan cache:clear
php artisan config:clear
```

### **Issue: Dropdowns showing all subjects/teachers**
**Solution:** Check that you're calling `$grade->getAllowedSubjects()` not `Subject::all()`

### **Issue: Warning not showing**
**Solution:** Check that you have `@if(session('warning'))` in your layout

---

**Status:** ✅ READY TO IMPLEMENT
**Next:** Begin with Step 1 - Add validation helpers to Grade model
```


