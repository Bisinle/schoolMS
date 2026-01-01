<?php

namespace App\Http\Controllers;

use App\Models\TimetableTemplate;
use App\Models\TimetablePeriod;
use App\Models\Room;
use App\Models\TimetableSlot;
use App\Models\TimetableConflict;
use App\Models\Grade;
use App\Models\AcademicTerm;
use App\Services\TimetableComplianceService;
use App\Services\TimetableConflictDetector;
use App\Services\TimetableGenerationService;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class TimetableTemplateController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display the timetable dashboard.
     */
    public function dashboard()
    {
        $this->authorize('viewAny', TimetableTemplate::class);

        $schoolId = auth()->user()->school_id;

        $stats = [
            'templates_count' => TimetableTemplate::where('school_id', $schoolId)->count(),
            'periods_count' => TimetablePeriod::where('school_id', $schoolId)->count(),
            'rooms_count' => Room::where('school_id', $schoolId)->count(),
            'slots_count' => TimetableSlot::whereHas('template', function ($query) use ($schoolId) {
                $query->where('school_id', $schoolId);
            })->count(),
            'published_count' => TimetableTemplate::where('school_id', $schoolId)
                ->where('status', 'published')
                ->count(),
            'draft_count' => TimetableTemplate::where('school_id', $schoolId)
                ->where('status', 'draft')
                ->count(),
        ];

        $recentTemplates = TimetableTemplate::with(['grade', 'academicTerm'])
            ->where('school_id', $schoolId)
            ->withCount('slots')
            ->latest()
            ->take(5)
            ->get();

        return Inertia::render('Timetables/Dashboard', [
            'stats' => $stats,
            'recentTemplates' => $recentTemplates,
        ]);
    }

    /**
     * Display a listing of timetable templates.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', TimetableTemplate::class);

        $templates = TimetableTemplate::with(['grade', 'academicTerm'])
            ->when($request->search, function ($query, $search) {
                $query->whereHas('grade', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                });
            })
            ->when($request->status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($request->grade_id, function ($query, $gradeId) {
                $query->where('grade_id', $gradeId);
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $grades = Grade::where('school_id', auth()->user()->school_id)
            ->orderBy('name')
            ->get();

        return Inertia::render('Timetables/Templates/Index', [
            'templates' => $templates,
            'grades' => $grades,
            'filters' => $request->only(['search', 'status', 'grade_id']),
        ]);
    }

    /**
     * Show the form for creating a new timetable template.
     */
    public function create()
    {
        $this->authorize('create', TimetableTemplate::class);

        $grades = Grade::where('school_id', auth()->user()->school_id)
            ->where('status', 'active')
            ->orderBy('name')
            ->get();

        $academicTerms = AcademicTerm::where('school_id', auth()->user()->school_id)
            ->where('is_active', true)
            ->orderBy('start_date', 'desc')
            ->get();

        return Inertia::render('Timetables/Templates/Create', [
            'grades' => $grades,
            'academicTerms' => $academicTerms,
        ]);
    }

    /**
     * Store a newly created timetable template.
     */
    public function store(Request $request)
    {
        $this->authorize('create', TimetableTemplate::class);

        $validated = $request->validate([
            'grade_id' => 'required|exists:grades,id',
            'academic_term_id' => 'required|exists:academic_terms,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'effective_from' => 'required|date',
            'effective_to' => 'nullable|date|after:effective_from',
        ]);

        $validated['school_id'] = auth()->user()->school_id;
        $validated['status'] = 'draft';
        $validated['is_active'] = false;
        $validated['created_by'] = auth()->id();

        $template = TimetableTemplate::create($validated);

        return redirect()->route('timetables.templates.show', $template)
            ->with('success', 'Timetable template created successfully.');
    }

    /**
     * Display the specified timetable template.
     *
     * Phase 2 Update: Now includes compliance summary
     */
    public function show(TimetableTemplate $template, TimetableComplianceService $complianceService)
    {
        $this->authorize('view', $template);

        $template->load(['grade', 'academicTerm', 'slots.subject', 'slots.teacher.user', 'slots.room', 'slots.period']);

        // ✅ PHASE 2: Add compliance summary
        $complianceReport = $complianceService->getTemplateComplianceReport($template);

        // ✅ PHASE 3: Get unresolved conflicts
        $conflicts = TimetableConflict::where('timetable_template_id', $template->id)
            ->unresolved()
            ->with(['slot', 'conflictingSlot'])
            ->get()
            ->map(function ($conflict) {
                return [
                    'id' => $conflict->id,
                    'slot_id' => $conflict->timetable_slot_id,
                    'conflict_type' => $conflict->conflict_type,
                    'severity' => $conflict->severity,
                    'message' => $conflict->message,
                    'details' => $conflict->details,
                ];
            });

        return Inertia::render('Timetables/Templates/Show', [
            'template' => $template,
            'complianceReport' => $complianceReport,
            'conflicts' => $conflicts,
        ]);
    }

    /**
     * Display the timetable template in grid view.
     *
     * Phase 3 Update: Enhanced grid view with conflict detection
     */
    public function grid(TimetableTemplate $template, TimetableConflictDetector $conflictDetector)
    {
        $this->authorize('view', $template);

        $template->load(['grade', 'academicTerm']);

        // Get all slots for this template
        $slots = TimetableSlot::where('timetable_template_id', $template->id)
            ->with(['subject', 'teacher.user', 'room', 'period'])
            ->orderBy('day_of_week')
            ->orderBy('timetable_period_id')
            ->get();

        // Get all periods for the school
        $periods = TimetablePeriod::where('school_id', $template->school_id)
            ->orderBy('order')
            ->get();

        // Get unresolved conflicts
        $conflicts = TimetableConflict::where('timetable_template_id', $template->id)
            ->unresolved()
            ->with(['slot', 'conflictingSlot'])
            ->get()
            ->map(function ($conflict) {
                return [
                    'id' => $conflict->id,
                    'slot_id' => $conflict->timetable_slot_id,
                    'conflict_type' => $conflict->conflict_type,
                    'severity' => $conflict->severity,
                    'message' => $conflict->message,
                    'details' => $conflict->details,
                ];
            });

        return Inertia::render('Timetables/Templates/Grid', [
            'template' => $template,
            'slots' => $slots,
            'periods' => $periods,
            'conflicts' => $conflicts,
        ]);
    }

    /**
     * Show the form for editing the specified timetable template.
     */
    public function edit(TimetableTemplate $template)
    {
        $this->authorize('update', $template);

        $template->load(['grade', 'academicTerm']);

        $grades = Grade::where('school_id', auth()->user()->school_id)
            ->where('status', 'active')
            ->orderBy('name')
            ->get();

        $academicTerms = AcademicTerm::where('school_id', auth()->user()->school_id)
            ->where('is_active', true)
            ->orderBy('start_date', 'desc')
            ->get();

        return Inertia::render('Timetables/Templates/Edit', [
            'template' => $template,
            'grades' => $grades,
            'academicTerms' => $academicTerms,
        ]);
    }

    /**
     * Update the specified timetable template.
     */
    public function update(Request $request, TimetableTemplate $template)
    {
        $this->authorize('update', $template);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'effective_from' => 'required|date',
            'effective_to' => 'nullable|date|after:effective_from',
        ]);

        $template->update($validated);

        return redirect()->route('timetables.templates.show', $template)
            ->with('success', 'Timetable template updated successfully.');
    }

    /**
     * Get compliance report for a timetable template
     *
     * Phase 2: Shows session compliance with curriculum requirements
     */
    public function complianceReport(TimetableTemplate $template, TimetableComplianceService $complianceService)
    {
        $this->authorize('view', $template);

        $template->load(['grade', 'academicTerm']);

        $report = $complianceService->getTemplateComplianceReport($template);

        return Inertia::render('Timetables/Templates/ComplianceReport', [
            'template' => $template,
            'report' => $report,
        ]);
    }

    /**
     * Remove the specified timetable template.
     * Note: Slots are automatically deleted via model boot event
     */
    public function destroy(TimetableTemplate $template)
    {
        $this->authorize('delete', $template);

        $slotsCount = $template->slots()->count();

        // Delete template (slots will be auto-deleted via model boot event)
        $template->delete();

        $message = 'Timetable template deleted successfully.';
        if ($slotsCount > 0) {
            $message .= " ({$slotsCount} slot" . ($slotsCount > 1 ? 's' : '') . " also deleted)";
        }

        return redirect()->route('timetables.templates.index')
            ->with('success', $message);
    }

    /**
     * Publish a timetable template.
     */
    public function publish(TimetableTemplate $template)
    {
        $this->authorize('publish', $template);

        // Deactivate other active templates for this grade
        TimetableTemplate::where('grade_id', $template->grade_id)
            ->where('is_active', true)
            ->update(['is_active' => false, 'status' => 'archived']);

        $template->update([
            'status' => 'published',
            'is_active' => true,
            'published_at' => now(),
            'published_by' => auth()->id(),
        ]);

        return redirect()->route('timetables.templates.show', $template)
            ->with('success', 'Timetable template published successfully.');
    }

    /**
     * Archive a timetable template.
     */
    public function archive(TimetableTemplate $template)
    {
        $this->authorize('archive', $template);

        $template->update([
            'status' => 'archived',
            'is_active' => false,
        ]);

        return redirect()->route('timetables.templates.show', $template)
            ->with('success', 'Timetable template archived successfully.');
    }

    /**
     * Unarchive a timetable template.
     */
    public function unarchive(TimetableTemplate $template)
    {
        $this->authorize('unarchive', $template);

        // Check if template is actually archived
        if ($template->status !== 'archived') {
            return redirect()->back()
                ->with('error', 'Only archived templates can be unarchived.');
        }

        $template->update([
            'status' => 'draft',
            'is_active' => false,
        ]);

        return redirect()->route('timetables.templates.index')
            ->with('success', 'Timetable template unarchived successfully. You can now edit and publish it.');
    }

    /**
     * Delete an archived timetable template with password confirmation.
     */
    public function deleteArchived(Request $request, TimetableTemplate $template)
    {
        $this->authorize('deleteArchived', $template);

        // Validate password
        $request->validate([
            'password' => ['required', 'string'],
        ]);

        // Verify password
        if (!Hash::check($request->password, $request->user()->password)) {
            return redirect()->back()
                ->withErrors(['password' => 'The provided password is incorrect.'])
                ->with('error', 'Password verification failed.');
        }

        // Check if template is actually archived
        if ($template->status !== 'archived') {
            return redirect()->back()
                ->with('error', 'Only archived templates can be deleted.');
        }

        $slotsCount = $template->slots()->count();
        $templateName = $template->name;

        // Delete the template (slots will be auto-deleted via model boot event)
        $template->delete();

        return redirect()->route('timetables.templates.index')
            ->with('success', "Archived template '{$templateName}' and {$slotsCount} associated slots have been permanently deleted.");
    }

    /**
     * Generate weekly timetable slots from blueprint.
     *
     * Phase 3: Auto-generation using blueprint and curriculum rules
     */
    public function generate(TimetableTemplate $template)
    {
        $this->authorize('update', $template);

        try {
            $service = new TimetableGenerationService();
            $result = $service->generate($template);

            return redirect()->route('timetables.templates.grid', $template)
                ->with('success', "Generated {$result['generated']} slots ({$result['lessons']} lessons, {$result['breaks']} breaks)");
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Generation failed: ' . $e->getMessage());
        }
    }

    /**
     * Regenerate weekly timetable slots from blueprint.
     *
     * This will delete all auto-generated slots and recreate them.
     * Manually created slots are preserved.
     */
    public function regenerate(TimetableTemplate $template)
    {
        $this->authorize('update', $template);

        try {
            $service = new TimetableGenerationService();
            $result = $service->generate($template);

            return redirect()->route('timetables.templates.grid', $template)
                ->with('success', "Regenerated {$result['generated']} slots ({$result['lessons']} lessons, {$result['breaks']} breaks). Manual edits preserved.");
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Regeneration failed: ' . $e->getMessage());
        }
    }
}
