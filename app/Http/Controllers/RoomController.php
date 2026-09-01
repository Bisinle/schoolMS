<?php

namespace App\Http\Controllers;

use App\Models\Room;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;

class RoomController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display a listing of rooms.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Room::class);

        $rooms = Room::query()
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('code', 'like', "%{$search}%");
                });
            })
            ->when($request->room_type, function ($query, $type) {
                $query->where('room_type', $type);
            })
            ->when($request->is_active !== null, function ($query) use ($request) {
                $query->where('is_active', $request->is_active);
            })
            ->orderBy('code')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Timetables/Rooms/Index', [
            'rooms' => $rooms,
            'filters' => $request->only(['search', 'room_type', 'is_active']),
            'roomTypes' => [
                'classroom', 'laboratory', 'library', 'computer_lab',
                'art_room', 'music_room', 'gym', 'auditorium',
                'cafeteria', 'office', 'other'
            ],
        ]);
    }

    /**
     * Show the form for creating a new room.
     */
    public function create()
    {
        $this->authorize('create', Room::class);

        return Inertia::render('Timetables/Rooms/Create', [
            'roomTypes' => [
                'classroom', 'laboratory', 'library', 'computer_lab',
                'art_room', 'music_room', 'gym', 'auditorium',
                'cafeteria', 'office', 'other'
            ],
        ]);
    }

    /**
     * Store a newly created room.
     */
    public function store(Request $request)
    {
        $this->authorize('create', Room::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50',
            'room_type' => 'required|in:classroom,laboratory,library,computer_lab,art_room,music_room,gym,auditorium,cafeteria,office,other',
            'capacity' => 'required|integer|min:1',
            'floor' => 'nullable|string|max:50',
            'building' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'facilities' => 'nullable|array',
        ]);

        $validated['school_id'] = auth()->user()->school_id;
        $validated['is_active'] = true;

        $room = Room::create($validated);

        return redirect()->route('timetables.rooms.index')
            ->with('success', 'Room created successfully.');
    }

    /**
     * Display the specified room.
     */
    public function show(Room $room)
    {
        $this->authorize('view', $room);

        $room->load(['slots.subject', 'slots.teacher', 'slots.grade', 'slots.period']);

        return Inertia::render('Timetables/Rooms/Show', [
            'room' => $room,
        ]);
    }

    /**
     * Show the form for editing the specified room.
     */
    public function edit(Room $room)
    {
        $this->authorize('update', $room);

        return Inertia::render('Timetables/Rooms/Edit', [
            'room' => $room,
            'roomTypes' => [
                'classroom', 'laboratory', 'library', 'computer_lab',
                'art_room', 'music_room', 'gym', 'auditorium',
                'cafeteria', 'office', 'other'
            ],
        ]);
    }

    /**
     * Update the specified room.
     */
    public function update(Request $request, Room $room)
    {
        $this->authorize('update', $room);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50',
            'room_type' => 'required|in:classroom,laboratory,library,computer_lab,art_room,music_room,gym,auditorium,cafeteria,office,other',
            'capacity' => 'required|integer|min:1',
            'floor' => 'nullable|string|max:50',
            'building' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'facilities' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        $room->update($validated);

        return redirect()->route('timetables.rooms.index')
            ->with('success', 'Room updated successfully.');
    }

    /**
     * Remove the specified room.
     */
    public function destroy(Room $room)
    {
        // Check if user is admin/head_teacher first
        if (!auth()->user()->isAdmin() && !auth()->user()->isHeadTeacher()) {
            abort(403, 'Only administrators can delete rooms.');
        }

        // Check if room is used in any timetable slots
        if ($room->slots()->exists()) {
            return back()->withErrors([
                'error' => 'Cannot delete this room because it is being used in timetable slots. Please remove it from all timetables first.'
            ]);
        }

        $room->delete();

        return redirect()->route('timetables.rooms.index')
            ->with('success', 'Room deleted successfully.');
    }
}
