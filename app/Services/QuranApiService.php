<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class QuranApiService
{
    private const QURAN_COM_BASE_URL = 'https://api.quran.com/api/v4';
    private const QURAN_CLOUD_BASE_URL = 'https://api.alquran.cloud/v1';
    private const CACHE_TTL = 86400; // 24 hours

    /**
     * Get all surahs with metadata.
     * Returns: [['id' => 1, 'name' => 'Al-Fatihah', 'total_verses' => 7], ...]
     */
    public function getSurahs(): array
    {
        return Cache::remember('quran_surahs', self::CACHE_TTL, function () {
            try {
                // Try Quran.com API first
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
                Log::warning('Quran.com API failed, trying fallback', ['error' => $e->getMessage()]);
            }

            // Fallback to Quran Cloud API
            try {
                $response = Http::timeout(10)->get(self::QURAN_CLOUD_BASE_URL . '/surah');
                
                if ($response->successful()) {
                    $surahs = $response->json('data', []);
                    return array_map(function ($surah) {
                        return [
                            'id' => $surah['number'],
                            'name' => $surah['englishName'],
                            'name_arabic' => $surah['name'] ?? '',
                            'total_verses' => $surah['numberOfAyahs'],
                            'revelation_place' => $surah['revelationType'] ?? '',
                        ];
                    }, $surahs);
                }
            } catch (\Exception $e) {
                Log::error('Both Quran APIs failed', ['error' => $e->getMessage()]);
            }

            // Return empty array if both APIs fail
            return [];
        });
    }

    /**
     * Get verses for a specific surah.
     * Returns: [['number' => 1, 'text' => '...'], ...]
     */
    public function getSurahVerses(int $surahNumber): array
    {
        return Cache::remember("quran_surah_{$surahNumber}_verses", self::CACHE_TTL, function () use ($surahNumber) {
            try {
                // Try Quran.com API first
                $response = Http::timeout(10)->get(self::QURAN_COM_BASE_URL . "/verses/by_chapter/{$surahNumber}", [
                    'language' => 'ar',
                    'words' => false,
                    'translations' => 131, // English translation
                ]);
                
                if ($response->successful()) {
                    $verses = $response->json('verses', []);
                    return array_map(function ($verse) {
                        return [
                            'number' => $verse['verse_number'],
                            'text' => $verse['text_uthmani'] ?? '',
                        ];
                    }, $verses);
                }
            } catch (\Exception $e) {
                Log::warning('Quran.com API failed for surah verses, trying fallback', ['error' => $e->getMessage()]);
            }

            // Fallback to Quran Cloud API
            try {
                $response = Http::timeout(10)->get(self::QURAN_CLOUD_BASE_URL . "/surah/{$surahNumber}");
                
                if ($response->successful()) {
                    $ayahs = $response->json('data.ayahs', []);
                    return array_map(function ($ayah) {
                        return [
                            'number' => $ayah['numberInSurah'],
                            'text' => $ayah['text'] ?? '',
                        ];
                    }, $ayahs);
                }
            } catch (\Exception $e) {
                Log::error('Both Quran APIs failed for surah verses', ['error' => $e->getMessage()]);
            }

            return [];
        });
    }

    /**
     * Get a specific ayah text.
     * Returns: string (ayah text)
     */
    public function getAyah(int $surahNumber, int $ayahNumber): ?string
    {
        $verses = $this->getSurahVerses($surahNumber);
        
        foreach ($verses as $verse) {
            if ($verse['number'] == $ayahNumber) {
                return $verse['text'];
            }
        }
        
        return null;
    }

    /**
     * Get surah metadata by number.
     */
    public function getSurah(int $surahNumber): ?array
    {
        $surahs = $this->getSurahs();
        
        foreach ($surahs as $surah) {
            if ($surah['id'] == $surahNumber) {
                return $surah;
            }
        }
        
        return null;
    }

    /**
     * Validate verse range for a surah.
     */
    public function validateVerseRange(int $surahNumber, int $verseFrom, int $verseTo): bool
    {
        $surah = $this->getSurah($surahNumber);

        if (!$surah) {
            return false;
        }

        return $verseFrom >= 1
            && $verseTo <= $surah['total_verses']
            && $verseFrom <= $verseTo;
    }

    /**
     * Calculate total verses across multiple surahs.
     * Supports both top-to-bottom (Surah 1 → 114) and bottom-to-top (Surah 114 → 1) reading.
     *
     * @param int $surahFrom Starting surah number
     * @param int $verseFrom Starting verse number in first surah
     * @param int $surahTo Ending surah number
     * @param int $verseTo Ending verse number in last surah
     * @return int Total number of verses
     */
    public function calculateTotalVerses(int $surahFrom, int $verseFrom, int $surahTo, int $verseTo): int
    {
        // Single surah case
        if ($surahFrom == $surahTo) {
            return abs($verseTo - $verseFrom) + 1;
        }

        $surahs = $this->getSurahs();
        $surahsById = collect($surahs)->keyBy('id');
        $totalVerses = 0;

        // Determine reading direction
        $isTopToBottom = $surahFrom < $surahTo;

        if ($isTopToBottom) {
            // Top to bottom: Surah 1 → Surah 114
            // First surah: from verseFrom to end of surah
            $firstSurah = $surahsById->get($surahFrom);
            if ($firstSurah) {
                $totalVerses += ($firstSurah['total_verses'] - $verseFrom) + 1;
            }

            // Middle surahs: all verses
            for ($i = $surahFrom + 1; $i < $surahTo; $i++) {
                $middleSurah = $surahsById->get($i);
                if ($middleSurah) {
                    $totalVerses += $middleSurah['total_verses'];
                }
            }

            // Last surah: from 1 to verseTo
            $lastSurah = $surahsById->get($surahTo);
            if ($lastSurah) {
                $totalVerses += $verseTo;
            }
        } else {
            // Bottom to top: Surah 114 → Surah 1
            // First surah: from verseFrom down to 1
            $firstSurah = $surahsById->get($surahFrom);
            if ($firstSurah) {
                $totalVerses += $verseFrom;
            }

            // Middle surahs: all verses (going backwards)
            for ($i = $surahFrom - 1; $i > $surahTo; $i--) {
                $middleSurah = $surahsById->get($i);
                if ($middleSurah) {
                    $totalVerses += $middleSurah['total_verses'];
                }
            }

            // Last surah: from end of surah down to verseTo
            $lastSurah = $surahsById->get($surahTo);
            if ($lastSurah) {
                $totalVerses += ($lastSurah['total_verses'] - $verseTo) + 1;
            }
        }

        return $totalVerses;
    }

    /**
     * Get page number for a specific verse using Quran.com API.
     *
     * @param int $surahNumber Surah number (1-114)
     * @param int $verseNumber Verse number
     * @return int|null Page number or null if not found
     */
    public function getVersePageNumber(int $surahNumber, int $verseNumber): ?int
    {
        $cacheKey = "quran_verse_page_{$surahNumber}_{$verseNumber}";

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($surahNumber, $verseNumber) {
            try {
                // Use Quran.com API v4 to get verse with page number
                $response = Http::timeout(10)->get(self::QURAN_COM_BASE_URL . "/verses/by_key/{$surahNumber}:{$verseNumber}", [
                    'fields' => 'text_uthmani',
                    'translations' => 131,
                ]);

                if ($response->successful()) {
                    $verse = $response->json('verse');
                    return $verse['page_number'] ?? null;
                }
            } catch (\Exception $e) {
                Log::warning('Failed to get verse page number from API', [
                    'surah' => $surahNumber,
                    'verse' => $verseNumber,
                    'error' => $e->getMessage()
                ]);
            }

            return null;
        });
    }

    /**
     * Calculate page range for a verse range.
     * Supports both top-to-bottom and bottom-to-top reading.
     *
     * @param int $surahFrom Starting surah number
     * @param int $verseFrom Starting verse number
     * @param int $surahTo Ending surah number
     * @param int $verseTo Ending verse number
     * @return array ['page_from' => int, 'page_to' => int, 'total_pages' => int] or null if API fails
     */
    public function calculatePageRange(int $surahFrom, int $verseFrom, int $surahTo, int $verseTo): ?array
    {
        $pageFrom = $this->getVersePageNumber($surahFrom, $verseFrom);
        $pageTo = $this->getVersePageNumber($surahTo, $verseTo);

        if ($pageFrom === null || $pageTo === null) {
            return null;
        }

        return [
            'page_from' => $pageFrom,
            'page_to' => $pageTo,
            'total_pages' => abs($pageTo - $pageFrom) + 1,
        ];
    }

    /**
     * Validate multi-surah verse range.
     * Allows reading in any direction (top to bottom OR bottom to top).
     * Only validates verse order when both surahs are the same.
     *
     * @param int $surahFrom Starting surah number
     * @param int $verseFrom Starting verse number
     * @param int $surahTo Ending surah number
     * @param int $verseTo Ending verse number
     * @return array ['valid' => bool, 'message' => string]
     */
    public function validateMultiSurahRange(int $surahFrom, int $verseFrom, int $surahTo, int $verseTo): array
    {
        // Validate surah numbers
        if ($surahFrom < 1 || $surahFrom > 114 || $surahTo < 1 || $surahTo > 114) {
            return ['valid' => false, 'message' => 'Surah numbers must be between 1 and 114.'];
        }

        $surahs = $this->getSurahs();
        $surahsById = collect($surahs)->keyBy('id');

        // Validate first surah verse range
        $firstSurah = $surahsById->get($surahFrom);
        if (!$firstSurah) {
            return ['valid' => false, 'message' => "Surah {$surahFrom} not found."];
        }

        if ($verseFrom < 1 || $verseFrom > $firstSurah['total_verses']) {
            return ['valid' => false, 'message' => "Starting verse must be between 1 and {$firstSurah['total_verses']} for Surah {$surahFrom}."];
        }

        // Validate last surah verse range
        $lastSurah = $surahsById->get($surahTo);
        if (!$lastSurah) {
            return ['valid' => false, 'message' => "Surah {$surahTo} not found."];
        }

        if ($verseTo < 1 || $verseTo > $lastSurah['total_verses']) {
            return ['valid' => false, 'message' => "Ending verse must be between 1 and {$lastSurah['total_verses']} for Surah {$surahTo}."];
        }

        // ONLY validate verse order when reading within the SAME surah
        if ($surahFrom == $surahTo && $verseFrom > $verseTo) {
            return ['valid' => false, 'message' => 'Starting verse must be less than or equal to ending verse when reading within the same surah.'];
        }

        return ['valid' => true, 'message' => ''];
    }
}

