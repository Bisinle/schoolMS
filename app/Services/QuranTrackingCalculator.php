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
     * @param int $pageFrom Starting page number
     * @param int $pageTo Ending page number
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
     * @param int $surahFrom Starting surah number
     * @param int $surahTo Ending surah number
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
     * @param int $pageFrom Starting page number
     * @param int $pageTo Ending page number
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
                'error' => $e->getMessage()
            ]);
            return 0;
        }
    }

    /**
     * Best-effort: If page_from/page_to are missing, derive them from surah+verse using API.
     * Returns array [page_from, page_to] or null on failure.
     *
     * @param int $surahFrom Starting surah number
     * @param int $verseFrom Starting verse number
     * @param int $surahTo Ending surah number
     * @param int $verseTo Ending verse number
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
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Compute all metrics for a tracking record.
     * Returns array with pages_memorized, surahs_memorized, juz_memorized.
     *
     * @param int|null $pageFrom
     * @param int|null $pageTo
     * @param int $surahFrom
     * @param int $surahTo
     * @param int $verseFrom
     * @param int $verseTo
     * @return array
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
        }

        // Compute surahs
        if ($surahFrom && $surahTo) {
            $metrics['surahs_memorized'] = $this->computeSurahs($surahFrom, $surahTo);
        }

        return $metrics;
    }
}

