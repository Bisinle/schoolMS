<?php

namespace App\External;

interface QuranApiClient
{
    /**
     * Get Juz page ranges.
     * Returns array like [1 => ['start_page' => 1, 'end_page' => 21], ...]
     */
    public function getJuzPageRanges(): array;

    /**
     * Get Hizb page ranges (each Juz is split into 2 Hizb, 60 total).
     * Returns array like [1 => ['start_page' => 1, 'end_page' => 11], ...]
     */
    public function getHizbPageRanges(): array;

    /**
     * Get page number for a specific ayah (verse).
     *
     * @param  int  $surah  Surah number (1-114)
     * @param  int  $verse  Verse number
     * @return int|null Page number or null if not found
     */
    public function getPageForAyah(int $surah, int $verse): ?int;

    /**
     * Get all surahs (114 chapters), raw shape from the API.
     */
    public function getSurahs(): array;

    /**
     * Get specific surah metadata.
     */
    public function getSurah(int $surahNumber): ?array;

    /**
     * Get a specific verse (ayah), including its Arabic text.
     */
    public function getAyah(int $surahNumber, int $verseNumber): ?array;

    /**
     * Get page number for a specific verse.
     */
    public function getVersePageNumber(int $surahNumber, int $verseNumber): ?int;

    /**
     * Calculate page range from a verse selection.
     *
     * @return array{page_from: int, page_to: int}
     */
    public function calculatePageRange(int $surahFrom, int $surahTo, int $verseFrom, int $verseTo): array;

    /**
     * Validate a multi-surah verse range.
     *
     * @return array{valid: bool, error?: string}
     */
    public function validateMultiSurahRange(int $surahFrom, int $surahTo, int $verseFrom, int $verseTo): array;

    /**
     * Calculate total verses covered in a range.
     */
    public function calculateTotalVerses(int $surahFrom, int $surahTo, int $verseFrom, int $verseTo): int;

    /**
     * Get all Juz information (id, juz_number, page_start, page_end, names).
     */
    public function getAllJuz(): array;

    /**
     * Get the Juz number containing a given page.
     */
    public function getJuzFromPage(int $pageNumber): int;

    /**
     * Get the Hizb number containing a given page.
     */
    public function getHizbFromPage(int $pageNumber): int;

    /**
     * Get the Rub el Hizb number (1-240) containing a given verse.
     *
     * @param  int  $surah  Surah number (1-114)
     * @param  int  $verse  Verse number
     * @return int|null Rub el Hizb number or null if not found
     */
    public function getRubElHizbForAyah(int $surah, int $verse): ?int;

    /**
     * Get the Arabic text of a specific verse.
     */
    public function getVerseText(int $surahNumber, int $verseNumber): ?string;

    /**
     * Get details (surah/verse boundaries, juz number) for a Mushaf page.
     */
    public function getPageDetails(int $pageNumber): array;

    /**
     * Get every verse on a Mushaf page, in order, with Arabic text in the
     * encoding paired with the UthmanicHafs webfont (text_qpc_hafs).
     * Used to render a full page as live text rather than a page image.
     *
     * @return array<int, array{verse_key: string, text_qpc_hafs: string}>
     */
    public function getPageVerses(int $pageNumber): array;

    /**
     * Get the CDN image URL for a Mushaf page. Not backed by an API call.
     */
    public function getPageImageUrl(int $pageNumber, string $quality = 'high'): string;
}
