# Seeder Guide

## Overview
This guide explains the database seeders available in the school management system and how to use them.

## Available Seeders

### Core Seeders

#### 1. SchoolSeeder
Creates demo schools in the system.
```bash
php artisan db:seed --class=SchoolSeeder
```

#### 2. UserSeeder
Creates admin and other users for each school.
```bash
php artisan db:seed --class=UserSeeder
```

### Academic Structure Seeders

#### 3. AcademicYearSeeder
Creates academic year 2025 and sets it as active.
- Creates year 2025 (Jan 6 - Nov 28, 2025)
- Sets it as the active academic year
- Deactivates all other years

```bash
php artisan db:seed --class=AcademicYearSeeder
```

#### 4. AcademicTermSeeder
Creates 3 terms for the 2025 academic year.
- Term 1 (Active): Jan 6 - Apr 4, 2025
- Term 2: May 5 - Aug 8, 2025
- Term 3: Sep 1 - Nov 28, 2025

```bash
php artisan db:seed --class=AcademicTermSeeder
```

#### 5. GradeSeeder
Creates grade levels (classes) for the school.
```bash
php artisan db:seed --class=GradeSeeder
```

#### 6. SubjectSeeder
Creates subjects for each grade.
```bash
php artisan db:seed --class=SubjectSeeder
```

### People Seeders

#### 7. TeacherSeeder
Creates teacher records.
```bash
php artisan db:seed --class=TeacherSeeder
```

#### 8. GuardianSeeder
Creates guardian (parent) records.
```bash
php artisan db:seed --class=GuardianSeeder
```

#### 9. StudentSeeder
Creates student records and assigns them to grades and guardians.
```bash
php artisan db:seed --class=StudentSeeder
```

### Exam Seeders

#### 10. ExamSeeder
Creates exams for all 3 terms of 2025.
- Creates Opening, Midterm, and End Term exams for Terms 1 & 2
- Creates End Term exam only for Term 3
- Covers all grades and subjects

```bash
php artisan db:seed --class=ExamSeeder
```

**Output**: ~1,386 exams (varies by number of grades and subjects)

#### 11. ExamResultSeeder
Creates exam results for all students in all exams.
- Generates realistic marks based on exam type
- Opening: 50-85 range
- Midterm: 55-90 range
- End Term: 60-95 range

```bash
php artisan db:seed --class=ExamResultSeeder
```

**Output**: ~6,552 results (varies by number of students and exams)

### Document Seeders

#### 12. DocumentCategorySeeder
Creates document categories for Teachers, Students, and Guardians.

**Teacher Categories** (4):
- CV, National ID, Teaching Certificate, Academic Certificates

**Student Categories** (5):
- Birth Certificate, Immunization Card, Previous School Report, Transfer Certificate, Passport Photo

**Guardian Categories** (1):
- National ID / Passport

```bash
php artisan db:seed --class=DocumentCategorySeeder
```

#### 13. DocumentSeeder
Creates sample documents for all teachers, students, and guardians.
- 80% verified, 15% pending, 5% rejected
- Creates dummy files in storage
- Adds expiry dates where applicable

```bash
php artisan db:seed --class=DocumentSeeder
```

**Output**: ~277 documents (varies by number of people)

## Running Seeders

### Run All Seeders
```bash
php artisan db:seed
```

This runs all seeders in the correct order as defined in `DatabaseSeeder.php`.

### Run Specific Seeder
```bash
php artisan db:seed --class=SeederName
```

### Fresh Migration + Seed
```bash
php artisan migrate:fresh --seed
```
⚠️ **Warning**: This will drop all tables and recreate them!

## Seeder Order

The seeders must be run in this order to maintain referential integrity:

1. Core Setup: Schools, Users
2. Academic Structure: Years, Terms, Grades, Subjects
3. People: Teachers, Guardians, Students
4. Exams: Exams, Results
5. Documents: Categories, Documents

## Idempotency

All seeders are designed to be idempotent:
- They check for existing data before creating new records
- Safe to run multiple times
- Will skip or update existing records as appropriate

## Verification

After seeding, verify the data:

```bash
php artisan tinker --execute="
echo 'Schools: ' . App\Models\School::count() . PHP_EOL;
echo 'Users: ' . App\Models\User::count() . PHP_EOL;
echo 'Academic Years: ' . App\Models\AcademicYear::count() . PHP_EOL;
echo 'Academic Terms: ' . App\Models\AcademicTerm::count() . PHP_EOL;
echo 'Grades: ' . App\Models\Grade::count() . PHP_EOL;
echo 'Subjects: ' . App\Models\Subject::count() . PHP_EOL;
echo 'Teachers: ' . App\Models\Teacher::count() . PHP_EOL;
echo 'Guardians: ' . App\Models\Guardian::count() . PHP_EOL;
echo 'Students: ' . App\Models\Student::count() . PHP_EOL;
echo 'Exams: ' . App\Models\Exam::count() . PHP_EOL;
echo 'Exam Results: ' . App\Models\ExamResult::count() . PHP_EOL;
echo 'Document Categories: ' . App\Models\DocumentCategory::count() . PHP_EOL;
echo 'Documents: ' . App\Models\Document::count() . PHP_EOL;
"
```

## Troubleshooting

### "No schools found" Error
Run `SchoolSeeder` first:
```bash
php artisan db:seed --class=SchoolSeeder
```

### "No admin user found" Error
Run `UserSeeder` after `SchoolSeeder`:
```bash
php artisan db:seed --class=UserSeeder
```

### Foreign Key Constraint Errors
Ensure you're running seeders in the correct order. Use `php artisan db:seed` to run all in order.

