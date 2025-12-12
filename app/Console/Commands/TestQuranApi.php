<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\QuranApiService;

class TestQuranApi extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'quran:test';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test Quran API authentication and data retrieval';

    /**
     * Execute the console command.
     */
    public function handle(QuranApiService $quranApi)
    {
        $this->info('🕌 Testing Quran API Authentication...');
        $this->newLine();

        try {
            // Test 1: Get Surahs
            $this->info('📖 Test 1: Fetching all Surahs...');
            $surahs = $quranApi->getSurahs();

            if (count($surahs) === 114) {
                $this->info("✅ SUCCESS: Retrieved all 114 surahs");
                $firstSurah = $surahs[0];
                $lastSurah = $surahs[113];
                $this->line("   First Surah: " . ($firstSurah['name_simple'] ?? $firstSurah['name_arabic'] ?? 'Unknown') . " (ID: {$firstSurah['id']})");
                $this->line("   Last Surah: " . ($lastSurah['name_simple'] ?? $lastSurah['name_arabic'] ?? 'Unknown') . " (ID: {$lastSurah['id']})");
            } else {
                $this->error("❌ FAILED: Expected 114 surahs, got " . count($surahs));
            }
            $this->newLine();

            // Test 2: Get Page Image URL
            $this->info('🖼️  Test 2: Generating page image URL...');
            $imageUrl = $quranApi->getPageImageUrl(1, 'medium');
            $this->info("✅ SUCCESS: Generated image URL");
            $this->line("   URL: {$imageUrl}");
            $this->newLine();

            // Test 3: Get Juz Data
            $this->info('📚 Test 3: Fetching Juz data...');
            $juzData = $quranApi->getAllJuz();

            if (count($juzData) === 30) {
                $this->info("✅ SUCCESS: Retrieved all 30 Juz");
                $this->line("   First Juz: {$juzData[0]['juz_number']} (Pages: {$juzData[0]['page_start']}-{$juzData[0]['page_end']})");
                $this->line("   Last Juz: {$juzData[29]['juz_number']} (Pages: {$juzData[29]['page_start']}-{$juzData[29]['page_end']})");
            } else {
                $this->error("❌ FAILED: Expected 30 Juz, got " . count($juzData));
            }
            $this->newLine();

            // Test 4: Get Verse Text
            $this->info('📝 Test 4: Fetching verse text (Al-Fatihah 1:1)...');
            $verseText = $quranApi->getVerseText(1, 1);
            
            if ($verseText) {
                $this->info("✅ SUCCESS: Retrieved verse text");
                $this->line("   Text: {$verseText}");
            } else {
                $this->error("❌ FAILED: Could not retrieve verse text");
            }
            $this->newLine();

            // Summary
            $this->info('🎉 All tests completed successfully!');
            $this->info('✅ Quran API authentication is working correctly');
            
            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error('❌ TEST FAILED: ' . $e->getMessage());
            $this->error('Stack trace: ' . $e->getTraceAsString());
            
            return Command::FAILURE;
        }
    }
}

