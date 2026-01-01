# 🚀 QUICK REFERENCE: Grade & Timetable Integration

**Last Updated:** 2025-12-26  
**For:** Developers working on timetable validation fixes

---

## 📋 THE PROBLEM IN 30 SECONDS

The **Grade Module** defines curriculum (what subjects, how many sessions, which teachers).  
The **Timetable Module** creates schedules (actual lesson slots).  
**BUT:** Timetable creation has **ZERO validation** against grade curriculum.

**Result:** You can create invalid timetables that violate curriculum rules.

---

## 🔴 CRITICAL ISSUES

### **Issue #1: Orphaned `sessions_per_week`**
```php
// Grade Module: Admin sets this
$grade->subjects()->attach($subjectId, [
    'sessions_per_week' => 5  // Math should have 5 sessions/week
]);

// Timetable Module: NEVER checks it
TimetableSlot::create([...]);  // Can create 3 slots or 10 slots - no validation!
```

**Impact:** The `sessions_per_week` field is meaningless.

---

### **Issue #2: No Subject-Grade Validation**
```php
// Can assign "Grade 1 Math" to "Grade 5 Timetable"
TimetableSlot::create([
    'timetable_template_id' => $grade5Template->id,
    'subject_id' => $grade1Math->id,  // ❌ No validation!
]);
```

**Impact:** Breaks curriculum integrity.

---

### **Issue #3: No Teacher-Grade Validation**
```php
// Can assign teacher to grade they don't teach
TimetableSlot::create([
    'timetable_template_id' => $grade5Template->id,
    'teacher_id' => $teacherNotInGrade5->id,  // ❌ No validation!
]);
```

**Impact:** Conflicts with `grade_teacher` assignments.

---

## ✅ THE FIX (High-Level)

### **Step 1: Add Validation Rules**
```php
// In TimetableSlotController::store()
$validated = $request->validate([
    'subject_id' => [
        'required',
        'exists:subjects,id',
        new SubjectAssignedToGrade($template->grade_id),  // NEW
    ],
    'teacher_id' => [
        'required',
        'exists:teachers,id',
        new TeacherAssignedToGrade($template->grade_id),  // NEW
    ],
]);
```

### **Step 2: Add Warning System**
```php
// After creating slots, check sessions_per_week
$subjectSlotCount = $template->slots()
    ->where('subject_id', $subjectId)
    ->count();

$expectedSessions = $template->grade->subjects()
    ->where('subject_id', $subjectId)
    ->first()
    ->pivot
    ->sessions_per_week;

if ($subjectSlotCount !== $expectedSessions) {
    session()->flash('warning', "Math has {$subjectSlotCount} slots but should have {$expectedSessions}");
}
```

### **Step 3: Add UI Feedback**
- Show curriculum summary when creating slots
- Highlight subjects with incorrect slot counts
- Show validation errors in real-time

---

## 📊 KEY MODELS & RELATIONSHIPS

### **Grade → Subjects**
```php
$grade->subjects  // Collection of subjects
    ->first()
    ->pivot
    ->sessions_per_week  // ⚠️ Currently orphaned
```

### **Grade → Teachers**
```php
$grade->teachers  // Collection of teachers assigned to this grade
    ->first()
    ->pivot
    ->is_class_teacher  // Boolean flag
```

### **TimetableTemplate → Grade**
```php
$template->grade  // The grade this timetable is for
$template->slots  // All lesson slots in this timetable
```

### **TimetableSlot → Subject & Teacher**
```php
$slot->subject  // ⚠️ Should be in $template->grade->subjects
$slot->teacher  // ⚠️ Should be in $template->grade->teachers
```

---

## 🔍 WHERE TO LOOK

### **Controllers**
- `app/Http/Controllers/TimetableSlotController.php` - **MAIN FIX LOCATION**
- `app/Http/Controllers/GradeController.php` - Where `sessions_per_week` is set

### **Models**
- `app/Models/Grade.php` - Has `subjects()` and `teachers()` relationships
- `app/Models/TimetableTemplate.php` - Has `grade` relationship
- `app/Models/TimetableSlot.php` - Needs validation

### **Migrations**
- `database/migrations/*_create_grade_subject_table.php` - Has `sessions_per_week`
- `database/migrations/*_create_timetable_slots_table.php` - Foreign keys

### **Policies**
- `app/Policies/TimetableSlotPolicy.php` - Authorization rules

---

## 🧪 TESTING CHECKLIST

### **Test Case 1: Subject Validation**
```php
// Should FAIL
$slot = TimetableSlot::create([
    'timetable_template_id' => $grade5Template->id,
    'subject_id' => $subjectNotInGrade5->id,  // ❌
]);
```

### **Test Case 2: Teacher Validation**
```php
// Should FAIL
$slot = TimetableSlot::create([
    'timetable_template_id' => $grade5Template->id,
    'teacher_id' => $teacherNotInGrade5->id,  // ❌
]);
```

### **Test Case 3: Sessions Per Week Warning**
```php
// Should show WARNING (not error)
// Create 3 slots for Math when sessions_per_week = 5
// Expected: Flash message warning about mismatch
```

---

## 📝 IMPLEMENTATION PRIORITY

### **Priority 1: Blocking Validation (MUST FIX)**
1. ✅ Validate subject is assigned to grade
2. ✅ Validate teacher is assigned to grade

### **Priority 2: Warning System (SHOULD FIX)**
3. ⚠️ Warn when slot count ≠ sessions_per_week
4. ⚠️ Show curriculum summary in UI

### **Priority 3: Nice-to-Have**
5. 💡 Real-time validation in form
6. 💡 Bulk validation report
7. 💡 Auto-suggest based on curriculum

---

## 🚨 GOTCHAS

1. **Soft Deletes:** Grades and subjects use soft deletes - check `deleted_at`
2. **Multi-Tenancy:** All queries auto-scoped by `school_id` via `BelongsToSchool` trait
3. **Draft vs Published:** Can only edit slots in `draft` templates (policy enforced)
4. **Break Slots:** Break/lunch slots have `subject_id = NULL` and `teacher_id = NULL` (CHECK constraint)

---

## 🔗 RELATED DOCS

- `docs/PHASE_0_SYSTEM_MAP.md` - Complete system analysis
- `docs/TIMETABLE_SYSTEM_COMPLETE.md` - Original timetable documentation
- `docs/PHASE_2_COMPLETE.md` - Phase 2 implementation notes

---

**Ready to fix?** Start with `TimetableSlotController::store()` and add the validation rules! 🚀

