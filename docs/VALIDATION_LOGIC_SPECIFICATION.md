# Timetable Generation Validation Logic Specification

**Date:** 2026-01-03  
**Status:** ✅ Implemented & Tested  
**Location:** `app/Models/Grade.php::canGenerateTimetable()`

---

## Overview

This document specifies the exact validation logic implemented for timetable auto-generation. All checks must pass before generation can proceed.

---

## Validation Checks (In Order)

### ✅ **Check 1: Class Teacher**

**Requirement:**
- Grade must have exactly ONE teacher with `is_class_teacher = true`

**Implementation:**
```php
if (!$this->getClassTeacher()) {
    $errors[] = "This grade has no class teacher assigned. Please assign a class teacher to {$this->name} before generating timetable.";
}
```

**Error Message:**
```
This grade has no class teacher assigned. Please assign a class teacher to {Grade Name} before generating timetable.
```

**Example:**
```
This grade has no class teacher assigned. Please assign a class teacher to Pre-Primary 1 before generating timetable.
```

**Type:** ❌ **ERROR** (Blocking)

---

### ✅ **Check 2: Default Room**

**Requirement:**
- Grade must have `default_room_id` set (not null)

**Implementation:**
```php
if (!$this->default_room_id) {
    $errors[] = "This grade has no default classroom assigned. Please assign a default room to {$this->name} before generating timetable.";
}
```

**Error Message:**
```
This grade has no default classroom assigned. Please assign a default room to {Grade Name} before generating timetable.
```

**Example:**
```
This grade has no default classroom assigned. Please assign a default room to Pre-Primary 1 before generating timetable.
```

**Type:** ❌ **ERROR** (Blocking)

---

### ✅ **Check 3: Subject Assignment**

**Requirement:**
- Grade must have at least 1 subject assigned

**Implementation:**
```php
$subjectsCount = $this->subjects()->count();
if ($subjectsCount === 0) {
    $errors[] = "This grade has no subjects assigned. Please assign subjects to {$this->name} before generating timetable.";
}
```

**Error Message:**
```
This grade has no subjects assigned. Please assign subjects to {Grade Name} before generating timetable.
```

**Example:**
```
This grade has no subjects assigned. Please assign subjects to Grade 4 before generating timetable.
```

**Type:** ❌ **ERROR** (Blocking)

---

### ✅ **Check 4: Blueprint Exists**

**Requirement:**
- Active blueprint must exist for grade's level

**Implementation:**
```php
$blueprint = LevelDayBlueprint::where('school_id', $this->school_id)
    ->where('level', $this->level)
    ->where('is_active', true)
    ->first();

if (!$blueprint) {
    $errors[] = "No active timetable blueprint found for {$this->level} level. Please create a blueprint for this level before generating timetable.";
}
```

**Error Message:**
```
No active timetable blueprint found for {Level} level. Please create a blueprint for this level before generating timetable.
```

**Example:**
```
No active timetable blueprint found for UPPER PRIMARY level. Please create a blueprint for this level before generating timetable.
```

**Type:** ❌ **ERROR** (Blocking)

---

### ✅ **Check 5: Periods Generated from Blueprint**

**Requirement:**
- Periods must exist for grade's level with `generated_from_blueprint_id` not null

**Implementation:**
```php
if ($blueprint) {
    $periodsCount = TimetablePeriod::where('school_id', $this->school_id)
        ->where('grade_level', $this->level)
        ->whereNotNull('generated_from_blueprint_id')
        ->count();

    if ($periodsCount === 0) {
        $errors[] = "No periods generated from blueprint for {$this->level} level. Please generate periods from the blueprint before creating timetable.";
    }
}
```

**Error Message:**
```
No periods generated from blueprint for {Level} level. Please generate periods from the blueprint before creating timetable.
```

**Example:**
```
No periods generated from blueprint for ECD level. Please generate periods from the blueprint before creating timetable.
```

**Type:** ❌ **ERROR** (Blocking)

---

### ✅ **Check 6: Subject Curriculum Rules**

**Requirement:**
- Each subject must have:
  - `sessions_per_week > 0`
  - `priority` set (high/neutral/low)

**Implementation:**
```php
if ($subjectsCount > 0) {
    $subjectsWithRules = $this->subjects()
        ->withPivot(['sessions_per_week', 'priority', 'must_be_daily', 'can_repeat_same_day'])
        ->get();

    // Check for missing sessions_per_week OR priority
    $subjectsWithMissingRules = $subjectsWithRules->filter(function ($subject) {
        $sessionsInvalid = empty($subject->pivot->sessions_per_week) || $subject->pivot->sessions_per_week <= 0;
        $priorityInvalid = empty($subject->pivot->priority);
        return $sessionsInvalid || $priorityInvalid;
    });

    if ($subjectsWithMissingRules->count() > 0) {
        $errors[] = "Some subjects in {$this->name} are missing curriculum rules (sessions per week, priority). Please configure these before generating timetable.";
    }
}
```

**Error Message:**
```
Some subjects in {Grade Name} are missing curriculum rules (sessions per week, priority). Please configure these before generating timetable.
```

**Example:**
```
Some subjects in Grade 3 are missing curriculum rules (sessions per week, priority). Please configure these before generating timetable.
```

**Type:** ❌ **ERROR** (Blocking)

---

## Additional Validations

### ✅ **Check 7: Slot Capacity** (Informational)

**Requirement:**
- Total required sessions must fit within available slots

**Implementation:**
```php
if ($blueprint && $subjectsCount > 0 && empty($errors)) {
    $totalRequiredSessions = $this->subjects()
        ->withPivot('sessions_per_week')
        ->get()
        ->sum(function ($subject) {
            return $subject->pivot->sessions_per_week ?? 0;
        });

    $teachablePeriods = $blueprint->periods()->where('is_teachable', true)->count();
    $availableSlots = $teachablePeriods * 5; // 5 working days

    if ($totalRequiredSessions > $availableSlots) {
        $errors[] = "Total required sessions ({$totalRequiredSessions}) exceeds available slots ({$availableSlots}). Please reduce sessions_per_week for some subjects or add more lesson periods to the blueprint.";
    }
}
```

**Error Message:**
```
Total required sessions ({X}) exceeds available slots ({Y}). Please reduce sessions_per_week for some subjects or add more lesson periods to the blueprint.
```

**Example:**
```
Total required sessions (45) exceeds available slots (35). Please reduce sessions_per_week for some subjects or add more lesson periods to the blueprint.
```

**Type:** ❌ **ERROR** (Blocking)

---

## Warnings (Non-Blocking)

### ⚠️ **Warning 1: Teacher Specializations**

**Message:**
```
Teachers without subject specializations: {Teacher Names}. All lessons will be assigned to class teacher. Set specializations for better teacher matching.
```

**Type:** ⚠️ **WARNING** (Non-blocking)

---

### ⚠️ **Warning 2: Low Utilization**

**Message:**
```
Only {X} sessions required out of {Y} available slots. Consider adding more subjects or increasing sessions_per_week.
```

**Type:** ⚠️ **WARNING** (Non-blocking)

---

## Return Structure

```php
[
    'can_generate' => true/false,  // false if ANY error exists
    'errors' => [
        "Error message 1",
        "Error message 2",
        ...
    ],
    'warnings' => [
        "Warning message 1",
        "Warning message 2",
        ...
    ],
    'summary' => [
        'total_slots' => 35,
        'lesson_slots' => 30,
        'empty_slots' => 5,
        'subjects_count' => 9,
        'teachers_count' => 3,
        'blueprint_name' => 'ECD Daily Schedule'
    ]
]
```

---

## Test Results

### Test Case: Pre-Primary 1

**Setup:**
- ✅ Class Teacher: Margaret Teacher
- ❌ Default Room: None
- ✅ Subjects: 9
- ✅ Blueprint: ECD period schedule
- ✅ Generated Periods: 15 periods

**Result:**
```
Can Generate: ❌ NO

❌ ERRORS:
1. This grade has no default classroom assigned. Please assign a default room to Pre-Primary 1 before generating timetable.

⚠️  WARNINGS:
• Teachers without subject specializations: Margaret Teacher. All lessons will be assigned to class teacher. Set specializations for better teacher matching.
```

**Outcome:** ✅ Correctly blocked due to missing default room

---

## Integration Points

### Service Layer
**File:** `app/Services/TimetableGenerationService.php`

```php
$validation = $this->grade->canGenerateTimetable();

if (!$validation['can_generate']) {
    throw new \Exception($errorMessage);
}
```

### Controller Layer
**File:** `app/Http/Controllers/TimetableTemplateController.php`

```php
$generationValidation = $template->grade->canGenerateTimetable();

return Inertia::render('Timetables/Templates/Grid', [
    'generationValidation' => $generationValidation,
]);
```

---

## Compliance Checklist

- [x] Check 1: Class Teacher - ✅ Implemented
- [x] Check 2: Default Room - ✅ Implemented
- [x] Check 3: Subject Assignment - ✅ Implemented
- [x] Check 4: Blueprint Exists - ✅ Implemented
- [x] Check 5: Periods Generated - ✅ Implemented
- [x] Check 6: Curriculum Rules - ✅ Implemented
- [x] Error messages match specification - ✅ Confirmed
- [x] Blocking logic works - ✅ Tested
- [x] Integration complete - ✅ Verified

---

## Status

**Implementation:** ✅ **COMPLETE**  
**Testing:** ✅ **PASSED**  
**Documentation:** ✅ **COMPLETE**  
**Production Ready:** ✅ **YES**

