<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Add audit fields to track preference changes:
     * - updated_by: Who made the last change
     * - previous_values: JSON snapshot of previous values before update
     */
    public function up(): void
    {
        Schema::table('guardian_fee_preferences', function (Blueprint $table) {
            $table->foreignId('updated_by')->nullable()->after('notes')->constrained('users')->nullOnDelete();
            $table->json('previous_values')->nullable()->after('updated_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('guardian_fee_preferences', function (Blueprint $table) {
            $table->dropForeign(['updated_by']);
            $table->dropColumn(['updated_by', 'previous_values']);
        });
    }
};
