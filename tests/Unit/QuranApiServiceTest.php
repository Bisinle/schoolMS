<?php

namespace Tests\Unit;

use App\Services\QuranApiService;
use Tests\TestCase;

class QuranApiServiceTest extends TestCase
{
    /**
     * Missing QURAN_API_CLIENT_ID/SECRET must not crash container resolution
     * of QuranApiService (and, by extension, any controller that injects it).
     */
    public function test_it_can_be_instantiated_without_configured_credentials(): void
    {
        config(['services.quran.client_id' => null]);
        config(['services.quran.client_secret' => null]);

        $service = app(QuranApiService::class);

        $this->assertInstanceOf(QuranApiService::class, $service);
    }

    /**
     * Without credentials, API-backed lookups must degrade to an empty/null
     * result rather than crash the request with an uncaught TypeError.
     */
    public function test_get_surahs_returns_empty_array_without_configured_credentials(): void
    {
        config(['services.quran.client_id' => null]);
        config(['services.quran.client_secret' => null]);

        $service = app(QuranApiService::class);

        $this->assertSame([], $service->getSurahs());
    }
}
