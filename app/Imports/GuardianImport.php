<?php

namespace App\Imports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class GuardianImport implements ToCollection, WithHeadingRow
{
    public Collection $rows;

    /**
     * The heading row index — row 1 is headers, row 2 is our notes row,
     * so actual data starts at row 3. We set headingRow to 1 and skip
     * the notes row in the controller by checking for a notes-like row.
     */
    public function headingRow(): int
    {
        return 1;
    }

    public function collection(Collection $rows): void
    {
        $this->rows = $rows;
    }
}

