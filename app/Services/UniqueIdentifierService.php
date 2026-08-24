<?php

namespace App\Services;

use App\Models\Student;
use App\Models\Guardian;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class UniqueIdentifierService
{
    /**
     * Generate unique admission number for student
     * Format: STU-YY-XXX (e.g., STU-25-001)
     */
    public static function generateAdmissionNumber(int $schoolId): string
    {
        return self::generateIdentifier(
            model: Student::class,
            field: 'admission_number',
            prefix: 'STU',
            schoolId: $schoolId,
            padding: 3
        );
    }

    /**
     * Generate unique guardian number
     * Format: PAR-YY-XXX (e.g., PAR-25-066)
     */
    public static function generateGuardianNumber(int $schoolId): string
    {
        return self::generateIdentifier(
            model: Guardian::class,
            field: 'guardian_number',
            prefix: 'PAR',
            schoolId: $schoolId,
            padding: 3
        );
    }

    /**
     * Generate unique employee number for teacher/staff
     * Format: EMP-YY-XXX (e.g., EMP-25-077)
     */
    public static function generateEmployeeNumber(int $schoolId): string
    {
        return self::generateIdentifier(
            model: Teacher::class,
            field: 'employee_number',
            prefix: 'EMP',
            schoolId: $schoolId,
            padding: 3
        );
    }

    /**
     * Generate unique employee number for admin users
     * Format: EMP-YY-XXX (e.g., EMP-25-001)
     * Uses the same sequence as teachers to ensure uniqueness across all employees
     */
    public static function generateAdminEmployeeNumber(int $schoolId): string
    {
        // Get current year (last 2 digits)
        $year = date('y');
        $prefix = 'EMP';

        // Get the highest counter from both tables. Deliberately not using
        // SQL string functions here (the previous ORDER BY relied on
        // MySQL-only SUBSTRING_INDEX, which SQLite doesn't have) — pluck
        // the small, school+year-scoped set of matching identifiers and
        // find the max counter in PHP instead, portable across drivers.
        $teacherCounter = self::highestCounter(
            Teacher::where('school_id', $schoolId)
                ->where('employee_number', 'LIKE', "{$prefix}-{$year}-%")
                ->pluck('employee_number')
        );

        $adminCounter = self::highestCounter(
            User::where('school_id', $schoolId)
                ->where('role', 'admin')
                ->where('employee_number', 'LIKE', "{$prefix}-{$year}-%")
                ->pluck('employee_number')
        );

        // Use the highest counter + 1
        $nextCounter = max($teacherCounter, $adminCounter) + 1;

        // Format: EMP-YY-COUNTER
        return sprintf(
            '%s-%s-%s',
            $prefix,
            $year,
            str_pad($nextCounter, 3, '0', STR_PAD_LEFT)
        );
    }

    /**
     * Core method to generate unique identifier
     */
    private static function generateIdentifier(
        string $model,
        string $field,
        string $prefix,
        int $schoolId,
        int $padding = 3
    ): string {
        // Get current year (last 2 digits)
        $year = date('y');

        // Get the highest counter for this year and school. Deliberately
        // not using SQL string functions here (the previous ORDER BY
        // relied on MySQL-only SUBSTRING_INDEX, which SQLite doesn't
        // have) — pluck the small, school+year-scoped set of matching
        // identifiers and find the max counter in PHP instead, portable
        // across drivers.
        $counter = self::highestCounter(
            $model::where('school_id', $schoolId)
                ->where($field, 'LIKE', "{$prefix}-{$year}-%")
                ->pluck($field)
        );

        $nextCounter = $counter + 1;

        // Format: PREFIX-YY-COUNTER
        return sprintf(
            '%s-%s-%s',
            $prefix,
            $year,
            str_pad($nextCounter, $padding, '0', STR_PAD_LEFT)
        );
    }

    /**
     * Given a collection of identifiers in PREFIX-YY-COUNTER format,
     * return the highest COUNTER value found (0 if the collection is
     * empty or no identifier has a valid counter segment).
     */
    private static function highestCounter($identifiers): int
    {
        return $identifiers->reduce(function (int $carry, string $identifier) {
            $parts = explode('-', $identifier);
            $counter = isset($parts[2]) ? (int) $parts[2] : 0;

            return max($carry, $counter);
        }, 0);
    }

    /**
     * Validate if identifier is unique within school
     */
    public static function isUnique(
        string $model,
        string $field,
        string $value,
        int $schoolId,
        ?int $excludeId = null
    ): bool {
        $query = $model::where('school_id', $schoolId)
            ->where($field, $value);

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return !$query->exists();
    }
}

