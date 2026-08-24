<?php

namespace Tests\Unit;

use App\External\QuranComApiClient;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class QuranComApiClientTest extends TestCase
{
    public function test_juz_page_ranges_are_the_standard_static_table_with_no_network_calls(): void
    {
        Http::fake();

        $ranges = (new QuranComApiClient)->getJuzPageRanges();

        Http::assertNothingSent();
        $this->assertCount(30, $ranges);
        $this->assertSame(['start_page' => 1, 'end_page' => 21], $ranges[1]);
        $this->assertSame(['start_page' => 582, 'end_page' => 604], $ranges[30]);
    }

    public function test_hizb_page_ranges_are_bisected_from_the_juz_table_with_no_network_calls(): void
    {
        Http::fake();

        $ranges = (new QuranComApiClient)->getHizbPageRanges();

        Http::assertNothingSent();
        $this->assertCount(60, $ranges);
        // Juz 1 (pages 1-21) bisects into Hizb 1 (1-11) and Hizb 2 (12-21).
        $this->assertSame(['start_page' => 1, 'end_page' => 11], $ranges[1]);
        $this->assertSame(['start_page' => 12, 'end_page' => 21], $ranges[2]);
        // Juz 30 (pages 582-604) bisects into Hizb 59 (582-593) and Hizb 60 (594-604).
        $this->assertSame(['start_page' => 582, 'end_page' => 593], $ranges[59]);
        $this->assertSame(['start_page' => 594, 'end_page' => 604], $ranges[60]);
    }

    public function test_get_all_juz_returns_thirty_sorted_entries_with_labels(): void
    {
        $juz = (new QuranComApiClient)->getAllJuz();

        $this->assertCount(30, $juz);
        $this->assertSame(1, $juz[0]['juz_number']);
        $this->assertSame(30, $juz[29]['juz_number']);
        $this->assertSame(['start_page' => 1, 'end_page' => 21], ['start_page' => $juz[0]['page_start'], 'end_page' => $juz[0]['page_end']]);
    }

    public function test_get_juz_from_page_and_get_hizb_from_page(): void
    {
        $client = new QuranComApiClient;

        $this->assertSame(1, $client->getJuzFromPage(10));
        $this->assertSame(2, $client->getJuzFromPage(22));
        $this->assertSame(1, $client->getHizbFromPage(5));
        $this->assertSame(2, $client->getHizbFromPage(15));
    }

    public function test_get_surahs_returns_raw_chapters_from_api(): void
    {
        Http::fake([
            'api.quran.com/api/v4/chapters' => Http::response([
                'chapters' => [
                    ['id' => 1, 'name_simple' => 'Al-Fatihah', 'verses_count' => 7],
                    ['id' => 2, 'name_simple' => 'Al-Baqarah', 'verses_count' => 286],
                ],
            ], 200),
        ]);

        $client = new QuranComApiClient;

        $this->assertCount(2, $client->getSurahs());
        $this->assertSame('Al-Baqarah', $client->getSurah(2)['name_simple']);
        $this->assertNull($client->getSurah(999));
    }

    public function test_validate_multi_surah_range_rejects_out_of_range_verse(): void
    {
        Http::fake([
            'api.quran.com/api/v4/chapters' => Http::response([
                'chapters' => [
                    ['id' => 1, 'name_simple' => 'Al-Fatihah', 'verses_count' => 7],
                ],
            ], 200),
        ]);

        $result = (new QuranComApiClient)->validateMultiSurahRange(1, 1, 1, 10);

        $this->assertFalse($result['valid']);
        $this->assertStringContainsString('out of range', $result['error']);
    }

    public function test_validate_multi_surah_range_rejects_reversed_same_surah_range(): void
    {
        Http::fake([
            'api.quran.com/api/v4/chapters' => Http::response([
                'chapters' => [
                    ['id' => 1, 'name_simple' => 'Al-Fatihah', 'verses_count' => 7],
                ],
            ], 200),
        ]);

        $result = (new QuranComApiClient)->validateMultiSurahRange(1, 1, 5, 2);

        $this->assertFalse($result['valid']);
    }

    public function test_validate_multi_surah_range_accepts_valid_range(): void
    {
        Http::fake([
            'api.quran.com/api/v4/chapters' => Http::response([
                'chapters' => [
                    ['id' => 1, 'name_simple' => 'Al-Fatihah', 'verses_count' => 7],
                    ['id' => 2, 'name_simple' => 'Al-Baqarah', 'verses_count' => 286],
                ],
            ], 200),
        ]);

        $result = (new QuranComApiClient)->validateMultiSurahRange(1, 2, 1, 5);

        $this->assertTrue($result['valid']);
    }

    public function test_calculate_total_verses_across_multiple_surahs(): void
    {
        Http::fake([
            'api.quran.com/api/v4/chapters' => Http::response([
                'chapters' => [
                    ['id' => 1, 'name_simple' => 'Al-Fatihah', 'verses_count' => 7],
                    ['id' => 2, 'name_simple' => 'Al-Baqarah', 'verses_count' => 286],
                    ['id' => 3, 'name_simple' => 'Al-Imran', 'verses_count' => 200],
                ],
            ], 200),
        ]);

        // Surah 1 verse 5 through Surah 3 verse 10:
        // (7 - 5 + 1) + 286 + 10 = 3 + 286 + 10 = 299
        $total = (new QuranComApiClient)->calculateTotalVerses(1, 3, 5, 10);

        $this->assertSame(299, $total);
    }

    public function test_calculate_total_verses_within_single_surah(): void
    {
        $total = (new QuranComApiClient)->calculateTotalVerses(2, 2, 5, 10);

        $this->assertSame(6, $total);
    }

    public function test_calculate_page_range_from_verse_selection(): void
    {
        Http::fake([
            'api.quran.com/api/v4/verses/by_key/1:1*' => Http::response(['verse' => ['page_number' => 1]], 200),
            'api.quran.com/api/v4/verses/by_key/2:5*' => Http::response(['verse' => ['page_number' => 3]], 200),
        ]);

        $range = (new QuranComApiClient)->calculatePageRange(1, 2, 1, 5);

        $this->assertSame(['page_from' => 1, 'page_to' => 3], $range);
    }

    public function test_get_page_details_parses_verse_key_boundaries(): void
    {
        Http::fake([
            'api.quran.com/api/v4/verses/by_page/1*' => Http::response([
                'verses' => [
                    ['verse_key' => '1:1', 'juz_number' => 1],
                    ['verse_key' => '1:2', 'juz_number' => 1],
                    ['verse_key' => '1:7', 'juz_number' => 1],
                ],
            ], 200),
        ]);

        $details = (new QuranComApiClient)->getPageDetails(1);

        $this->assertSame(1, $details['surah_start']);
        $this->assertSame(1, $details['verse_start']);
        $this->assertSame(1, $details['surah_end']);
        $this->assertSame(7, $details['verse_end']);
        $this->assertSame(3, $details['verse_count']);
    }

    public function test_get_page_image_url_rejects_out_of_range_page(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        (new QuranComApiClient)->getPageImageUrl(605);
    }

    public function test_get_page_image_url_builds_cdn_url(): void
    {
        $url = (new QuranComApiClient)->getPageImageUrl(1, 'medium');

        $this->assertSame('https://cdn.qurancdn.com/images/w960/page001.png', $url);
    }

    /**
     * Ayat al-Kursi (2:255) is a documented reference point: Juz 3, Hizb 5,
     * Rub 19, Page 42. A single verse fetch must resolve all four together.
     */
    public function test_reference_verse_resolves_juz_hizb_rub_and_page_together(): void
    {
        Http::fake([
            'api.quran.com/api/v4/verses/by_key/2:255*' => Http::response([
                'verse' => [
                    'page_number' => 42,
                    'juz_number' => 3,
                    'hizb_number' => 5,
                    'rub_el_hizb_number' => 19,
                    'text_uthmani' => 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ...',
                ],
            ], 200),
        ]);

        $client = new QuranComApiClient;

        $this->assertSame(42, $client->getPageForAyah(2, 255));
        $this->assertSame(19, $client->getRubElHizbForAyah(2, 255));

        $verse = $client->getAyah(2, 255);
        $this->assertSame(3, $verse['juz_number']);
        $this->assertSame(5, $verse['hizb_number']);
    }

    public function test_get_rub_el_hizb_for_ayah_returns_null_when_lookup_fails(): void
    {
        Http::fake(['api.quran.com/api/v4/verses/by_key/1:1*' => Http::response([], 500)]);

        $this->assertNull((new QuranComApiClient)->getRubElHizbForAyah(1, 1));
    }

    /**
     * A failed getSurahs() call must not poison the cache — the next call
     * should retry the network instead of returning a stale empty result
     * for the full 24h TTL.
     */
    public function test_get_surahs_does_not_cache_a_failed_response_and_retries(): void
    {
        Cache::flush();

        Http::fake([
            'api.quran.com/api/v4/chapters' => Http::sequence()
                ->push([], 500)
                ->push(['chapters' => [
                    ['id' => 1, 'name_simple' => 'Al-Fatihah', 'verses_count' => 7],
                ]], 200),
        ]);

        $client = new QuranComApiClient;
        $failedResult = $client->getSurahs();
        $this->assertSame([], $failedResult);

        $retryResult = $client->getSurahs();

        $this->assertCount(1, $retryResult);
        Http::assertSentCount(2);
    }

    public function test_get_surahs_caches_a_successful_response(): void
    {
        Cache::flush();

        Http::fake([
            'api.quran.com/api/v4/chapters' => Http::response([
                'chapters' => [
                    ['id' => 1, 'name_simple' => 'Al-Fatihah', 'verses_count' => 7],
                ],
            ], 200),
        ]);

        $client = new QuranComApiClient;
        $client->getSurahs();
        $client->getSurahs();

        Http::assertSentCount(1);
    }

    /**
     * Same cache-poisoning defect as getSurahs(), verified independently
     * since getAyah() has its own per-verse cache key.
     */
    public function test_get_ayah_does_not_cache_a_failed_response_and_retries(): void
    {
        Cache::flush();

        Http::fake([
            'api.quran.com/api/v4/verses/by_key/1:1*' => Http::sequence()
                ->push([], 500)
                ->push(['verse' => ['page_number' => 1]], 200),
        ]);

        $client = new QuranComApiClient;
        $failedResult = $client->getAyah(1, 1);
        $this->assertNull($failedResult);

        $retryResult = $client->getAyah(1, 1);

        $this->assertSame(1, $retryResult['page_number']);
        Http::assertSentCount(2);
    }

    /**
     * getAyah() must request text_qpc_hafs — the field documented as paired
     * with the UthmanicHafs webfont — and getVerseText() must prefer it over
     * text_uthmani, which produces unshaped marks with that font.
     */
    public function test_get_ayah_requests_and_get_verse_text_prefers_qpc_hafs_text(): void
    {
        Http::fake([
            'api.quran.com/api/v4/verses/by_key/1:1*' => Http::response([
                'verse' => ['text_uthmani' => 'نص عثماني', 'text_qpc_hafs' => 'نص حفص'],
            ], 200),
        ]);

        $client = new QuranComApiClient;

        $ayah = $client->getAyah(1, 1);
        $this->assertSame('نص حفص', $ayah['text_qpc_hafs']);

        $sentRequest = Http::recorded()[0][0];
        $this->assertStringContainsString('text_qpc_hafs', $sentRequest->data()['fields']);

        $this->assertSame('نص حفص', $client->getVerseText(1, 1));
    }

    /**
     * Cache keys must change alongside the text_uthmani -> text_qpc_hafs
     * switch, so an entry cached under the old field/key before this fix
     * shipped is never served after it.
     */
    public function test_get_ayah_does_not_serve_a_stale_pre_qpc_hafs_cached_entry(): void
    {
        Cache::flush();
        Cache::put('quran_com_ayah_1_1', ['text_uthmani' => 'STALE PRE-FIX ENTRY', 'page_number' => 1], 86400);

        Http::fake([
            'api.quran.com/api/v4/verses/by_key/1:1*' => Http::response([
                'verse' => ['text_qpc_hafs' => 'نص جديد', 'page_number' => 1],
            ], 200),
        ]);

        $ayah = (new QuranComApiClient)->getAyah(1, 1);

        $this->assertSame('نص جديد', $ayah['text_qpc_hafs']);
        Http::assertSentCount(1);
    }

    /**
     * text_qpc_hafs (not text_uthmani) is the field documented by Quran
     * Foundation as paired with the UthmanicHafs webfont this app renders
     * with — text_uthmani produces unshaped/incorrect marks with that font.
     * Page 42 is the same reference point used elsewhere in this project:
     * it contains Ayat al-Kursi (2:255), among verses 2:253-2:256.
     */
    public function test_get_page_verses_returns_ordered_verses_with_qpc_hafs_text(): void
    {
        Http::fake([
            'api.quran.com/api/v4/verses/by_page/42*' => Http::response([
                'verses' => [
                    ['verse_key' => '2:253', 'text_qpc_hafs' => 'نص الآية ٢٥٣'],
                    ['verse_key' => '2:254', 'text_qpc_hafs' => 'نص الآية ٢٥٤'],
                    ['verse_key' => '2:255', 'text_qpc_hafs' => 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ'],
                    ['verse_key' => '2:256', 'text_qpc_hafs' => 'نص الآية ٢٥٦'],
                ],
            ], 200),
        ]);

        $verses = (new QuranComApiClient)->getPageVerses(42);

        $this->assertCount(4, $verses);
        $this->assertSame('2:253', $verses[0]['verse_key']);
        $this->assertSame('2:255', $verses[2]['verse_key']);
        $this->assertSame('اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ', $verses[2]['text_qpc_hafs']);
        $this->assertSame('2:256', $verses[3]['verse_key']);
    }

    public function test_get_page_verses_does_not_cache_a_failed_response_and_retries(): void
    {
        Cache::flush();

        Http::fake([
            'api.quran.com/api/v4/verses/by_page/42*' => Http::sequence()
                ->push([], 500)
                ->push(['verses' => [
                    ['verse_key' => '2:253', 'text_qpc_hafs' => 'نص'],
                ]], 200),
        ]);

        $client = new QuranComApiClient;
        $failedResult = $client->getPageVerses(42);
        $this->assertSame([], $failedResult);

        $retryResult = $client->getPageVerses(42);

        $this->assertCount(1, $retryResult);
        Http::assertSentCount(2);
    }

    /**
     * Cache keys must change alongside the text_uthmani -> text_qpc_hafs
     * switch, so an entry cached under the old field/key before this fix
     * shipped is never served after it — proven by seeding a stale
     * text_uthmani-only entry under the pre-fix key and confirming the
     * method still hits the network fresh rather than returning it.
     */
    public function test_get_page_verses_does_not_serve_a_stale_pre_qpc_hafs_cached_entry(): void
    {
        Cache::flush();
        Cache::put('quran_com_page_verses_42', [
            ['verse_key' => '2:253', 'text_uthmani' => 'STALE PRE-FIX ENTRY'],
        ], 86400);

        Http::fake([
            'api.quran.com/api/v4/verses/by_page/42*' => Http::response([
                'verses' => [
                    ['verse_key' => '2:253', 'text_qpc_hafs' => 'نص جديد'],
                ],
            ], 200),
        ]);

        $verses = (new QuranComApiClient)->getPageVerses(42);

        $this->assertSame('نص جديد', $verses[0]['text_qpc_hafs']);
        Http::assertSentCount(1);
    }

    public function test_get_page_details_does_not_cache_a_failed_response_and_retries(): void
    {
        Cache::flush();

        Http::fake([
            'api.quran.com/api/v4/verses/by_page/1*' => Http::sequence()
                ->push([], 500)
                ->push(['verses' => [
                    ['verse_key' => '1:1', 'juz_number' => 1],
                ]], 200),
        ]);

        $client = new QuranComApiClient;
        $failedResult = $client->getPageDetails(1);
        $this->assertSame(0, $failedResult['verse_count']);

        $retryResult = $client->getPageDetails(1);

        $this->assertSame(1, $retryResult['verse_count']);
        Http::assertSentCount(2);
    }
}
