<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('quran_homework');
    }

    public function down(): void
    {
        // Deliberately not recreated — the old QuranHomework schema is gone
        // for good (confirmed: no real data existed in this table). A
        // rollback of this migration is only meaningful together with a
        // rollback of every later migration in this set.
    }
};
