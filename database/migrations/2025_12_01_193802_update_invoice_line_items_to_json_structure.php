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
        Schema::table('invoice_line_items', function (Blueprint $table) {
            // Drop old columns
            $table->dropColumn([
                'category_name',
                'description',
                'quantity',
                'unit_price',
                'is_waived',
                'waiver_reason'
            ]);

            // Add new JSON column for flexible fee breakdown
            $table->json('fee_breakdown')->after('grade_name'); // {"Tuition": 35000, "Transport": 10000, ...}
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoice_line_items', function (Blueprint $table) {
            // Remove JSON column
            $table->dropColumn('fee_breakdown');

            // Restore old columns
            $table->string('category_name')->after('grade_name');
            $table->text('description')->after('category_name');
            $table->integer('quantity')->default(1)->after('description');
            $table->decimal('unit_price', 10, 2)->after('quantity');
            $table->boolean('is_waived')->default(false)->after('total_amount');
            $table->text('waiver_reason')->nullable()->after('is_waived');
        });
    }
};
