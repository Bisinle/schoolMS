<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class QuranApiService
{
    private string $clientId;
    private string $clientSecret;
    private string $authUrl;
    private string $apiBaseUrl;
    private const CACHE_TTL = 86400; // 24 hours
    private const TOKEN_TTL = 3600; // 1 hour (token expiry)

    public function __construct()
    {
        $this->clientId = config('services.quran.client_id');
        $this->clientSecret = config('services.quran.client_secret');
        
        $env = config('services.quran.environment', 'production');
        
        if ($env === 'production') {
            $this->authUrl = 'https://oauth2.quran.foundation';
            $this->apiBaseUrl = 'https://apis.quran.foundation/content/api/v4';
        } else {
            // Pre-production (testing)
            $this->authUrl = 'https://prelive-oauth2.quran.foundation';
            $this->apiBaseUrl = 'https://apis-prelive.quran.foundation/content/api/v4';
        }
    }

    /**
     * Get OAuth2 access token (cached for 1 hour)
     */
    private function getAccessToken(): string
    {
        return Cache::remember('quran_api_access_token', self::TOKEN_TTL - 60, function() {
            try {
                // Use HTTP Basic Auth (client_secret_basic method)
                $response = Http::withBasicAuth($this->clientId, $this->clientSecret)
                    ->asForm()
                    ->post($this->authUrl . '/oauth2/token', [
                        'grant_type' => 'client_credentials',
                        'scope' => 'content', // Required for accessing Quran content API
                    ]);

                if ($response->successful()) {
                    $data = $response->json();
                    Log::info('QuranApiService: Access token obtained', [
                        'expires_in' => $data['expires_in'] ?? 3600
                    ]);
                    return $data['access_token'];
                }

                Log::error('QuranApiService: Failed to get access token', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);

                throw new \Exception('Failed to get access token: ' . $response->body());
            } catch (\Exception $e) {
                Log::error('QuranApiService: Token request exception', [
                    'error' => $e->getMessage()
                ]);
                throw $e;
            }
        });
    }

    /**
     * Make authenticated API request
     */
    private function makeRequest(string $endpoint, array $params = []): array
    {
        try {
            $token = $this->getAccessToken();

            $response = Http::withHeaders([
                'x-auth-token' => $token,
                'x-client-id' => $this->clientId,
            ])->get($this->apiBaseUrl . $endpoint, $params);

            if ($response->successful()) {
                return $response->json();
            }

            // Log error
            Log::error('QuranApiService: API request failed', [
                'endpoint' => $endpoint,
                'status' => $response->status(),
                'body' => $response->body()
            ]);

            throw new \Exception('API request failed: ' . $response->body());
        } catch (\Exception $e) {
            Log::error('QuranApiService: Request exception', [
                'endpoint' => $endpoint,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Get page image URL (Images are NOT from API, they're from CDN)
     */
    public function getPageImageUrl(int $pageNumber, string $quality = 'high'): string
    {
        if ($pageNumber < 1 || $pageNumber > 604) {
            throw new \InvalidArgumentException("Page number must be between 1 and 604");
        }

        $qualityPaths = [
            'high' => 'w1920',
            'medium' => 'w960',
            'low' => 'w480'
        ];

        $width = $qualityPaths[$quality] ?? 'w1920';
        $paddedPage = str_pad($pageNumber, 3, '0', STR_PAD_LEFT);
        
        // CDN (no auth required for images)
        return "https://cdn.qurancdn.com/images/{$width}/page{$paddedPage}.png";
    }

    /**
     * Get all Surahs (114 chapters)
     */
    public function getSurahs(): array
    {
        return Cache::remember('quran_api_surahs', self::CACHE_TTL, function() {
            try {
                $data = $this->makeRequest('/chapters');
                return $data['chapters'] ?? [];
            } catch (\Exception $e) {
                Log::error('QuranApiService: Failed to fetch surahs', [
                    'error' => $e->getMessage()
                ]);
                return [];
            }
        });
    }

    /**
     * Get specific Surah metadata
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
     * Get all verses for a Surah
     */
    public function getSurahVerses(int $surahNumber): array
    {
        return Cache::remember("quran_api_surah_{$surahNumber}_verses", self::CACHE_TTL, function() use ($surahNumber) {
            try {
                $data = $this->makeRequest("/verses/by_chapter/{$surahNumber}");
                return $data['verses'] ?? [];
            } catch (\Exception $e) {
                Log::error('QuranApiService: Failed to fetch verses', [
                    'surah' => $surahNumber,
                    'error' => $e->getMessage()
                ]);
                return [];
            }
        });
    }

    /**
     * Get specific verse (Ayah)
     */
    public function getAyah(int $surahNumber, int $ayahNumber): ?array
    {
        $cacheKey = "quran_api_ayah_{$surahNumber}_{$ayahNumber}";

        return Cache::remember($cacheKey, self::CACHE_TTL, function() use ($surahNumber, $ayahNumber) {
            try {
                // Request verse with text fields
                $data = $this->makeRequest("/verses/by_key/{$surahNumber}:{$ayahNumber}", [
                    'words' => 'false',
                    'fields' => 'text_uthmani,text_imlaei,text_indopak',
                ]);
                return $data['verse'] ?? null;
            } catch (\Exception $e) {
                Log::error('QuranApiService: Failed to fetch ayah', [
                    'surah' => $surahNumber,
                    'ayah' => $ayahNumber,
                    'error' => $e->getMessage()
                ]);
                return null;
            }
        });
    }

    /**
     * Get page number for specific verse
     */
    public function getVersePageNumber(int $surahNumber, int $verseNumber): ?int
    {
        try {
            $verse = $this->getAyah($surahNumber, $verseNumber);
            return $verse['page_number'] ?? null;
        } catch (\Exception $e) {
            Log::error('QuranApiService: Failed to get verse page number', [
                'surah' => $surahNumber,
                'verse' => $verseNumber,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Calculate page range from verse selection
     */
    public function calculatePageRange(int $surahFrom, int $surahTo, int $verseFrom, int $verseTo): array
    {
        try {
            $pageFrom = $this->getVersePageNumber($surahFrom, $verseFrom);
            $pageTo = $this->getVersePageNumber($surahTo, $verseTo);

            if ($pageFrom === null || $pageTo === null) {
                Log::warning('QuranApiService: Could not determine page range', [
                    'surah_from' => $surahFrom,
                    'verse_from' => $verseFrom,
                    'surah_to' => $surahTo,
                    'verse_to' => $verseTo,
                ]);

                return [
                    'page_from' => 0,
                    'page_to' => 0,
                ];
            }

            return [
                'page_from' => $pageFrom,
                'page_to' => $pageTo,
            ];
        } catch (\Exception $e) {
            Log::error('QuranApiService: Failed to calculate page range', [
                'error' => $e->getMessage()
            ]);
            return [
                'page_from' => 0,
                'page_to' => 0,
            ];
        }
    }

    /**
     * Validate multi-surah verse range
     */
    public function validateMultiSurahRange(int $surahFrom, int $surahTo, int $verseFrom, int $verseTo): array
    {
        $surahFromData = $this->getSurah($surahFrom);
        if (!$surahFromData) {
            return [
                'valid' => false,
                'error' => "Surah {$surahFrom} not found"
            ];
        }

        $surahToData = $this->getSurah($surahTo);
        if (!$surahToData) {
            return [
                'valid' => false,
                'error' => "Surah {$surahTo} not found"
            ];
        }

        if ($verseFrom < 1 || $verseFrom > $surahFromData['verses_count']) {
            return [
                'valid' => false,
                'error' => "Verse {$verseFrom} is out of range for Surah {$surahFrom}"
            ];
        }

        if ($verseTo < 1 || $verseTo > $surahToData['verses_count']) {
            return [
                'valid' => false,
                'error' => "Verse {$verseTo} is out of range for Surah {$surahTo}"
            ];
        }

        // If same surah, verse_from must be less than verse_to
        if ($surahFrom === $surahTo && $verseFrom >= $verseTo) {
            return [
                'valid' => false,
                'error' => "When selecting the same surah, the starting verse must be less than the ending verse"
            ];
        }

        return ['valid' => true];
    }

    /**
     * Calculate total verses in range
     */
    public function calculateTotalVerses(int $surahFrom, int $surahTo, int $verseFrom, int $verseTo): int
    {
        if ($surahFrom === $surahTo) {
            return abs($verseTo - $verseFrom) + 1;
        }

        $total = 0;
        $surahs = $this->getSurahs();
        $surahsById = collect($surahs)->keyBy('id');

        if ($surahFrom < $surahTo) {
            $firstSurah = $surahsById[$surahFrom];
            $total += ($firstSurah['verses_count'] - $verseFrom) + 1;

            for ($i = $surahFrom + 1; $i < $surahTo; $i++) {
                $total += $surahsById[$i]['verses_count'];
            }

            $total += $verseTo;
        }

        if ($surahFrom > $surahTo) {
            $total += $verseFrom;

            for ($i = $surahFrom - 1; $i > $surahTo; $i--) {
                $total += $surahsById[$i]['verses_count'];
            }

            $lastSurah = $surahsById[$surahTo];
            $total += ($lastSurah['verses_count'] - $verseTo) + 1;
        }

        return $total;
    }

    /**
     * Get all Juz information (hardcoded as it never changes)
     */
    public function getAllJuz(): array
    {
        return Cache::remember('quran_api_all_juz', self::CACHE_TTL, function() {
            return $this->getStandardJuzData();
        });
    }

    /**
     * Standard Juz data
     */
    private function getStandardJuzData(): array
    {
        $juzPageRanges = [
            1 => ['start' => 1, 'end' => 21],
            2 => ['start' => 22, 'end' => 41],
            3 => ['start' => 42, 'end' => 61],
            4 => ['start' => 62, 'end' => 81],
            5 => ['start' => 82, 'end' => 101],
            6 => ['start' => 102, 'end' => 121],
            7 => ['start' => 122, 'end' => 141],
            8 => ['start' => 142, 'end' => 161],
            9 => ['start' => 162, 'end' => 181],
            10 => ['start' => 182, 'end' => 201],
            11 => ['start' => 202, 'end' => 221],
            12 => ['start' => 222, 'end' => 241],
            13 => ['start' => 242, 'end' => 261],
            14 => ['start' => 262, 'end' => 281],
            15 => ['start' => 282, 'end' => 301],
            16 => ['start' => 302, 'end' => 321],
            17 => ['start' => 322, 'end' => 341],
            18 => ['start' => 342, 'end' => 361],
            19 => ['start' => 362, 'end' => 381],
            20 => ['start' => 382, 'end' => 401],
            21 => ['start' => 402, 'end' => 421],
            22 => ['start' => 422, 'end' => 441],
            23 => ['start' => 442, 'end' => 461],
            24 => ['start' => 462, 'end' => 481],
            25 => ['start' => 482, 'end' => 501],
            26 => ['start' => 502, 'end' => 521],
            27 => ['start' => 522, 'end' => 541],
            28 => ['start' => 542, 'end' => 561],
            29 => ['start' => 562, 'end' => 581],
            30 => ['start' => 582, 'end' => 604],
        ];

        $juzData = [];
        foreach ($juzPageRanges as $juzNumber => $range) {
            $juzData[] = [
                'id' => $juzNumber,
                'juz_number' => $juzNumber,
                'page_start' => $range['start'],
                'page_end' => $range['end'],
                'name_arabic' => "الجزء {$juzNumber}",
                'name_english' => "Juz {$juzNumber}",
            ];
        }

        return $juzData;
    }

    /**
     * Get Juz number from page number
     */
    public function getJuzFromPage(int $pageNumber): int
    {
        $juzData = $this->getAllJuz();

        foreach ($juzData as $juz) {
            if ($pageNumber >= $juz['page_start'] && $pageNumber <= $juz['page_end']) {
                return $juz['juz_number'];
            }
        }

        return 1;
    }

    /**
     * Get verse text (Arabic)
     */
    public function getVerseText(int $surahNumber, int $verseNumber): ?string
    {
        $verse = $this->getAyah($surahNumber, $verseNumber);
        return $verse['text_uthmani'] ?? $verse['text_imlaei'] ?? null;
    }

    /**
     * Get page details
     */
    public function getPageDetails(int $pageNumber): array
    {
        $cacheKey = "quran_api_page_details_{$pageNumber}";

        return Cache::remember($cacheKey, self::CACHE_TTL, function() use ($pageNumber) {
            try {
                $data = $this->makeRequest("/verses/by_page/{$pageNumber}");
                $verses = $data['verses'] ?? [];

                if (empty($verses)) {
                    return [
                        'page_number' => $pageNumber,
                        'verse_count' => 0,
                        'verses' => [],
                    ];
                }

                $firstVerse = $verses[0];
                $lastVerse = end($verses);

                return [
                    'page_number' => $pageNumber,
                    'verse_count' => count($verses),
                    'surah_start' => $firstVerse['chapter_id'] ?? 0,
                    'verse_start' => $firstVerse['verse_number'] ?? 0,
                    'surah_end' => $lastVerse['chapter_id'] ?? 0,
                    'verse_end' => $lastVerse['verse_number'] ?? 0,
                    'juz_number' => $this->getJuzFromPage($pageNumber),
                    'verses' => $verses,
                ];
            } catch (\Exception $e) {
                Log::error('QuranApiService: Failed to fetch page details', [
                    'page' => $pageNumber,
                    'error' => $e->getMessage()
                ]);
                return [
                    'page_number' => $pageNumber,
                    'verse_count' => 0,
                    'verses' => [],
                ];
            }
        });
    }
}