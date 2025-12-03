<?php

namespace App\Console\Commands;

use App\Models\AcademicTerm;
use App\Models\FeeAmount;
use App\Models\FeeCategory;
use App\Models\Grade;
use App\Models\Student;
use App\Models\Scopes\SchoolScope;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Auth;

class DiagnoseFeePickup extends Command
{
    protected $signature = 'fees:diagnose {user_id : The ID of a school admin user}';
    protected $description = 'Diagnose why fees are not being picked up during invoice generation';

    public function handle()
    {
        $userId = $this->argument('user_id');
        
        // Login as the specified user
        Auth::loginUsingId($userId);
        $user = Auth::user();
        
        if (!$user) {
            $this->error("User with ID {$userId} not found");
            return 1;
        }
        
        $this->info("🔍 PRODUCTION FEE PICKUP DIAGNOSTIC");
        $this->info("Logged in as: {$user->name} (School ID: {$user->school_id})");
        $this->newLine();
        
        // 1. Check active academic term
        $this->info("1️⃣ ACTIVE ACADEMIC TERM:");
        $activeTerm = AcademicTerm::where('is_active', true)->with('academicYear')->first();
        
        if (!$activeTerm) {
            $this->error("   ❌ NO ACTIVE TERM FOUND!");
            return 1;
        }
        
        $this->line("   Term: {$activeTerm->academicYear->year} - Term {$activeTerm->term_number}");
        $this->line("   Academic Year ID: {$activeTerm->academic_year_id}");
        $this->newLine();
        
        // 2. Check school ID consistency
        $this->info("2️⃣ SCHOOL ID CONSISTENCY CHECK:");
        $this->line("   Current user school_id: {$user->school_id}");
        
        $categoriesWithWrongSchool = FeeCategory::withoutGlobalScope(SchoolScope::class)
            ->where('school_id', '!=', $user->school_id)
            ->count();
        
        $amountsWithWrongSchool = FeeAmount::withoutGlobalScope(SchoolScope::class)
            ->where('school_id', '!=', $user->school_id)
            ->count();
        
        if ($categoriesWithWrongSchool > 0 || $amountsWithWrongSchool > 0) {
            $this->error("   ❌ SCHOOL ID MISMATCH FOUND!");
            $this->error("      Fee categories with wrong school_id: {$categoriesWithWrongSchool}");
            $this->error("      Fee amounts with wrong school_id: {$amountsWithWrongSchool}");
            $this->newLine();
            
            if ($this->confirm('Do you want to fix the school_id mismatch?')) {
                FeeCategory::withoutGlobalScope(SchoolScope::class)->update(['school_id' => $user->school_id]);
                FeeAmount::withoutGlobalScope(SchoolScope::class)->update(['school_id' => $user->school_id]);
                $this->info("   ✅ Fixed school_id for all fee categories and amounts");
            }
        } else {
            $this->info("   ✅ All fees have correct school_id");
        }
        $this->newLine();
        
        // 3. Check fee amounts for active year
        $this->info("3️⃣ FEE AMOUNTS FOR ACTIVE YEAR (ID: {$activeTerm->academic_year_id}):");
        $feeAmounts = FeeAmount::with('feeCategory')
            ->where('academic_year_id', $activeTerm->academic_year_id)
            ->get();
        
        if ($feeAmounts->isEmpty()) {
            $this->error("   ❌ NO FEE AMOUNTS FOUND FOR THIS YEAR!");
            $this->newLine();
            return 1;
        }
        
        $this->line("   Total fee amounts: {$feeAmounts->count()}");
        foreach ($feeAmounts as $fee) {
            $status = ($fee->is_active && $fee->feeCategory->is_active) ? '✅' : '❌';
            $this->line("   {$status} {$fee->feeCategory->name}: KSh " . number_format($fee->amount, 2) .
                " (Range: " . ($fee->grade_range ?? 'ALL') . ")" .
                " [Fee Active: " . ($fee->is_active ? 'YES' : 'NO') . "]" .
                " [Category Active: " . ($fee->feeCategory->is_active ? 'YES' : 'NO') . "]");
        }
        $this->newLine();
        
        // 4. Check grades
        $this->info("4️⃣ GRADES IN SYSTEM:");
        $grades = Grade::all();
        foreach ($grades as $grade) {
            $this->line("   - {$grade->name} (ID: {$grade->id})");
        }
        $this->newLine();
        
        // 5. Test fee retrieval for each grade
        $this->info("5️⃣ TESTING FEE RETRIEVAL FOR EACH GRADE:");
        foreach ($grades as $grade) {
            $fees = FeeAmount::getApplicableFeesForGrade($grade->name, $activeTerm->academic_year_id);
            
            if ($fees->count() > 0) {
                $this->info("   ✅ Grade {$grade->name}: {$fees->count()} fees (" . 
                    $fees->pluck('feeCategory.name')->implode(', ') . ")");
            } else {
                $this->error("   ❌ Grade {$grade->name}: NO FEES FOUND");
            }
        }
        $this->newLine();
        
        // 6. Test with actual student
        $this->info("6️⃣ TESTING WITH ACTUAL STUDENT:");
        $student = Student::where('status', 'active')
            ->whereHas('guardians')
            ->with('grade')
            ->first();
        
        if ($student) {
            $this->line("   Student: {$student->first_name} {$student->last_name}");
            $this->line("   Grade: {$student->grade->name}");
            
            $fees = FeeAmount::getApplicableFeesForGrade($student->grade->name, $activeTerm->academic_year_id);
            
            if ($fees->count() > 0) {
                $this->info("   ✅ Found {$fees->count()} applicable fees:");
                foreach ($fees as $fee) {
                    $this->line("      - {$fee->feeCategory->name}: KSh " . number_format($fee->amount, 2));
                }
            } else {
                $this->error("   ❌ NO FEES FOUND FOR THIS STUDENT!");
            }
        } else {
            $this->warn("   ⚠️  No active students with guardians found");
        }
        
        $this->newLine();
        $this->info("✅ Diagnostic complete!");
        
        return 0;
    }
}

