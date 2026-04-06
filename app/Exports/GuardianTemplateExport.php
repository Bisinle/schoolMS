<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;

class GuardianTemplateExport implements FromArray, WithHeadings, WithStyles, WithColumnWidths, WithTitle
{
    public function array(): array
    {
        // No example rows — instructions are in the modal
        return [];
    }

    public function headings(): array
    {
        return [
            'name',
            'email',
            'phone_number',
            'relationship',
            'address',
            'occupation',
        ];
    }

    public function title(): string
    {
        return 'Guardians Import';
    }

    public function columnWidths(): array
    {
        return [
            'A' => 28,
            'B' => 35,
            'C' => 22,
            'D' => 20,
            'E' => 32,
            'F' => 25,
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        // Style the header row
        $sheet->getStyle('A1:F1')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['argb' => 'FFFFFFFF'],
                'size' => 11,
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['argb' => 'FF2563EB'],
            ],
            'alignment' => [
                'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
            ],
        ]);

        // Add a "Required" note row below headers
        $sheet->insertNewRowBefore(2, 1);
        $sheet->setCellValue('A2', 'Required');
        $sheet->setCellValue('B2', 'Required');
        $sheet->setCellValue('C2', 'Required');
        $sheet->setCellValue('D2', 'Required — Father / Mother / Uncle / Aunt / Guardian / Other');
        $sheet->setCellValue('E2', 'Optional');
        $sheet->setCellValue('F2', 'Optional');

        $sheet->getStyle('A2:F2')->applyFromArray([
            'font' => [
                'italic' => true,
                'size' => 9,
                'color' => ['argb' => 'FF6B7280'],
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['argb' => 'FFF9FAFB'],
            ],
            'alignment' => [
                'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
            ],
        ]);

        // Freeze the first two rows so headers stay visible while scrolling
        $sheet->freezePane('A3');

        // Relationship dropdown validation starting from row 3
        $validation = $sheet->getDataValidation('D3:D10000');
        $validation->setType(DataValidation::TYPE_LIST);
        $validation->setErrorStyle(DataValidation::STYLE_STOP);
        $validation->setAllowBlank(false);
        $validation->setShowDropDown(false);
        $validation->setShowErrorMessage(true);
        $validation->setErrorTitle('Invalid value');
        $validation->setError('Please choose from: Father, Mother, Uncle, Aunt, Guardian, Other');
        $validation->setFormula1('"Father,Mother,Uncle,Aunt,Guardian,Other"');

        return [];
    }
}

