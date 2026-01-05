<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\LevelDayBlueprint;
use App\Models\BlueprintPeriod;
use App\Models\School;
use Carbon\Carbon;

class LevelDayBlueprintSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Creates level day blueprints and their periods for all grade levels
     */
    public function run(): void
    {
        $this->command->info('📋 Seeding Level Day Blueprints...');

        $schools = School::all();

        if ($schools->isEmpty()) {
            $this->command->error('No schools found. Run SchoolSeeder first.');
            return;
        }

        $totalCreated = 0;

        foreach ($schools as $school) {
            $blueprintCount = 0;

            // Define blueprints for each level
            $blueprints = [
                [
                    'level' => 'ECD',
                    'name' => 'ECD Standard Day',
                    'start_time' => '08:00',
                    'end_time' => '12:30',
                    'description' => 'Early Childhood Development schedule with shorter periods and more breaks',
                ],
                [
                    'level' => 'LOWER PRIMARY',
                    'name' => 'Lower Primary Standard Day',
                    'start_time' => '08:00',
                    'end_time' => '14:30',
                    'description' => 'Lower Primary (Grades 1-3) schedule with balanced learning periods',
                ],
                [
                    'level' => 'UPPER PRIMARY',
                    'name' => 'Upper Primary Standard Day',
                    'start_time' => '08:00',
                    'end_time' => '15:00',
                    'description' => 'Upper Primary (Grades 4-6) schedule with longer periods',
                ],
                [
                    'level' => 'JUNIOR SECONDARY',
                    'name' => 'Junior Secondary Standard Day',
                    'start_time' => '08:00',
                    'end_time' => '15:30',
                    'description' => 'Junior Secondary (Grades 7-9) schedule with extended learning time',
                ],
            ];

            foreach ($blueprints as $blueprintData) {
                // Check if blueprint already exists
                $exists = LevelDayBlueprint::where('school_id', $school->id)
                    ->where('level', $blueprintData['level'])
                    ->exists();

                if (!$exists) {
                    $blueprint = LevelDayBlueprint::create([
                        'school_id' => $school->id,
                        'level' => $blueprintData['level'],
                        'name' => $blueprintData['name'],
                        'start_time' => $blueprintData['start_time'],
                        'end_time' => $blueprintData['end_time'],
                        'is_active' => true,
                        'description' => $blueprintData['description'],
                    ]);

                    // Create periods for this blueprint
                    $this->createPeriodsForBlueprint($blueprint);

                    $blueprintCount++;
                    $totalCreated++;
                }
            }

            if ($blueprintCount > 0) {
                $this->command->info("  ✅ {$school->name}: {$blueprintCount} blueprints created");
            } else {
                $this->command->warn("  ⚠️  {$school->name}: Blueprints already exist");
            }
        }

        $this->command->info("✅ {$totalCreated} level day blueprints seeded successfully!");
    }

    /**
     * Create periods for a blueprint based on its level
     */
    private function createPeriodsForBlueprint(LevelDayBlueprint $blueprint): void
    {
        $periods = $this->getPeriodStructure($blueprint->level);
        $currentTime = Carbon::parse($blueprint->start_time);

        foreach ($periods as $index => $period) {
            $startTime = $currentTime->copy();
            $endTime = $currentTime->copy()->addMinutes($period['duration']);

            BlueprintPeriod::create([
                'level_day_blueprint_id' => $blueprint->id,
                'sequence_order' => $index + 1,
                'period_type' => $period['type'],
                'duration_minutes' => $period['duration'],
                'priority_band' => $period['priority'] ?? null,
                'is_teachable' => $period['type'] === 'lesson',
                'start_time' => $startTime->format('H:i'),
                'end_time' => $endTime->format('H:i'),
            ]);

            $currentTime = $endTime;
        }
    }

    /**
     * Get period structure for each level
     */
    private function getPeriodStructure(string $level): array
    {
        switch ($level) {
            case 'ECD':
                return $this->getECDPeriods();
            case 'LOWER PRIMARY':
                return $this->getLowerPrimaryPeriods();
            case 'UPPER PRIMARY':
                return $this->getUpperPrimaryPeriods();
            case 'JUNIOR SECONDARY':
                return $this->getJuniorSecondaryPeriods();
            default:
                return $this->getLowerPrimaryPeriods();
        }
    }

    /**
     * ECD Period Structure (08:00 - 12:30)
     * Shorter periods with more breaks
     */
    private function getECDPeriods(): array
    {
        return [
            ['type' => 'lesson', 'duration' => 30, 'priority' => 'morning_high'],
            ['type' => 'lesson', 'duration' => 30, 'priority' => 'morning_high'],
            ['type' => 'short_break', 'duration' => 15],
            ['type' => 'lesson', 'duration' => 30, 'priority' => 'neutral'],
            ['type' => 'lesson', 'duration' => 30, 'priority' => 'neutral'],
            ['type' => 'lunch', 'duration' => 30],
            ['type' => 'lesson', 'duration' => 30, 'priority' => 'afternoon_low'],
            ['type' => 'activity', 'duration' => 30],
            ['type' => 'lesson', 'duration' => 30, 'priority' => 'afternoon_low'],
        ];
    }

    /**
     * Lower Primary Period Structure (08:00 - 14:30)
     */
    private function getLowerPrimaryPeriods(): array
    {
        return [
            ['type' => 'lesson', 'duration' => 35, 'priority' => 'morning_high'],
            ['type' => 'lesson', 'duration' => 35, 'priority' => 'morning_high'],
            ['type' => 'lesson', 'duration' => 35, 'priority' => 'morning_high'],
            ['type' => 'short_break', 'duration' => 20],
            ['type' => 'lesson', 'duration' => 35, 'priority' => 'neutral'],
            ['type' => 'lesson', 'duration' => 35, 'priority' => 'neutral'],
            ['type' => 'lunch', 'duration' => 45],
            ['type' => 'lesson', 'duration' => 35, 'priority' => 'afternoon_low'],
            ['type' => 'lesson', 'duration' => 35, 'priority' => 'afternoon_low'],
            ['type' => 'short_break', 'duration' => 15],
            ['type' => 'lesson', 'duration' => 35, 'priority' => 'afternoon_low'],
            ['type' => 'activity', 'duration' => 35],
        ];
    }

    /**
     * Upper Primary Period Structure (08:00 - 15:00)
     */
    private function getUpperPrimaryPeriods(): array
    {
        return [
            ['type' => 'lesson', 'duration' => 40, 'priority' => 'morning_high'],
            ['type' => 'lesson', 'duration' => 40, 'priority' => 'morning_high'],
            ['type' => 'lesson', 'duration' => 40, 'priority' => 'morning_high'],
            ['type' => 'short_break', 'duration' => 20],
            ['type' => 'lesson', 'duration' => 40, 'priority' => 'neutral'],
            ['type' => 'lesson', 'duration' => 40, 'priority' => 'neutral'],
            ['type' => 'lunch', 'duration' => 45],
            ['type' => 'lesson', 'duration' => 40, 'priority' => 'afternoon_low'],
            ['type' => 'lesson', 'duration' => 40, 'priority' => 'afternoon_low'],
            ['type' => 'short_break', 'duration' => 15],
            ['type' => 'lesson', 'duration' => 40, 'priority' => 'afternoon_low'],
            ['type' => 'sports', 'duration' => 40],
        ];
    }

    /**
     * Junior Secondary Period Structure (08:00 - 15:30)
     */
    private function getJuniorSecondaryPeriods(): array
    {
        return [
            ['type' => 'lesson', 'duration' => 40, 'priority' => 'morning_high'],
            ['type' => 'lesson', 'duration' => 40, 'priority' => 'morning_high'],
            ['type' => 'lesson', 'duration' => 40, 'priority' => 'morning_high'],
            ['type' => 'short_break', 'duration' => 20],
            ['type' => 'lesson', 'duration' => 40, 'priority' => 'neutral'],
            ['type' => 'lesson', 'duration' => 40, 'priority' => 'neutral'],
            ['type' => 'lesson', 'duration' => 40, 'priority' => 'neutral'],
            ['type' => 'lunch', 'duration' => 45],
            ['type' => 'lesson', 'duration' => 40, 'priority' => 'afternoon_low'],
            ['type' => 'lesson', 'duration' => 40, 'priority' => 'afternoon_low'],
            ['type' => 'short_break', 'duration' => 15],
            ['type' => 'lesson', 'duration' => 40, 'priority' => 'afternoon_low'],
            ['type' => 'sports', 'duration' => 40],
        ];
    }
}

