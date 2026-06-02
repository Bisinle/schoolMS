<?php

namespace App\Http\Controllers;

use App\Exports\GuardianTemplateExport;
use App\Imports\GuardianImport;
use App\Models\Guardian;
use App\Models\User;
use App\Services\UniqueIdentifierService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;

class GuardianImportController extends Controller
{
    public function downloadTemplate()
    {
        return Excel::download(new GuardianTemplateExport(), 'guardians_import_template.xlsx');
    }

    /**
     * Parse the uploaded file and return a preview of each row — no data is saved.
     */
    public function preview(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls|max:5120',
        ]);

        $import = new GuardianImport();
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

        $import = new GuardianImport();
        Excel::import($import, $request->file('file'));

        $rows     = $this->parseRows($import->rows, auth()->user()->school_id, save: true);
        $imported = collect($rows)->where('status', 'ready')->count();
        $skipped  = collect($rows)->where('status', 'duplicate')->count();
        $failed   = collect($rows)->whereIn('status', ['failed', 'error'])->count();
        $errors   = collect($rows)->whereIn('status', ['duplicate', 'failed', 'error'])
            ->map(fn($r) => ['row' => $r['row'], 'name' => $r['name'], 'reason' => $r['reason']])
            ->values()
            ->all();

        return redirect()->route('guardians.index')
            ->with('importResults', compact('imported', 'skipped', 'failed', 'errors'));
    }

    /**
     * Shared row-parsing logic used by both preview() and import().
     * When $save=true, creates the User and Guardian records.
     */
    private function parseRows(iterable $rawRows, int $schoolId, bool $save): array
    {
        $rows = [];

        foreach ($rawRows as $index => $row) {
            // Skip the hints row (row 2 in the file)
            if ($index === 0) {
                $firstVal = strtolower(trim($row['name'] ?? ''));
                if (in_array($firstVal, ['required', 'optional', ''])) {
                    continue;
                }
            }

            $rowNumber    = $index + 2;
            $name         = trim($row['name'] ?? '');
            $email        = strtolower(trim($row['email'] ?? ''));
            $phone        = trim($row['phone_number'] ?? '');
            $relationship = trim($row['relationship'] ?? '');
            $address      = trim($row['address'] ?? '') ?: null;
            $occupation   = trim($row['occupation'] ?? '') ?: null;

            if (!$name && !$email && !$phone) {
                continue;
            }

            $base = [
                'row'    => $rowNumber,
                'name'   => $name ?: "Row {$rowNumber}",
                'email'  => $email,
                'phone'  => $phone,
                'reason' => null,
            ];

            // Field validation
            $validator = Validator::make([
                'name'         => $name,
                'email'        => $email,
                'phone_number' => $phone,
                'relationship' => $relationship,
            ], [
                'name'         => 'required|string|max:255',
                'email'        => 'required|email|max:255',
                'phone_number' => 'required|string|max:20',
                'relationship' => 'required|string|max:255',
            ]);

            if ($validator->fails()) {
                $rows[] = array_merge($base, ['status' => 'failed', 'reason' => implode(', ', $validator->errors()->all())]);
                continue;
            }

            // Duplicate check — email unique within school
            $exists = User::where('email', $email)->where('school_id', $schoolId)->exists();

            if ($exists) {
                $rows[] = array_merge($base, ['status' => 'duplicate', 'reason' => 'Email already registered in this school']);
                continue;
            }

            // All checks passed — save if requested
            if ($save) {
                try {
                    $user = User::create([
                        'school_id'  => $schoolId,
                        'name'       => $name,
                        'email'      => $email,
                        'password'   => Hash::make(Str::random(12)),
                        'role'       => 'guardian',
                        'created_by' => auth()->id(),
                    ]);

                    Guardian::create([
                        'user_id'         => $user->id,
                        'guardian_number' => UniqueIdentifierService::generateGuardianNumber($schoolId),
                        'phone_number'    => $phone,
                        'address'         => $address,
                        'occupation'      => $occupation,
                        'relationship'    => $relationship,
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

