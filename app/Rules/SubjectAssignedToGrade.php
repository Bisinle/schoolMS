<?php

namespace App\Rules;

use App\Models\Grade;
use App\Models\Subject;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validation rule to ensure a subject is assigned to a grade
 *
 * This enforces curriculum integrity by preventing timetable slots
 * from being created with subjects that aren't part of the grade's curriculum.
 *
 * Usage:
 * 'subject_id' => ['required', new SubjectAssignedToGrade($gradeId)]
 */
class SubjectAssignedToGrade implements ValidationRule
{
    protected $gradeId;

    /**
     * Create a new rule instance.
     *
     * @param int $gradeId The ID of the grade to validate against
     */
    public function __construct($gradeId)
    {
        $this->gradeId = $gradeId;
    }

    /**
     * Run the validation rule.
     *
     * @param  string  $attribute
     * @param  mixed  $value
     * @param  \Closure(string): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     * @return void
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // Find the grade
        $grade = Grade::find($this->gradeId);

        if (!$grade) {
            $fail('Grade not found.');
            return;
        }

        // Check if subject is assigned to this grade
        if (!$grade->isSubjectAllowed($value)) {
            $subject = Subject::find($value);
            $subjectName = $subject ? $subject->name : 'Unknown';
            $fail("Subject '{$subjectName}' is not assigned to grade '{$grade->name}'. Please assign it in the Grade management section first.");
        }
    }
}

