<?php

namespace App\External;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Concrete implementation of QuranApiClient using the free, unauthenticated
 * quran.com public API (api.quran.com/api/v4). Source of record for all
 * Quran reference data used by the app (surahs, verses, pages, Juz, Hizb).
 */
class QuranComApiClient implements QuranApiClient
{
    private const QURAN_COM_BASE_URL = 'https://api.quran.com/api/v4';

    private const CACHE_TTL = 86400; // 24 hours

    /**
     * Get Juz page ranges. Standard Mushaf has 30 Juz.
     *
     * This is fixed, canonical reference data for the standard 604-page Mushaf
     * (it does not vary and is not something the live API needs to be queried
     * for) — hardcoded directly rather than fetched, so this is instant and
     * makes no network calls.
     */
    public function getJuzPageRanges(): array
    {
        return $this->getStandardJuzRanges();
    }

    /**
     * Get Hizb page ranges. Standard Mushaf has 60 Hizb (each Juz split in two).
     * Fixed, canonical reference data — see getJuzPageRanges().
     */
    public function getHizbPageRanges(): array
    {
        return $this->getStandardHizbRanges();
    }

    /**
     * Standard Juz page ranges (604-page Mushaf).
     */
    private function getStandardJuzRanges(): array
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
     * Standard Hizb page ranges, derived by bisecting each standard Juz range
     * (each Juz is exactly 2 Hizb).
     */
    private function getStandardHizbRanges(): array
    {
        $ranges = [];

        foreach ($this->getStandardJuzRanges() as $juzNumber => $juzRange) {
            $midpoint = $juzRange['start_page'] + intdiv($juzRange['end_page'] - $juzRange['start_page'], 2);

            $firstHizb = ($juzNumber - 1) * 2 + 1;
            $ranges[$firstHizb] = ['start_page' => $juzRange['start_page'], 'end_page' => $midpoint];
            $ranges[$firstHizb + 1] = ['start_page' => $midpoint + 1, 'end_page' => $juzRange['end_page']];
        }

        return $ranges;
    }

    /**
     * Get page number for a specific ayah.
     */
    public function getPageForAyah(int $surah, int $verse): ?int
    {
        $verse = $this->getAyah($surah, $verse);

        return $verse['page_number'] ?? null;
    }

    /**
     * Get all Surahs (114 chapters), raw shape from the API.
     */
    public function getSurahs(): array
    {
        return $this->rememberOnSuccess('quran_com_surahs', function () {
            try {
                $response = Http::timeout(10)->get(self::QURAN_COM_BASE_URL.'/chapters');

                if ($response->successful()) {
                    return $response->json('chapters', []);
                }
            } catch (\Exception $e) {
                Log::error('Failed to fetch surahs from quran.com API', ['error' => $e->getMessage()]);
            }

            return null;
        }) ?? [];
    }

    /**
     * Cache $fetch()'s result under $key, but only when it succeeds. $fetch
     * must return null to signal a failure; any non-null result is treated
     * as success and cached. A failure is never cached, so the next call
     * retries the network immediately instead of returning a stale/empty
     * result for the full TTL.
     */
    private function rememberOnSuccess(string $key, \Closure $fetch): mixed
    {
        $cached = Cache::get($key);
        if ($cached !== null) {
            return $cached;
        }

        $result = $fetch();

        if ($result !== null) {
            Cache::put($key, $result, self::CACHE_TTL);
        }

        return $result;
    }

    /**
     * Get specific surah metadata.
     */
    public function getSurah(int $surahNumber): ?array
    {
        foreach ($this->getSurahs() as $surah) {
            if ($surah['id'] == $surahNumber) {
                return $surah;
            }
        }

        return null;
    }

    /**
     * Get a specific verse (ayah), including its Arabic text and page/juz/hizb/rub numbers.
     *
     * Requests text_qpc_hafs alongside text_uthmani: text_qpc_hafs is the
     * field Quran Foundation documents as paired with the UthmanicHafs
     * webfont this app renders with (see docs/tutorials/fonts/font-rendering) —
     * text_uthmani uses different codepoints for the same annotation marks
     * and renders as unshaped "tofu" dots with that font.
     */
    public function getAyah(int $surahNumber, int $verseNumber): ?array
    {
        $cacheKey = "quran_com_ayah_v2_{$surahNumber}_{$verseNumber}";

        return $this->rememberOnSuccess($cacheKey, function () use ($surahNumber, $verseNumber) {
            try {
                $response = Http::timeout(10)->get(
                    self::QURAN_COM_BASE_URL."/verses/by_key/{$surahNumber}:{$verseNumber}",
                    ['fields' => 'text_uthmani,text_imlaei,text_qpc_hafs,page_number,juz_number,hizb_number,rub_el_hizb_number']
                );

                if ($response->successful()) {
                    return $response->json('verse');
                }
            } catch (\Exception $e) {
                Log::warning('Failed to fetch ayah from quran.com API', [
                    'surah' => $surahNumber,
                    'verse' => $verseNumber,
                    'error' => $e->getMessage(),
                ]);
            }

            return null;
        });
    }

    /**
     * Get page number for a specific verse.
     */
    public function getVersePageNumber(int $surahNumber, int $verseNumber): ?int
    {
        return $this->getPageForAyah($surahNumber, $verseNumber);
    }

    /**
     * Get the Rub el Hizb number (1-240) containing a given verse.
     */
    public function getRubElHizbForAyah(int $surah, int $verse): ?int
    {
        $verseData = $this->getAyah($surah, $verse);

        return $verseData['rub_el_hizb_number'] ?? null;
    }

    /**
     * Calculate page range from a verse selection.
     */
    public function calculatePageRange(int $surahFrom, int $surahTo, int $verseFrom, int $verseTo): array
    {
        $pageFrom = $this->getVersePageNumber($surahFrom, $verseFrom);
        $pageTo = $this->getVersePageNumber($surahTo, $verseTo);

        if ($pageFrom === null || $pageTo === null) {
            Log::warning('Could not determine page range', [
                'surah_from' => $surahFrom,
                'verse_from' => $verseFrom,
                'surah_to' => $surahTo,
                'verse_to' => $verseTo,
            ]);

            return ['page_from' => 0, 'page_to' => 0];
        }

        return ['page_from' => $pageFrom, 'page_to' => $pageTo];
    }

    /**
     * Validate a multi-surah verse range.
     */
    public function validateMultiSurahRange(int $surahFrom, int $surahTo, int $verseFrom, int $verseTo): array
    {
        $surahFromData = $this->getSurah($surahFrom);
        if (! $surahFromData) {
            return ['valid' => false, 'error' => "Surah {$surahFrom} not found"];
        }

        $surahToData = $this->getSurah($surahTo);
        if (! $surahToData) {
            return ['valid' => false, 'error' => "Surah {$surahTo} not found"];
        }

        if ($verseFrom < 1 || $verseFrom > $surahFromData['verses_count']) {
            return ['valid' => false, 'error' => "Verse {$verseFrom} is out of range for Surah {$surahFrom}"];
        }

        if ($verseTo < 1 || $verseTo > $surahToData['verses_count']) {
            return ['valid' => false, 'error' => "Verse {$verseTo} is out of range for Surah {$surahTo}"];
        }

        if ($surahFrom === $surahTo && $verseFrom >= $verseTo) {
            return [
                'valid' => false,
                'error' => 'When selecting the same surah, the starting verse must be less than the ending verse',
            ];
        }

        return ['valid' => true];
    }

    /**
     * Calculate total verses covered in a range.
     */
    public function calculateTotalVerses(int $surahFrom, int $surahTo, int $verseFrom, int $verseTo): int
    {
        if ($surahFrom === $surahTo) {
            return abs($verseTo - $verseFrom) + 1;
        }

        $total = 0;
        $surahsById = collect($this->getSurahs())->keyBy('id');

        if ($surahFrom < $surahTo) {
            $total += ($surahsById[$surahFrom]['verses_count'] - $verseFrom) + 1;

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

            $total += ($surahsById[$surahTo]['verses_count'] - $verseTo) + 1;
        }

        return $total;
    }

    /**
     * Get all Juz information (id, juz_number, page_start, page_end, names),
     * derived from getJuzPageRanges() — the single source of truth for Juz boundaries.
     */
    public function getAllJuz(): array
    {
        $ranges = $this->getJuzPageRanges();
        ksort($ranges);

        $juzData = [];
        foreach ($ranges as $juzNumber => $range) {
            $juzData[] = [
                'id' => $juzNumber,
                'juz_number' => $juzNumber,
                'page_start' => $range['start_page'],
                'page_end' => $range['end_page'],
                'name_arabic' => "الجزء {$juzNumber}",
                'name_english' => "Juz {$juzNumber}",
            ];
        }

        return $juzData;
    }

    /**
     * Get the Juz number containing a given page.
     */
    public function getJuzFromPage(int $pageNumber): int
    {
        foreach ($this->getAllJuz() as $juz) {
            if ($pageNumber >= $juz['page_start'] && $pageNumber <= $juz['page_end']) {
                return $juz['juz_number'];
            }
        }

        return 1;
    }

    /**
     * Get the Hizb number containing a given page.
     */
    public function getHizbFromPage(int $pageNumber): int
    {
        foreach ($this->getHizbPageRanges() as $hizbNumber => $range) {
            if ($pageNumber >= $range['start_page'] && $pageNumber <= $range['end_page']) {
                return $hizbNumber;
            }
        }

        return 1;
    }

    /**
     * Get the Arabic text of a specific verse, in the encoding paired with
     * the UthmanicHafs webfont (see getAyah()).
     */
    public function getVerseText(int $surahNumber, int $verseNumber): ?string
    {
        $verse = $this->getAyah($surahNumber, $verseNumber);

        return $verse['text_qpc_hafs'] ?? $verse['text_uthmani'] ?? $verse['text_imlaei'] ?? null;
    }

    /**
     * Get details (surah/verse boundaries, juz number) for a Mushaf page.
     */
    public function getPageDetails(int $pageNumber): array
    {
        $cacheKey = "quran_com_page_details_{$pageNumber}";

        return $this->rememberOnSuccess($cacheKey, function () use ($pageNumber) {
            try {
                $response = Http::timeout(10)->get(
                    self::QURAN_COM_BASE_URL."/verses/by_page/{$pageNumber}",
                    ['fields' => 'juz_number']
                );

                if ($response->successful()) {
                    $verses = $response->json('verses', []);

                    if (empty($verses)) {
                        return ['page_number' => $pageNumber, 'verse_count' => 0, 'verses' => []];
                    }

                    $firstVerse = $verses[0];
                    $lastVerse = end($verses);
                    [$surahStart, $verseStart] = explode(':', $firstVerse['verse_key']);
                    [$surahEnd, $verseEnd] = explode(':', $lastVerse['verse_key']);

                    return [
                        'page_number' => $pageNumber,
                        'verse_count' => count($verses),
                        'surah_start' => (int) $surahStart,
                        'verse_start' => (int) $verseStart,
                        'surah_end' => (int) $surahEnd,
                        'verse_end' => (int) $verseEnd,
                        'juz_number' => $firstVerse['juz_number'] ?? $this->getJuzFromPage($pageNumber),
                        'verses' => $verses,
                    ];
                }
            } catch (\Exception $e) {
                Log::error('Failed to fetch page details from quran.com API', [
                    'page' => $pageNumber,
                    'error' => $e->getMessage(),
                ]);
            }

            return null;
        }) ?? ['page_number' => $pageNumber, 'verse_count' => 0, 'verses' => []];
    }

    /**
     * Get every verse on a Mushaf page, in order, with Arabic text in the
     * encoding paired with the UthmanicHafs webfont (see getAyah()). Used to
     * render a full page as live text rather than a page image.
     */
    public function getPageVerses(int $pageNumber): array
    {
        $cacheKey = "quran_com_page_verses_v2_{$pageNumber}";

        return $this->rememberOnSuccess($cacheKey, function () use ($pageNumber) {
            try {
                $response = Http::timeout(10)->get(
                    self::QURAN_COM_BASE_URL."/verses/by_page/{$pageNumber}",
                    ['fields' => 'text_qpc_hafs']
                );

                if ($response->successful()) {
                    return array_map(
                        fn (array $verse) => [
                            'verse_key' => $verse['verse_key'],
                            'text_qpc_hafs' => $verse['text_qpc_hafs'],
                        ],
                        $response->json('verses', [])
                    );
                }
            } catch (\Exception $e) {
                Log::error('Failed to fetch page verses from quran.com API', [
                    'page' => $pageNumber,
                    'error' => $e->getMessage(),
                ]);
            }

            return null;
        }) ?? [];
    }

    /**
     * Get the CDN image URL for a Mushaf page. Images are served from a public
     * CDN, not the API — no auth or API call required.
     */
    public function getPageImageUrl(int $pageNumber, string $quality = 'high'): string
    {
        if ($pageNumber < 1 || $pageNumber > 604) {
            throw new \InvalidArgumentException('Page number must be between 1 and 604');
        }

        $qualityPaths = ['high' => 'w1920', 'medium' => 'w960', 'low' => 'w480'];
        $width = $qualityPaths[$quality] ?? 'w1920';
        $paddedPage = str_pad($pageNumber, 3, '0', STR_PAD_LEFT);

        return "https://cdn.qurancdn.com/images/{$width}/page{$paddedPage}.png";
    }
}
