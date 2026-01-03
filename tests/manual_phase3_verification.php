<?php

/**
 * Manual Phase 3 Verification Script
 * 
 * Run this in Tinker: php artisan tinker < tests/manual_phase3_verification.php
 * 
 * This script verifies:
 * 1. Grade has class teacher
 * 2. Grade has subjects
 * 3. Blueprint exists and is active
 * 4. Periods generated from blueprint
 * 5. Timetable generation succeeds
 * 6. All lesson slots have class teacher assigned
 * 7. auto_assigned_teacher flag is set
 */

use App\Models\Grade;
use App\Models\TimetableTemplate;
use App\Models\TimetableSlot;
use App\Services\TimetableGenerationService;

echo "\n=== PHASE 3 VERIFICATION ===\n\n";

// Step 1: Find a grade with class teacher
echo "Step 1: Finding grade with class teacher...\n";
$grade = Grade::whereHas('teachers', function($q) {
    $q->wherePivot('is_class_teacher', true);
})->with(['teachers', 'subjects'])->first();

if (!$grade) {
    echo "❌ No grade found with class teacher. Please create one first.\n";
    exit(1);
}

echo "✅ Found grade: {$grade->name} (Level: {$grade->level})\n";

$classTeacher = $grade->getClassTeacher();
echo "✅ Class teacher: {$classTeacher->user->name}\n";

// Step 2: Check subjects
echo "\nStep 2: Checking subjects...\n";
$subjects = $grade->subjects;
if ($subjects->isEmpty()) {
    echo "❌ Grade has no subjects assigned.\n";
    exit(1);
}
echo "✅ Grade has {$subjects->count()} subjects\n";

// Step 3: Check blueprint
echo "\nStep 3: Checking blueprint...\n";
$blueprint = $grade->activeBlueprint();
if (!$blueprint) {
    echo "❌ No active blueprint found for level: {$grade->level}\n";
    exit(1);
}
echo "✅ Active blueprint: {$blueprint->name}\n";
echo "   Periods: {$blueprint->periods->count()}\n";

// Step 4: Check periods generated from blueprint
echo "\nStep 4: Checking generated periods...\n";
$periods = \App\Models\TimetablePeriod::where('school_id', $grade->school_id)
    ->where('grade_level', $grade->level)
    ->whereNotNull('generated_from_blueprint_id')
    ->get();

if ($periods->isEmpty()) {
    echo "❌ No periods generated from blueprint.\n";
    exit(1);
}
echo "✅ Found {$periods->count()} generated periods\n";

// Step 5: Validation check
echo "\nStep 5: Running validation...\n";
$validation = $grade->canGenerateTimetable();
if (!$validation['can_generate']) {
    echo "❌ Validation failed:\n";
    foreach ($validation['errors'] as $error) {
        echo "   - $error\n";
    }
    exit(1);
}
echo "✅ Validation passed\n";

// Step 6: Find or create template
echo "\nStep 6: Finding/creating template...\n";
$academicTerm = \App\Models\AcademicTerm::where('school_id', $grade->school_id)
    ->where('is_current', true)
    ->first();

if (!$academicTerm) {
    echo "❌ No current academic term found.\n";
    exit(1);
}

$template = TimetableTemplate::where('grade_id', $grade->id)
    ->where('academic_term_id', $academicTerm->id)
    ->where('status', 'draft')
    ->first();

if (!$template) {
    $template = TimetableTemplate::create([
        'school_id' => $grade->school_id,
        'grade_id' => $grade->id,
        'academic_term_id' => $academicTerm->id,
        'name' => "Phase 3 Test - {$grade->name}",
        'status' => 'draft',
        'effective_from' => now(),
    ]);
    echo "✅ Created new template: {$template->name}\n";
} else {
    echo "✅ Using existing template: {$template->name}\n";
}

// Step 7: Generate timetable
echo "\nStep 7: Generating timetable...\n";
try {
    $service = new TimetableGenerationService();
    $result = $service->generate($template);
    
    echo "✅ Generation successful!\n";
    echo "   Total slots: {$result['generated']}\n";
    echo "   Lesson slots: {$result['lessons']}\n";
    echo "   Break slots: {$result['breaks']}\n";
} catch (\Exception $e) {
    echo "❌ Generation failed: {$e->getMessage()}\n";
    exit(1);
}

// Step 8: Verify lesson slots have class teacher
echo "\nStep 8: Verifying teacher assignments...\n";
$lessonSlots = $template->slots()->where('is_teachable', true)->get();
$slotsWithTeacher = $lessonSlots->where('teacher_id', $classTeacher->id)->count();
$slotsWithAutoFlag = $lessonSlots->where('auto_assigned_teacher', true)->count();

echo "   Lesson slots: {$lessonSlots->count()}\n";
echo "   Slots with class teacher: {$slotsWithTeacher}\n";
echo "   Slots with auto_assigned_teacher flag: {$slotsWithAutoFlag}\n";

if ($slotsWithTeacher === $lessonSlots->count()) {
    echo "✅ All lesson slots have class teacher assigned\n";
} else {
    echo "❌ Not all lesson slots have class teacher assigned\n";
}

if ($slotsWithAutoFlag === $lessonSlots->count()) {
    echo "✅ All lesson slots have auto_assigned_teacher flag set\n";
} else {
    echo "❌ Not all lesson slots have auto_assigned_teacher flag set\n";
}

// Step 9: Verify break slots have no teacher
echo "\nStep 9: Verifying break slots...\n";
$breakSlots = $template->slots()->where('is_teachable', false)->get();
$breakSlotsWithTeacher = $breakSlots->whereNotNull('teacher_id')->count();

echo "   Break slots: {$breakSlots->count()}\n";
echo "   Break slots with teacher: {$breakSlotsWithTeacher}\n";

if ($breakSlotsWithTeacher === 0) {
    echo "✅ No break slots have teachers assigned\n";
} else {
    echo "❌ Some break slots have teachers assigned\n";
}

echo "\n=== VERIFICATION COMPLETE ===\n\n";
echo "Summary:\n";
echo "✅ Grade: {$grade->name}\n";
echo "✅ Class Teacher: {$classTeacher->user->name}\n";
echo "✅ Template: {$template->name}\n";
echo "✅ Total Slots: {$result['generated']}\n";
echo "✅ Lesson Slots with Class Teacher: {$slotsWithTeacher}/{$lessonSlots->count()}\n";
echo "✅ Auto-assigned Flag Set: {$slotsWithAutoFlag}/{$lessonSlots->count()}\n";
echo "\n";

