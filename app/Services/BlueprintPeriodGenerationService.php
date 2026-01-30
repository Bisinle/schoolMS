<?php

namespace App\Services;

use App\Models\LevelDayBlueprint;
use App\Models\TimetablePeriod;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BlueprintPeriodGenerationService
{
    /**
     * Generate timetable periods from a blueprint.
     * 
     * Strategy:
     * - First generation: Create new periods
     * - Regeneration: UPDATE existing periods (preserves timetable_slot references)
     * 
     * @param LevelDayBlueprint $blueprint
     * @param bool $forceRegenerate If true, regenerate even if periods exist
     * @return array ['created' => int, 'updated' => int, 'skipped' => int]
     */
    public function generatePeriods(LevelDayBlueprint $blueprint, bool $forceRegenerate = false): array
    {
        $stats = ['created' => 0, 'updated' => 0, 'skipped' => 0];

        // Check if blueprint has periods
        if ($blueprint->periods->isEmpty()) {
            throw new \Exception('Blueprint has no periods defined. Please add periods to the blueprint first.');
        }

        // Check if periods already exist for this blueprint
        $existingPeriods = TimetablePeriod::where('school_id', $blueprint->school_id)
            ->where('grade_level', $blueprint->level)
            ->where('generated_from_blueprint_id', $blueprint->id)
            ->get()
            ->keyBy('order'); // Key by order for easy lookup

        DB::beginTransaction();
        try {
            $lessonCounter = 0; // Track lesson numbers

            foreach ($blueprint->periods()->orderBy('sequence_order')->get() as $blueprintPeriod) {
                // Increment lesson counter only for teachable periods
                if ($blueprintPeriod->is_teachable) {
                    $lessonCounter++;
                }

                // Map blueprint period to timetable period data
                $periodData = $this->mapBlueprintPeriodToTimetablePeriod(
                    $blueprintPeriod,
                    $blueprint,
                    $lessonCounter
                );

                // Check if period with this order already exists
                $existingPeriod = $existingPeriods->get($blueprintPeriod->sequence_order);

                if ($existingPeriod) {
                    if ($forceRegenerate) {
                        // Update existing period (preserves ID and timetable_slot references)
                        $existingPeriod->update($periodData);
                        $stats['updated']++;
                        
                        Log::info("Updated timetable period from blueprint", [
                            'period_id' => $existingPeriod->id,
                            'blueprint_id' => $blueprint->id,
                            'order' => $blueprintPeriod->sequence_order,
                        ]);
                    } else {
                        $stats['skipped']++;
                    }
                } else {
                    // Create new period
                    TimetablePeriod::create($periodData);
                    $stats['created']++;
                    
                    Log::info("Created timetable period from blueprint", [
                        'blueprint_id' => $blueprint->id,
                        'order' => $blueprintPeriod->sequence_order,
                    ]);
                }
            }

            DB::commit();
            
            Log::info("Blueprint period generation completed", [
                'blueprint_id' => $blueprint->id,
                'stats' => $stats,
            ]);

            return $stats;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Blueprint period generation failed", [
                'blueprint_id' => $blueprint->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Map blueprint period fields to timetable period fields.
     */
    private function mapBlueprintPeriodToTimetablePeriod(
        $blueprintPeriod,
        LevelDayBlueprint $blueprint,
        int $lessonNumber
    ): array
    {
        return [
            'school_id' => $blueprint->school_id,
            'generated_from_blueprint_id' => $blueprint->id,
            'grade_level' => $blueprint->level,
            'name' => $this->generatePeriodName($blueprintPeriod, $lessonNumber),
            'order' => $blueprintPeriod->sequence_order,
            'period_number' => $blueprintPeriod->sequence_order, // Display number
            'lesson_number' => $blueprintPeriod->is_teachable ? $lessonNumber : null,
            'start_time' => $blueprintPeriod->start_time,
            'end_time' => $blueprintPeriod->end_time,
            'duration_minutes' => $blueprintPeriod->duration_minutes,
            'period_type' => $this->mapPeriodType($blueprintPeriod->period_type),
            'is_break' => $this->isBreakType($blueprintPeriod->period_type),
            'is_active' => true,
            'description' => $this->generateDescription($blueprintPeriod),
            'color_code' => $this->getColorCode($blueprintPeriod->period_type),
        ];
    }

    /**
     * Generate a human-readable name for the period.
     */
    private function generatePeriodName($blueprintPeriod, int $lessonNumber): string
    {
        $typeNames = [
            'lesson' => "Period {$lessonNumber}",
            'short_break' => 'Short Break',
            'breakfast' => 'Breakfast Break',
            'lunch' => 'Lunch Break',
            'prayer' => 'Prayer Break',
            'sports' => 'Sports Block',
            'activity' => 'Activity Period',
        ];

        return $typeNames[$blueprintPeriod->period_type] ?? "Period {$blueprintPeriod->sequence_order}";
    }

    /**
     * Map blueprint period type to timetable period type.
     */
    private function mapPeriodType(string $blueprintType): string
    {
        // Now we map 1:1 since slot types match period types
        $typeMap = [
            'lesson' => 'lesson',
            'short_break' => 'short_break',
            'breakfast' => 'breakfast',
            'lunch' => 'lunch',
            'prayer' => 'prayer',
            'sports' => 'sports',
            'activity' => 'activity',
            'homework' => 'homework',
        ];

        return $typeMap[$blueprintType] ?? 'other';
    }

    /**
     * Determine if period type is a break.
     */
    private function isBreakType(string $blueprintType): bool
    {
        return in_array($blueprintType, ['short_break', 'breakfast', 'lunch']);
    }

    /**
     * Generate description for the period.
     */
    private function generateDescription($blueprintPeriod): ?string
    {
        $descriptions = [
            'lesson' => 'Teaching period',
            'short_break' => 'Short break between lessons',
            'breakfast' => 'Breakfast break',
            'lunch' => 'Lunch break',
            'prayer' => 'Prayer/reflection time',
            'sports' => 'Physical education or sports activities',
            'activity' => 'Co-curricular activities',
        ];

        $baseDescription = $descriptions[$blueprintPeriod->period_type] ?? null;

        if ($blueprintPeriod->priority_band) {
            $baseDescription .= " (Priority: {$blueprintPeriod->priority_band})";
        }

        return $baseDescription;
    }

    /**
     * Get color code for period type.
     */
    private function getColorCode(string $blueprintType): ?string
    {
        $colors = [
            'lesson' => '#3B82F6',        // Blue
            'short_break' => '#10B981',   // Green
            'breakfast' => '#F59E0B',     // Amber
            'lunch' => '#EF4444',         // Red
            'prayer' => '#8B5CF6',        // Purple
            'sports' => '#06B6D4',        // Cyan
            'activity' => '#EC4899',      // Pink
        ];

        return $colors[$blueprintType] ?? '#6B7280'; // Gray default
    }

    /**
     * Check if periods already exist for this blueprint.
     */
    public function hasGeneratedPeriods(LevelDayBlueprint $blueprint): bool
    {
        return TimetablePeriod::where('school_id', $blueprint->school_id)
            ->where('grade_level', $blueprint->level)
            ->where('generated_from_blueprint_id', $blueprint->id)
            ->exists();
    }

    /**
     * Get count of generated periods for this blueprint.
     */
    public function getGeneratedPeriodsCount(LevelDayBlueprint $blueprint): int
    {
        return TimetablePeriod::where('school_id', $blueprint->school_id)
            ->where('grade_level', $blueprint->level)
            ->where('generated_from_blueprint_id', $blueprint->id)
            ->count();
    }

    /**
     * Delete all periods generated from this blueprint.
     * WARNING: This will set timetable_slot.timetable_period_id to NULL for affected slots.
     */
    public function deleteGeneratedPeriods(LevelDayBlueprint $blueprint): int
    {
        return TimetablePeriod::where('school_id', $blueprint->school_id)
            ->where('grade_level', $blueprint->level)
            ->where('generated_from_blueprint_id', $blueprint->id)
            ->delete();
    }
}

