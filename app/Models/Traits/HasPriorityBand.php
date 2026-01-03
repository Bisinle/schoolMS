<?php

namespace App\Models\Traits;

/**
 * Trait HasPriorityBand
 * 
 * Provides priority band mapping functionality for timetable scheduling.
 * Maps subject priorities to period priority bands for optimal scheduling.
 * 
 * Priority Mapping:
 * - high → morning_high (Fresh mind subjects: Math, Science)
 * - neutral → neutral (Mid-day subjects: Languages, Social Studies)
 * - low → afternoon_low (Low-energy subjects: Arts, PE, Music)
 */
trait HasPriorityBand
{
    /**
     * Map subject priority to period priority band
     * 
     * @param string $subjectPriority The subject priority (high, neutral, low)
     * @return string The corresponding period priority band
     */
    public static function mapPriorityToBand(string $subjectPriority): string
    {
        return match ($subjectPriority) {
            'high' => 'morning_high',
            'neutral' => 'neutral',
            'low' => 'afternoon_low',
            default => 'neutral',
        };
    }

    /**
     * Map period priority band to subject priority
     * 
     * @param string $priorityBand The period priority band (morning_high, neutral, afternoon_low)
     * @return string The corresponding subject priority
     */
    public static function mapBandToPriority(string $priorityBand): string
    {
        return match ($priorityBand) {
            'morning_high' => 'high',
            'neutral' => 'neutral',
            'afternoon_low' => 'low',
            default => 'neutral',
        };
    }

    /**
     * Check if a subject priority matches a period priority band
     * 
     * @param string $subjectPriority The subject priority
     * @param string $periodBand The period priority band
     * @return bool True if they match
     */
    public static function priorityMatchesBand(string $subjectPriority, string $periodBand): bool
    {
        return self::mapPriorityToBand($subjectPriority) === $periodBand;
    }

    /**
     * Get all valid subject priorities
     * 
     * @return array
     */
    public static function getSubjectPriorities(): array
    {
        return ['high', 'neutral', 'low'];
    }

    /**
     * Get all valid period priority bands
     * 
     * @return array
     */
    public static function getPeriodPriorityBands(): array
    {
        return ['morning_high', 'neutral', 'afternoon_low'];
    }

    /**
     * Get priority band label for display
     * 
     * @param string $band The priority band
     * @return string Human-readable label
     */
    public static function getPriorityBandLabel(string $band): string
    {
        return match ($band) {
            'morning_high' => 'Morning (High Focus)',
            'neutral' => 'Mid-Day (Neutral)',
            'afternoon_low' => 'Afternoon (Low Energy)',
            default => 'Unspecified',
        };
    }

    /**
     * Get subject priority label for display
     * 
     * @param string $priority The subject priority
     * @return string Human-readable label
     */
    public static function getSubjectPriorityLabel(string $priority): string
    {
        return match ($priority) {
            'high' => 'High Priority (Morning)',
            'neutral' => 'Neutral (Anytime)',
            'low' => 'Low Priority (Afternoon)',
            default => 'Unspecified',
        };
    }

    /**
     * Get color class for priority band (for UI styling)
     * 
     * @param string $band The priority band
     * @return string Tailwind color class
     */
    public static function getPriorityBandColor(string $band): string
    {
        return match ($band) {
            'morning_high' => 'text-green-600 bg-green-50',
            'neutral' => 'text-blue-600 bg-blue-50',
            'afternoon_low' => 'text-orange-600 bg-orange-50',
            default => 'text-gray-600 bg-gray-50',
        };
    }
}

