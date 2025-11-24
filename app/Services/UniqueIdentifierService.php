<?php

namespace App\Services;

use App\Models\Student;
use App\Models\Guardian;
use App\Models\Teacher;
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
        
        // Get the latest number for this year and school
        $latestRecord = $model::where('school_id', $schoolId)
            ->where($field, 'LIKE', "{$prefix}-{$year}-%")
            ->orderByRaw("CAST(SUBSTRING_INDEX({$field}, '-', -1) AS UNSIGNED) DESC")
            ->first();

        if ($latestRecord) {
            // Extract the counter from the latest record
            $parts = explode('-', $latestRecord->$field);
            $counter = isset($parts[2]) ? (int)$parts[2] : 0;
            $nextCounter = $counter + 1;
        } else {
            // First record for this year
            $nextCounter = 1;
        }

        // Format: PREFIX-YY-COUNTER
        return sprintf(
            '%s-%s-%s',
            $prefix,
            $year,
            str_pad($nextCounter, $padding, '0', STR_PAD_LEFT)
        );
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

