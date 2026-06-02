<?php

namespace App\Imports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class StudentImport implements ToCollection, WithHeadingRow
{
    public Collection $rows;

    /**
     * Row 1 is the headers, row 2 is the hints row.
     * Actual data starts at row 3.
     * The controller skips the hints row by detecting hint-like content.
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
