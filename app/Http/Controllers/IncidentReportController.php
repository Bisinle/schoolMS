<?php

namespace App\Http\Controllers;

use App\Models\IncidentReport;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class IncidentReportController extends Controller
{
    /**
     * Display a listing of incident reports.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', IncidentReport::class);

        $query = IncidentReport::with(['reporter', 'handler', 'school'])
            ->where('school_id', Auth::user()->school_id)
            ->orderBy('incident_date', 'desc')
            ->orderBy('created_at', 'desc');

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('report_number', 'like', "%{$search}%")
                  ->orWhere('location', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('severity')) {
            $query->where('severity', $request->severity);
        }

        if ($request->filled('incident_type')) {
            $query->where('incident_type', $request->incident_type);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('incident_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('incident_date', '<=', $request->date_to);
        }

        $reports = $query->paginate(15)->withQueryString();

        return Inertia::render('IncidentReports/Index', [
            'reports' => $reports,
            'filters' => $request->only(['search', 'status', 'severity', 'incident_type', 'date_from', 'date_to']),
        ]);
    }

    /**
     * Show the form for creating a new incident report.
     */
    public function create()
    {
        $this->authorize('create', IncidentReport::class);

        $students = Student::where('school_id', Auth::user()->school_id)
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'admission_number']);

        $staff = User::where('school_id', Auth::user()->school_id)
            ->whereIn('role', ['admin', 'teacher', 'nurse', 'receptionist', 'it_staff', 'accountant'])
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role']);

        return Inertia::render('IncidentReports/Create', [
            'students' => $students,
            'staff' => $staff,
        ]);
    }

    /**
     * Store a newly created incident report.
     */
    public function store(Request $request)
    {
        $this->authorize('create', IncidentReport::class);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'incident_date' => 'required|date',
            'incident_time' => 'required|date_format:H:i',
            'location' => 'required|string|max:255',
            'incident_type' => 'required|in:bullying,fighting,theft,vandalism,disrespect,cheating,truancy,substance_abuse,weapons,harassment,cut_laceration,broken_bones,head_injury,other',
            'severity' => 'required|in:minor,moderate,severe,critical',
            'students_involved' => 'required|array|min:1',
            'staff_involved' => 'nullable|array',
            'description' => 'required|string',
            'action_taken' => 'nullable|string',
            'disciplinary_action' => 'nullable|string',
            'parent_contacted' => 'boolean',
            'parent_contacted_at' => 'nullable|date',
            'police_involved' => 'boolean',
            'police_report_number' => 'nullable|string|max:255',
            'resolution' => 'nullable|string',
            'resolved_date' => 'nullable|date',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|mimes:jpg,jpeg,png,pdf,doc,docx|max:5120',
        ]);

        // Handle file uploads
        $attachmentPaths = [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('incident-reports', 'public');
                $attachmentPaths[] = [
                    'path' => $path,
                    'name' => $file->getClientOriginalName(),
                    'size' => $file->getSize(),
                    'type' => $file->getMimeType(),
                ];
            }
        }

        $report = IncidentReport::create([
            'school_id' => Auth::user()->school_id,
            'title' => $validated['title'],
            'incident_date' => $validated['incident_date'],
            'incident_time' => $validated['incident_time'],
            'location' => $validated['location'],
            'incident_type' => $validated['incident_type'],
            'severity' => $validated['severity'],
            'students_involved' => $validated['students_involved'],
            'staff_involved' => $validated['staff_involved'] ?? null,
            'description' => $validated['description'],
            'action_taken' => $validated['action_taken'] ?? null,
            'disciplinary_action' => $validated['disciplinary_action'] ?? null,
            'parent_contacted' => $validated['parent_contacted'] ?? false,
            'parent_contacted_at' => $validated['parent_contacted_at'] ?? null,
            'police_involved' => $validated['police_involved'] ?? false,
            'police_report_number' => $validated['police_report_number'] ?? null,
            'resolution' => $validated['resolution'] ?? null,
            'resolved_date' => $validated['resolved_date'] ?? null,
            'attachments' => $attachmentPaths,
            'status' => 'open',
            'reported_by' => Auth::id(),
        ]);

        return redirect()->route('incident-reports.show', $report)
            ->with('success', 'Incident report created successfully.');
    }

    /**
     * Display the specified incident report.
     */
    public function show(IncidentReport $incidentReport)
    {
        $this->authorize('view', $incidentReport);

        $incidentReport->load(['reporter', 'handler', 'school']);

        // Load students involved with their grade
        $students = Student::with('grade')
            ->whereIn('id', $incidentReport->students_involved ?? [])
            ->get(['id', 'first_name', 'last_name', 'admission_number', 'grade_id']);

        // Load staff involved
        $staff = [];
        if (!empty($incidentReport->staff_involved)) {
            $staff = User::whereIn('id', $incidentReport->staff_involved)
                ->get(['id', 'name', 'email', 'role']);
        }

        // Load guardians of involved students (using many-to-many relationship)
        $guardians = [];
        if (!empty($incidentReport->students_involved)) {
            $guardians = \App\Models\Guardian::whereHas('studentsMany', function ($query) use ($incidentReport) {
                $query->whereIn('students.id', $incidentReport->students_involved);
            })->with([
                'user:id,name,email,phone',
                'studentsMany' => function ($query) use ($incidentReport) {
                    $query->whereIn('students.id', $incidentReport->students_involved)
                        ->select('students.id', 'students.first_name', 'students.last_name');
                }
            ])->get(['id', 'user_id', 'phone_number']);

            // Transform guardians to include user data at top level for easier frontend access
            $guardians = $guardians->map(function ($guardian) {
                return [
                    'id' => $guardian->id,
                    'name' => $guardian->user->name ?? 'N/A',
                    'email' => $guardian->user->email ?? 'N/A',
                    'phone' => $guardian->user->phone ?? $guardian->phone_number ?? 'N/A',
                    'relationship' => $guardian->studentsMany->first()->pivot->relationship ?? 'Guardian',
                    'students' => $guardian->studentsMany->map(function ($student) {
                        return [
                            'id' => $student->id,
                            'first_name' => $student->first_name,
                            'last_name' => $student->last_name,
                        ];
                    }),
                ];
            });
        }

        // Format dates for display
        $reportData = $incidentReport->toArray();
        $reportData['incident_date'] = $incidentReport->incident_date?->format('Y-m-d');
        $reportData['parent_contacted_at'] = $incidentReport->parent_contacted_at?->format('Y-m-d H:i:s');
        $reportData['resolved_date'] = $incidentReport->resolved_date?->format('Y-m-d');

        return Inertia::render('IncidentReports/Show', [
            'report' => $reportData,
            'students' => $students,
            'staff' => $staff,
            'guardians' => $guardians,
        ]);
    }

    /**
     * Show the form for editing the incident report.
     */
    public function edit(IncidentReport $incidentReport)
    {
        $this->authorize('update', $incidentReport);

        $allStudents = Student::with('grade:id,name')
            ->where('school_id', Auth::user()->school_id)
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'admission_number', 'grade_id']);

        $allStaff = User::where('school_id', Auth::user()->school_id)
            ->whereIn('role', ['admin', 'teacher', 'nurse', 'receptionist', 'it_staff', 'accountant'])
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role']);

        // Format dates for HTML inputs
        $reportData = $incidentReport->toArray();
        $reportData['incident_date'] = $incidentReport->incident_date?->format('Y-m-d');
        $reportData['parent_contacted_at'] = $incidentReport->parent_contacted_at?->format('Y-m-d\TH:i');
        $reportData['resolved_date'] = $incidentReport->resolved_date?->format('Y-m-d');

        return Inertia::render('IncidentReports/Edit', [
            'report' => $reportData,
            'students' => $allStudents,
            'staff' => $allStaff,
        ]);
    }

    /**
     * Update the specified incident report.
     */
    public function update(Request $request, IncidentReport $incidentReport)
    {
        $this->authorize('update', $incidentReport);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'incident_date' => 'required|date',
            'incident_time' => 'required|date_format:H:i',
            'location' => 'required|string|max:255',
            'incident_type' => 'required|in:bullying,fighting,theft,vandalism,disrespect,cheating,truancy,substance_abuse,weapons,harassment,cut_laceration,broken_bones,head_injury,other',
            'severity' => 'required|in:minor,moderate,severe,critical',
            'students_involved' => 'required|array|min:1',
            'staff_involved' => 'nullable|array',
            'description' => 'required|string',
            'action_taken' => 'nullable|string',
            'disciplinary_action' => 'nullable|string',
            'parent_contacted' => 'boolean',
            'parent_contacted_at' => 'nullable|date',
            'police_involved' => 'boolean',
            'police_report_number' => 'nullable|string|max:255',
            'resolution' => 'nullable|string',
            'resolved_date' => 'nullable|date',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|mimes:jpg,jpeg,png,pdf,doc,docx|max:5120',
        ]);

        // Handle file uploads
        $existingAttachments = $incidentReport->attachments ?? [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('incident-reports', 'public');
                $existingAttachments[] = [
                    'path' => $path,
                    'name' => $file->getClientOriginalName(),
                    'size' => $file->getSize(),
                    'type' => $file->getMimeType(),
                ];
            }
        }

        $incidentReport->update([
            'title' => $validated['title'],
            'incident_date' => $validated['incident_date'],
            'incident_time' => $validated['incident_time'],
            'location' => $validated['location'],
            'incident_type' => $validated['incident_type'],
            'severity' => $validated['severity'],
            'students_involved' => $validated['students_involved'],
            'staff_involved' => $validated['staff_involved'] ?? null,
            'description' => $validated['description'],
            'action_taken' => $validated['action_taken'] ?? null,
            'disciplinary_action' => $validated['disciplinary_action'] ?? null,
            'parent_contacted' => $validated['parent_contacted'] ?? false,
            'parent_contacted_at' => $validated['parent_contacted_at'] ?? $incidentReport->parent_contacted_at,
            'police_involved' => $validated['police_involved'] ?? false,
            'police_report_number' => $validated['police_report_number'] ?? null,
            'resolution' => $validated['resolution'] ?? null,
            'resolved_date' => $validated['resolved_date'] ?? null,
            'attachments' => $existingAttachments,
        ]);

        return redirect()->route('incident-reports.show', $incidentReport)
            ->with('success', 'Incident report updated successfully.');
    }

    /**
     * Update the status of the incident report.
     */
    public function updateStatus(Request $request, IncidentReport $incidentReport)
    {
        $this->authorize('updateStatus', $incidentReport);

        $validated = $request->validate([
            'status' => 'required|in:open,investigating,resolved,closed',
            'resolution' => 'nullable|string',
            'resolved_date' => 'nullable|date',
            'handled_by' => 'nullable|exists:users,id',
        ]);

        $incidentReport->update([
            'status' => $validated['status'],
            'resolution' => $validated['resolution'] ?? $incidentReport->resolution,
            'resolved_date' => $validated['resolved_date'] ?? $incidentReport->resolved_date,
            'handled_by' => $validated['handled_by'] ?? $incidentReport->handled_by,
        ]);

        return back()->with('success', 'Incident status updated successfully.');
    }

    /**
     * Remove the specified incident report.
     */
    public function destroy(IncidentReport $incidentReport)
    {
        $this->authorize('delete', $incidentReport);

        // Delete attachments from storage
        if ($incidentReport->attachments) {
            foreach ($incidentReport->attachments as $attachment) {
                Storage::disk('public')->delete($attachment['path']);
            }
        }

        $incidentReport->delete();

        return redirect()->route('incident-reports.index')
            ->with('success', 'Incident report deleted successfully.');
    }
}

