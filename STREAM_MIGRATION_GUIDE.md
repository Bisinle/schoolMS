# Stream Migration Guide

## Overview
This guide documents the complete migration from grade-based to stream-based student, exam, and attendance management.

## Migration Summary

### Database Changes
- **Students Table**: Changed `grade_id` → `stream_id`
- **Exams Table**: Changed `grade_id` → `stream_id`
- **Attendances Table**: Changed `grade_id` → `stream_id`

### Migration Files Created
1. `2026_01_10_000001_add_stream_id_to_students_table.php`
2. `2026_01_10_000002_add_stream_id_to_exams_table.php`
3. `2026_01_10_000003_add_stream_id_to_attendances_table.php`

## Running the Migration

### Step 1: Backup Database
```bash
php artisan db:backup  # If you have backup package
# OR manually backup your database
```

### Step 2: Run Migrations
```bash
php artisan migrate
```

### Step 3: Verify Migration
```bash
php artisan migrate:status
```

## What Changed

### Backend (Laravel)

#### Models Updated
- `app/Models/Student.php`
  - Added `stream_id` to fillable
  - Added `stream()` relationship
  - Removed `grade_id` references

- `app/Models/Exam.php`
  - Added `stream_id` to fillable
  - Added `stream()` relationship
  - Removed `grade_id` references

- `app/Models/Attendance.php`
  - Added `stream_id` to fillable
  - Added `stream()` relationship
  - Removed `grade_id` references

#### Controllers Updated
- `StudentController`: All methods updated to use `stream_id`
- `ExamController`: All methods updated to use `stream_id`
- `AttendanceController`: All methods updated to use `stream_id`

#### Validation Rules Updated
- `StudentRequest`: Changed `grade_id` → `stream_id`
- `ExamRequest`: Changed `grade_id` → `stream_id`
- `AttendanceRequest`: Changed `grade_id` → `stream_id`

#### API Endpoints
- New: `GET /api/streams/{stream}/subjects`
- Returns active subjects for a stream's grade

### Frontend (React/Inertia)

#### Components Updated
**Students Module:**
- `Students/Index.jsx`: Stream filter and display
- `Students/Create.jsx`: Stream selection
- `Students/Edit.jsx`: Stream selection

**Exams Module:**
- `Exams/Index.jsx`: Stream filter and display
- `Exams/Create.jsx`: Stream selection + API update
- `Exams/Edit.jsx`: Stream selection + API update

**Attendance Module:**
- `Attendance/Index.jsx`: Stream selection with grade filter

## Testing Checklist

### Database
- [ ] Migrations run successfully
- [ ] Foreign keys created correctly
- [ ] Existing data preserved
- [ ] No orphaned records

### Students Module
- [ ] Can create new student with stream
- [ ] Can edit existing student
- [ ] Can filter students by stream
- [ ] Can filter students by grade
- [ ] Student list displays stream correctly
- [ ] Mobile view works correctly

### Exams Module
- [ ] Can create new exam with stream
- [ ] Can edit existing exam
- [ ] Subjects load correctly by stream
- [ ] Can filter exams by stream
- [ ] Can filter exams by grade
- [ ] Exam list displays stream correctly
- [ ] Mobile view works correctly

### Attendance Module
- [ ] Can mark attendance for stream
- [ ] Can filter by grade then stream
- [ ] Student list loads correctly
- [ ] Attendance saves correctly
- [ ] Mobile view works correctly

## Rollback Instructions

If you need to rollback the migration:

```bash
php artisan migrate:rollback --step=3
```

This will rollback the last 3 migrations (all stream-related changes).

## Important Notes

1. **Stream Selection is Required**: All new students, exams, and attendance records must have a stream assigned.

2. **Grade Filter is Optional**: In list views, grade filter is optional but stream filter is required.

3. **Display Format**: Streams are displayed as "Grade Name + Stream Name" (e.g., "Grade 1 Main").

4. **API Changes**: Frontend now calls `/api/streams/{id}/subjects` instead of `/api/grades/{id}/subjects`.

5. **Backward Compatibility**: The migration preserves all existing data.

## Support

If you encounter any issues during migration:
1. Check Laravel logs: `storage/logs/laravel.log`
2. Check browser console for frontend errors
3. Verify database schema matches expected structure
4. Ensure all migrations ran successfully

