<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\SchoolSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SystemPreferencesController extends Controller
{
    /**
     * Display the system preferences page
     */
    public function index()
    {
        $preferences = [
            'currency' => SchoolSetting::get('currency', 'KSh'),
            'date_format' => SchoolSetting::get('date_format', 'DD/MM/YYYY'),
            'time_zone' => SchoolSetting::get('time_zone', 'Africa/Nairobi'),
            'language' => SchoolSetting::get('language', 'English'),
        ];

        return Inertia::render('Settings/SystemPreferences/Index', [
            'preferences' => $preferences,
            'currencyOptions' => $this->getCurrencyOptions(),
            'dateFormatOptions' => $this->getDateFormatOptions(),
            'timeZoneOptions' => $this->getTimeZoneOptions(),
            'languageOptions' => $this->getLanguageOptions(),
        ]);
    }

    /**
     * Update system preferences
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'currency' => 'required|string|in:KSh,USD,EUR,GBP',
            'date_format' => 'required|string|in:DD/MM/YYYY,MM/DD/YYYY,YYYY-MM-DD',
            'time_zone' => 'required|string',
            'language' => 'required|string|in:English,Swahili',
        ]);

        foreach ($validated as $key => $value) {
            SchoolSetting::set($key, $value);
        }

        return redirect()->back()->with('success', 'System preferences updated successfully!');
    }

    /**
     * Get currency options
     */
    private function getCurrencyOptions()
    {
        return [
            ['value' => 'KSh', 'label' => 'Kenyan Shilling (KSh)'],
            ['value' => 'USD', 'label' => 'US Dollar ($)'],
            ['value' => 'EUR', 'label' => 'Euro (€)'],
            ['value' => 'GBP', 'label' => 'British Pound (£)'],
        ];
    }

    /**
     * Get date format options
     */
    private function getDateFormatOptions()
    {
        return [
            ['value' => 'DD/MM/YYYY', 'label' => 'DD/MM/YYYY (31/12/2025)'],
            ['value' => 'MM/DD/YYYY', 'label' => 'MM/DD/YYYY (12/31/2025)'],
            ['value' => 'YYYY-MM-DD', 'label' => 'YYYY-MM-DD (2025-12-31)'],
        ];
    }

    /**
     * Get timezone options
     */
    private function getTimeZoneOptions()
    {
        return [
            ['value' => 'Africa/Nairobi', 'label' => 'Africa/Nairobi (EAT)'],
            ['value' => 'Africa/Lagos', 'label' => 'Africa/Lagos (WAT)'],
            ['value' => 'Africa/Cairo', 'label' => 'Africa/Cairo (EET)'],
            ['value' => 'Africa/Johannesburg', 'label' => 'Africa/Johannesburg (SAST)'],
            ['value' => 'UTC', 'label' => 'UTC'],
            ['value' => 'America/New_York', 'label' => 'America/New_York (EST)'],
            ['value' => 'Europe/London', 'label' => 'Europe/London (GMT)'],
        ];
    }

    /**
     * Get language options
     */
    private function getLanguageOptions()
    {
        return [
            ['value' => 'English', 'label' => 'English'],
            ['value' => 'Swahili', 'label' => 'Swahili'],
        ];
    }
}

