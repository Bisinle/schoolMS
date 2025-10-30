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
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all active students with their grades
        $students = Student::with('grade')->where('status', 'active')->get();
        
        // Get admin user to mark attendance (fallback)
        $adminUser = User::where('role', 'admin')->first();
        
        // Get all teachers
        $teachers = User::where('role', 'teacher')->get();

        // Define date range (January 7, 2025 to October 23, 2025)
        $startDate = Carbon::parse('2025-01-07');
        $endDate = Carbon::parse('2025-10-23');

        // Define attendance weights for realistic distribution
        // 85% present, 8% absent, 5% late, 2% excused
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
        $currentDate = $startDate->copy();

        // Loop through each date
        while ($currentDate->lte($endDate)) {
            // Skip weekends (Saturday = 6, Sunday = 0)
            if ($currentDate->dayOfWeek === Carbon::SATURDAY || $currentDate->dayOfWeek === Carbon::SUNDAY) {
                $currentDate->addDay();
                continue;
            }

            $this->command->info("Processing date: {$currentDate->toDateString()} ({$currentDate->format('l')})");

            // Mark attendance for each student
            foreach ($students as $student) {
                // Skip if student hasn't enrolled yet
                if (Carbon::parse($student->enrollment_date)->gt($currentDate)) {
                    continue;
                }

                // Get the teacher who should mark this attendance
                // Try to get a teacher assigned to this grade
                $gradeTeachers = $student->grade->teachers;
                
                if ($gradeTeachers->isNotEmpty()) {
                    // Randomly pick one of the teachers assigned to this grade
                    $markedBy = $gradeTeachers->random()->user_id;
                } else {
                    // If no teacher assigned to grade, use admin
                    $markedBy = $adminUser->id;
                }

                // Determine attendance status based on weights
                $status = $this->getWeightedRandomStatus($statusWeights);

                // Generate realistic remarks based on status
                $remarks = $this->generateRemarks($status, $student->first_name);

                // Create attendance record
                Attendance::create([
                    'student_id' => $student->id,
                    'grade_id' => $student->grade_id,
                    'marked_by' => $markedBy,
                    'attendance_date' => $currentDate->toDateString(),
                    'status' => $status,
                    'remarks' => $remarks,
                ]);

                $totalRecords++;
            }

            // Move to next day
            $currentDate->addDay();
        }

        $this->command->info("✅ Attendance seeding completed!");
        $this->command->info("📊 Total records created: {$totalRecords}");
        $this->command->info("📅 School days covered: " . $this->calculateSchoolDays($startDate, $endDate));
    }

    /**
     * Get weighted random status based on probability distribution
     */
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

        return 'present'; // Fallback
    }

    /**
     * Generate realistic remarks based on status
     */
    private function generateRemarks(string $status, string $studentName): ?string
    {
        // 70% chance of no remarks for present students
        if ($status === 'present' && mt_rand(1, 10) <= 7) {
            return null;
        }

        $remarks = [
            'present' => [
                null,
                null,
                null,
                "Active participation in class",
                "Excellent behavior today",
                "Completed all assignments",
            ],
            'absent' => [
                "Sick - parent notified",
                "Family emergency",
                "Medical appointment",
                "Unexcused absence",
                "Called in sick",
                "Doctor's appointment",
                "Parent called - illness",
                "Absent without notice",
            ],
            'late' => [
                "Traffic delay",
                "Arrived 15 minutes late",
                "Transportation issue",
                "Overslept",
                "Arrived during second period",
                "Parent explained lateness",
                "Bus delay",
                "Arrived 30 minutes late",
            ],
            'excused' => [
                "School trip",
                "Medical appointment with note",
                "Religious observance",
                "Family event - pre-approved",
                "Educational leave",
                "Parent meeting - excused",
                "Special event participation",
                "Court appearance with guardian",
            ],
        ];

        $statusRemarks = $remarks[$status] ?? [null];
        return $statusRemarks[array_rand($statusRemarks)];
    }

    /**
     * Calculate total school days (excluding weekends)
     */
    private function calculateSchoolDays(Carbon $start, Carbon $end): int
    {
        $days = 0;
        $current = $start->copy();

        while ($current->lte($end)) {
            if ($current->dayOfWeek !== Carbon::SATURDAY && $current->dayOfWeek !== Carbon::SUNDAY) {
                $days++;
            }
            $current->addDay();
        }

        return $days;
    }
}