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
        Schema::table('schools', function (Blueprint $table) {
            // Add tagline if it doesn't exist
            if (!Schema::hasColumn('schools', 'tagline')) {
                $table->string('tagline')->nullable()->after('name');
            }

            // Add phone fields if they don't exist
            if (!Schema::hasColumn('schools', 'phone_primary')) {
                $table->string('phone_primary')->nullable()->after('admin_phone');
            }
            if (!Schema::hasColumn('schools', 'phone_secondary')) {
                $table->string('phone_secondary')->nullable()->after('phone_primary');
            }

            // Add physical_address if it doesn't exist
            if (!Schema::hasColumn('schools', 'physical_address')) {
                $table->text('physical_address')->nullable()->after('address');
            }

            // Add motto, vision, mission
            if (!Schema::hasColumn('schools', 'motto')) {
                $table->text('motto')->nullable()->after('tagline');
            }
            if (!Schema::hasColumn('schools', 'vision')) {
                $table->text('vision')->nullable()->after('motto');
            }
            if (!Schema::hasColumn('schools', 'mission')) {
                $table->text('mission')->nullable()->after('vision');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $columns = ['tagline', 'phone_primary', 'phone_secondary', 'physical_address', 'motto', 'vision', 'mission'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('schools', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
