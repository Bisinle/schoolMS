<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class DebugQuranAuth extends Command
{
    protected $signature = 'quran:debug-auth';
    protected $description = 'Debug Quran API authentication';

    public function handle()
    {
        $this->info('🔍 Debugging Quran API Authentication...');
        $this->newLine();

        // Step 1: Check environment variables
        $this->info('Step 1: Checking environment variables...');
        $clientId = config('services.quran.client_id');
        $clientSecret = config('services.quran.client_secret');
        $environment = config('services.quran.environment');

        $this->line("   Client ID: " . ($clientId ? substr($clientId, 0, 10) . '...' : 'NOT SET'));
        $this->line("   Client Secret: " . ($clientSecret ? substr($clientSecret, 0, 5) . '...' : 'NOT SET'));
        $this->line("   Environment: " . ($environment ?? 'NOT SET'));
        $this->newLine();

        if (!$clientId || !$clientSecret) {
            $this->error('❌ Client credentials are not set!');
            return Command::FAILURE;
        }

        // Step 2: Determine URLs
        $this->info('Step 2: Determining API URLs...');
        if ($environment === 'production') {
            $authUrl = 'https://oauth2.quran.foundation';
            $apiBaseUrl = 'https://apis.quran.foundation/content/api/v4';
        } else {
            $authUrl = 'https://prelive-oauth2.quran.foundation';
            $apiBaseUrl = 'https://apis-prelive.quran.foundation/content/api/v4';
        }

        $this->line("   Auth URL: {$authUrl}");
        $this->line("   API Base URL: {$apiBaseUrl}");
        $this->newLine();

        // Step 3: Test authentication (Method 1: Form data)
        $this->info('Step 3a: Testing OAuth2 token request (Form data with scope)...');

        try {
            $response = Http::asForm()->post($authUrl . '/oauth2/token', [
                'grant_type' => 'client_credentials',
                'client_id' => $clientId,
                'client_secret' => $clientSecret,
                'scope' => 'content', // Required for Quran content API
            ]);

            $this->line("   Status Code: " . $response->status());
            
            if ($response->successful()) {
                $data = $response->json();
                $this->info("   ✅ SUCCESS: Access token obtained!");
                $this->line("   Token: " . substr($data['access_token'], 0, 20) . '...');
                $this->line("   Expires in: " . ($data['expires_in'] ?? 'unknown') . ' seconds');
                $this->newLine();

                // Step 4: Test API request
                $this->info('Step 4: Testing API request with token...');
                $token = $data['access_token'];

                $apiResponse = Http::withHeaders([
                    'x-auth-token' => $token,
                    'x-client-id' => $clientId,
                ])->get($apiBaseUrl . '/chapters');

                $this->line("   Status Code: " . $apiResponse->status());

                if ($apiResponse->successful()) {
                    $chapters = $apiResponse->json('chapters', []);
                    $this->info("   ✅ SUCCESS: Retrieved " . count($chapters) . " chapters!");
                    
                    if (count($chapters) > 0) {
                        $this->line("   First chapter: " . ($chapters[0]['name_simple'] ?? 'Unknown'));
                    }
                } else {
                    $this->error("   ❌ FAILED: API request failed");
                    $this->line("   Response: " . $apiResponse->body());
                }

            } else {
                $this->error("   ❌ FAILED: Could not get access token (Form data method)");
                $this->line("   Response: " . $response->body());

                // Try to parse error
                $errorData = $response->json();
                if (isset($errorData['error'])) {
                    $this->error("   Error: " . $errorData['error']);
                    if (isset($errorData['error_description'])) {
                        $this->error("   Description: " . $errorData['error_description']);
                    }
                }

                $this->newLine();

                // Try Method 2: Basic Auth
                $this->info('Step 3b: Testing OAuth2 token request (Basic Auth with scope)...');

                $response2 = Http::withBasicAuth($clientId, $clientSecret)
                    ->asForm()
                    ->post($authUrl . '/oauth2/token', [
                        'grant_type' => 'client_credentials',
                        'scope' => 'content', // Required for Quran content API
                    ]);

                $this->line("   Status Code: " . $response2->status());

                if ($response2->successful()) {
                    $data = $response2->json();
                    $this->info("   ✅ SUCCESS: Access token obtained with Basic Auth!");
                    $this->line("   Token: " . substr($data['access_token'], 0, 20) . '...');
                    $this->line("   Expires in: " . ($data['expires_in'] ?? 'unknown') . ' seconds');
                    $this->newLine();

                    // Test API request
                    $this->info('Step 4: Testing API request with token...');
                    $token = $data['access_token'];

                    $apiResponse = Http::withHeaders([
                        'x-auth-token' => $token,
                        'x-client-id' => $clientId,
                    ])->get($apiBaseUrl . '/chapters');

                    $this->line("   Status Code: " . $apiResponse->status());

                    if ($apiResponse->successful()) {
                        $chapters = $apiResponse->json('chapters', []);
                        $this->info("   ✅ SUCCESS: Retrieved " . count($chapters) . " chapters!");

                        if (count($chapters) > 0) {
                            $this->line("   First chapter: " . ($chapters[0]['name_simple'] ?? 'Unknown'));
                        }
                    } else {
                        $this->error("   ❌ FAILED: API request failed");
                        $this->line("   Response: " . $apiResponse->body());
                    }
                } else {
                    $this->error("   ❌ FAILED: Basic Auth also failed");
                    $this->line("   Response: " . $response2->body());
                }
            }

        } catch (\Exception $e) {
            $this->error('❌ Exception: ' . $e->getMessage());
            return Command::FAILURE;
        }

        return Command::SUCCESS;
    }
}

