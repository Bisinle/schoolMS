<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * DEPRECATED: This migration created the ORIGINAL OLD fee structure.
     * It was superseded by 2025_12_02_130000_create_new_fee_structure_tables.php
     * which was then REPLACED by the Fee Preference System (2025_12_05_000001 onwards).
     *
     * This file is kept for migration history tracking only.
     */
    public function up(): void
    {
        // DEPRECATED - No longer used
        // The fee_categories and fee_amounts tables have been replaced by:
        // - transport_routes
        // - tuition_fees
        // - universal_fees
        // - guardian_fee_preferences
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op - tables are managed by the new migration
    }
};

