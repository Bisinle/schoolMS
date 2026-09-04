<?php

namespace App\Rules;

use App\Models\Grade;
use App\Models\Teacher;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validation rule to ensure a teacher is assigned to a grade
 *
 * This enforces assignment integrity by preventing timetable slots
 * from being created with teachers who aren't assigned to teach the grade.
 *
 * Usage:
 * 'teacher_id' => ['required', new TeacherAssignedToGrade($gradeId)]
 */
class TeacherAssignedToGrade implements ValidationRule
{
    protected $gradeId;

    /**
     * Create a new rule instance.
     *
     * @param  int  $gradeId  The ID of the grade to validate against
     */
    public function __construct($gradeId)
    {
        $this->gradeId = $gradeId;
    }

    /**
     * Run the validation rule.
     *
     * @param  \Closure(string): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // Find the grade
        $grade = Grade::find($this->gradeId);

        if (! $grade) {
            $fail('Grade not found.');

            return;
        }

        // Check if teacher is assigned to this grade
        if (! $grade->isTeacherAllowed($value)) {
            $teacher = Teacher::with('user')->find($value);
            $teacherName = $teacher->user->name ?? 'Unknown';
            $fail("Teacher '{$teacherName}' is not assigned to grade '{$grade->name}'. Please assign them in the Grade management section first.");
        }
    }
}
