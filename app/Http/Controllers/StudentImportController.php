<?php

namespace App\Http\Controllers;

use App\Exports\StudentTemplateExport;
use App\Imports\StudentImport;
use App\Models\Grade;
use App\Models\Guardian;
use App\Models\Student;
use App\Services\UniqueIdentifierService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

class StudentImportController extends Controller
{
    private array $validRelationships = ['father', 'mother', 'uncle', 'aunt', 'guardian', 'other'];

    /**
     * Normalise a raw cell value into a Y-m-d date string.
     * Excel stores date cells as numeric serials; string cells may use various formats.
     * Returns null when the value is blank or unparseable.
     */
    private function parseDate(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        // Numeric = Excel date serial (e.g. 44927 → 2023-01-01)
        if (is_numeric($value)) {
            try {
                return Carbon::instance(ExcelDate::excelToDateTimeObject((float) $value))->format('Y-m-d');
            } catch (\Throwable) {
                return null;
            }
        }

        // String — try Carbon parsing with common formats
        try {
            return Carbon::parse((string) $value)->format('Y-m-d');
        } catch (\Throwable) {
            return null;
        }
    }

    public function downloadTemplate()
    {
        return Excel::download(new StudentTemplateExport(), 'students_import_template.xlsx');
    }

    /**
     * Parse the uploaded file and return a preview of each row — no data is saved.
     */
    public function preview(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls|max:5120',
        ]);

        $import = new StudentImport();
        Excel::import($import, $request->file('file'));

        $rows = $this->parseRows($import->rows, auth()->user()->school_id, save: false);

        return response()->json(['rows' => $rows]);
    }

    /**
     * Re-process the file and save all rows that pass validation.
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls|max:5120',
        ]);

        $import = new StudentImport();
        Excel::import($import, $request->file('file'));

        $rows     = $this->parseRows($import->rows, auth()->user()->school_id, save: true);
        $imported = collect($rows)->where('status', 'ready')->count();
        $skipped  = collect($rows)->where('status', 'duplicate')->count();
        $failed   = collect($rows)->whereIn('status', ['failed', 'error'])->count();
        $errors   = collect($rows)->whereIn('status', ['duplicate', 'failed', 'error'])
            ->map(fn($r) => ['row' => $r['row'], 'name' => $r['name'], 'reason' => $r['reason']])
            ->values()
            ->all();

        return redirect()->route('students.index')
            ->with('importResults', compact('imported', 'skipped', 'failed', 'errors'));
    }

    /**
     * Shared row-parsing logic used by both preview() and import().
     * When $save=true, creates the Student record and syncs the guardian pivot.
     */
    private function parseRows(iterable $rawRows, int $schoolId, bool $save): array
    {
        $rows           = [];
        $gradesCache    = [];
        $guardiansCache = [];

        foreach ($rawRows as $index => $row) {
            // Skip the hints row (row 2 in the file)
            if ($index === 0) {
                $firstVal = strtolower(trim($row['first_name'] ?? ''));
                if (in_array($firstVal, ['required', 'optional', ''])) {
                    continue;
                }
            }

            $rowNumber      = $index + 2;
            $firstName      = trim($row['first_name'] ?? '');
            $lastName       = trim($row['last_name'] ?? '');
            $gender         = strtolower(trim($row['gender'] ?? ''));
            $gradeName      = trim($row['grade'] ?? '');
            $guardianPhone  = trim($row['guardian_phone'] ?? '');
            $dateOfBirth    = $this->parseDate($row['date_of_birth'] ?? null);
            $relationship   = strtolower(trim($row['relationship'] ?? '')) ?: 'guardian';
            $enrollmentDate = $this->parseDate($row['enrollment_date'] ?? null) ?? now()->toDateString();
            $status         = strtolower(trim($row['status'] ?? '')) ?: 'active';

            if (!$firstName && !$lastName && !$guardianPhone) {
                continue;
            }

            $base = [
                'row'            => $rowNumber,
                'name'           => trim("{$firstName} {$lastName}") ?: "Row {$rowNumber}",
                'grade'          => $gradeName,
                'guardian_phone' => $guardianPhone,
                'gender'         => $gender,
                'date_of_birth'  => $dateOfBirth,
                'guardian_name'  => null,
                'reason'         => null,
            ];

            // Field validation
            $validator = Validator::make([
                'first_name'     => $firstName,
                'last_name'      => $lastName,
                'gender'         => $gender,
                'grade'          => $gradeName,
                'guardian_phone' => $guardianPhone,
                'date_of_birth'  => $dateOfBirth,
                'status'         => $status,
            ], [
                'first_name'     => 'required|string|max:255',
                'last_name'      => 'required|string|max:255',
                'gender'         => 'required|in:male,female',
                'grade'          => 'required|string|max:255',
                'guardian_phone' => 'required|string|max:20',
                'date_of_birth'  => 'nullable|date|before:today',
                'status'         => 'nullable|in:active,inactive',
            ]);

            if ($validator->fails()) {
                $rows[] = array_merge($base, ['status' => 'failed', 'reason' => implode(', ', $validator->errors()->all())]);
                continue;
            }

            // Grade lookup
            if (!isset($gradesCache[$gradeName])) {
                $gradesCache[$gradeName] = Grade::where('school_id', $schoolId)->where('name', $gradeName)->first();
            }
            $grade = $gradesCache[$gradeName];

            if (!$grade) {
                $rows[] = array_merge($base, ['status' => 'failed', 'reason' => "Grade \"{$gradeName}\" not found — use the exact name from the system"]);
                continue;
            }

            // Guardian lookup
            if (!isset($guardiansCache[$guardianPhone])) {
                $guardiansCache[$guardianPhone] = Guardian::where('phone_number', $guardianPhone)->where('school_id', $schoolId)->first();
            }
            $guardian = $guardiansCache[$guardianPhone];

            if (!$guardian) {
                $rows[] = array_merge($base, ['status' => 'failed', 'reason' => "Guardian with phone \"{$guardianPhone}\" not found — import the guardian first"]);
                continue;
            }

            $base['guardian_name'] = $guardian->user->name ?? $guardianPhone;

            // Duplicate check
            $dupQuery = Student::where('school_id', $schoolId)->where('first_name', $firstName)->where('last_name', $lastName);
            if ($dateOfBirth) {
                $dupQuery->where('date_of_birth', $dateOfBirth);
            }

            if ($dupQuery->exists()) {
                $rows[] = array_merge($base, [
                    'status' => 'duplicate',
                    'reason' => 'Already exists (matched on name' . ($dateOfBirth ? ' + DOB' : '') . ')',
                ]);
                continue;
            }

            // All checks passed — save if requested
            if ($save) {
                try {
                    $student = Student::create([
                        'school_id'        => $schoolId,
                        'admission_number' => UniqueIdentifierService::generateAdmissionNumber($schoolId),
                        'first_name'       => $firstName,
                        'last_name'        => $lastName,
                        'gender'           => $gender,
                        'grade_id'         => $grade->id,
                        'guardian_id'      => $guardian->id,
                        'date_of_birth'    => $dateOfBirth,
                        'enrollment_date'  => $enrollmentDate,
                        'status'           => $status,
                    ]);

                    $student->guardians()->sync([
                        $guardian->id => [
                            'relationship'         => in_array($relationship, $this->validRelationships) ? $relationship : 'guardian',
                            'is_primary'           => true,
                            'can_receive_invoices' => true,
                            'can_pickup'           => true,
                            'emergency_contact'    => false,
                        ],
                    ]);
                } catch (\Exception $e) {
                    $rows[] = array_merge($base, ['status' => 'error', 'reason' => 'Database error: ' . $e->getMessage()]);
                    continue;
                }
            }

            $rows[] = array_merge($base, ['status' => 'ready', 'reason' => null]);
        }

        return $rows;
    }
}

