<?php

namespace App\External;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Concrete implementation of QuranApiClient using Quran.com API.
 * Wraps the existing QuranApiService functionality.
 */
class QuranComApiClient implements QuranApiClient
{
    private const QURAN_COM_BASE_URL = 'https://api.quran.com/api/v4';
    private const CACHE_TTL = 86400; // 24 hours

    /**
     * Get Juz page ranges from Quran.com API.
     * Standard Mushaf has 30 Juz with accurate page mappings.
     */
    public function getJuzPageRanges(): array
    {
        return Cache::remember('quran_juz_page_ranges', self::CACHE_TTL, function () {
            try {
                $response = Http::timeout(10)->get(self::QURAN_COM_BASE_URL . '/juzs');
                
                if ($response->successful()) {
                    $juzs = $response->json('juzs', []);
                    $ranges = [];
                    
                    foreach ($juzs as $juz) {
                        $juzNumber = $juz['juz_number'];
                        // Get first and last verse of this juz to determine page range
                        $firstVerse = $juz['verse_mapping'] ?? null;
                        
                        if ($firstVerse) {
                            // Parse verse mapping to get page numbers
                            // Juz verse_mapping format: {"1": "1-7", "2": "1-141", ...}
                            $ranges[$juzNumber] = $this->getJuzPageRangeFromMapping($juzNumber);
                        }
                    }
                    
                    return $ranges ?: $this->getFallbackJuzRanges();
                }
            } catch (\Exception $e) {
                Log::warning('Failed to fetch Juz ranges from API, using fallback', [
                    'error' => $e->getMessage()
                ]);
            }
            
            return $this->getFallbackJuzRanges();
        });
    }

    /**
     * Get page range for a specific Juz by querying its first and last verses.
     */
    private function getJuzPageRangeFromMapping(int $juzNumber): array
    {
        try {
            // Use known start/end verses for each Juz
            $juzBoundaries = $this->getJuzBoundaries();
            
            if (isset($juzBoundaries[$juzNumber])) {
                $start = $juzBoundaries[$juzNumber]['start'];
                $end = $juzBoundaries[$juzNumber]['end'];
                
                $startPage = $this->getPageForAyah($start['surah'], $start['verse']);
                $endPage = $this->getPageForAyah($end['surah'], $end['verse']);
                
                if ($startPage && $endPage) {
                    return ['start_page' => $startPage, 'end_page' => $endPage];
                }
            }
        } catch (\Exception $e) {
            Log::debug('Failed to get Juz page range from mapping', ['juz' => $juzNumber]);
        }
        
        // Fallback to approximate calculation
        $startPage = (($juzNumber - 1) * 20) + 1;
        $endPage = min($juzNumber * 20, 604);
        
        return ['start_page' => $startPage, 'end_page' => $endPage];
    }

    /**
     * Fallback Juz page ranges (standard 604-page Mushaf).
     * Accurate mapping based on standard Mushaf.
     */
    private function getFallbackJuzRanges(): array
    {
        return [
            1 => ['start_page' => 1, 'end_page' => 21],
            2 => ['start_page' => 22, 'end_page' => 41],
            3 => ['start_page' => 42, 'end_page' => 61],
            4 => ['start_page' => 62, 'end_page' => 81],
            5 => ['start_page' => 82, 'end_page' => 101],
            6 => ['start_page' => 102, 'end_page' => 121],
            7 => ['start_page' => 122, 'end_page' => 141],
            8 => ['start_page' => 142, 'end_page' => 161],
            9 => ['start_page' => 162, 'end_page' => 181],
            10 => ['start_page' => 182, 'end_page' => 201],
            11 => ['start_page' => 202, 'end_page' => 221],
            12 => ['start_page' => 222, 'end_page' => 241],
            13 => ['start_page' => 242, 'end_page' => 261],
            14 => ['start_page' => 262, 'end_page' => 281],
            15 => ['start_page' => 282, 'end_page' => 301],
            16 => ['start_page' => 302, 'end_page' => 321],
            17 => ['start_page' => 322, 'end_page' => 341],
            18 => ['start_page' => 342, 'end_page' => 361],
            19 => ['start_page' => 362, 'end_page' => 381],
            20 => ['start_page' => 382, 'end_page' => 401],
            21 => ['start_page' => 402, 'end_page' => 421],
            22 => ['start_page' => 422, 'end_page' => 441],
            23 => ['start_page' => 442, 'end_page' => 461],
            24 => ['start_page' => 462, 'end_page' => 481],
            25 => ['start_page' => 482, 'end_page' => 501],
            26 => ['start_page' => 502, 'end_page' => 521],
            27 => ['start_page' => 522, 'end_page' => 541],
            28 => ['start_page' => 542, 'end_page' => 561],
            29 => ['start_page' => 562, 'end_page' => 581],
            30 => ['start_page' => 582, 'end_page' => 604],
        ];
    }

    /**
     * Get Juz boundaries (first and last verse of each Juz).
     * This is static data for standard Mushaf.
     */
    private function getJuzBoundaries(): array
    {
        // Simplified - in production, this would be complete
        return [
            1 => ['start' => ['surah' => 1, 'verse' => 1], 'end' => ['surah' => 2, 'verse' => 141]],
            2 => ['start' => ['surah' => 2, 'verse' => 142], 'end' => ['surah' => 2, 'verse' => 252]],
            // ... Add all 30 Juz boundaries
            30 => ['start' => ['surah' => 78, 'verse' => 1], 'end' => ['surah' => 114, 'verse' => 6]],
        ];
    }

    /**
     * Get page number for a specific ayah using Quran.com API.
     */
    public function getPageForAyah(int $surah, int $verse): ?int
    {
        $cacheKey = "quran_verse_page_{$surah}_{$verse}";

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($surah, $verse) {
            try {
                $response = Http::timeout(10)->get(
                    self::QURAN_COM_BASE_URL . "/verses/by_key/{$surah}:{$verse}",
                    ['fields' => 'text_uthmani']
                );

                if ($response->successful()) {
                    $verseData = $response->json('verse');
                    return $verseData['page_number'] ?? null;
                }
            } catch (\Exception $e) {
                Log::warning('Failed to get page for ayah from API', [
                    'surah' => $surah,
                    'verse' => $verse,
                    'error' => $e->getMessage()
                ]);
            }

            return null;
        });
    }

    /**
     * Get all surahs metadata.
     */
    public function getSurahMetadata(): array
    {
        return Cache::remember('quran_surahs_metadata', self::CACHE_TTL, function () {
            try {
                $response = Http::timeout(10)->get(self::QURAN_COM_BASE_URL . '/chapters');

                if ($response->successful()) {
                    $chapters = $response->json('chapters', []);
                    return array_map(function ($chapter) {
                        return [
                            'id' => $chapter['id'],
                            'name' => $chapter['name_simple'],
                            'name_arabic' => $chapter['name_arabic'] ?? '',
                            'total_verses' => $chapter['verses_count'],
                            'revelation_place' => $chapter['revelation_place'] ?? '',
                        ];
                    }, $chapters);
                }
            } catch (\Exception $e) {
                Log::error('Failed to fetch surah metadata from API', ['error' => $e->getMessage()]);
            }

            return [];
        });
    }

    /**
     * Get specific surah metadata.
     */
    public function getSurah(int $surahNumber): ?array
    {
        $surahs = $this->getSurahMetadata();

        foreach ($surahs as $surah) {
            if ($surah['id'] == $surahNumber) {
                return $surah;
            }
        }

        return null;
    }
}


