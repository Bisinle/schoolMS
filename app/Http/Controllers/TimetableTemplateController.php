<?php

namespace App\Http\Controllers;

use App\Models\TimetableTemplate;
use App\Models\TimetablePeriod;
use App\Models\Room;
use App\Models\TimetableSlot;
use App\Models\TimetableConflict;
use App\Models\Grade;
use App\Models\AcademicTerm;
use App\Models\Stream;
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

        $templates = TimetableTemplate::with(['grade', 'stream', 'academicTerm'])
            ->when($request->search, function ($query, $search) {
                $query->whereHas('grade', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                })->orWhereHas('stream', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                });
            })
            ->when($request->status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($request->grade_id, function ($query, $gradeId) {
                $query->where('grade_id', $gradeId);
            })
            ->when($request->stream_id, function ($query, $streamId) {
                $query->where('stream_id', $streamId);
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $grades = Grade::where('school_id', auth()->user()->school_id)
            ->orderBy('name')
            ->get();

        $streams = Stream::where('school_id', auth()->user()->school_id)
            ->where('status', 'active')
            ->orderBy('name')
            ->get();

        return Inertia::render('Timetables/Templates/Index', [
            'templates' => $templates,
            'grades' => $grades,
            'streams' => $streams,
            'filters' => $request->only(['search', 'status', 'grade_id', 'stream_id']),
        ]);
    }

    /**
     * Show grade selection page for creating a new timetable template.
     */
    public function create()
    {
        $this->authorize('create', TimetableTemplate::class);

        $grades = Grade::where('school_id', auth()->user()->school_id)
            ->where('status', 'active')
            ->with('stream')
            ->orderBy('name')
            ->get();

        return Inertia::render('Timetables/Templates/SelectGrade', [
            'grades' => $grades,
        ]);
    }

    /**
     * Show stream selection page for a specific grade.
     */
    public function selectStream(Grade $grade)
    {
        $this->authorize('create', TimetableTemplate::class);

        // Get all available streams for this school
        $streams = Stream::where('school_id', auth()->user()->school_id)
            ->where('status', 'active')
            ->withCount('grades')
            ->orderBy('name')
            ->get();

        // Get existing templates for this grade (grouped by stream)
        $existingTemplates = TimetableTemplate::where('grade_id', $grade->id)
            ->with(['stream', 'academicTerm'])
            ->get()
            ->groupBy('stream_id');

        return Inertia::render('Timetables/Templates/SelectStream', [
            'grade' => $grade->load('stream'),
            'streams' => $streams,
            'existingTemplates' => $existingTemplates,
        ]);
    }

    /**
     * Show the form for creating a new timetable template with grade and stream.
     */
    public function createWithStream(Grade $grade, Request $request)
    {
        $this->authorize('create', TimetableTemplate::class);

        $streamId = $request->query('stream_id');

        // Validate stream if provided
        $stream = null;
        if ($streamId) {
            $stream = Stream::where('id', $streamId)
                ->where('school_id', auth()->user()->school_id)
                ->where('status', 'active')
                ->firstOrFail();
        }

        $academicTerms = AcademicTerm::where('school_id', auth()->user()->school_id)
            ->where('is_active', true)
            ->orderBy('start_date', 'desc')
            ->get();

        return Inertia::render('Timetables/Templates/Create', [
            'grade' => $grade->load('stream'),
            'stream' => $stream,
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
            'stream_id' => 'nullable|exists:streams,id',
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

        $streamName = $template->stream ? ' ' . $template->stream->name : '';
        $gradeName = $template->grade->name ?? 'Unknown';

        return redirect()->route('timetables.templates.show', $template)
            ->with('success', "Timetable template for {$gradeName}{$streamName} created successfully.");
    }

    /**
     * Display the specified timetable template in grid view.
     *
     * Phase 3 Update: Enhanced grid view with conflict detection
     * Phase 4 Update: Added subjects, teachers, and class teacher for bulk operations
     * Phase 5 Update: Made grid view the default view
     * Phase 6 Update: Added priority-based period allocation stats
     */
    public function show(TimetableTemplate $template, TimetableConflictDetector $conflictDetector)
    {
        $this->authorize('view', $template);

        $template->load(['grade', 'academicTerm', 'slots.subject', 'slots.period']);

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

        // Get subjects assigned to this grade for bulk operations
        $subjects = $template->grade->subjects()
            ->orderBy('name')
            ->get(['subjects.id', 'subjects.name', 'subjects.code']);

        // Get teachers assigned to this grade with their specializations
        $teachers = $template->grade->teachers()
            ->with(['user', 'subjects'])
            ->get()
            ->map(function ($teacher) {
                return [
                    'id' => $teacher->id,
                    'name' => $teacher->user->name,
                    'user' => $teacher->user,
                    'subjects' => $teacher->subjects->map(function ($subject) {
                        return ['id' => $subject->id, 'name' => $subject->name];
                    }),
                ];
            });

        // Get class teacher
        $classTeacher = $template->grade->getClassTeacher();
        if ($classTeacher) {
            $classTeacher = [
                'id' => $classTeacher->id,
                'name' => $classTeacher->user->name,
                'user' => $classTeacher->user,
            ];
        }

        // Check if generation is possible (prerequisite validation)
        $generationValidation = $template->grade->canGenerateTimetable();

        // Get priority allocation stats and recommendations
        $priorityAllocator = new \App\Services\Timetable\PriorityBasedPeriodAllocator();
        $priorityStats = $priorityAllocator->getTemplateAllocationStats($template);
        $priorityRecommendations = $priorityAllocator->getRecommendations($template);

        return Inertia::render('Timetables/Templates/Grid', [
            'template' => $template,
            'slots' => $slots,
            'periods' => $periods,
            'conflicts' => $conflicts,
            'subjects' => $subjects,
            'teachers' => $teachers,
            'classTeacher' => $classTeacher,
            'generationValidation' => $generationValidation,
            'priorityStats' => $priorityStats,
            'priorityRecommendations' => $priorityRecommendations,
        ]);
    }

    /**
     * Redirect to show method (grid is now the default view).
     * Kept for backward compatibility with old links.
     */
    public function grid(TimetableTemplate $template)
    {
        return redirect()->route('timetables.templates.show', $template);
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
     * Validate if a grade can generate a timetable.
     *
     * Returns validation results with errors and warnings.
     */
    public function validateGeneration(Grade $grade)
    {
        $this->authorize('create', TimetableTemplate::class);

        $validation = $grade->canGenerateTimetable();

        return response()->json($validation);
    }

    /**
     * Generate weekly timetable slots from blueprint.
     *
     * Phase 3: Auto-generation using blueprint and curriculum rules
     * Phase 5: Enhanced with comprehensive prerequisite validation
     * Phase 6: Three-layer validation (Frontend → Controller → Service)
     */
    public function generate(TimetableTemplate $template)
    {
        $this->authorize('update', $template);

        // ============================================
        // LAYER 2: CONTROLLER VALIDATION
        // ============================================
        // Validate prerequisites before calling service
        // This prevents unnecessary service calls and provides
        // structured error responses
        $validation = $template->grade->canGenerateTimetable();

        if (!$validation['can_generate']) {
            $errorMessage = $this->formatValidationErrors($validation, $template->grade->name);

            return redirect()->back()
                ->with('error', $errorMessage);
        }

        // ============================================
        // LAYER 3: SERVICE VALIDATION (Final Safeguard)
        // ============================================
        try {
            $service = new TimetableGenerationService();
            $result = $service->generate($template);

            // Build success message with post-validation results
            $successMessage = "Generated {$result['generated']} slots ({$result['lessons']} lessons, {$result['breaks']} breaks). All lesson slots assigned to class teacher.";

            // Add post-validation warnings
            if (!empty($result['post_validation']['warnings'])) {
                $successMessage .= "\n\n⚠️ Warnings:\n" . implode("\n", $result['post_validation']['warnings']);
            }

            // Add post-validation issues (critical)
            if (!empty($result['post_validation']['issues'])) {
                $successMessage .= "\n\n❌ Issues:\n" . implode("\n", $result['post_validation']['issues']);
            }

            // Add day-by-day stats
            if (!empty($result['post_validation']['day_stats'])) {
                $successMessage .= "\n\n📊 Daily Distribution:";
                foreach ($result['post_validation']['day_stats'] as $day => $stats) {
                    $successMessage .= "\n• " . ucfirst($day) . ": {$stats['total_slots']} lessons";
                }
            }

            return redirect()->route('timetables.templates.grid', $template)
                ->with('success', $successMessage);
        } catch (\Exception $e) {
            // Format error message for better readability
            $errorMessage = $e->getMessage();

            // Convert newlines to HTML breaks for display
            $errorMessage = nl2br($errorMessage);

            return redirect()->back()
                ->with('error', $errorMessage);
        }
    }

    /**
     * Regenerate weekly timetable slots from blueprint.
     *
     * This will delete all auto-generated slots and recreate them.
     * Manually created slots are preserved.
     * Phase 5: Enhanced with comprehensive prerequisite validation
     * Phase 6: Three-layer validation (Frontend → Controller → Service)
     */
    public function regenerate(TimetableTemplate $template)
    {
        $this->authorize('update', $template);

        // ============================================
        // LAYER 2: CONTROLLER VALIDATION
        // ============================================
        // Validate prerequisites before calling service
        $validation = $template->grade->canGenerateTimetable();

        if (!$validation['can_generate']) {
            $errorMessage = $this->formatValidationErrors($validation, $template->grade->name);

            return redirect()->back()
                ->with('error', $errorMessage);
        }

        // ============================================
        // LAYER 3: SERVICE VALIDATION (Final Safeguard)
        // ============================================
        try {
            $service = new TimetableGenerationService();
            $result = $service->generate($template);

            // Build success message with post-validation results
            $successMessage = "Regenerated {$result['generated']} slots ({$result['lessons']} lessons, {$result['breaks']} breaks). Manual edits preserved.";

            // Add post-validation warnings
            if (!empty($result['post_validation']['warnings'])) {
                $successMessage .= "\n\n⚠️ Warnings:\n" . implode("\n", $result['post_validation']['warnings']);
            }

            // Add post-validation issues (critical)
            if (!empty($result['post_validation']['issues'])) {
                $successMessage .= "\n\n❌ Issues:\n" . implode("\n", $result['post_validation']['issues']);
            }

            // Add day-by-day stats
            if (!empty($result['post_validation']['day_stats'])) {
                $successMessage .= "\n\n📊 Daily Distribution:";
                foreach ($result['post_validation']['day_stats'] as $day => $stats) {
                    $successMessage .= "\n• " . ucfirst($day) . ": {$stats['total_slots']} lessons";
                }
            }

            return redirect()->route('timetables.templates.grid', $template)
                ->with('success', $successMessage);
        } catch (\Exception $e) {
            // Format error message for better readability
            $errorMessage = $e->getMessage();

            // Convert newlines to HTML breaks for display
            $errorMessage = nl2br($errorMessage);

            return redirect()->back()
                ->with('error', $errorMessage);
        }
    }

    /**
     * Format validation errors for display.
     *
     * Converts validation result into user-friendly error message.
     * Used by controller validation layer.
     *
     * Follows error message design principles:
     * - Specific: Exact details of what's missing
     * - Actionable: Clear steps to fix
     * - Hierarchical: All errors shown at once with status indicators
     * - Linked: Navigation paths to fix issues
     */
    protected function formatValidationErrors(array $validation, string $gradeName): string
    {
        $message = "<strong>Cannot Generate Timetable for {$gradeName}</strong>\n\n";

        // Show missing requirements
        if (!empty($validation['errors'])) {
            $message .= "<strong>Missing Requirements:</strong>\n";
            foreach ($validation['errors'] as $error) {
                if (is_array($error)) {
                    $message .= "❌ {$error['message']}\n";
                    $message .= "   → {$error['action']}\n\n";
                } else {
                    // Fallback for old string format
                    $message .= "❌ {$error}\n\n";
                }
            }
        }

        // Show successes (what's already configured)
        if (!empty($validation['successes'])) {
            $message .= "<strong>Already Configured:</strong>\n";
            foreach ($validation['successes'] as $success) {
                $message .= "✅ {$success}\n";
            }
            $message .= "\n";
        }

        // Show warnings
        if (!empty($validation['warnings'])) {
            $message .= "<strong>Warnings:</strong>\n";
            foreach ($validation['warnings'] as $warning) {
                if (is_array($warning)) {
                    $message .= "⚠️ {$warning['message']}\n";
                    $message .= "   → {$warning['action']}\n\n";
                } else {
                    // Fallback for old string format
                    $message .= "⚠️ {$warning}\n\n";
                }
            }
        }

        // Convert newlines to HTML breaks for display
        return nl2br($message);
    }

    /**
     * ✅ PHASE 4: Bulk update teacher for all slots of a specific subject
     */
    public function bulkUpdateTeacher(Request $request, TimetableTemplate $template)
    {
        $this->authorize('update', $template);

        $validated = $request->validate([
            'subject_id' => 'required|exists:subjects,id',
            'teacher_id' => 'required|exists:teachers,id',
        ]);

        // Update all slots with the specified subject
        $updated = $template->slots()
            ->where('subject_id', $validated['subject_id'])
            ->update([
                'teacher_id' => $validated['teacher_id'],
                'auto_assigned_teacher' => false, // Manual override clears auto-assigned flag
            ]);

        return redirect()->back()
            ->with('success', "Updated {$updated} slot(s) with the selected teacher.");
    }
}
