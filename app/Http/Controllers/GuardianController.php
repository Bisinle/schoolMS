<?php

namespace App\Http\Controllers;

use App\Models\Guardian;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
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

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'phone_number' => 'required|string|max:20',
            'address' => 'nullable|string',
            'occupation' => 'nullable|string|max:255',
            'relationship' => 'required|string|max:255',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'guardian',
        ]);

        Guardian::create([
            'user_id' => $user->id,
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

        $guardian->load(['user', 'students']);

        return Inertia::render('Guardians/Show', [
            'guardian' => $guardian,
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
            'email' => 'required|string|email|max:255|unique:users,email,' . $guardian->user_id,
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
