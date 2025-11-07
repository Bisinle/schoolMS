<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add new columns
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('email');
            $table->boolean('is_active')->default(true)->after('role');
            $table->boolean('must_change_password')->default(false)->after('password');
            $table->timestamp('last_login_at')->nullable()->after('must_change_password');
            $table->unsignedBigInteger('created_by')->nullable()->after('remember_token');
            $table->softDeletes()->after('updated_at');
            
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->index('is_active');
            $table->index('role');
        });

        // Modify the role enum to include all roles
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'teacher', 'guardian', 'accountant', 'receptionist', 'nurse', 'it_staff', 'maid', 'cook') NOT NULL DEFAULT 'guardian'");
    }

    public function down(): void
    {
        // Revert role enum to original values
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'teacher', 'guardian') NOT NULL DEFAULT 'guardian'");

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->dropIndex(['is_active']);
            $table->dropIndex(['role']);
            $table->dropSoftDeletes();
            $table->dropColumn([
                'is_active',
                'phone',
                'last_login_at',
                'created_by',
                'must_change_password'
            ]);
        });
    }
};