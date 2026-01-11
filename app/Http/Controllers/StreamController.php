<?php

namespace App\Http\Controllers;

use App\Models\Stream;
use App\Models\Grade;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class StreamController extends Controller
{
    public function index()
    {
        $schoolId = auth()->user()->school_id;

        $streams = Stream::where('school_id', $schoolId)
            ->with('grade')
            ->withCount('students')
            ->orderBy('name')
            ->get();

        return Inertia::render('Settings/Streams/Index', [
            'streams' => $streams,
        ]);
    }

    public function create()
    {
        return Inertia::render('Settings/Streams/Create');
    }

    public function store(Request $request)
    {
        $schoolId = auth()->user()->school_id;

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('streams', 'name')->where('school_id', $schoolId),
            ],
            'code' => 'nullable|string|max:10',
            'status' => 'required|in:active,inactive',
        ]);

        $validated['school_id'] = $schoolId;

        Stream::create($validated);

        return redirect()->route('streams.index')
            ->with('success', 'Stream created successfully.');
    }

    public function show(Stream $stream)
    {
        $this->authorize('view', $stream);

        $stream->load(['grade', 'students', 'teachers', 'subjects', 'room']);

        return Inertia::render('Settings/Streams/Show', [
            'stream' => $stream,
        ]);
    }

    public function edit(Stream $stream)
    {
        $this->authorize('update', $stream);

        return Inertia::render('Settings/Streams/Edit', [
            'stream' => $stream,
        ]);
    }

    public function update(Request $request, Stream $stream)
    {
        $this->authorize('update', $stream);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('streams', 'name')
                    ->where('school_id', $stream->school_id)
                    ->ignore($stream->id),
            ],
            'code' => 'nullable|string|max:10',
            'status' => 'required|in:active,inactive',
        ]);

        $stream->update($validated);

        return redirect()->route('streams.index')
            ->with('success', 'Stream updated successfully.');
    }

    public function destroy(Stream $stream)
    {
        $this->authorize('delete', $stream);

        $gradesCount = $stream->grades()->count();

        if ($gradesCount > 0) {
            return back()->withErrors([
                'stream' => "Cannot delete this stream. {$gradesCount} grade(s) are currently using it. Please unlink all grades first."
            ]);
        }

        $stream->delete();

        return redirect()->route('streams.index')
            ->with('success', 'Stream deleted successfully.');
    }

    public function unlink(Stream $stream)
    {
        $this->authorize('update', $stream);

        $gradesCount = $stream->grades()->count();

        $stream->grades()->update(['stream_id' => null]);

        return redirect()->route('streams.index')
            ->with('success', "Stream unlinked from {$gradesCount} grade(s) successfully.");
    }
}
