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
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class StudentTemplateExport implements FromArray, WithHeadings, WithStyles, WithColumnWidths, WithTitle
{
    public function array(): array
    {
        return [];
    }

    public function headings(): array
    {
        return [
            'first_name',
            'last_name',
            'gender',
            'grade',
            'guardian_phone',
            'date_of_birth',
            'relationship',
            'enrollment_date',
            'status',
        ];
    }

    public function title(): string
    {
        return 'Students Import';
    }

    public function columnWidths(): array
    {
        return [
            'A' => 22, // first_name
            'B' => 22, // last_name
            'C' => 14, // gender
            'D' => 20, // grade
            'E' => 28, // guardian_phone
            'F' => 18, // date_of_birth
            'G' => 22, // relationship
            'H' => 18, // enrollment_date
            'I' => 14, // status
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        // Style the header row (blue background, white bold text)
        $sheet->getStyle('A1:I1')->applyFromArray([
            'font' => [
                'bold'  => true,
                'color' => ['argb' => 'FFFFFFFF'],
                'size'  => 11,
            ],
            'fill' => [
                'fillType'   => Fill::FILL_SOLID,
                'startColor' => ['argb' => 'FF2563EB'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
            ],
        ]);

        // Insert hints row below headers
        $sheet->insertNewRowBefore(2, 1);
        $sheet->setCellValue('A2', 'Required');
        $sheet->setCellValue('B2', 'Required');
        $sheet->setCellValue('C2', 'Required — male / female');
        $sheet->setCellValue('D2', 'Required — exact grade name e.g. "Grade 3"');
        $sheet->setCellValue('E2', 'Required — must match an existing guardian phone number');
        $sheet->setCellValue('F2', 'Optional — YYYY-MM-DD');
        $sheet->setCellValue('G2', 'Optional — Father / Mother / Uncle / Aunt / Guardian / Other');
        $sheet->setCellValue('H2', 'Optional — YYYY-MM-DD (defaults to today)');
        $sheet->setCellValue('I2', 'Optional — active (default) or inactive');

        $sheet->getStyle('A2:I2')->applyFromArray([
            'font' => [
                'italic' => true,
                'size'   => 9,
                'color'  => ['argb' => 'FF6B7280'],
            ],
            'fill' => [
                'fillType'   => Fill::FILL_SOLID,
                'startColor' => ['argb' => 'FFF9FAFB'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
            ],
        ]);

        // Freeze top two rows so headers stay visible while scrolling
        $sheet->freezePane('A3');

        // Gender dropdown — C3:C10000
        $genderValidation = $sheet->getDataValidation('C3:C10000');
        $genderValidation->setType(DataValidation::TYPE_LIST);
        $genderValidation->setErrorStyle(DataValidation::STYLE_STOP);
        $genderValidation->setAllowBlank(false);
        $genderValidation->setShowDropDown(false);
        $genderValidation->setShowErrorMessage(true);
        $genderValidation->setErrorTitle('Invalid value');
        $genderValidation->setError('Please choose: male or female');
        $genderValidation->setFormula1('"male,female"');

        // Relationship dropdown — G3:G10000
        $relValidation = $sheet->getDataValidation('G3:G10000');
        $relValidation->setType(DataValidation::TYPE_LIST);
        $relValidation->setErrorStyle(DataValidation::STYLE_STOP);
        $relValidation->setAllowBlank(true);
        $relValidation->setShowDropDown(false);
        $relValidation->setShowErrorMessage(true);
        $relValidation->setErrorTitle('Invalid value');
        $relValidation->setError('Please choose from: Father, Mother, Uncle, Aunt, Guardian, Other');
        $relValidation->setFormula1('"Father,Mother,Uncle,Aunt,Guardian,Other"');

        // Status dropdown — I3:I10000
        $statusValidation = $sheet->getDataValidation('I3:I10000');
        $statusValidation->setType(DataValidation::TYPE_LIST);
        $statusValidation->setErrorStyle(DataValidation::STYLE_STOP);
        $statusValidation->setAllowBlank(true);
        $statusValidation->setShowDropDown(false);
        $statusValidation->setShowErrorMessage(true);
        $statusValidation->setErrorTitle('Invalid value');
        $statusValidation->setError('Please choose: active or inactive');
        $statusValidation->setFormula1('"active,inactive"');

        return [];
    }
}
