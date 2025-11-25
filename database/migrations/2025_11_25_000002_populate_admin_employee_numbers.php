<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Services\UniqueIdentifierService;

return new class extends Migration
{
    public function up(): void
    {
        // Populate employee_number for existing admin users (if any are null)
        $admins = DB::table('users')
            ->where('role', 'admin')
            ->whereNotNull('school_id')
            ->whereNull('employee_number')
            ->get();

        foreach ($admins as $admin) {
            $employeeNumber = UniqueIdentifierService::generateAdminEmployeeNumber($admin->school_id);
            DB::table('users')
                ->where('id', $admin->id)
                ->update(['employee_number' => $employeeNumber]);
        }
    }

    public function down(): void
    {
        // No need to reverse this migration
    }
};

