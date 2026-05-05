<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('guardians', function (Blueprint $table) {
            $table->string('status')->default('active')->after('relationship'); // 'active' | 'inactive'
            $table->timestamp('deactivated_at')->nullable()->after('status');
            $table->text('deactivation_reason')->nullable()->after('deactivated_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('guardians', function (Blueprint $table) {
            $table->dropColumn(['status', 'deactivated_at', 'deactivation_reason']);
        });
    }
};
