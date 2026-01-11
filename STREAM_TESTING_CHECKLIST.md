# Stream Feature Testing Checklist

## Pre-Migration Checks

- [ ] Backup database
- [ ] Verify you're on `feat-stream` branch
- [ ] Review migration files
- [ ] Check current data (count students, teachers, exams, attendances)

## Migration Steps

### 1. Run Migrations
```bash
php artisan migrate
```

**Expected Output:**
- Phase 1: Reverses grade-stream relationship
- Phase 2: Migrates X students to streams
- Phase 3: Migrates X teacher assignments to streams
- Phase 4: Migrates X subject assignments to streams
- Phase 5: Migrates X exams and X attendance records to streams

### 2. Verify Database Structure
```bash
php artisan tinker
```

```php
// Check streams table
DB::table('streams')->count();
DB::table('streams')->first();

// Check students have stream_id
DB::table('students')->whereNotNull('stream_id')->count();

// Check stream_teacher pivot exists
DB::table('stream_teacher')->count();

// Check stream_subject pivot exists
DB::table('stream_subject')->count();

// Check exams have stream_id
DB::table('exams')->whereNotNull('stream_id')->count();

// Check attendances have stream_id
DB::table('attendances')->whereNotNull('stream_id')->count();
```

### 3. Seed Initial Streams (Optional)
```bash
php artisan db:seed --class=StreamSeeder
```

## Feature Testing

### Stream Management

- [ ] **Navigate to Settings → Streams**
  - Should see list of streams
  - Should see grade associations

- [ ] **Create New Stream**
  - Click "Create Stream"
  - Select a grade
  - Enter stream name (e.g., "North", "South", "A", "B")
  - Enter stream code
  - Set capacity
  - Assign room (optional)
  - Save
  - Verify stream appears in list

- [ ] **Edit Stream**
  - Click edit on a stream
  - Change name/capacity
  - Save
  - Verify changes persist

- [ ] **View Stream Details**
  - Click on a stream
  - Should see:
    - Stream info
    - Assigned students count
    - Assigned teachers
    - Subjects
    - Class teacher (if assigned)

- [ ] **Delete Stream**
  - Try to delete stream with students (should fail)
  - Create empty stream
  - Delete it (should succeed)

### Student Management

- [ ] **View Students**
  - Navigate to Students
  - Should see stream column
  - Filter by grade (should show students from all streams in that grade)
  - Filter by stream (if available)

- [ ] **Create Student**
  - Click "Create Student"
  - Select grade
  - Select stream (should show streams for selected grade)
  - Fill other details
  - Save
  - Verify student is assigned to correct stream

- [ ] **Edit Student**
  - Edit existing student
  - Change stream
  - Save
  - Verify stream change

- [ ] **Student Details**
  - View student details
  - Should show stream name
  - Should show grade name (through stream)

### Teacher Management

- [ ] **Assign Teacher to Stream**
  - Navigate to Teachers
  - Edit a teacher
  - Assign to stream(s)
  - Mark as class teacher for one stream
  - Save
  - Verify assignments

- [ ] **View Teacher Streams**
  - View teacher details
  - Should see assigned streams
  - Should see class teacher designation

### Attendance

- [ ] **Mark Attendance**
  - Navigate to Attendance
  - Select stream (not grade)
  - Select date
  - Should see students from that stream
  - Mark attendance
  - Save
  - Verify attendance is saved

- [ ] **View Attendance Reports**
  - Filter by grade (should show all streams)
  - Filter by stream
  - Verify data is correct

### Exams

- [ ] **Create Exam**
  - Navigate to Exams
  - Click "Create Exam"
  - Select grade
  - Select stream
  - Select subject
  - Fill other details
  - Save
  - Verify exam is created

- [ ] **View Exams**
  - Filter by grade (should show exams from all streams)
  - Filter by stream
  - Verify correct exams appear

- [ ] **Enter Exam Results**
  - Select an exam
  - Enter results for students
  - Should only show students from that stream
  - Save
  - Verify results

### Subjects

- [ ] **Assign Subjects to Stream**
  - Navigate to Grades
  - Select a grade
  - View streams
  - Assign subjects to a stream
  - Set sessions per week
  - Set priority
  - Save
  - Verify assignments

## Data Integrity Checks

### Verify Relationships Work

```bash
php artisan tinker
```

```php
// Test Stream → Grade
$stream = App\Models\Stream::first();
$stream->grade; // Should return grade

// Test Stream → Students
$stream->students; // Should return students

// Test Stream → Teachers
$stream->teachers; // Should return teachers

// Test Stream → Subjects
$stream->subjects; // Should return subjects

// Test Grade → Streams
$grade = App\Models\Grade::first();
$grade->streams; // Should return streams

// Test Grade → Students (through streams)
$grade->students; // Should return all students in all streams

// Test Student → Stream
$student = App\Models\Student::first();
$student->stream; // Should return stream
$student->grade; // Should return grade (through stream)

// Test Teacher → Streams
$teacher = App\Models\Teacher::first();
$teacher->streams; // Should return streams
$teacher->grades; // Should return grades (through streams)

// Test Exam → Stream
$exam = App\Models\Exam::first();
$exam->stream; // Should return stream
$exam->grade; // Should return grade (through stream)

// Test Attendance → Stream
$attendance = App\Models\Attendance::first();
$attendance->stream; // Should return stream
$attendance->grade; // Should return grade (through stream)
```

## Rollback Plan

If something goes wrong:

```bash
# Rollback migrations
php artisan migrate:rollback --step=5

# Restore from backup
# (Use your backup restoration process)
```

## Success Criteria

✅ All migrations run without errors
✅ All existing data is preserved
✅ Students are assigned to streams
✅ Teachers are assigned to streams
✅ Subjects are assigned to streams
✅ Exams use stream_id
✅ Attendances use stream_id
✅ All CRUD operations work
✅ Filtering works correctly
✅ Relationships return correct data
✅ No broken pages or errors in browser console

