<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * page_from/page_to were made NOT NULL (with a default of 0) back when
     * this table was quran_tracking, recording already-completed sessions
     * where a page range was always known. Homework is assign-then-grade:
     * a teacher can create an entry from just a surah/verse range, with the
     * page range derived later (QuranHomeworkObserver) or left unset — see
     * QuranHomeworkController::store()'s 'page_from'/'page_to' => 'nullable'
     * validation rules. The rename migration (2026_08_23_000003) carried the
     * old NOT NULL constraint over verbatim without revisiting it, and the
     * prior ->nullable(false)->change() call (2025_11_25_100003) also
     * silently dropped the column's default(0), so any create() that leaves
     * page_from/page_to unset — and that the observer can't derive (e.g. the
     * Quran API being unreachable/mocked-empty) — fails with a NOT NULL
     * constraint violation instead of just storing null.
     */
    public function up(): void
    {
        Schema::table('quran_homework', function (Blueprint $table) {
            $table->integer('page_from')->nullable()->default(null)->change();
            $table->integer('page_to')->nullable()->default(null)->change();
        });
    }

    public function down(): void
    {
        Schema::table('quran_homework', function (Blueprint $table) {
            $table->integer('page_from')->nullable(false)->default(0)->change();
            $table->integer('page_to')->nullable(false)->default(0)->change();
        });
    }
};
