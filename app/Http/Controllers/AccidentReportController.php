<?php

namespace App\Http\Controllers;

use App\Models\AccidentReport;
use App\Models\User;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class AccidentReportController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display a listing of accident reports.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', AccidentReport::class);

        $query = AccidentReport::with(['reporter', 'reviewer'])
            ->where('school_id', Auth::user()->school_id);

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by severity
        if ($request->filled('severity')) {
            $query->where('severity', $request->severity);
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('incident_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('incident_date', '<=', $request->date_to);
        }

        // Search
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('report_number', 'like', '%' . $request->search . '%')
                  ->orWhere('location', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        $reports = $query->latest('incident_date')->paginate(15);

        return Inertia::render('AccidentReports/Index', [
            'reports' => $reports,
            'filters' => $request->only(['status', 'severity', 'date_from', 'date_to', 'search']),
        ]);
    }

    /**
     * Show the form for creating a new accident report.
     */
    public function create()
    {
        $this->authorize('create', AccidentReport::class);

        // Get all users for people involved dropdown
        $users = User::where('school_id', Auth::user()->school_id)
            ->where('is_active', true)
            ->select('id', 'name', 'role')
            ->orderBy('name')
            ->get();

        // Get all students for people involved dropdown
        $students = Student::where('school_id', Auth::user()->school_id)
            ->where('status', 'active')
            ->select('id', 'first_name', 'last_name', 'grade_id')
            ->with('grade:id,name')
            ->orderBy('first_name')
            ->get()
            ->map(function ($student) {
                return [
                    'id' => $student->id,
                    'name' => $student->first_name . ' ' . $student->last_name,
                    'grade' => $student->grade->name ?? '',
                    'type' => 'student',
                ];
            });

        return Inertia::render('AccidentReports/Create', [
            'users' => $users,
            'students' => $students,
        ]);
    }

    /**
     * Store a newly created accident report.
     */
    public function store(Request $request)
    {
        $this->authorize('create', AccidentReport::class);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'incident_date' => 'required|date',
            'incident_time' => 'required|date_format:H:i',
            'location' => 'required|string|max:255',
            'incident_type' => 'required|in:fall,collision,cut,burn,sports_injury,playground_injury,medical_emergency,other',
            'severity' => 'required|in:minor,moderate,severe,critical',
            'people_involved' => 'required|array|min:1',
            'description' => 'required|string',
            'immediate_action_taken' => 'required|string',
            'witnesses' => 'nullable|array',
            'medical_attention_required' => 'boolean',
            'medical_facility' => 'nullable|string|max:255',
            'medical_notes' => 'nullable|string',
            'parent_notified' => 'boolean',
            'parent_notified_at' => 'nullable|date',
            'parent_notification_method' => 'nullable|in:phone,email,in_person,sms',
            'follow_up_required' => 'boolean',
            'follow_up_notes' => 'nullable|string',
            'follow_up_date' => 'nullable|date|after:today',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|mimes:jpg,jpeg,png,pdf,doc,docx|max:5120',
        ]);

        // Handle file uploads
        $attachmentPaths = [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('accident-reports', 'public');
                $attachmentPaths[] = [
                    'path' => $path,
                    'name' => $file->getClientOriginalName(),
                    'size' => $file->getSize(),
                    'type' => $file->getMimeType(),
                ];
            }
        }

        $report = AccidentReport::create([
            'school_id' => Auth::user()->school_id,
            'title' => $validated['title'],
            'incident_date' => $validated['incident_date'],
            'incident_time' => $validated['incident_time'],
            'location' => $validated['location'],
            'incident_type' => $validated['incident_type'],
            'severity' => $validated['severity'],
            'people_involved' => $validated['people_involved'],
            'description' => $validated['description'],
            'immediate_action_taken' => $validated['immediate_action_taken'],
            'witnesses' => $validated['witnesses'] ?? null,
            'medical_attention_required' => $validated['medical_attention_required'] ?? false,
            'medical_facility' => $validated['medical_facility'] ?? null,
            'medical_notes' => $validated['medical_notes'] ?? null,
            'parent_notified' => $validated['parent_notified'] ?? false,
            'parent_notified_at' => $validated['parent_notified_at'] ?? null,
            'parent_notification_method' => $validated['parent_notification_method'] ?? null,
            'follow_up_required' => $validated['follow_up_required'] ?? false,
            'follow_up_notes' => $validated['follow_up_notes'] ?? null,
            'follow_up_date' => $validated['follow_up_date'] ?? null,
            'attachments' => $attachmentPaths,
            'status' => 'submitted',
            'reported_by' => Auth::id(),
        ]);

        return redirect()->route('accident-reports.show', $report)
            ->with('success', 'Accident report created successfully.');
    }

    /**
     * Display the specified accident report.
     */
    public function show(AccidentReport $accidentReport)
    {
        $this->authorize('view', $accidentReport);

        $accidentReport->load(['reporter', 'reviewer']);

        // Format dates for display
        $reportData = $accidentReport->toArray();
        $reportData['incident_date'] = $accidentReport->incident_date?->format('Y-m-d');
        $reportData['parent_notified_at'] = $accidentReport->parent_notified_at?->format('Y-m-d H:i:s');
        $reportData['follow_up_date'] = $accidentReport->follow_up_date?->format('Y-m-d');

        return Inertia::render('AccidentReports/Show', [
            'report' => $reportData,
        ]);
    }

    /**
     * Show the form for editing the specified accident report.
     */
    public function edit(AccidentReport $accidentReport)
    {
        $this->authorize('update', $accidentReport);

        // Get all users for people involved dropdown
        $users = User::where('school_id', Auth::user()->school_id)
            ->where('is_active', true)
            ->select('id', 'name', 'role')
            ->orderBy('name')
            ->get();

        // Get all students for people involved dropdown
        $students = Student::where('school_id', Auth::user()->school_id)
            ->where('status', 'active')
            ->select('id', 'first_name', 'last_name', 'grade_id')
            ->with('grade:id,name')
            ->orderBy('first_name')
            ->get()
            ->map(function ($student) {
                return [
                    'id' => $student->id,
                    'name' => $student->first_name . ' ' . $student->last_name,
                    'grade' => $student->grade->name ?? '',
                    'type' => 'student',
                ];
            });

        // Format dates for HTML inputs
        $reportData = $accidentReport->toArray();
        $reportData['incident_date'] = $accidentReport->incident_date?->format('Y-m-d');
        $reportData['parent_notified_at'] = $accidentReport->parent_notified_at?->format('Y-m-d\TH:i');
        $reportData['follow_up_date'] = $accidentReport->follow_up_date?->format('Y-m-d');

        return Inertia::render('AccidentReports/Edit', [
            'report' => $reportData,
            'users' => $users,
            'students' => $students,
        ]);
    }

    /**
     * Update the specified accident report.
     */
    public function update(Request $request, AccidentReport $accidentReport)
    {
        $this->authorize('update', $accidentReport);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'incident_date' => 'required|date',
            'incident_time' => 'required|date_format:H:i',
            'location' => 'required|string|max:255',
            'incident_type' => 'required|in:fall,collision,cut,burn,sports_injury,playground_injury,medical_emergency,other',
            'severity' => 'required|in:minor,moderate,severe,critical',
            'people_involved' => 'required|array|min:1',
            'description' => 'required|string',
            'immediate_action_taken' => 'required|string',
            'witnesses' => 'nullable|array',
            'medical_attention_required' => 'boolean',
            'medical_facility' => 'nullable|string|max:255',
            'medical_notes' => 'nullable|string',
            'parent_notified' => 'boolean',
            'parent_notified_at' => 'nullable|date',
            'parent_notification_method' => 'nullable|in:phone,email,in_person,sms',
            'follow_up_required' => 'boolean',
            'follow_up_notes' => 'nullable|string',
            'follow_up_date' => 'nullable|date|after:today',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|mimes:jpg,jpeg,png,pdf,doc,docx|max:5120',
        ]);

        // Handle file uploads
        $existingAttachments = $accidentReport->attachments ?? [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('accident-reports', 'public');
                $existingAttachments[] = [
                    'path' => $path,
                    'name' => $file->getClientOriginalName(),
                    'size' => $file->getSize(),
                    'type' => $file->getMimeType(),
                ];
            }
        }

        $accidentReport->update([
            'title' => $validated['title'],
            'incident_date' => $validated['incident_date'],
            'incident_time' => $validated['incident_time'],
            'location' => $validated['location'],
            'incident_type' => $validated['incident_type'],
            'severity' => $validated['severity'],
            'people_involved' => $validated['people_involved'],
            'description' => $validated['description'],
            'immediate_action_taken' => $validated['immediate_action_taken'],
            'witnesses' => $validated['witnesses'] ?? null,
            'medical_attention_required' => $validated['medical_attention_required'] ?? false,
            'medical_facility' => $validated['medical_facility'] ?? null,
            'medical_notes' => $validated['medical_notes'] ?? null,
            'parent_notified' => $validated['parent_notified'] ?? false,
            'parent_notified_at' => $validated['parent_notified_at'] ?? $accidentReport->parent_notified_at,
            'parent_notification_method' => $validated['parent_notification_method'] ?? null,
            'follow_up_required' => $validated['follow_up_required'] ?? false,
            'follow_up_notes' => $validated['follow_up_notes'] ?? null,
            'follow_up_date' => $validated['follow_up_date'] ?? null,
            'attachments' => $existingAttachments,
        ]);

        return redirect()->route('accident-reports.show', $accidentReport)
            ->with('success', 'Accident report updated successfully.');
    }

    /**
     * Admin reviews the accident report.
     */
    public function review(Request $request, AccidentReport $accidentReport)
    {
        $this->authorize('review', $accidentReport);

        $validated = $request->validate([
            'review_notes' => 'required|string',
            'status' => 'required|in:under_review,closed',
        ]);

        $accidentReport->update([
            'status' => $validated['status'],
            'review_notes' => $validated['review_notes'],
            'reviewed_by' => Auth::id(),
            'reviewed_at' => now(),
        ]);

        return back()->with('success', 'Accident report reviewed successfully.');
    }

    /**
     * Remove the specified accident report.
     */
    public function destroy(AccidentReport $accidentReport)
    {
        $this->authorize('delete', $accidentReport);

        // Delete attachments from storage
        if ($accidentReport->attachments) {
            foreach ($accidentReport->attachments as $attachment) {
                Storage::disk('public')->delete($attachment['path']);
            }
        }

        $accidentReport->delete();

        return redirect()->route('accident-reports.index')
            ->with('success', 'Accident report deleted successfully.');
    }
}

