<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use App\Services\UniqueIdentifierService;

return new class extends Migration
{
    public function up(): void
    {
        // Populate guardian_number for existing guardians
        $guardians = DB::table('guardians')->whereNull('guardian_number')->get();
        foreach ($guardians as $guardian) {
            $guardianNumber = UniqueIdentifierService::generateGuardianNumber($guardian->school_id);
            DB::table('guardians')
                ->where('id', $guardian->id)
                ->update(['guardian_number' => $guardianNumber]);
        }

        // Populate employee_number for existing teachers (if any are null)
        $teachers = DB::table('teachers')->whereNull('employee_number')->get();
        foreach ($teachers as $teacher) {
            $employeeNumber = UniqueIdentifierService::generateEmployeeNumber($teacher->school_id);
            DB::table('teachers')
                ->where('id', $teacher->id)
                ->update(['employee_number' => $employeeNumber]);
        }
    }

    public function down(): void
    {
        // No need to reverse this migration
    }
};

