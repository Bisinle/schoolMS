<?php

namespace App\Services;

use App\External\QuranApiClient;
use Illuminate\Support\Facades\Log;

/**
 * Service for computing Quran tracking metrics.
 * Handles calculation of pages, surahs, and juz memorized.
 */
class QuranTrackingCalculator
{
    protected QuranApiClient $api;

    public function __construct(QuranApiClient $api)
    {
        $this->api = $api;
    }

    /**
     * Compute number of pages from page_from/page_to.
     * Supports bidirectional reading (forward and backward).
     *
     * @param  int  $pageFrom  Starting page number
     * @param  int  $pageTo  Ending page number
     * @return int Number of pages
     */
    public function computePages(int $pageFrom, int $pageTo): int
    {
        return abs($pageTo - $pageFrom) + 1;
    }

    /**
     * Compute number of surahs covered using surah_from and surah_to.
     * Supports bidirectional reading (forward and backward).
     * If surah_from == surah_to => 1 surah
     *
     * @param  int  $surahFrom  Starting surah number
     * @param  int  $surahTo  Ending surah number
     * @return int Number of surahs
     */
    public function computeSurahs(int $surahFrom, int $surahTo): int
    {
        return abs($surahTo - $surahFrom) + 1;
    }

    /**
     * Compute Juz coverage by page ranges using the Quran API's juz page mapping.
     * Supports bidirectional reading (forward and backward).
     * Returns count of distinct juz covered (any overlap counts as 1).
     *
     * @param  int  $pageFrom  Starting page number
     * @param  int  $pageTo  Ending page number
     * @return int Number of juz covered
     */
    public function computeJuzByPages(int $pageFrom, int $pageTo): int
    {
        try {
            // Normalize the range to handle bidirectional reading
            $minPage = min($pageFrom, $pageTo);
            $maxPage = max($pageFrom, $pageTo);

            $juzRanges = $this->api->getJuzPageRanges();

            $covered = 0;
            foreach ($juzRanges as $juz => $range) {
                // Check if there's any overlap between the page range and this juz
                if ($maxPage < $range['start_page'] || $minPage > $range['end_page']) {
                    continue; // no overlap
                }
                // If any overlap, count that juz as covered
                $covered++;
            }

            return $covered;
        } catch (\Exception $e) {
            Log::error('Failed to compute Juz by pages', [
                'page_from' => $pageFrom,
                'page_to' => $pageTo,
                'error' => $e->getMessage(),
            ]);

            return 0;
        }
    }

    /**
     * Determine the Juz range (from/to) covered by a page range.
     * Supports bidirectional reading (forward and backward).
     * Returns null if no Juz ranges overlap (e.g. API/fallback data unavailable).
     *
     * @param  int  $pageFrom  Starting page number
     * @param  int  $pageTo  Ending page number
     * @return array{from: int, to: int}|null
     */
    public function getJuzRangeForPages(int $pageFrom, int $pageTo): ?array
    {
        return $this->getRangeForPages($pageFrom, $pageTo, $this->api->getJuzPageRanges(), 'Juz');
    }

    /**
     * Determine the Hizb range (from/to) covered by a page range.
     * Supports bidirectional reading (forward and backward).
     * Returns null if no Hizb ranges overlap (e.g. API/fallback data unavailable).
     *
     * @param  int  $pageFrom  Starting page number
     * @param  int  $pageTo  Ending page number
     * @return array{from: int, to: int}|null
     */
    public function getHizbRangeForPages(int $pageFrom, int $pageTo): ?array
    {
        return $this->getRangeForPages($pageFrom, $pageTo, $this->api->getHizbPageRanges(), 'Hizb');
    }

    /**
     * Shared overlap logic for computing a from/to unit range (Juz or Hizb) covered by a page range.
     *
     * @param  array<int, array{start_page: int, end_page: int}>  $unitRanges
     */
    private function getRangeForPages(int $pageFrom, int $pageTo, array $unitRanges, string $unitLabel): ?array
    {
        try {
            $minPage = min($pageFrom, $pageTo);
            $maxPage = max($pageFrom, $pageTo);

            $matching = [];
            foreach ($unitRanges as $unitNumber => $range) {
                if ($maxPage < $range['start_page'] || $minPage > $range['end_page']) {
                    continue; // no overlap
                }
                $matching[] = $unitNumber;
            }

            if (empty($matching)) {
                return null;
            }

            return ['from' => min($matching), 'to' => max($matching)];
        } catch (\Exception $e) {
            Log::error("Failed to compute {$unitLabel} range by pages", [
                'page_from' => $pageFrom,
                'page_to' => $pageTo,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Determine the Rub el Hizb range (from/to) covered by a verse range, sourced
     * directly from the rub_el_hizb_number already present on verse data (unlike
     * Juz/Hizb, this does not depend on page_from/page_to being known/derived —
     * surah/verse are always available on a tracking or homework record).
     * Supports bidirectional reading (forward and backward).
     * Returns null if either boundary verse's Rub el Hizb number can't be resolved.
     *
     * @param  int  $surahFrom  Starting surah number
     * @param  int  $verseFrom  Starting verse number
     * @param  int  $surahTo  Ending surah number
     * @param  int  $verseTo  Ending verse number
     * @return array{from: int, to: int}|null
     */
    public function getRubRangeForVerses(int $surahFrom, int $verseFrom, int $surahTo, int $verseTo): ?array
    {
        try {
            $startRub = $this->api->getRubElHizbForAyah($surahFrom, $verseFrom);
            $endRub = $this->api->getRubElHizbForAyah($surahTo, $verseTo);

            if ($startRub === null || $endRub === null) {
                return null;
            }

            return ['from' => min($startRub, $endRub), 'to' => max($startRub, $endRub)];
        } catch (\Exception $e) {
            Log::error('Failed to compute Rub el Hizb range by verses', [
                'surah_from' => $surahFrom,
                'verse_from' => $verseFrom,
                'surah_to' => $surahTo,
                'verse_to' => $verseTo,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Best-effort: If page_from/page_to are missing, derive them from surah+verse using API.
     * Returns array [page_from, page_to] or null on failure.
     *
     * @param  int  $surahFrom  Starting surah number
     * @param  int  $verseFrom  Starting verse number
     * @param  int  $surahTo  Ending surah number
     * @param  int  $verseTo  Ending verse number
     * @return array|null [page_from, page_to] or null
     */
    public function derivePagesFromVerses(int $surahFrom, int $verseFrom, int $surahTo, int $verseTo): ?array
    {
        try {
            // Use API endpoints that map (surah,verse) => page
            $startPage = $this->api->getPageForAyah($surahFrom, $verseFrom);
            $endPage = $this->api->getPageForAyah($surahTo, $verseTo);

            if ($startPage && $endPage) {
                return [$startPage, $endPage];
            }

            Log::warning('Could not derive pages from verses - API returned null', [
                'surah_from' => $surahFrom,
                'verse_from' => $verseFrom,
                'surah_to' => $surahTo,
                'verse_to' => $verseTo,
            ]);

            return null;
        } catch (\Throwable $e) {
            Log::error('Failed to derive pages from verses', [
                'surah_from' => $surahFrom,
                'verse_from' => $verseFrom,
                'surah_to' => $surahTo,
                'verse_to' => $verseTo,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Compute all metrics for a tracking record.
     * Returns array with pages_memorized, surahs_memorized, juz_memorized.
     */
    public function computeAllMetrics(
        ?int $pageFrom,
        ?int $pageTo,
        int $surahFrom,
        int $surahTo,
        int $verseFrom,
        int $verseTo
    ): array {
        $metrics = [
            'page_from' => $pageFrom,
            'page_to' => $pageTo,
            'pages_memorized' => 0,
            'surahs_memorized' => 0,
            'juz_memorized' => 0,
            'juz_from' => null,
            'juz_to' => null,
            'hizb_from' => null,
            'hizb_to' => null,
            'rub_from' => null,
            'rub_to' => null,
        ];

        // Try to derive pages if missing
        if (empty($pageFrom) || empty($pageTo)) {
            $derived = $this->derivePagesFromVerses($surahFrom, $verseFrom, $surahTo, $verseTo);
            if ($derived) {
                [$metrics['page_from'], $metrics['page_to']] = $derived;
                $pageFrom = $metrics['page_from'];
                $pageTo = $metrics['page_to'];
            }
        }

        // Compute metrics if we have valid pages (supports bidirectional)
        if ($pageFrom && $pageTo) {
            $metrics['pages_memorized'] = $this->computePages($pageFrom, $pageTo);
            $metrics['juz_memorized'] = $this->computeJuzByPages($pageFrom, $pageTo);

            $juzRange = $this->getJuzRangeForPages($pageFrom, $pageTo);
            if ($juzRange) {
                $metrics['juz_from'] = $juzRange['from'];
                $metrics['juz_to'] = $juzRange['to'];
            }

            $hizbRange = $this->getHizbRangeForPages($pageFrom, $pageTo);
            if ($hizbRange) {
                $metrics['hizb_from'] = $hizbRange['from'];
                $metrics['hizb_to'] = $hizbRange['to'];
            }
        }

        // Compute surahs
        if ($surahFrom && $surahTo) {
            $metrics['surahs_memorized'] = $this->computeSurahs($surahFrom, $surahTo);
        }

        // Rub el Hizb is sourced directly from verse data, so unlike Juz/Hizb it
        // does not require page_from/page_to to be known.
        $rubRange = $this->getRubRangeForVerses($surahFrom, $verseFrom, $surahTo, $verseTo);
        if ($rubRange) {
            $metrics['rub_from'] = $rubRange['from'];
            $metrics['rub_to'] = $rubRange['to'];
        }

        return $metrics;
    }
}
