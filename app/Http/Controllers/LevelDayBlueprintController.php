<?php

namespace App\Http\Controllers;

use App\Models\LevelDayBlueprint;
use App\Models\BlueprintPeriod;
use App\Models\Grade;
use App\Services\BlueprintPeriodGenerationService;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class LevelDayBlueprintController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display a listing of blueprints.
     */
    public function index(Request $request)
    {
        // Global scope automatically filters by school_id
        $blueprints = LevelDayBlueprint::with('periods')
            ->when($request->level, function ($query, $level) {
                $query->where('level', $level);
            })
            ->orderBy('level')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Blueprints/Index', [
            'blueprints' => $blueprints,
            'levels' => Grade::LEVELS,
            'filters' => $request->only(['level']),
        ]);
    }

    /**
     * Show the form for creating a new blueprint.
     */
    public function create()
    {
        return Inertia::render('Blueprints/Create', [
            'levels' => Grade::LEVELS,
            'periodTypes' => [
                'lesson' => 'Lesson',
                'short_break' => 'Short Break',
                'breakfast' => 'Breakfast Break',
                'lunch' => 'Lunch Break',
                'prayer' => 'Prayer Break',
                'sports' => 'Sports Block',
                'activity' => 'Activity',
            ],
            'priorityBands' => [
                'morning_high' => 'Morning (Fresh Mind)',
                'neutral' => 'Neutral (Mid-day)',
                'afternoon_low' => 'Afternoon (Low Energy)',
            ],
        ]);
    }

    /**
     * Store a newly created blueprint.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'level' => 'required|in:' . implode(',', array_keys(Grade::LEVELS)),
            'name' => 'required|string|max:255',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'description' => 'nullable|string',
            'periods' => 'required|array|min:1',
            'periods.*.period_type' => 'required|in:lesson,short_break,breakfast,lunch,prayer,sports,activity',
            'periods.*.duration_minutes' => 'required|integer|min:5|max:120',
            'periods.*.priority_band' => 'nullable|in:morning_high,neutral,afternoon_low',
        ]);

        // Validate total duration doesn't exceed available time
        $startTime = Carbon::parse($validated['start_time']);
        $endTime = Carbon::parse($validated['end_time']);
        $availableMinutes = $startTime->diffInMinutes($endTime);

        $totalDuration = collect($validated['periods'])->sum(function ($period) {
            return (int) $period['duration_minutes'];
        });

        if ($totalDuration > $availableMinutes) {
            return back()->withErrors([
                'periods' => "Total period duration ({$totalDuration} minutes) exceeds available time ({$availableMinutes} minutes)."
            ])->withInput();
        }

        DB::beginTransaction();
        try {
            // Deactivate existing active blueprint for this level
            // Global scope automatically filters by school_id
            LevelDayBlueprint::where('level', $validated['level'])
                ->where('is_active', true)
                ->update(['is_active' => false]);

            // school_id is auto-assigned by BelongsToSchool trait
            $blueprint = LevelDayBlueprint::create([
                'level' => $validated['level'],
                'name' => $validated['name'],
                'start_time' => $validated['start_time'],
                'end_time' => $validated['end_time'],
                'description' => $validated['description'] ?? null,
                'is_active' => true,
            ]);

            // Create periods with calculated start/end times
            $currentTime = Carbon::parse($validated['start_time']);

            foreach ($validated['periods'] as $index => $periodData) {
                $duration = (int) $periodData['duration_minutes'];
                $startTime = $currentTime->format('H:i:s');
                $endTime = $currentTime->copy()->addMinutes($duration)->format('H:i:s');

                BlueprintPeriod::create([
                    'level_day_blueprint_id' => $blueprint->id,
                    'sequence_order' => $index + 1,
                    'period_type' => $periodData['period_type'],
                    'duration_minutes' => $duration,
                    'priority_band' => $periodData['period_type'] === 'lesson'
                        ? ($periodData['priority_band'] ?? 'neutral')
                        : null,
                    'is_teachable' => $periodData['period_type'] === 'lesson',
                    'start_time' => $startTime,
                    'end_time' => $endTime,
                ]);

                $currentTime->addMinutes($duration);
            }

            DB::commit();

            return redirect()->route('blueprints.index')
                ->with('success', 'Blueprint created successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to create blueprint: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified blueprint.
     */
    public function show(LevelDayBlueprint $blueprint)
    {
        $blueprint->load('periods');

        return Inertia::render('Blueprints/Show', [
            'blueprint' => $blueprint,
        ]);
    }

    /**
     * Show the form for editing the specified blueprint.
     */
    public function edit(LevelDayBlueprint $blueprint)
    {
        $blueprint->load('periods');

        return Inertia::render('Blueprints/Edit', [
            'blueprint' => $blueprint,
            'levels' => Grade::LEVELS,
            'periodTypes' => [
                'lesson' => 'Lesson',
                'short_break' => 'Short Break',
                'breakfast' => 'Breakfast Break',
                'lunch' => 'Lunch Break',
                'prayer' => 'Prayer Break',
                'sports' => 'Sports Block',
                'activity' => 'Activity',
            ],
            'priorityBands' => [
                'morning_high' => 'Morning (Fresh Mind)',
                'neutral' => 'Neutral (Mid-day)',
                'afternoon_low' => 'Afternoon (Low Energy)',
            ],
        ]);
    }

    /**
     * Update the specified blueprint.
     */
    public function update(Request $request, LevelDayBlueprint $blueprint)
    {
        $validated = $request->validate([
            'level' => 'required|in:' . implode(',', array_keys(Grade::LEVELS)),
            'name' => 'required|string|max:255',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'periods' => 'required|array|min:1',
            'periods.*.period_type' => 'required|in:lesson,short_break,breakfast,lunch,prayer,sports,activity',
            'periods.*.duration_minutes' => 'required|integer|min:5|max:120',
            'periods.*.priority_band' => 'nullable|in:morning_high,neutral,afternoon_low',
        ]);

        // Validate total duration doesn't exceed available time
        $startTime = Carbon::parse($validated['start_time']);
        $endTime = Carbon::parse($validated['end_time']);
        $availableMinutes = $startTime->diffInMinutes($endTime);

        $totalDuration = collect($validated['periods'])->sum(function ($period) {
            return (int) $period['duration_minutes'];
        });

        if ($totalDuration > $availableMinutes) {
            return back()->withErrors([
                'periods' => "Total period duration ({$totalDuration} minutes) exceeds available time ({$availableMinutes} minutes)."
            ])->withInput();
        }

        DB::beginTransaction();
        try {
            // If activating this blueprint, deactivate others for this level
            // Global scope automatically filters by school_id
            if (isset($validated['is_active']) && $validated['is_active']) {
                LevelDayBlueprint::where('level', $validated['level'])
                    ->where('id', '!=', $blueprint->id)
                    ->where('is_active', true)
                    ->update(['is_active' => false]);
            }

            $blueprint->update([
                'level' => $validated['level'],
                'name' => $validated['name'],
                'start_time' => $validated['start_time'],
                'end_time' => $validated['end_time'],
                'description' => $validated['description'] ?? null,
                'is_active' => $validated['is_active'] ?? $blueprint->is_active,
            ]);

            // Delete existing periods and recreate
            $blueprint->periods()->delete();

            // Create periods with calculated start/end times
            $currentTime = Carbon::parse($validated['start_time']);

            foreach ($validated['periods'] as $index => $periodData) {
                $duration = (int) $periodData['duration_minutes'];
                $startTime = $currentTime->format('H:i:s');
                $endTime = $currentTime->copy()->addMinutes($duration)->format('H:i:s');

                BlueprintPeriod::create([
                    'level_day_blueprint_id' => $blueprint->id,
                    'sequence_order' => $index + 1,
                    'period_type' => $periodData['period_type'],
                    'duration_minutes' => $duration,
                    'priority_band' => $periodData['period_type'] === 'lesson'
                        ? ($periodData['priority_band'] ?? 'neutral')
                        : null,
                    'is_teachable' => $periodData['period_type'] === 'lesson',
                    'start_time' => $startTime,
                    'end_time' => $endTime,
                ]);

                $currentTime->addMinutes($duration);
            }

            DB::commit();

            return redirect()->route('blueprints.index')
                ->with('success', 'Blueprint updated successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to update blueprint: ' . $e->getMessage()]);
        }
    }

    /**
     * Remove the specified blueprint.
     */
    public function destroy(LevelDayBlueprint $blueprint)
    {
        try {
            $blueprint->delete();

            return redirect()->route('blueprints.index')
                ->with('success', 'Blueprint deleted successfully');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to delete blueprint: ' . $e->getMessage()]);
        }
    }

    /**
     * Toggle the active status of a blueprint.
     */
    public function toggleActive(LevelDayBlueprint $blueprint)
    {
        DB::beginTransaction();
        try {
            $newStatus = !$blueprint->is_active;

            // If activating, deactivate others for this level
            if ($newStatus) {
                LevelDayBlueprint::where('school_id', $blueprint->school_id)
                    ->where('level', $blueprint->level)
                    ->where('id', '!=', $blueprint->id)
                    ->where('is_active', true)
                    ->update(['is_active' => false]);
            }

            $blueprint->update(['is_active' => $newStatus]);

            DB::commit();

            $status = $newStatus ? 'activated' : 'deactivated';
            return back()->with('success', "Blueprint {$status} successfully");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to toggle blueprint status: ' . $e->getMessage()]);
        }
    }

    /**
     * Generate timetable periods from blueprint.
     */
    public function generatePeriods(LevelDayBlueprint $blueprint, BlueprintPeriodGenerationService $service)
    {
        try {
            // Check if blueprint has periods
            if ($blueprint->periods->isEmpty()) {
                return back()->withErrors(['error' => 'Blueprint has no periods defined. Please add periods first.']);
            }

            // Check if periods already exist
            $hasExisting = $service->hasGeneratedPeriods($blueprint);

            if ($hasExisting) {
                return back()->withErrors([
                    'error' => 'Periods already generated from this blueprint. Use "Regenerate Periods" to update them.'
                ]);
            }

            // Generate periods
            $stats = $service->generatePeriods($blueprint, false);

            $message = "Successfully generated {$stats['created']} timetable periods for {$blueprint->level} level.";

            return back()->with('success', $message);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to generate periods: ' . $e->getMessage()]);
        }
    }

    /**
     * Regenerate timetable periods from blueprint (updates existing).
     */
    public function regeneratePeriods(LevelDayBlueprint $blueprint, BlueprintPeriodGenerationService $service)
    {
        try {
            // Check if blueprint has periods
            if ($blueprint->periods->isEmpty()) {
                return back()->withErrors(['error' => 'Blueprint has no periods defined. Please add periods first.']);
            }

            // Regenerate periods (force update)
            $stats = $service->generatePeriods($blueprint, true);

            $message = "Successfully regenerated periods: {$stats['created']} created, {$stats['updated']} updated.";

            return back()->with('success', $message);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to regenerate periods: ' . $e->getMessage()]);
        }
    }

    /**
     * Get generation status for a blueprint (API endpoint for frontend).
     */
    public function generationStatus(LevelDayBlueprint $blueprint, BlueprintPeriodGenerationService $service)
    {
        return response()->json([
            'has_generated' => $service->hasGeneratedPeriods($blueprint),
            'generated_count' => $service->getGeneratedPeriodsCount($blueprint),
            'blueprint_periods_count' => $blueprint->periods->count(),
        ]);
    }
}
