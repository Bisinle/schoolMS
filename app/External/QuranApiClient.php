<?php

namespace App\External;

interface QuranApiClient
{
    /**
     * Get Juz page ranges.
     * Returns array like [1 => ['start_page' => 1, 'end_page' => 21], ...]
     *
     * @return array
     */
    public function getJuzPageRanges(): array;

    /**
     * Get page number for a specific ayah (verse).
     *
     * @param int $surah Surah number (1-114)
     * @param int $verse Verse number
     * @return int|null Page number or null if not found
     */
    public function getPageForAyah(int $surah, int $verse): ?int;

    /**
     * Get all surahs metadata.
     * Returns array of surahs with id, name, total_verses, etc.
     *
     * @return array
     */
    public function getSurahMetadata(): array;

    /**
     * Get specific surah metadata.
     *
     * @param int $surahNumber
     * @return array|null
     */
    public function getSurah(int $surahNumber): ?array;
}

