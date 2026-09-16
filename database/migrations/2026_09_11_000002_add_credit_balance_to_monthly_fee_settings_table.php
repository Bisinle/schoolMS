<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('monthly_fee_settings', function (Blueprint $table) {
            $table->decimal('credit_balance', 10, 2)->default(0)->after('expected_fee');
        });
    }

    public function down(): void
    {
        Schema::table('monthly_fee_settings', function (Blueprint $table) {
            $table->dropColumn('credit_balance');
        });
    }
};
