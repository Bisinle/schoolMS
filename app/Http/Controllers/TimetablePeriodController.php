<?php

namespace App\Http\Controllers;

use App\Models\TimetablePeriod;
use App\Models\TimetableTemplate;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;

class TimetablePeriodController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display a listing of timetable periods.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', TimetablePeriod::class);

        $periods = TimetablePeriod::query()
            ->with('generatedFromBlueprint:id,name,level') // Load blueprint relationship
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->when($request->period_type, function ($query, $type) {
                $query->where('period_type', $type);
            })
            ->when($request->grade_level, function ($query, $level) {
                $query->where('grade_level', $level);
            })
            ->when($request->is_active !== null, function ($query) use ($request) {
                $query->where('is_active', $request->is_active);
            })
            ->when($request->source, function ($query, $source) {
                // Filter by source: 'generated' or 'manual'
                if ($source === 'generated') {
                    $query->whereNotNull('generated_from_blueprint_id');
                } elseif ($source === 'manual') {
                    $query->whereNull('generated_from_blueprint_id');
                }
            })
            ->orderBy('grade_level')
            ->orderBy('order')
            ->paginate(50)
            ->withQueryString();

        return Inertia::render('Timetables/Periods/Index', [
            'periods' => $periods,
            'filters' => $request->only(['search', 'period_type', 'grade_level', 'is_active', 'source']),
            'periodTypes' => ['lesson', 'break', 'lunch', 'assembly', 'activity', 'study', 'other'],
            'gradeLevels' => ['ECD', 'LOWER PRIMARY', 'UPPER PRIMARY', 'JUNIOR SECONDARY'],
        ]);
    }

    /**
     * Show the form for creating a new timetable period.
     */
    public function create()
    {
        $this->authorize('create', TimetablePeriod::class);

        return Inertia::render('Timetables/Periods/Create', [
            'periodTypes' => ['lesson', 'break', 'lunch', 'assembly', 'activity', 'study', 'other'],
            'gradeLevels' => ['ECD', 'LOWER PRIMARY', 'UPPER PRIMARY', 'JUNIOR SECONDARY'],
        ]);
    }

    /**
     * Store a newly created timetable period.
     */
    public function store(Request $request)
    {
        $this->authorize('create', TimetablePeriod::class);

        $schoolId = auth()->user()->school_id;

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'grade_level' => 'required|in:ECD,LOWER PRIMARY,UPPER PRIMARY,JUNIOR SECONDARY',
            'order' => [
                'required',
                'integer',
                'min:1',
                \Illuminate\Validation\Rule::unique('timetable_periods', 'order')
                    ->where('school_id', $schoolId)
                    ->where('grade_level', $request->grade_level)
            ],
            'period_number' => 'nullable|integer|min:1',
            'lesson_number' => 'nullable|integer|min:1',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'period_type' => 'required|in:lesson,break,lunch,assembly,activity,study,other',
            'description' => 'nullable|string',
            'color_code' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
        ], [
            'name.required' => 'Period name is required.',
            'grade_level.required' => 'Grade level is required.',
            'grade_level.in' => 'Invalid grade level selected.',
            'order.required' => 'Period order is required.',
            'order.unique' => 'This order number is already used for this grade level. Please choose a different order number.',
            'start_time.required' => 'Start time is required.',
            'start_time.date_format' => 'Start time must be in HH:MM format (e.g., 08:00).',
            'end_time.required' => 'End time is required.',
            'end_time.date_format' => 'End time must be in HH:MM format (e.g., 09:00).',
            'end_time.after' => 'End time must be after start time.',
            'period_type.required' => 'Period type is required.',
            'period_type.in' => 'Invalid period type selected.',
            'color_code.regex' => 'Color code must be a valid hex color (e.g., #FF5733).',
        ]);

        try {
            // Calculate duration in minutes
            $start = \Carbon\Carbon::parse($validated['start_time']);
            $end = \Carbon\Carbon::parse($validated['end_time']);
            $validated['duration_minutes'] = $start->diffInMinutes($end);

            $validated['school_id'] = $schoolId;
            $validated['is_break'] = in_array($validated['period_type'], ['break', 'lunch']);
            $validated['is_active'] = true;

            TimetablePeriod::create($validated);

            return redirect()->route('timetables.periods.index')
                ->with('success', 'Timetable period created successfully.');
        } catch (\Exception $e) {
            return back()->withInput()->withErrors([
                'error' => 'Failed to create period. Please check your input and try again.'
            ]);
        }
    }

    /**
     * Display the specified timetable period.
     */
    public function show(TimetablePeriod $period)
    {
        $this->authorize('view', $period);

        $period->load([
            'slots.subject',
            'slots.teacher',
            'slots.grade',
            'slots.template',
            'generatedFromBlueprint:id,name,level'
        ]);

        return Inertia::render('Timetables/Periods/Show', [
            'period' => $period,
        ]);
    }

    /**
     * Show the form for editing the specified timetable period.
     */
    public function edit(TimetablePeriod $period)
    {
        $this->authorize('update', $period);

        return Inertia::render('Timetables/Periods/Edit', [
            'period' => $period,
            'periodTypes' => ['lesson', 'break', 'lunch', 'assembly', 'activity', 'study', 'other'],
            'gradeLevels' => ['ECD', 'LOWER PRIMARY', 'UPPER PRIMARY', 'JUNIOR SECONDARY'],
        ]);
    }

    /**
     * Update the specified timetable period.
     */
    public function update(Request $request, TimetablePeriod $period)
    {
        $this->authorize('update', $period);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'grade_level' => 'required|in:ECD,LOWER PRIMARY,UPPER PRIMARY,JUNIOR SECONDARY',
            'order' => [
                'required',
                'integer',
                'min:1',
                \Illuminate\Validation\Rule::unique('timetable_periods', 'order')
                    ->where('school_id', $period->school_id)
                    ->where('grade_level', $request->grade_level)
                    ->ignore($period->id)
            ],
            'period_number' => 'nullable|integer|min:1',
            'lesson_number' => 'nullable|integer|min:1',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'period_type' => 'required|in:lesson,break,lunch,assembly,activity,study,other',
            'description' => 'nullable|string',
            'color_code' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'is_active' => 'boolean',
        ], [
            'name.required' => 'Period name is required.',
            'grade_level.required' => 'Grade level is required.',
            'grade_level.in' => 'Invalid grade level selected.',
            'order.required' => 'Period order is required.',
            'order.unique' => 'This order number is already used for this grade level. Please choose a different order number.',
            'start_time.required' => 'Start time is required.',
            'start_time.date_format' => 'Start time must be in HH:MM format (e.g., 08:00).',
            'end_time.required' => 'End time is required.',
            'end_time.date_format' => 'End time must be in HH:MM format (e.g., 09:00).',
            'end_time.after' => 'End time must be after start time.',
            'period_type.required' => 'Period type is required.',
            'period_type.in' => 'Invalid period type selected.',
            'color_code.regex' => 'Color code must be a valid hex color (e.g., #FF5733).',
        ]);

        try {
            // Check if period is being used in active timetables
            $slotsCount = $period->slots()->count();

            if ($slotsCount > 0 && ($validated['start_time'] !== $period->start_time || $validated['end_time'] !== $period->end_time)) {
                return back()->withInput()->withErrors([
                    'error' => "This period is used in {$slotsCount} timetable slot(s). Changing the time may affect existing schedules. Please review the affected timetables after updating."
                ])->with('warning', true);
            }

            // Calculate duration in minutes
            $start = \Carbon\Carbon::parse($validated['start_time']);
            $end = \Carbon\Carbon::parse($validated['end_time']);
            $validated['duration_minutes'] = $start->diffInMinutes($end);

            $validated['is_break'] = in_array($validated['period_type'], ['break', 'lunch']);

            $period->update($validated);

            return redirect()->route('timetables.periods.index')
                ->with('success', 'Timetable period updated successfully.');
        } catch (\Exception $e) {
            return back()->withInput()->withErrors([
                'error' => 'Failed to update period. Please check your input and try again.'
            ]);
        }
    }

    /**
     * Remove the specified timetable period.
     * Note: Only checks active templates since deleted templates auto-delete their slots
     */
    public function destroy(TimetablePeriod $period)
    {
        $this->authorize('delete', $period);

        try {
            // Check if period is used in any timetable slots
            $activeSlotsCount = $period->slots()->count();

            if ($activeSlotsCount > 0) {
                // Get the templates using this period
                $templates = TimetableTemplate::whereHas('slots', function ($query) use ($period) {
                    $query->where('timetable_period_id', $period->id);
                })->get(['id', 'name', 'status']);

                $templateList = $templates->map(function ($template) {
                    return "{$template->name} ({$template->status})";
                })->join(', ');

                return back()->withErrors([
                    'error' => "Cannot delete '{$period->name}' because it is being used in {$activeSlotsCount} timetable slot(s).",
                    'templates' => "Affected templates: {$templateList}",
                    'instruction' => "To delete this period: 1) Go to each template listed above, 2) Remove or reassign all slots using this period, 3) Then try deleting again."
                ]);
            }

            $periodName = $period->name;
            $period->delete();

            return redirect()->route('timetables.periods.index')
                ->with('success', "Period '{$periodName}' deleted successfully.");
        } catch (\Exception $e) {
            return back()->withErrors([
                'error' => 'Failed to delete period. It may be in use by other records.',
                'instruction' => 'Please check if this period is referenced in any timetables and remove those references first.'
            ]);
        }
    }
}
