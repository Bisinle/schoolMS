<?php

namespace App\Http\Controllers;

use App\Models\Guardian;
use App\Models\User;
use App\Services\UniqueIdentifierService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class GuardianController extends Controller
{
    use AuthorizesRequests;
    
    public function index(Request $request)
    {
        $this->authorize('viewAny', Guardian::class);

        $guardians = Guardian::with(['user', 'students'])
            ->when($request->search, function ($query, $search) {
                $query->whereHas('user', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Guardians/Index', [
            'guardians' => $guardians,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create()
    {
        $this->authorize('create', Guardian::class);

        return Inertia::render('Guardians/Create');
    }

    public function store(Request $request)
    {
        $this->authorize('create', Guardian::class);

        $schoolId = $request->user()->school_id;

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->where('school_id', $schoolId),
            ],
            'password' => 'required|string|min:8',
            'phone_number' => 'required|string|max:20',
            'address' => 'nullable|string',
            'occupation' => 'nullable|string|max:255',
            'relationship' => 'required|string|max:255',
        ]);

        $user = User::create([
            'school_id' => auth()->user()->school_id,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'guardian',
            'created_by' => auth()->id(),
        ]);

        Guardian::create([
            'user_id' => $user->id,
            'guardian_number' => UniqueIdentifierService::generateGuardianNumber(auth()->user()->school_id),
            'phone_number' => $validated['phone_number'],
            'address' => $validated['address'],
            'occupation' => $validated['occupation'],
            'relationship' => $validated['relationship'],
        ]);

        return redirect()->route('guardians.index')
            ->with('success', 'Guardian created successfully.');
    }

    public function show(Guardian $guardian)
    {
        $this->authorize('view', $guardian);

        $guardian->load(['user', 'students.grade']);

        // Add attendance stats for each child (current month)
        $startDate = now()->startOfMonth()->toDateString();
        $endDate = now()->toDateString();
        
        $studentsWithAttendance = $guardian->students->map(function ($student) use ($startDate, $endDate) {
            $stats = $student->getAttendanceStats($startDate, $endDate);
            $studentArray = $student->toArray();
            $studentArray['attendance_stats'] = $stats;
            return $studentArray;
        });

        return Inertia::render('Guardians/Show', [
            'guardian' => $guardian,
            'studentsWithAttendance' => $studentsWithAttendance,
            'currentMonth' => now()->format('F Y'),
        ]);
    }

    public function edit(Guardian $guardian)
    {
        $this->authorize('update', $guardian);

        $guardian->load('user');

        return Inertia::render('Guardians/Edit', [
            'guardian' => $guardian,
        ]);
    }

    public function update(Request $request, Guardian $guardian)
    {
        $this->authorize('update', $guardian);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')
                    ->ignore($guardian->user_id)
                    ->where('school_id', $guardian->user->school_id),
            ],
            'phone_number' => 'required|string|max:20',
            'address' => 'nullable|string',
            'occupation' => 'nullable|string|max:255',
            'relationship' => 'required|string|max:255',
        ]);

        $guardian->user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        $guardian->update([
            'phone_number' => $validated['phone_number'],
            'address' => $validated['address'],
            'occupation' => $validated['occupation'],
            'relationship' => $validated['relationship'],
        ]);

        return redirect()->route('guardians.index')
            ->with('success', 'Guardian updated successfully.');
    }

    public function destroy(Guardian $guardian)
    {
        $this->authorize('delete', $guardian);

        $guardian->user->delete();

        return redirect()->route('guardians.index')
            ->with('success', 'Guardian deleted successfully.');
    }
}