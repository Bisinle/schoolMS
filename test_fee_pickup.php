<?php

/**
 * Diagnostic script to test fee pickup issue in production
 * Run with: php test_fee_pickup.php
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\AcademicTerm;
use App\Models\FeeAmount;
use App\Models\FeeCategory;
use App\Models\Grade;
use App\Models\Student;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

echo "🔍 PRODUCTION FEE PICKUP DIAGNOSTIC\n\n";

// Simulate authenticated user (replace with actual school admin user ID)
echo "Enter school admin user ID: ";
$userId = trim(fgets(STDIN));

if (!$userId) {
    echo "❌ No user ID provided\n";
    exit(1);
}

// Login as this user
$user = DB::table('users')->find($userId);
if (!$user) {
    echo "❌ User not found\n";
    exit(1);
}

Auth::loginUsingId($userId);
echo "✅ Logged in as: {$user->name} (School ID: {$user->school_id})\n\n";

// 1. Check active academic term
echo "1️⃣ ACTIVE ACADEMIC TERM:\n";
$activeTerm = AcademicTerm::where('is_active', true)->with('academicYear')->first();
if ($activeTerm) {
    echo "   Term: {$activeTerm->academicYear->year} - Term {$activeTerm->term_number}\n";
    echo "   Academic Year ID: {$activeTerm->academic_year_id}\n";
} else {
    echo "   ❌ NO ACTIVE TERM FOUND!\n";
    exit(1);
}
echo "\n";

// 2. Check fee categories
echo "2️⃣ FEE CATEGORIES:\n";
$categories = FeeCategory::all();
echo "   Total categories: {$categories->count()}\n";
foreach ($categories as $cat) {
    echo "   - {$cat->name} (ID: {$cat->id}, Active: " . ($cat->is_active ? 'YES' : 'NO') . ", School: {$cat->school_id})\n";
}
echo "\n";

// 3. Check fee amounts for active year
echo "3️⃣ FEE AMOUNTS FOR ACTIVE YEAR (ID: {$activeTerm->academic_year_id}):\n";
$feeAmounts = FeeAmount::with('feeCategory')
    ->where('academic_year_id', $activeTerm->academic_year_id)
    ->get();

echo "   Total fee amounts: {$feeAmounts->count()}\n";
if ($feeAmounts->isEmpty()) {
    echo "   ❌ NO FEE AMOUNTS FOUND FOR THIS YEAR!\n";
} else {
    foreach ($feeAmounts as $fee) {
        echo "   ✅ {$fee->feeCategory->name}: KSh " . number_format($fee->amount, 2);
        echo " (Grade Range: " . ($fee->grade_range ?? 'ALL') . ")";
        echo " [Active: " . ($fee->is_active ? 'YES' : 'NO') . "]";
        echo " [Category Active: " . ($fee->feeCategory->is_active ? 'YES' : 'NO') . "]";
        echo " [School: {$fee->school_id}]\n";
    }
}
echo "\n";

// 4. Check grades
echo "4️⃣ GRADES IN SYSTEM:\n";
$grades = Grade::all();
foreach ($grades as $grade) {
    echo "   - {$grade->name} (ID: {$grade->id})\n";
}
echo "\n";

// 5. Test fee retrieval for each grade
echo "5️⃣ TESTING FEE RETRIEVAL FOR EACH GRADE:\n";
foreach ($grades as $grade) {
    echo "   Testing grade: {$grade->name}\n";
    
    // Method 1: Using the static method
    $fees1 = FeeAmount::getApplicableFeesForGrade($grade->name, $activeTerm->academic_year_id);
    echo "      Method 1 (getApplicableFeesForGrade): {$fees1->count()} fees\n";
    
    // Method 2: Manual query to debug
    $fees2 = FeeAmount::with('feeCategory')
        ->where('is_active', true)
        ->where('academic_year_id', $activeTerm->academic_year_id)
        ->whereHas('feeCategory', function ($query) {
            $query->where('is_active', true);
        })
        ->get();
    echo "      Method 2 (manual query before filter): {$fees2->count()} fees\n";
    
    // Apply filter manually
    $fees3 = $fees2->filter(function ($feeAmount) use ($grade) {
        return $feeAmount->appliesToGrade($grade->name);
    });
    echo "      Method 3 (after appliesToGrade filter): {$fees3->count()} fees\n";
    
    if ($fees3->count() > 0) {
        echo "         → " . $fees3->pluck('feeCategory.name')->implode(', ') . "\n";
    }
    echo "\n";
}

// 6. Test with a specific student
echo "6️⃣ TESTING WITH ACTUAL STUDENT:\n";
$student = Student::where('status', 'active')->whereHas('guardians')->with('grade')->first();
if ($student) {
    echo "   Student: {$student->first_name} {$student->last_name}\n";
    echo "   Grade: {$student->grade->name}\n";
    
    $fees = FeeAmount::getApplicableFeesForGrade($student->grade->name, $activeTerm->academic_year_id);
    echo "   Applicable fees: {$fees->count()}\n";
    
    if ($fees->count() > 0) {
        foreach ($fees as $fee) {
            echo "      - {$fee->feeCategory->name}: KSh " . number_format($fee->amount, 2) . "\n";
        }
    } else {
        echo "   ❌ NO FEES FOUND FOR THIS STUDENT!\n";
    }
} else {
    echo "   ❌ No active students with guardians found\n";
}

echo "\n✅ Diagnostic complete!\n";

