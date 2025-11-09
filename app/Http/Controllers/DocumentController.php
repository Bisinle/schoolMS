<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\DocumentCategory;
use App\Models\Teacher;
use App\Models\Student;
use App\Models\Guardian;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class DocumentController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $this->authorize('viewAny', Document::class);

        $user = $request->user();

        // Base query with relationships
        $query = $user->accessibleDocuments()
            ->with(['category', 'documentable', 'uploader', 'verifier']);

        // Search
        if ($request->filled('owner_search')) {
            $ownerSearch = $request->owner_search;
            $query->where(function ($q) use ($ownerSearch) {
                // Search in teachers
                $q->orWhereHasMorph('documentable', [Teacher::class], function ($q2) use ($ownerSearch) {
                    $q2->whereHas('user', function ($q3) use ($ownerSearch) {
                        $q3->where('name', 'like', "%{$ownerSearch}%");
                    });
                })
                // Search in students (supports first name, last name, OR full name)
                ->orWhereHasMorph('documentable', [Student::class], function ($q2) use ($ownerSearch) {
                    $q2->where(function ($q3) use ($ownerSearch) {
                        $q3->where('first_name', 'like', "%{$ownerSearch}%")
                          ->orWhere('last_name', 'like', "%{$ownerSearch}%")
                          ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$ownerSearch}%"]);
                    });
                })
                // Search in guardians
                ->orWhereHasMorph('documentable', [Guardian::class], function ($q2) use ($ownerSearch) {
                    $q2->whereHas('user', function ($q3) use ($ownerSearch) {
                        $q3->where('name', 'like', "%{$ownerSearch}%");
                    });
                })
                // Search in users
                ->orWhereHasMorph('documentable', [User::class], function ($q2) use ($ownerSearch) {
                    $q2->where('name', 'like', "%{$ownerSearch}%");
                });
            });
        }

        // Filter by category
        if ($request->filled('category_id') && $request->category_id !== 'all') {
            $query->where('document_category_id', $request->category_id);
        }

        // Filter by status
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by entity type (admin only)
        if ($request->filled('entity_type') && $request->entity_type !== 'all') {
            $query->where('documentable_type', 'App\\Models\\' . $request->entity_type);
        }

        // Sort
        $sortField = $request->get('sort_field', 'created_at');
        $sortDirection = $request->get('sort_direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $documents = $query->paginate(20)->withQueryString();

        // Get categories for filter
        $categories = DocumentCategory::active()->orderBy('name')->get(['id', 'name']);

        // Get statistics
        $stats = [
            'total' => $user->accessibleDocuments()->count(),
            'pending' => $user->accessibleDocuments()->where('status', 'pending')->count(),
            'verified' => $user->accessibleDocuments()->where('status', 'verified')->count(),
            'rejected' => $user->accessibleDocuments()->where('status', 'rejected')->count(),
            'expired' => $user->accessibleDocuments()->where('status', 'expired')->count(),
        ];

        return Inertia::render('Documents/Index', [
            'documents' => $documents,
            'categories' => $categories,
            'stats' => $stats,
            'filters' => $request->only(['owner_search', 'category_id', 'status', 'entity_type', 'sort_field', 'sort_direction']),
            'entityTypes' => ['Teacher', 'Student', 'Guardian', 'User'],
        ]);
    }

    public function create(Request $request)
    {
        $this->authorize('create', Document::class);

        $user = $request->user();

        // Get entity options based on user role
        $entityOptions = $this->getEntityOptions($user);

        // Get active categories
        $categories = DocumentCategory::active()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return Inertia::render('Documents/Create', [
            'categories' => $categories,
            'entityOptions' => $entityOptions,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Document::class);

        $validated = $request->validate([
            'document_category_id' => 'required|exists:document_categories,id',
            'documentable_type' => 'required|in:Teacher,Student,Guardian,User',
            'documentable_id' => 'required|integer',
            'file' => 'required|file|max:51200', // Max 50MB
            'expiry_date' => 'nullable|date|after:today',
        ]);

        // Get the category to validate file
        $category = DocumentCategory::findOrFail($validated['document_category_id']);

        // Validate file extension
        $file = $request->file('file');
        $extension = $file->getClientOriginalExtension();

        if (!$category->isValidFileExtension($extension)) {
            return back()->withErrors([
                'file' => "File type .{$extension} is not allowed. Allowed types: " . $category->getAllowedExtensionsString()
            ])->withInput();
        }

        // Validate file size
        if (!$category->isValidFileSize($file->getSize())) {
            return back()->withErrors([
                'file' => "File size exceeds maximum allowed size of {$category->max_file_size_in_mb}MB"
            ])->withInput();
        }

        // Generate unique filename
        $storedFilename = Str::uuid() . '.' . $extension;
        
        // Determine storage path based on entity type
        $entityFolder = strtolower($validated['documentable_type']) . 's';
        $filePath = "documents/{$entityFolder}/{$storedFilename}";

        // Store file
        $file->storeAs('documents/' . $entityFolder, $storedFilename);

        // Create document record
        Document::create([
            'document_category_id' => $validated['document_category_id'],
            'documentable_type' => 'App\\Models\\' . $validated['documentable_type'],
            'documentable_id' => $validated['documentable_id'],
            'original_filename' => $file->getClientOriginalName(),
            'stored_filename' => $storedFilename,
            'file_path' => $filePath,
            'mime_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'expiry_date' => $validated['expiry_date'] ?? null,
            'uploaded_by' => $request->user()->id,
            'status' => 'pending',
        ]);

        return redirect()->route('documents.index')
            ->with('success', 'Document uploaded successfully and is pending verification.');
    }

    public function show(Document $document)
    {
        $this->authorize('view', $document);

        $document->load(['category', 'documentable', 'uploader', 'verifier']);

        return Inertia::render('Documents/Show', [
            'document' => $document,
        ]);
    }

    public function edit(Document $document)
    {
        $this->authorize('update', $document);

        $document->load('category');

        return Inertia::render('Documents/Edit', [
            'document' => $document,
        ]);
    }

    public function update(Request $request, Document $document)
    {
        $this->authorize('update', $document);

        $validated = $request->validate([
            'expiry_date' => 'nullable|date|after:today',
        ]);

        $document->update($validated);

        return redirect()->route('documents.show', $document)
            ->with('success', 'Document updated successfully.');
    }

    public function destroy(Document $document)
    {
        $this->authorize('delete', $document);

        // Delete physical file
        if (Storage::exists($document->file_path)) {
            Storage::delete($document->file_path);
        }

        $document->delete();

        return redirect()->route('documents.index')
            ->with('success', 'Document deleted successfully.');
    }

    /**
     * Verify a document (Admin only)
     */
    public function verify(Document $document)
    {
        $this->authorize('verify', $document);

        $document->markAsVerified(auth()->user());

        return back()->with('success', 'Document verified successfully.');
    }

    /**
     * Reject a document (Admin only)
     */
    public function reject(Request $request, Document $document)
    {
        $this->authorize('verify', $document);

        $validated = $request->validate([
            'rejection_reason' => 'required|string|max:500',
        ]);

        $document->markAsRejected(auth()->user(), $validated['rejection_reason']);

        return back()->with('success', 'Document rejected. User will be notified.');
    }

    /**
     * Download a document
     */
    public function download(Document $document)
    {
        $this->authorize('download', $document);

        if (!Storage::exists($document->file_path)) {
            abort(404, 'File not found.');
        }

        return Storage::download($document->file_path, $document->original_filename);
    }

    /**
     * Preview a document (for PDFs and images)
     */
    public function preview(Document $document)
    {
        $this->authorize('view', $document);

        if (!Storage::exists($document->file_path)) {
            abort(404, 'File not found.');
        }

        $mimeType = $document->mime_type;
        $allowedPreviewTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

        if (!in_array($mimeType, $allowedPreviewTypes)) {
            return $this->download($document);
        }

        return response()->file(Storage::path($document->file_path));
    }

    /**
     * Get entity options based on user role
     */
    private function getEntityOptions($user)
    {
        $options = [];

        if ($user->isAdmin()) {
            // Admin can upload for anyone
            $options['Teacher'] = Teacher::with('user')->get()->map(function ($teacher) {
                return [
                    'id' => $teacher->id,
                    'name' => $teacher->user->name . ' (' . $teacher->employee_number . ')',
                ];
            });

            $options['Student'] = Student::with('grade')->get()->map(function ($student) {
                return [
                    'id' => $student->id,
                    'name' => $student->full_name . ' (' . $student->grade_name . ')',
                ];
            });

            $options['Guardian'] = Guardian::with('user')->get()->map(function ($guardian) {
                return [
                    'id' => $guardian->id,
                    'name' => $guardian->user->name . ' (' . $guardian->relationship . ')',
                ];
            });

            $options['User'] = User::whereNotIn('role', ['teacher', 'guardian'])
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name . ' (' . ucfirst($user->role) . ')',
                    ];
                });
        } elseif ($user->isTeacher() && $user->teacher) {
            // Teacher can only upload their own documents
            $options['Teacher'] = [[
                'id' => $user->teacher->id,
                'name' => $user->name . ' (You)',
            ]];
        } elseif ($user->isGuardian() && $user->guardian) {
            // Guardian can upload their own and their children's documents
            $options['Guardian'] = [[
                'id' => $user->guardian->id,
                'name' => $user->name . ' (You)',
            ]];

            $options['Student'] = $user->guardian->students->map(function ($student) {
                return [
                    'id' => $student->id,
                    'name' => $student->full_name . ' (Your child)',
                ];
            });
        } else {
            // Other users can only upload their own documents
            $options['User'] = [[
                'id' => $user->id,
                'name' => $user->name . ' (You)',
            ]];
        }

        return $options;
    }
}