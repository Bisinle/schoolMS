# Stream Migration Quick Reference

## Quick Start

### 1. Run Migration
```bash
php artisan migrate
```

### 2. Verify Migration
```bash
php artisan migrate:status
```

### 3. Rollback (if needed)
```bash
php artisan migrate:rollback --step=3
```

## Key Changes at a Glance

### Database Schema
| Table | Old Column | New Column | Type | Constraint |
|-------|-----------|-----------|------|------------|
| students | grade_id | stream_id | unsignedBigInteger | FK to streams |
| exams | grade_id | stream_id | unsignedBigInteger | FK to streams |
| attendances | grade_id | stream_id | unsignedBigInteger | FK to streams |

### Model Relationships
```php
// Student Model
public function stream() {
    return $this->belongsTo(Stream::class);
}

// Exam Model
public function stream() {
    return $this->belongsTo(Stream::class);
}

// Attendance Model
public function stream() {
    return $this->belongsTo(Stream::class);
}
```

### Validation Rules
```php
// Old
'grade_id' => 'required|exists:grades,id'

// New
'stream_id' => 'required|exists:streams,id'
```

### Controller Changes
```php
// Old - StudentController
$students = Student::with(['grade', 'user'])
    ->when($request->grade_id, fn($q) => $q->where('grade_id', $request->grade_id))
    ->get();

// New - StudentController
$students = Student::with(['stream.grade', 'user'])
    ->when($request->stream_id, fn($q) => $q->where('stream_id', $request->stream_id))
    ->when($request->grade_id, fn($q) => $q->whereHas('stream', fn($q) => $q->where('grade_id', $request->grade_id)))
    ->get();
```

### Frontend Props
```jsx
// Old
export default function StudentsIndex({ students, grades }) {
    // ...
}

// New
export default function StudentsIndex({ students, grades, streams }) {
    // ...
}
```

### Form Data
```jsx
// Old
const { data, setData } = useForm({
    grade_id: '',
    // ...
});

// New
const { data, setData } = useForm({
    stream_id: '',
    // ...
});
```

### API Endpoints
```javascript
// Old
fetch(`/api/grades/${gradeId}/subjects`)

// New
fetch(`/api/streams/${streamId}/subjects`)
```

## Display Format

### Stream Display
```jsx
{stream.grade?.name} {stream.name}
// Example: "Grade 1 Main"
```

### Filter Structure
```jsx
// Grade Filter (Optional)
<select value={gradeId} onChange={...}>
    <option value="">All Grades</option>
    {grades.map(grade => <option value={grade.id}>{grade.name}</option>)}
</select>

// Stream Filter (Required)
<select value={streamId} onChange={...}>
    <option value="">-- Select Stream --</option>
    {streams
        .filter(s => !gradeId || s.grade?.id == gradeId)
        .map(stream => (
            <option value={stream.id}>
                {stream.grade?.name} {stream.name}
            </option>
        ))}
</select>
```

## Testing Commands

### Check Migration Status
```bash
php artisan migrate:status
```

### View Database Schema
```bash
php artisan db:show
php artisan db:table students
php artisan db:table exams
php artisan db:table attendances
```

### Clear Cache
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### Rebuild Frontend
```bash
npm run build
# or for development
npm run dev
```

## Common Issues & Solutions

### Issue: Foreign Key Constraint Error
**Solution**: Ensure streams table exists and has data before running migrations.

### Issue: Subjects Not Loading
**Solution**: Verify the API endpoint `/api/streams/{stream}/subjects` is accessible.

### Issue: Validation Errors
**Solution**: Check that `stream_id` is being sent in the request, not `grade_id`.

### Issue: Display Shows "undefined"
**Solution**: Ensure stream relationship is loaded with `.with(['stream.grade'])`.

## Files Modified Reference

- **Migrations**: `database/migrations/2026_01_10_*`
- **Models**: `app/Models/{Student,Exam,Attendance}.php`
- **Controllers**: `app/Http/Controllers/{Student,Exam,Attendance}Controller.php`
- **Requests**: `app/Http/Requests/{Student,Exam,Attendance}Request.php`
- **Routes**: `routes/web.php`
- **Frontend**: `resources/js/Pages/{Students,Exams,Attendance}/*.jsx`

## Support Resources

- Full Guide: `STREAM_MIGRATION_GUIDE.md`
- Laravel Logs: `storage/logs/laravel.log`
- Browser Console: Check for JavaScript errors

