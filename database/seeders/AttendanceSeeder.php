<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\Student;
use App\Models\Grade;
use App\Models\User;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class AttendanceSeeder extends Seeder
{
    public function run(): void
    {
          // ✅ Skip this seeder if not in local environment
        if (!app()->environment('local')) {
            $this->command->info('AttendanceSeeder skipped in non-local environment.');
            return;
        }
        $students = Student::with('grade')->where('status', 'active')->get();
        $adminUser = User::where('role', 'admin')->first();
        $teachers = User::where('role', 'teacher')->get();

        $startDate = Carbon::parse('2025-01-07');
        // $endDate = Carbon::parse('2025-11-4');
        // $endDate = Carbon::now()->format('Y-m-d');
        $endDate = Carbon::parse(Carbon::now()->format('Y-m-d'));



        // dd($endDate);

        $statusWeights = [
            'present' => 85,
            'absent' => 8,
            'late' => 5,
            'excused' => 2,
        ];

        $this->command->info('Starting attendance seeding...');
        $this->command->info("Date range: {$startDate->toDateString()} to {$endDate->toDateString()}");
        $this->command->info("Total students: {$students->count()}");

        $totalRecords = 0;
        $batchSize = 1000; // Number of records to insert per batch
        $buffer = [];

        $currentDate = $startDate->copy();

        while ($currentDate->lte($endDate)) {
            if ($currentDate->isWeekend()) {
                $currentDate->addDay();
                continue;
            }

            $this->command->info("Processing: {$currentDate->toDateString()}");

            foreach ($students as $student) {
                if (Carbon::parse($student->enrollment_date)->gt($currentDate)) {
                    continue;
                }

                $gradeTeachers = $student->grade->teachers ?? collect();
                $markedBy = $gradeTeachers->isNotEmpty()
                    ? $gradeTeachers->random()->user_id
                    : ($adminUser ? $adminUser->id : null);

                $status = $this->getWeightedRandomStatus($statusWeights);
                $remarks = $this->generateRemarks($status, $student->first_name);

                $buffer[] = [
                    'school_id' => $student->school_id,
                    'student_id' => $student->id,
                    'grade_id' => $student->grade_id,
                    'marked_by' => $markedBy,
                    'attendance_date' => $currentDate->toDateString(),
                    'status' => $status,
                    'remarks' => $remarks,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                // Insert in chunks for speed
                if (count($buffer) >= $batchSize) {
                    Attendance::insert($buffer);
                    $totalRecords += count($buffer);
                    $buffer = [];
                }
            }

            $currentDate->addDay();
        }

        // Insert remaining records
        if (!empty($buffer)) {
            Attendance::insert($buffer);
            $totalRecords += count($buffer);
        }

        $this->command->info("✅ Attendance seeding completed!");
        $this->command->info("📊 Total records created: {$totalRecords}");
        $this->command->info("📅 School days covered: " . $this->calculateSchoolDays($startDate, $endDate));
    }

    private function getWeightedRandomStatus(array $weights): string
    {
        $rand = mt_rand(1, 100);
        $cumulative = 0;
        foreach ($weights as $status => $weight) {
            $cumulative += $weight;
            if ($rand <= $cumulative) {
                return $status;
            }
        }
        return 'present';
    }

    private function generateRemarks(string $status, string $studentName): ?string
    {
        if ($status === 'present' && mt_rand(1, 10) <= 7) {
            return null;
        }

        $remarks = [
            'present' => [
                null,
                "Active participation in class",
                "Excellent behavior today",
                "Completed all assignments",
            ],
            'absent' => [
                "Sick - parent notified",
                "Family emergency",
                "Unexcused absence",
                "Doctor's appointment",
            ],
            'late' => [
                "Arrived 15 minutes late",
                "Traffic delay",
                "Transportation issue",
            ],
            'excused' => [
                "Medical appointment with note",
                "School trip",
                "Religious observance",
            ],
        ];

        $statusRemarks = $remarks[$status] ?? [null];
        return $statusRemarks[array_rand($statusRemarks)];
    }

    private function calculateSchoolDays(Carbon $start, Carbon $end): int
    {
        $days = 0;
        $current = $start->copy();
        while ($current->lte($end)) {
            if (!$current->isWeekend()) $days++;
            $current->addDay();
        }
        return $days;
    }
}
