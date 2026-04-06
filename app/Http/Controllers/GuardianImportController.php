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

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls|max:5120',
        ]);

        $import = new GuardianImport();
        Excel::import($import, $request->file('file'));

        $schoolId = auth()->user()->school_id;

        $results = [
            'imported' => 0,
            'skipped'  => 0,
            'failed'   => 0,
            'errors'   => [],
        ];

        $validRelationships = ['father', 'mother', 'uncle', 'aunt', 'guardian', 'other'];

        foreach ($import->rows as $index => $row) {
            // Row 2 in the file is the "Required / Optional" notes row — skip it
            // WithHeadingRow makes row 1 the key map, so $index 0 = file row 2
            if ($index === 0) {
                $firstVal = strtolower(trim($row['name'] ?? ''));
                if (in_array($firstVal, ['required', 'optional', ''])) {
                    continue;
                }
            }

            $rowNumber = $index + 2; // +2: row 1 is headers, index is 0-based

            $name         = trim($row['name'] ?? '');
            $email        = strtolower(trim($row['email'] ?? ''));
            $phone        = trim($row['phone_number'] ?? '');
            $relationship = trim($row['relationship'] ?? '');
            $address      = trim($row['address'] ?? '') ?: null;
            $occupation   = trim($row['occupation'] ?? '') ?: null;

            // Skip completely empty rows
            if (!$name && !$email && !$phone) {
                continue;
            }

            // Validate the row
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
                $results['failed']++;
                $results['errors'][] = [
                    'row'    => $rowNumber,
                    'email'  => $email ?: "Row {$rowNumber}",
                    'reason' => implode(', ', $validator->errors()->all()),
                    'type'   => 'validation',
                ];
                continue;
            }

            // Check for duplicate email within this school
            $exists = User::where('email', $email)
                ->where('school_id', $schoolId)
                ->exists();

            if ($exists) {
                $results['skipped']++;
                $results['errors'][] = [
                    'row'    => $rowNumber,
                    'email'  => $email,
                    'reason' => 'Email already registered in this school',
                    'type'   => 'duplicate',
                ];
                continue;
            }

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
                    'user_id'          => $user->id,
                    'guardian_number'  => UniqueIdentifierService::generateGuardianNumber($schoolId),
                    'phone_number'     => $phone,
                    'address'          => $address,
                    'occupation'       => $occupation,
                    'relationship'     => $relationship,
                ]);

                $results['imported']++;
            } catch (\Exception $e) {
                $results['failed']++;
                $results['errors'][] = [
                    'row'    => $rowNumber,
                    'email'  => $email,
                    'reason' => 'Database error: ' . $e->getMessage(),
                    'type'   => 'error',
                ];
            }
        }

        return redirect()->route('guardians.index')
            ->with('importResults', $results);
    }
}

