<?php

namespace App\Http\Controllers;

use App\Models\TransportRoute;
use App\Models\GuardianFeePreference;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TransportRouteController extends Controller
{
    /**
     * Display a listing of transport routes
     */
    public function index(Request $request)
    {
        $query = TransportRoute::query();

        // Apply search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('route_name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Apply status filter
        if ($request->filled('status')) {
            $isActive = $request->status === 'active';
            $query->where('is_active', $isActive);
        }

        // Get routes with student count
        $routes = $query->orderBy('route_name')->get()->map(function ($route) {
            return [
                'id' => $route->id,
                'route_name' => $route->route_name,
                'amount_two_way' => $route->amount_two_way,
                'amount_one_way' => $route->amount_one_way,
                'description' => $route->description,
                'is_active' => $route->is_active,
                'students_count' => GuardianFeePreference::where('transport_route_id', $route->id)->count(),
                'created_at' => $route->created_at,
                'updated_at' => $route->updated_at,
            ];
        });

        return Inertia::render('Fees/TransportRoutes/Index', [
            'routes' => $routes,
            'filters' => [
                'search' => $request->search ?? '',
                'status' => $request->status ?? '',
            ],
        ]);
    }

    /**
     * Store a newly created transport route
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'route_name' => 'required|string|max:255',
            'amount_two_way' => 'required|numeric|min:0',
            'amount_one_way' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        // Validate that two-way amount is greater than one-way
        if ($validated['amount_two_way'] <= $validated['amount_one_way']) {
            return redirect()->back()
                ->withErrors(['amount_two_way' => 'Two-way amount must be greater than one-way amount.'])
                ->withInput();
        }

        // Check for duplicate route name
        $exists = TransportRoute::where('route_name', $validated['route_name'])->exists();
        if ($exists) {
            return redirect()->back()
                ->withErrors(['route_name' => 'A transport route with this name already exists.'])
                ->withInput();
        }

        $validated['school_id'] = auth()->user()->school_id;
        $validated['is_active'] = $validated['is_active'] ?? true;

        TransportRoute::create($validated);

        return redirect()->back()->with('success', 'Transport route created successfully.');
    }

    /**
     * Update the specified transport route
     */
    public function update(Request $request, TransportRoute $transportRoute)
    {
        $validated = $request->validate([
            'route_name' => 'required|string|max:255',
            'amount_two_way' => 'required|numeric|min:0',
            'amount_one_way' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        // Validate that two-way amount is greater than one-way
        if ($validated['amount_two_way'] <= $validated['amount_one_way']) {
            return redirect()->back()
                ->withErrors(['amount_two_way' => 'Two-way amount must be greater than one-way amount.'])
                ->withInput();
        }

        // Check for duplicate route name (excluding current route)
        $exists = TransportRoute::where('route_name', $validated['route_name'])
            ->where('id', '!=', $transportRoute->id)
            ->exists();
        if ($exists) {
            return redirect()->back()
                ->withErrors(['route_name' => 'A transport route with this name already exists.'])
                ->withInput();
        }

        $transportRoute->update($validated);

        return redirect()->back()->with('success', 'Transport route updated successfully.');
    }

    /**
     * Remove the specified transport route
     */
    public function destroy(TransportRoute $transportRoute)
    {
        // Check if route is being used by any preferences
        $usageCount = GuardianFeePreference::where('transport_route_id', $transportRoute->id)->count();

        if ($usageCount > 0) {
            return redirect()->back()
                ->withErrors(['error' => "Cannot delete this route. It is currently used by {$usageCount} student(s). Please deactivate it instead."]);
        }

        $transportRoute->delete();

        return redirect()->back()->with('success', 'Transport route deleted successfully.');
    }

    /**
     * Toggle the active status of a transport route
     */
    public function toggleStatus(TransportRoute $transportRoute)
    {
        $transportRoute->update([
            'is_active' => !$transportRoute->is_active,
        ]);

        $status = $transportRoute->is_active ? 'activated' : 'deactivated';
        return redirect()->back()->with('success', "Transport route {$status} successfully.");
    }
}

