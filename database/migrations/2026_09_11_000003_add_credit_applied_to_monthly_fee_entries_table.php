<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('monthly_fee_entries', function (Blueprint $table) {
            $table->decimal('credit_applied', 10, 2)->default(0)->after('amount_collected');
        });
    }

    public function down(): void
    {
        Schema::table('monthly_fee_entries', function (Blueprint $table) {
            $table->dropColumn('credit_applied');
        });
    }
};
