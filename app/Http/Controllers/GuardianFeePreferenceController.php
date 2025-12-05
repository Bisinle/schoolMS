<?php

namespace App\Http\Controllers;

use App\Models\Guardian;
use App\Models\GuardianFeePreference;
use App\Models\GuardianInvoice;
use App\Models\Student;
use App\Models\AcademicTerm;
use App\Models\AcademicYear;
use App\Models\TransportRoute;
use App\Models\TuitionFee;
use App\Models\UniversalFee;
use App\Services\InvoiceGenerationService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class GuardianFeePreferenceController extends Controller
{
    /**
     * Display a listing of guardians with their preference status
     */
    public function index(Request $request)
    {
        // Get the active academic term or the first one
        $activeTerm = AcademicTerm::active()->first() ?? AcademicTerm::orderBy('start_date', 'desc')->first();
        
        // Get selected term from request or use active term
        $selectedTermId = $request->filled('term') ? $request->term : $activeTerm?->id;

        $query = Guardian::with([
            'user:id,name,email,phone',
            'students' => function ($q) {
                $q->select('id', 'guardian_id', 'first_name', 'last_name', 'grade_id')
                  ->with('grade:id,name');
            }
        ]);

        // Search by guardian name or ID
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', function ($userQuery) use ($search) {
                    $userQuery->where('name', 'like', "%{$search}%")
                              ->orWhere('email', 'like', "%{$search}%");
                })
                ->orWhere('guardian_number', 'like', "%{$search}%");
            });
        }

        // Filter by preference status
        if ($request->filled('status') && $selectedTermId) {
            $status = $request->status;
            
            if ($status === 'complete') {
                // Has preferences for all children
                $query->whereHas('students', function ($q) use ($selectedTermId) {
                    $q->whereHas('feePreferences', function ($q2) use ($selectedTermId) {
                        $q2->where('academic_term_id', $selectedTermId);
                    });
                })->whereDoesntHave('students', function ($q) use ($selectedTermId) {
                    $q->whereDoesntHave('feePreferences', function ($q2) use ($selectedTermId) {
                        $q2->where('academic_term_id', $selectedTermId);
                    });
                });
            } elseif ($status === 'incomplete') {
                // Has some but not all preferences
                $query->whereHas('students', function ($q) use ($selectedTermId) {
                    $q->whereHas('feePreferences', function ($q2) use ($selectedTermId) {
                        $q2->where('academic_term_id', $selectedTermId);
                    });
                })->whereHas('students', function ($q) use ($selectedTermId) {
                    $q->whereDoesntHave('feePreferences', function ($q2) use ($selectedTermId) {
                        $q2->where('academic_term_id', $selectedTermId);
                    });
                });
            } elseif ($status === 'none') {
                // No preferences at all
                $query->whereDoesntHave('students.feePreferences', function ($q) use ($selectedTermId) {
                    $q->where('academic_term_id', $selectedTermId);
                });
            }
        }

        $guardians = $query
            ->join('users', 'guardians.user_id', '=', 'users.id')
            ->orderBy('users.name')
            ->select('guardians.*')
            ->paginate(20)
            ->through(function ($guardian) use ($selectedTermId) {
            $totalChildren = $guardian->students->count();
            $childrenWithPreferences = 0;

            if ($selectedTermId && $totalChildren > 0) {
                // Query preferences directly through GuardianFeePreference table
                $studentIds = $guardian->students->pluck('id');

                $childrenWithPreferences = GuardianFeePreference::where('guardian_id', $guardian->id)
                    ->where('academic_term_id', $selectedTermId)
                    ->whereIn('student_id', $studentIds)
                    ->distinct('student_id')
                    ->count('student_id');
            }

            // Determine status
            $status = 'none';
            if ($childrenWithPreferences === $totalChildren && $totalChildren > 0) {
                $status = 'complete';
            } elseif ($childrenWithPreferences > 0) {
                $status = 'incomplete';
            }

            return [
                'id' => $guardian->id,
                'guardian_id' => $guardian->guardian_id,
                'full_name' => $guardian->full_name,
                'email' => $guardian->email,
                'phone' => $guardian->phone,
                'total_children' => $totalChildren,
                'children_with_preferences' => $childrenWithPreferences,
                'preference_status' => $status,
            ];
        });

        // Get all academic terms for the term selector
        $academicTerms = AcademicTerm::with('academicYear')
            ->orderBy('start_date', 'desc')
            ->get()
            ->map(function ($term) {
                return [
                    'id' => $term->id,
                    'name' => $term->name,
                    'year' => $term->academicYear->year,
                    'display_name' => "{$term->name}, {$term->academicYear->year}",
                ];
            });

        return Inertia::render('Fees/FeePreferences/Index', [
            'guardians' => $guardians,
            'academicTerms' => $academicTerms,
            'selectedTerm' => $selectedTermId ? AcademicTerm::with('academicYear')->find($selectedTermId) : $activeTerm,
            'filters' => [
                'search' => $request->search ?? '',
                'status' => $request->status ?? '',
                'term' => $selectedTermId,
            ],
        ]);
    }

    /**
     * Show the form for editing guardian fee preferences
     */
    public function edit(Guardian $guardian, Request $request)
    {
        // Get the active academic term or the first one
        $activeTerm = AcademicTerm::active()->first() ?? AcademicTerm::orderBy('start_date', 'desc')->first();
        
        // Get selected term from request or use active term
        $selectedTermId = $request->filled('term') ? $request->term : $activeTerm?->id;

        if (!$selectedTermId) {
            return redirect()->back()->withErrors(['term' => 'No academic term available.']);
        }

        $selectedTerm = AcademicTerm::with('academicYear')->findOrFail($selectedTermId);

        // Get guardian's students with their current preferences
        $students = $guardian->students()->with('grade')->get()->map(function ($student) use ($guardian, $selectedTermId) {
            // Get preference for this student in the selected term
            $preference = GuardianFeePreference::where('guardian_id', $guardian->id)
                ->where('student_id', $student->id)
                ->where('academic_term_id', $selectedTermId)
                ->with(['transportRoute'])
                ->first();

            return [
                'id' => $student->id,
                'full_name' => $student->full_name,
                'grade_id' => $student->grade_id,
                'grade_name' => $student->grade->name,
                'preference' => $preference ? [
                    'id' => $preference->id,
                    'tuition_type' => $preference->tuition_type,
                    'transport_route_id' => $preference->transport_route_id,
                    'transport_type' => $preference->transport_type,
                    'include_food' => $preference->include_food,
                    'include_sports' => $preference->include_sports,
                    'notes' => $preference->notes,
                ] : null,
            ];
        });

        // Get available transport routes
        $transportRoutes = TransportRoute::active()
            ->orderBy('route_name')
            ->get()
            ->map(function ($route) {
                return [
                    'id' => $route->id,
                    'route_name' => $route->route_name,
                    'amount_one_way' => $route->amount_one_way,
                    'amount_two_way' => $route->amount_two_way,
                ];
            });

        // Get tuition fees for the academic year
        $tuitionFees = TuitionFee::where('academic_year_id', $selectedTerm->academic_year_id)
            ->where('is_active', true)
            ->with('grade')
            ->get()
            ->keyBy('grade_id')
            ->map(function ($fee) {
                return [
                    'grade_id' => $fee->grade_id,
                    'amount_full_day' => $fee->amount_full_day,
                    'amount_half_day' => $fee->amount_half_day,
                ];
            });

        // Get universal fees for the academic year
        $universalFees = UniversalFee::where('academic_year_id', $selectedTerm->academic_year_id)
            ->where('is_active', true)
            ->get()
            ->keyBy('fee_type')
            ->map(function ($fee) {
                return [
                    'fee_type' => $fee->fee_type,
                    'amount' => $fee->amount,
                ];
            });

        // Get all academic terms for the term selector
        $academicTerms = AcademicTerm::with('academicYear')
            ->orderBy('start_date', 'desc')
            ->get()
            ->map(function ($term) {
                return [
                    'id' => $term->id,
                    'name' => $term->name,
                    'year' => $term->academicYear->year,
                    'display_name' => "{$term->name}, {$term->academicYear->year}",
                ];
            });

        // Check if invoice already exists for this guardian and term
        $existingInvoice = GuardianInvoice::where('guardian_id', $guardian->id)
            ->where('academic_term_id', $selectedTermId)
            ->first();

        return Inertia::render('Fees/FeePreferences/Edit', [
            'guardian' => [
                'id' => $guardian->id,
                'guardian_id' => $guardian->guardian_id,
                'full_name' => $guardian->full_name,
                'email' => $guardian->email,
                'phone' => $guardian->phone,
            ],
            'students' => $students,
            'transportRoutes' => $transportRoutes,
            'tuitionFees' => $tuitionFees,
            'universalFees' => $universalFees,
            'selectedTerm' => $selectedTerm,
            'academicTerms' => $academicTerms,
            'existingInvoice' => $existingInvoice ? [
                'id' => $existingInvoice->id,
                'invoice_number' => $existingInvoice->invoice_number,
                'status' => $existingInvoice->status,
                'total_amount' => $existingInvoice->total_amount,
                'amount_paid' => $existingInvoice->amount_paid,
                'balance_due' => $existingInvoice->balance_due,
                'updated_at' => $existingInvoice->updated_at->format('M d, Y'),
            ] : null,
        ]);
    }

    /**
     * Store or update fee preferences for guardian's children
     */
    public function update(Guardian $guardian, Request $request)
    {
        $validated = $request->validate([
            'academic_term_id' => 'required|exists:academic_terms,id',
            'preferences' => 'required|array',
            'preferences.*.student_id' => 'required|exists:students,id',
            'preferences.*.tuition_type' => 'required|in:full_day,half_day',
            'preferences.*.transport_route_id' => 'nullable|exists:transport_routes,id',
            'preferences.*.transport_type' => 'nullable|in:one_way,two_way,none',
            'preferences.*.include_food' => 'boolean',
            'preferences.*.include_sports' => 'boolean',
            'preferences.*.notes' => 'nullable|string|max:500',
            'regenerate_invoice' => 'nullable|boolean', // Option to regenerate existing invoice
        ]);

        // Check if invoice already exists for this guardian and term
        $existingInvoice = GuardianInvoice::where('guardian_id', $guardian->id)
            ->where('academic_term_id', $validated['academic_term_id'])
            ->first();

        DB::beginTransaction();
        try {
            foreach ($validated['preferences'] as $prefData) {
                // Verify student belongs to this guardian
                $student = Student::where('id', $prefData['student_id'])
                    ->where('guardian_id', $guardian->id)
                    ->firstOrFail();

                // Validate that tuition fee exists for this student's grade
                $term = AcademicTerm::findOrFail($validated['academic_term_id']);
                $tuitionFee = TuitionFee::where('grade_id', $student->grade_id)
                    ->where('academic_year_id', $term->academic_year_id)
                    ->where('is_active', true)
                    ->first();

                if (!$tuitionFee) {
                    throw new \Exception("No active tuition fee found for {$student->full_name}'s grade.");
                }

                // Update or create preference
                GuardianFeePreference::updateOrCreate(
                    [
                        'guardian_id' => $guardian->id,
                        'student_id' => $student->id,
                        'academic_term_id' => $validated['academic_term_id'],
                    ],
                    [
                        'school_id' => auth()->user()->school_id,
                        'tuition_type' => $prefData['tuition_type'],
                        'transport_route_id' => $prefData['transport_route_id'] ?? null,
                        'transport_type' => $prefData['transport_type'] ?? 'none',
                        'include_food' => $prefData['include_food'] ?? false,
                        'include_sports' => $prefData['include_sports'] ?? false,
                        'notes' => $prefData['notes'] ?? null,
                    ]
                );
            }

            // Handle existing invoice
            $message = 'Fee preferences saved successfully.';
            $invoiceAction = null;

            if ($existingInvoice) {
                // Check if we should regenerate the invoice
                if ($request->filled('regenerate_invoice') && $request->regenerate_invoice) {
                    // Only regenerate if invoice is unpaid or partially paid
                    if (in_array($existingInvoice->status, ['pending', 'partial'])) {
                        // Delete existing invoice and regenerate
                        $existingInvoice->delete();

                        $invoiceService = app(InvoiceGenerationService::class);
                        $newInvoice = $invoiceService->generateInvoiceForGuardian(
                            $guardian,
                            AcademicTerm::find($validated['academic_term_id']),
                            auth()->id(),
                            $existingInvoice->payment_plan
                        );

                        $message = 'Fee preferences updated and invoice regenerated successfully.';
                        $invoiceAction = 'regenerated';
                    } else {
                        $message = 'Fee preferences saved. Invoice was not regenerated because it is already paid.';
                        $invoiceAction = 'not_regenerated_paid';
                    }
                } else {
                    $message = 'Fee preferences saved. Changes will apply to next invoice generation.';
                    $invoiceAction = 'existing_not_modified';
                }
            }

            DB::commit();

            return redirect()->route('fee-preferences.index', ['term' => $validated['academic_term_id']])
                ->with('success', $message)
                ->with('invoice_action', $invoiceAction)
                ->with('existing_invoice_id', $existingInvoice?->id);
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()
                ->withErrors(['error' => $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Delete fee preference
     */
    public function destroy(GuardianFeePreference $feePreference)
    {
        $feePreference->delete();

        return redirect()->back()->with('success', 'Fee preference deleted successfully.');
    }

    /**
     * Get preference change history for a guardian
     */
    public function history(Guardian $guardian, Request $request)
    {
        $termId = $request->filled('term') ? $request->term : null;

        $query = GuardianFeePreference::where('guardian_id', $guardian->id)
            ->with(['student', 'academicTerm.academicYear', 'updatedBy', 'transportRoute']);

        if ($termId) {
            $query->where('academic_term_id', $termId);
        }

        $preferences = $query->orderBy('updated_at', 'desc')->get();

        $history = $preferences->map(function ($pref) {
            return [
                'id' => $pref->id,
                'student_name' => $pref->student->full_name,
                'term' => $pref->academicTerm->name . ', ' . $pref->academicTerm->academicYear->year,
                'tuition_type' => $pref->tuition_type,
                'transport_route' => $pref->transportRoute?->route_name,
                'transport_type' => $pref->transport_type,
                'include_food' => $pref->include_food,
                'include_sports' => $pref->include_sports,
                'updated_at' => $pref->updated_at->format('M d, Y H:i'),
                'updated_by' => $pref->updatedBy?->name ?? 'System',
                'previous_values' => $pref->previous_values,
            ];
        });

        return response()->json([
            'guardian' => [
                'id' => $guardian->id,
                'full_name' => $guardian->full_name,
            ],
            'history' => $history,
        ]);
    }

    /**
     * Bulk apply default preferences to multiple guardians
     */
    public function bulkApplyDefaults(Request $request)
    {
        $validated = $request->validate([
            'guardian_ids' => 'required|array',
            'guardian_ids.*' => 'exists:guardians,id',
            'academic_term_id' => 'required|exists:academic_terms,id',
            'defaults' => 'required|array',
            'defaults.tuition_type' => 'required|in:full_day,half_day',
            'defaults.transport_type' => 'required|in:one_way,two_way,none',
            'defaults.transport_route_id' => 'nullable|exists:transport_routes,id',
            'defaults.include_food' => 'boolean',
            'defaults.include_sports' => 'boolean',
        ]);

        $term = AcademicTerm::findOrFail($validated['academic_term_id']);
        $schoolId = auth()->user()->school_id;
        $createdCount = 0;

        DB::beginTransaction();
        try {
            foreach ($validated['guardian_ids'] as $guardianId) {
                $guardian = Guardian::findOrFail($guardianId);

                foreach ($guardian->students as $student) {
                    // Validate that tuition fee exists for this student's grade
                    $tuitionFee = TuitionFee::where('grade_id', $student->grade_id)
                        ->where('academic_year_id', $term->academic_year_id)
                        ->where('is_active', true)
                        ->first();

                    if (!$tuitionFee) {
                        continue; // Skip if no tuition fee found
                    }

                    // Create or update preference
                    GuardianFeePreference::updateOrCreate(
                        [
                            'guardian_id' => $guardian->id,
                            'student_id' => $student->id,
                            'academic_term_id' => $validated['academic_term_id'],
                        ],
                        [
                            'school_id' => $schoolId,
                            'tuition_type' => $validated['defaults']['tuition_type'],
                            'transport_route_id' => $validated['defaults']['transport_route_id'] ?? null,
                            'transport_type' => $validated['defaults']['transport_type'],
                            'include_food' => $validated['defaults']['include_food'] ?? false,
                            'include_sports' => $validated['defaults']['include_sports'] ?? false,
                        ]
                    );

                    $createdCount++;
                }
            }

            DB::commit();

            return redirect()->back()->with('success', "Applied default preferences to {$createdCount} student(s).");
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}

