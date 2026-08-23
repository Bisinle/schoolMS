<?php

namespace Tests\Unit;

use App\External\QuranApiClient;
use App\Services\QuranTrackingCalculator;
use Tests\TestCase;

class QuranTrackingCalculatorTest extends TestCase
{
    private function calculatorWithRanges(array $juzRanges, array $hizbRanges = [], array $rubByVerseKey = []): QuranTrackingCalculator
    {
        $client = new class($juzRanges, $hizbRanges, $rubByVerseKey) implements QuranApiClient
        {
            public function __construct(private array $juzRanges, private array $hizbRanges, private array $rubByVerseKey) {}

            public function getJuzPageRanges(): array
            {
                return $this->juzRanges;
            }

            public function getHizbPageRanges(): array
            {
                return $this->hizbRanges;
            }

            public function getRubElHizbForAyah(int $surah, int $verse): ?int
            {
                return $this->rubByVerseKey["{$surah}:{$verse}"] ?? null;
            }

            public function getPageForAyah(int $surah, int $verse): ?int
            {
                return null;
            }

            public function getSurahs(): array
            {
                return [];
            }

            public function getSurah(int $surahNumber): ?array
            {
                return null;
            }

            public function getAyah(int $surahNumber, int $verseNumber): ?array
            {
                return null;
            }

            public function getVersePageNumber(int $surahNumber, int $verseNumber): ?int
            {
                return null;
            }

            public function calculatePageRange(int $surahFrom, int $surahTo, int $verseFrom, int $verseTo): array
            {
                return [];
            }

            public function validateMultiSurahRange(int $surahFrom, int $surahTo, int $verseFrom, int $verseTo): array
            {
                return ['valid' => true];
            }

            public function calculateTotalVerses(int $surahFrom, int $surahTo, int $verseFrom, int $verseTo): int
            {
                return 0;
            }

            public function getAllJuz(): array
            {
                return [];
            }

            public function getJuzFromPage(int $pageNumber): int
            {
                return 1;
            }

            public function getHizbFromPage(int $pageNumber): int
            {
                return 1;
            }

            public function getVerseText(int $surahNumber, int $verseNumber): ?string
            {
                return null;
            }

            public function getPageDetails(int $pageNumber): array
            {
                return [];
            }

            public function getPageVerses(int $pageNumber): array
            {
                return [];
            }

            public function getPageImageUrl(int $pageNumber, string $quality = 'high'): string
            {
                return '';
            }
        };

        return new QuranTrackingCalculator($client);
    }

    private function standardJuzRanges(): array
    {
        $ranges = [];
        for ($i = 1; $i <= 30; $i++) {
            $ranges[$i] = ['start_page' => ($i - 1) * 20 + 1, 'end_page' => $i * 20];
        }

        return $ranges;
    }

    private function standardHizbRanges(): array
    {
        $ranges = [];
        for ($i = 1; $i <= 60; $i++) {
            $ranges[$i] = ['start_page' => ($i - 1) * 10 + 1, 'end_page' => $i * 10];
        }

        return $ranges;
    }

    public function test_juz_range_for_pages_within_a_single_juz(): void
    {
        $calculator = $this->calculatorWithRanges($this->standardJuzRanges());

        $range = $calculator->getJuzRangeForPages(5, 15);

        $this->assertSame(['from' => 1, 'to' => 1], $range);
    }

    public function test_juz_range_for_pages_spanning_multiple_juz(): void
    {
        $calculator = $this->calculatorWithRanges($this->standardJuzRanges());

        $range = $calculator->getJuzRangeForPages(15, 45);

        $this->assertSame(['from' => 1, 'to' => 3], $range);
    }

    public function test_juz_range_for_pages_supports_bidirectional_input(): void
    {
        $calculator = $this->calculatorWithRanges($this->standardJuzRanges());

        $range = $calculator->getJuzRangeForPages(45, 15);

        $this->assertSame(['from' => 1, 'to' => 3], $range);
    }

    public function test_juz_range_for_pages_returns_null_when_no_ranges_available(): void
    {
        $calculator = $this->calculatorWithRanges([]);

        $range = $calculator->getJuzRangeForPages(5, 15);

        $this->assertNull($range);
    }

    public function test_hizb_range_for_pages_spanning_multiple_hizb(): void
    {
        $calculator = $this->calculatorWithRanges($this->standardJuzRanges(), $this->standardHizbRanges());

        $range = $calculator->getHizbRangeForPages(5, 25);

        $this->assertSame(['from' => 1, 'to' => 3], $range);
    }

    public function test_hizb_range_for_pages_returns_null_when_no_ranges_available(): void
    {
        $calculator = $this->calculatorWithRanges($this->standardJuzRanges(), []);

        $range = $calculator->getHizbRangeForPages(5, 25);

        $this->assertNull($range);
    }

    public function test_compute_all_metrics_includes_juz_and_hizb_ranges(): void
    {
        $calculator = $this->calculatorWithRanges($this->standardJuzRanges(), $this->standardHizbRanges());

        $metrics = $calculator->computeAllMetrics(5, 25, 1, 2, 1, 10);

        $this->assertSame(1, $metrics['juz_from']);
        $this->assertSame(2, $metrics['juz_to']);
        $this->assertSame(1, $metrics['hizb_from']);
        $this->assertSame(3, $metrics['hizb_to']);
    }

    public function test_compute_all_metrics_sets_null_juz_and_hizb_ranges_without_pages(): void
    {
        $calculator = $this->calculatorWithRanges($this->standardJuzRanges(), $this->standardHizbRanges());

        $metrics = $calculator->computeAllMetrics(null, null, 1, 1, 1, 1);

        $this->assertNull($metrics['juz_from']);
        $this->assertNull($metrics['juz_to']);
        $this->assertNull($metrics['hizb_from']);
        $this->assertNull($metrics['hizb_to']);
    }

    public function test_rub_range_for_verses_within_a_single_rub(): void
    {
        $calculator = $this->calculatorWithRanges([], [], ['2:1' => 5, '2:10' => 5]);

        $range = $calculator->getRubRangeForVerses(2, 1, 2, 10);

        $this->assertSame(['from' => 5, 'to' => 5], $range);
    }

    public function test_rub_range_for_verses_spanning_multiple_rub(): void
    {
        $calculator = $this->calculatorWithRanges([], [], ['2:1' => 5, '2:200' => 9]);

        $range = $calculator->getRubRangeForVerses(2, 1, 2, 200);

        $this->assertSame(['from' => 5, 'to' => 9], $range);
    }

    public function test_rub_range_for_verses_supports_bidirectional_input(): void
    {
        $calculator = $this->calculatorWithRanges([], [], ['2:1' => 5, '2:200' => 9]);

        $range = $calculator->getRubRangeForVerses(2, 200, 2, 1);

        $this->assertSame(['from' => 5, 'to' => 9], $range);
    }

    public function test_rub_range_for_verses_returns_null_when_lookup_fails(): void
    {
        $calculator = $this->calculatorWithRanges([], [], ['2:1' => 5]);

        $range = $calculator->getRubRangeForVerses(2, 1, 2, 200);

        $this->assertNull($range);
    }

    public function test_compute_all_metrics_includes_rub_range_even_without_pages(): void
    {
        $calculator = $this->calculatorWithRanges([], [], ['2:1' => 5, '2:200' => 9]);

        $metrics = $calculator->computeAllMetrics(null, null, 2, 2, 1, 200);

        $this->assertSame(5, $metrics['rub_from']);
        $this->assertSame(9, $metrics['rub_to']);
    }

    public function test_compute_all_metrics_sets_null_rub_range_when_lookup_fails(): void
    {
        $calculator = $this->calculatorWithRanges([], [], []);

        $metrics = $calculator->computeAllMetrics(null, null, 2, 2, 1, 200);

        $this->assertNull($metrics['rub_from']);
        $this->assertNull($metrics['rub_to']);
    }
}
