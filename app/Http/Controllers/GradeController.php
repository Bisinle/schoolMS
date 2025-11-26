<?php

namespace App\Http\Controllers;

use App\Models\Grade;
use App\Models\Teacher;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class GradeController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $this->authorize('viewAny', Grade::class);

        $user = $request->user();

        // Build query
        $query = $user->isTeacher()
            ? $user->teacher->grades()
            : Grade::query();

        // Apply archived filter (default: show only active/non-deleted)
        if ($request->show_archived === 'true') {
            $query->withTrashed();
        } elseif ($request->show_archived === 'only') {
            $query->onlyTrashed();
        }
        // else: default behavior (only non-deleted grades)

        // Apply search filter
        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('code', 'like', "%{$request->search}%");
            });
        }

        // Apply level filter
        if ($request->level) {
            $query->where('level', $request->level);
        }

        $grades = $query->withCount('students', 'subjects', 'exams')
            ->orderBy('level')
            ->orderBy('name')
            ->get();

        return Inertia::render('Grades/Index', [
            'grades' => $grades,
            'filters' => $request->only(['search', 'level', 'show_archived']),
            'filters' => $request->only(['search', 'level']),
        ]);
    }

    public function create()
    {
        $this->authorize('create', Grade::class);
        
        $subjects = Subject::where('status', 'active')
            ->orderBy('category')
            ->orderBy('name')
            ->get();

        $teachers = Teacher::with('user')
            ->whereHas('user', function ($query) {
                $query->where('role', 'teacher');
            })
            ->get()
            ->map(function ($teacher) {
                return [
                    'id' => $teacher->id,
                    'name' => $teacher->user->name,
                    'employee_number' => $teacher->employee_number,
                ];
            });

        return Inertia::render('Grades/Create', [
            'subjects' => $subjects,
            'teachers' => $teachers,
            'levels' => Grade::LEVELS,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Grade::class);

        // Get school type from authenticated user's school
        $school = $request->user()->school;
        $isMadrasah = $school && $school->school_type === 'madrasah';
        $schoolId = $request->user()->school_id;

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('grades', 'name')->where('school_id', $schoolId),
            ],
            'code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('grades', 'code')->where('school_id', $schoolId),
            ],
            'level' => $isMadrasah ? 'nullable|in:ECD,LOWER PRIMARY,UPPER PRIMARY,JUNIOR SECONDARY' : 'required|in:ECD,LOWER PRIMARY,UPPER PRIMARY,JUNIOR SECONDARY',
            'status' => 'required|in:active,inactive',
            'subject_ids' => 'nullable|array',
            'subject_ids.*' => 'exists:subjects,id',
            'teacher_ids' => 'nullable|array',
            'teacher_ids.*' => 'exists:teachers,id',
            'class_teacher_id' => 'nullable|exists:teachers,id',
        ]);

        $grade = Grade::create([
            'name' => $validated['name'],
            'code' => $validated['code'] ?? null,
            'level' => $validated['level'] ?? null,
            'status' => $validated['status'],
        ]);

        // Attach subjects if provided
        if (isset($validated['subject_ids']) && count($validated['subject_ids']) > 0) {
            $grade->subjects()->attach($validated['subject_ids']);
        }

        // Attach teachers if provided
        if (isset($validated['teacher_ids']) && count($validated['teacher_ids']) > 0) {
            $teacherData = [];
            foreach ($validated['teacher_ids'] as $teacherId) {
                $teacherData[$teacherId] = [
                    'is_class_teacher' => isset($validated['class_teacher_id']) && $validated['class_teacher_id'] == $teacherId
                ];
            }
            $grade->teachers()->attach($teacherData);
        }

        return redirect()->route('grades.index')
            ->with('success', 'Grade created successfully.');
    }

    public function show(Grade $grade)
    {
        $this->authorize('view', $grade);

        $grade->load([
            'students' => function ($query) {
                $query->where('status', 'active')
                    ->orderBy('first_name')
                    ->orderBy('last_name');
            },
            'teachers.user',
            'subjects' => function ($query) {
                $query->orderBy('category')
                    ->orderBy('name');
            }
        ]);

        $availableTeachers = Teacher::whereDoesntHave('grades', function ($query) use ($grade) {
            $query->where('grades.id', $grade->id);
        })->with('user')->get();

        return Inertia::render('Grades/Show', [
            'grade' => $grade,
            'availableTeachers' => $availableTeachers,
        ]);
    }

    public function edit(Grade $grade)
    {
        $this->authorize('update', $grade);

        $subjects = Subject::where('status', 'active')
            ->orderBy('category')
            ->orderBy('name')
            ->get();
        
        $teachers = Teacher::with('user')
            ->whereHas('user', function ($query) {
                $query->where('role', 'teacher');
            })
            ->get()
            ->map(function ($teacher) {
                return [
                    'id' => $teacher->id,
                    'name' => $teacher->user->name,
                    'employee_number' => $teacher->employee_number,
                ];
            });

        $grade->load(['subjects', 'teachers']);

        // Get class teacher ID
        $classTeacher = $grade->teachers()->wherePivot('is_class_teacher', true)->first();

        return Inertia::render('Grades/Edit', [
            'grade' => $grade,
            'subjects' => $subjects,
            'teachers' => $teachers,
            'levels' => Grade::LEVELS,
            'classTeacherId' => $classTeacher ? $classTeacher->id : null,
        ]);
    }

    public function update(Request $request, Grade $grade)
    {
        $this->authorize('update', $grade);

        // Get school type from authenticated user's school
        $school = $request->user()->school;
        $isMadrasah = $school && $school->school_type === 'madrasah';

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('grades', 'name')
                    ->ignore($grade->id)
                    ->where('school_id', $grade->school_id),
            ],
            'code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('grades', 'code')
                    ->ignore($grade->id)
                    ->where('school_id', $grade->school_id),
            ],
            'level' => $isMadrasah ? 'nullable|in:ECD,LOWER PRIMARY,UPPER PRIMARY,JUNIOR SECONDARY' : 'required|in:ECD,LOWER PRIMARY,UPPER PRIMARY,JUNIOR SECONDARY',
            'status' => 'required|in:active,inactive',
            'subject_ids' => 'nullable|array',
            'subject_ids.*' => 'exists:subjects,id',
            'teacher_ids' => 'nullable|array',
            'teacher_ids.*' => 'exists:teachers,id',
            'class_teacher_id' => 'nullable|exists:teachers,id',
        ]);

        $grade->update([
            'name' => $validated['name'],
            'code' => $validated['code'] ?? null,
            'level' => $validated['level'] ?? null,
            'status' => $validated['status'],
        ]);

        // Sync subjects
        if (isset($validated['subject_ids'])) {
            $grade->subjects()->sync($validated['subject_ids']);
        } else {
            $grade->subjects()->detach();
        }

        // Sync teachers
        if (isset($validated['teacher_ids']) && count($validated['teacher_ids']) > 0) {
            $teacherData = [];
            foreach ($validated['teacher_ids'] as $teacherId) {
                $teacherData[$teacherId] = [
                    'is_class_teacher' => isset($validated['class_teacher_id']) && $validated['class_teacher_id'] == $teacherId
                ];
            }
            $grade->teachers()->sync($teacherData);
        } else {
            $grade->teachers()->detach();
        }

        return redirect()->route('grades.index')
            ->with('success', 'Grade updated successfully.');
    }

    public function destroy(Grade $grade)
    {
        $this->authorize('delete', $grade);

        try {
            // Prevent deletion of "Unassigned" grade
            if ($grade->code === 'UNASSIGNED') {
                return back()->withErrors([
                    'error' => "The 'Unassigned' grade cannot be deleted as it is a system grade."
                ]);
            }

            DB::beginTransaction();

            // Check if grade has students
            $studentCount = $grade->students()->count();

            // Check if grade has exams
            $examCount = $grade->exams()->count();

            // Check if grade has attendance records
            $attendanceCount = DB::table('attendances')->where('grade_id', $grade->id)->count();

            // If grade has NO students, exams, or attendance - allow hard delete
            if ($studentCount === 0 && $examCount === 0 && $attendanceCount === 0) {
                // Detach all many-to-many relationships
                $grade->teachers()->detach();
                $grade->subjects()->detach();

                // Force delete (permanent deletion)
                $grade->forceDelete();

                DB::commit();

                return redirect()->route('grades.index')
                    ->with('success', "Grade '{$grade->name}' deleted permanently.");
            }

            // If grade has students, reassign them to "Unassigned" grade
            if ($studentCount > 0) {
                // Find or create "Unassigned" grade for this school
                $unassignedGrade = Grade::firstOrCreate(
                    [
                        'school_id' => $grade->school_id,
                        'code' => 'UNASSIGNED',
                    ],
                    [
                        'name' => 'Unassigned',
                        'level' => null,
                        'capacity' => 9999,
                        'description' => 'System grade for students without assigned grade',
                        'status' => 'active',
                    ]
                );

                // Reassign all students to "Unassigned" grade
                $grade->students()->update([
                    'grade_id' => $unassignedGrade->id,
                    'class_name' => $unassignedGrade->name,
                ]);

                Log::info("Reassigned {$studentCount} students from grade '{$grade->name}' to 'Unassigned'", [
                    'grade_id' => $grade->id,
                    'unassigned_grade_id' => $unassignedGrade->id,
                    'student_count' => $studentCount,
                ]);
            }

            // Detach all many-to-many relationships (these are safe to detach)
            $grade->teachers()->detach();
            $grade->subjects()->detach();

            // Set status to inactive before archiving
            $grade->status = 'inactive';
            $grade->save();

            // Soft delete the grade (preserves historical data)
            $grade->delete();

            DB::commit();

            $message = "Grade '{$grade->name}' archived successfully.";
            if ($studentCount > 0) {
                $message .= " {$studentCount} student(s) were moved to 'Unassigned' grade.";
            }
            if ($examCount > 0 || $attendanceCount > 0) {
                $message .= " Historical exam and attendance records have been preserved.";
            }

            return redirect()->route('grades.index')
                ->with('success', $message);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Grade deletion failed', [
                'grade_id' => $grade->id,
                'grade_name' => $grade->name,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return back()->withErrors([
                'error' => "Failed to delete/archive grade '{$grade->name}'. Error: " . $e->getMessage()
            ]);
        }
    }

    /**
     * Restore (unarchive) a soft-deleted grade.
     */
    public function restore($id)
    {
        // Find the grade including soft-deleted ones
        $grade = Grade::withTrashed()->findOrFail($id);

        $this->authorize('delete', $grade); // Same permission as delete

        try {
            // Restore the grade (unarchive)
            $grade->restore();

            // Set status to active
            $grade->update(['status' => 'active']);

            Log::info("Grade '{$grade->name}' unarchived successfully", [
                'grade_id' => $grade->id,
                'grade_name' => $grade->name,
            ]);

            return redirect()->route('grades.index')
                ->with('success', "Grade '{$grade->name}' has been unarchived and set to active status.");

        } catch (\Exception $e) {
            Log::error('Grade restore failed', [
                'grade_id' => $grade->id,
                'grade_name' => $grade->name,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return back()->withErrors([
                'error' => "Failed to unarchive grade '{$grade->name}'. Error: " . $e->getMessage()
            ]);
        }
    }

    // Teacher Assignment Methods
    public function assignTeacher(Request $request, Grade $grade)
    {
        $this->authorize('update', $grade);

        $validated = $request->validate([
            'teacher_id' => 'required|exists:teachers,id',
            'is_class_teacher' => 'required|boolean',
        ]);

        // Check if teacher is already assigned
        if ($grade->teachers()->where('teacher_id', $validated['teacher_id'])->exists()) {
            return back()->withErrors([
                'teacher_id' => 'This teacher is already assigned to this grade.'
            ]);
        }

        // If marking as class teacher, remove class teacher status from others in this grade
        if ($validated['is_class_teacher']) {
            $grade->teachers()->updateExistingPivot(
                $grade->teachers()->pluck('teachers.id')->toArray(),
                ['is_class_teacher' => false]
            );
        }

        $grade->teachers()->attach($validated['teacher_id'], [
            'is_class_teacher' => $validated['is_class_teacher'],
        ]);

        return back()->with('success', 'Teacher assigned successfully.');
    }

    public function removeTeacher(Grade $grade, Teacher $teacher)
    {
        $this->authorize('update', $grade);

        $grade->teachers()->detach($teacher->id);

        return back()->with('success', 'Teacher removed successfully.');
    }

    public function updateTeacherAssignment(Request $request, Grade $grade, Teacher $teacher)
    {
        $this->authorize('update', $grade);

        $validated = $request->validate([
            'is_class_teacher' => 'required|boolean',
        ]);

        // If marking as class teacher, remove class teacher status from others in this grade
        if ($validated['is_class_teacher']) {
            $grade->teachers()->updateExistingPivot(
                $grade->teachers()->where('teachers.id', '!=', $teacher->id)->pluck('teachers.id')->toArray(),
                ['is_class_teacher' => false]
            );
        }

        $grade->teachers()->updateExistingPivot($teacher->id, [
            'is_class_teacher' => $validated['is_class_teacher'],
        ]);

        return back()->with('success', 'Teacher assignment updated successfully.');
    }
}