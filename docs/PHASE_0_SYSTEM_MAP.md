# 📊 PHASE 0: COMPLETE SYSTEM MAP
## Grade & Timetable Module Integration Analysis

**Generated:** 2025-12-26  
**Purpose:** Complete understanding of current system before making any changes

---

## 🗂️ MODULE OVERVIEW

### **GRADE MODULE**
**Purpose:** Curriculum planning and teacher assignment  
**Scope:** Defines WHAT subjects are taught, WHO teaches them, and HOW OFTEN

### **TIMETABLE MODULE**  
**Purpose:** Scheduling and execution  
**Scope:** Defines WHEN lessons happen, WHERE they occur, and actual teaching assignments

---

## 📋 DATABASE SCHEMA

### **GRADE MODULE TABLES**

#### **`grades`**
```sql
- id (PK)
- school_id (FK → schools)
- name (unique per school)
- code (unique per school, nullable)
- level (enum: ECD, LOWER PRIMARY, UPPER PRIMARY, JUNIOR SECONDARY, nullable for madrasah)
- capacity (integer, default 40)
- description (text, nullable)
- status (enum: active, inactive)
- timestamps
- deleted_at (soft deletes)
```

#### **`grade_subject`** (Pivot)
```sql
- id (PK)
- grade_id (FK → grades, cascade delete)
- subject_id (FK → subjects, cascade delete)
- sessions_per_week (integer, default 4) ⚠️ ORPHANED - not enforced
- timestamps
- UNIQUE(grade_id, subject_id)
```

#### **`grade_teacher`** (Pivot)
```sql
- id (PK)
- grade_id (FK → grades, cascade delete)
- teacher_id (FK → teachers, cascade delete)
- is_class_teacher (boolean, default false)
- timestamps
- UNIQUE(grade_id, teacher_id)
```

#### **`subjects`**
```sql
- id (PK)
- school_id (FK → schools)
- name (string)
- category (enum: academic, islamic)
- code (string, nullable)
- status (enum: active, inactive)
- timestamps
- UNIQUE(school_id, name, category)
```

#### **`teachers`**
```sql
- id (PK)
- school_id (FK → schools)
- user_id (FK → users)
- employee_number (unique per school)
- phone_number, address, qualification, subject_specialization
- date_of_joining (date)
- status (enum: active, inactive)
- timestamps
```

---

### **TIMETABLE MODULE TABLES**

#### **`timetable_templates`**
```sql
- id (PK)
- school_id (FK → schools, cascade delete)
- grade_id (FK → grades, restrict delete) ⚠️ DEPENDENCY
- academic_term_id (FK → academic_terms, restrict delete)
- name, description
- is_active (boolean, default false)
- status (enum: draft, published, archived)
- active_days (JSON array: ['monday', 'tuesday', ...])
- school_start_time, school_end_time (time)
- created_by, updated_by (FK → users)
- timestamps
- deleted_at (soft deletes)
- UNIQUE(grade_id, academic_term_id, is_active) - one active per grade/term
```

#### **`timetable_periods`**
```sql
- id (PK)
- school_id (FK → schools, cascade delete)
- grade_level (enum: ECD, LOWER PRIMARY, UPPER PRIMARY, JUNIOR SECONDARY, nullable)
- name (e.g., "Period 1", "Morning Break")
- order (integer) - chronological position in day
- period_number (integer, nullable) - legacy label
- lesson_number (integer, nullable) - for lesson-type periods only
- start_time, end_time (time)
- duration_minutes (integer)
- period_type (enum: lesson, break, lunch, assembly, activity, study, other)
- is_break (boolean)
- is_active (boolean)
- description, color_code
- timestamps
- UNIQUE(school_id, grade_level, order)
```

#### **`timetable_slots`**
```sql
- id (PK)
- school_id (FK → schools, cascade delete)
- timetable_template_id (FK → timetable_templates, cascade delete)
- timetable_period_id (FK → timetable_periods, null on delete)
- day_of_week (enum: monday-sunday)
- subject_id (FK → subjects, restrict delete) ⚠️ NO VALIDATION
- teacher_id (FK → teachers, restrict delete) ⚠️ NO VALIDATION
- room_id (FK → rooms, null on delete)
- slot_type (enum: lesson, break, lunch, assembly, activity, study, other)
- notes, topic (text)
- is_substitution (boolean)
- original_teacher_id (FK → teachers, null on delete)
- timestamps
- UNIQUE(timetable_template_id, day_of_week, timetable_period_id)
- CHECK CONSTRAINTS:
  * Break/lunch slots MUST have subject_id = NULL AND teacher_id = NULL
  * Lesson slots MUST have subject_id NOT NULL
```

#### **`rooms`**
```sql
- id (PK)
- school_id (FK → schools, cascade delete)
- name, code (unique per school)
- room_type (enum: classroom, laboratory, library, computer_lab, etc.)
- capacity, building, floor
- facilities (JSON array)
- status (enum: available, maintenance, reserved, inactive)
- is_active (boolean)
- notes
- timestamps
- deleted_at (soft deletes)
```

#### **`teacher_availability`**
```sql
- id (PK)
- school_id (FK → schools, cascade delete)
- teacher_id (FK → teachers, restrict delete)
- academic_term_id (FK → academic_terms, cascade delete, nullable)
- day_of_week (enum: monday-sunday)
- start_time, end_time (time)
- availability_type (enum: available, unavailable, preferred, limited)
- reason (enum: personal, meeting, training, other_duty, health, other, nullable)
- notes, is_recurring (boolean)
- effective_from, effective_until (date, nullable)
- timestamps
```

#### **`timetable_conflicts`**
```sql
- id (PK)
- school_id (FK → schools, cascade delete)
- timetable_template_id (FK → timetable_templates, cascade delete)
- slot_id_1, slot_id_2 (FK → timetable_slots, cascade delete)
- conflict_type (enum: teacher_double_booking, room_double_booking, teacher_unavailable, etc.)
- description (text)
- severity (enum: low, medium, high, critical)
- status (enum: detected, acknowledged, resolved, ignored)
- resolution_notes
- resolved_by (FK → users), resolved_at (timestamp)
- timestamps
```

---

## 🔗 MODEL RELATIONSHIPS

### **Grade Model**
```php
// Relationships
- hasMany: students, exams, tuitionFees, timetableTemplates, timetableSlots
- belongsToMany: subjects (via grade_subject, withPivot: sessions_per_week)
- belongsToMany: teachers (via grade_teacher, withPivot: is_class_teacher)

// Helper Methods
- getClassTeacher(): Teacher|null
- hasCapacity(): bool
- getLevelDisplayNameAttribute(): string
- activeTimetableTemplate(): TimetableTemplate|null
- activeTimetableSlots(): HasMany
- hasActiveTimetable(): bool
- getTimetableForDay(string $day): Collection
```

### **Subject Model**
```php
// Relationships
- belongsToMany: grades (via grade_subject, withPivot: sessions_per_week)
- hasMany: exams, timetableSlots

// Scopes
- active(), academic(), islamic()

// Helper Methods
- activeTimetableSlots(): HasMany
- requiresLab(): bool
- isCoreSubject(): bool
```

### **Teacher Model**
```php
// Relationships
- belongsTo: user
- belongsToMany: grades (via grade_teacher, withPivot: is_class_teacher)
- hasMany: timetableSlots, availability, documents

// Scopes
- assignedGrades(), classTeacherGrades()

// Helper Methods
- activeTimetableSlots(): HasMany
- isAvailableAt(string $day, string $startTime, string $endTime): bool
- hasConflictAt(string $day, int $periodId, int $timetableTemplateId): bool
- getTimetableForDay(string $day): Collection
- getWeeklyTimetable(): Collection
```

### **TimetableTemplate Model**
```php
// Relationships
- belongsTo: grade, academicTerm, creator (User), updater (User)
- hasMany: slots, conflicts

// Scopes
- active(), published(), draft(), forGrade($gradeId), forTerm($termId)

// Helper Methods
- isDraft(): bool
- isPublished(): bool
- isArchived(): bool
- hasConflicts(): bool
- getActiveDaysArray(): array
```

### **TimetableSlot Model**
```php
// Relationships
- belongsTo: timetableTemplate, timetablePeriod, subject, teacher, room, originalTeacher
- hasMany: conflicts (as slot1 or slot2)

// Scopes
- forTemplate($templateId), forDay($day), lessons(), breaks(), forTeacher($teacherId)
- forSubject($subjectId), forRoom($roomId), substitutions()

// Helper Methods
- isLesson(): bool
- isBreak(): bool
- isSubstitution(): bool
- getTimeRange(): string
```

### **TimetablePeriod Model**
```php
// Relationships
- hasMany: slots

// Scopes
- active(), lessons(), breaks(), forGradeLevel($level), ordered(), byLessonNumber()

// Helper Methods
- isLesson(): bool
- isBreakPeriod(): bool
- getDurationInMinutes(): int
```

### **TimetableConflict Model**
```php
// Relationships
- belongsTo: timetableTemplate, slot1 (TimetableSlot), slot2 (TimetableSlot), resolver (User)

// Scopes
- detected(), resolved(), unresolved(), critical(), high(), byType($type), forTimetable($id)

// Helper Methods
- isResolved(): bool
- isDetected(): bool
- isCritical(): bool
- isHigh(): bool
- resolve(User $user, ?string $notes): void
- ignore(?string $notes): void
- acknowledge(): void
```

---

## 🔒 AUTHORIZATION POLICIES

### **TimetableTemplatePolicy**
```php
- viewAny(): Admin & Teachers
- view(): Admin (all) | Teachers (for grades they teach)
- create(): Admin only
- update(): Admin only (draft status only)
- delete(): Admin only (draft status only)
- publish(): Admin only (draft status only)
- archive(): Admin only
```

### **TimetablePeriodPolicy**
```php
- viewAny(): Admin & Teachers
- view(): Admin & Teachers
- create(): Admin only
- update(): Admin only
- delete(): Admin only (if not used in slots)
```

### **TimetableSlotPolicy**
```php
- viewAny(): Admin & Teachers
- view(): Admin (all) | Teachers (their assigned slots only)
- create(): Admin only
- update(): Admin only (draft templates only)
- delete(): Admin only (draft templates only)
```

### **RoomPolicy**
```php
- viewAny(): Admin & Teachers
- view(): Admin & Teachers
- create(): Admin only
- update(): Admin only
- delete(): Admin only (if not used in slots)
```

---

## 🚨 CRITICAL ISSUES IDENTIFIED

### **1. ORPHANED DATA: `sessions_per_week`**
**Location:** `grade_subject.sessions_per_week`
**Problem:** Stored but NEVER enforced or validated
**Impact:**
- Admins can set "Math: 5 sessions/week" but create 3 or 7 slots
- No validation in TimetableSlotController
- No UI warnings when mismatch occurs
- Data becomes meaningless over time

**Evidence:**
```php
// GradeController.php - stores the value
$grade->subjects()->attach($subjectId, [
    'sessions_per_week' => $request->sessions_per_week[$subjectId]
]);

// TimetableSlotController.php - NEVER checks it
public function store(Request $request) {
    // No validation against sessions_per_week
    TimetableSlot::create($validated);
}
```

### **2. NO VALIDATION: Subject-Grade Assignment**
**Location:** `TimetableSlotController::store()`
**Problem:** Can assign ANY subject to ANY grade
**Impact:**
- Can assign "Grade 1 Math" to "Grade 5 Timetable"
- Can assign subjects not in grade's curriculum
- Breaks curriculum integrity

**Missing Validation:**
```php
// SHOULD EXIST but DOESN'T:
$grade = $template->grade;
if (!$grade->subjects->contains($subjectId)) {
    throw ValidationException::withMessages([
        'subject_id' => 'Subject not assigned to this grade'
    ]);
}
```

### **3. NO VALIDATION: Teacher-Grade Assignment**
**Location:** `TimetableSlotController::store()`
**Problem:** Can assign ANY teacher to ANY grade
**Impact:**
- Can assign teachers to grades they don't teach
- Breaks teacher assignment logic
- Conflicts with grade_teacher pivot

**Missing Validation:**
```php
// SHOULD EXIST but DOESN'T:
$grade = $template->grade;
if (!$grade->teachers->contains($teacherId)) {
    throw ValidationException::withMessages([
        'teacher_id' => 'Teacher not assigned to this grade'
    ]);
}
```

### **4. WEAK VALIDATION: Teacher-Subject Specialization**
**Location:** `TimetableSlotController::store()`
**Problem:** Only checks `subject_specialization` field (free text)
**Impact:**
- Relies on manual text matching
- No structured validation
- Easy to bypass with typos

**Current Implementation:**
```php
// Weak validation - just a warning
if ($teacher->subject_specialization !== $subject->name) {
    // Just a warning, not blocked
}
```

### **5. ARCHITECTURAL MISMATCH: Two Sources of Truth**
**Problem:** Grade module and Timetable module both define teaching assignments
**Conflict:**
- `grade_teacher` says "Teacher A teaches Grade 5"
- `timetable_slots` says "Teacher B teaches Grade 5 Math on Monday"
- Which is correct?

**Impact:**
- Confusion about actual teaching assignments
- Reports may show different data
- No single source of truth

---

## 🔄 DATA FLOW ANALYSIS

### **Current Workflow**
```
1. Admin creates Grade (e.g., "Grade 5")
2. Admin assigns Subjects to Grade (e.g., "Math: 5 sessions/week")
3. Admin assigns Teachers to Grade (e.g., "Teacher A, Teacher B")
4. Admin creates TimetableTemplate for Grade
5. Admin creates TimetableSlots
   ⚠️ NO validation that subject is in grade
   ⚠️ NO validation that teacher is assigned to grade
   ⚠️ NO validation against sessions_per_week
6. Admin publishes timetable
```

### **Expected Workflow (Missing)**
```
1. Admin creates Grade
2. Admin assigns Subjects to Grade with sessions_per_week
3. Admin assigns Teachers to Grade
4. Admin creates TimetableTemplate
5. System validates:
   ✅ Subject must be in grade.subjects
   ✅ Teacher must be in grade.teachers
   ✅ Total slots per subject ≈ sessions_per_week
6. System warns if mismatches
7. Admin publishes timetable
```

---

## 📊 ROUTES & CONTROLLERS

### **Grade Module Routes**
```php
// Admin & Teachers can view
GET  /grades                    → GradeController@index
GET  /grades/{grade}            → GradeController@show

// Admin only
GET  /grades/create             → GradeController@create
POST /grades                    → GradeController@store
GET  /grades/{grade}/edit       → GradeController@edit
PUT  /grades/{grade}            → GradeController@update
DELETE /grades/{grade}          → GradeController@destroy
POST /grades/{grade}/restore    → GradeController@restore

// Admin only - Teacher assignments
POST   /grades/{grade}/assign-teacher           → GradeController@assignTeacher
DELETE /grades/{grade}/remove-teacher/{teacher} → GradeController@removeTeacher
PATCH  /grades/{grade}/update-teacher/{teacher} → GradeController@updateTeacherAssignment
```

### **Timetable Module Routes**
```php
// Dashboard
GET /timetables/dashboard → TimetableTemplateController@dashboard (Admin & Teachers)

// Templates
GET    /timetables/templates              → index (Admin & Teachers)
GET    /timetables/templates/create       → create (Admin only)
POST   /timetables/templates              → store (Admin only)
GET    /timetables/templates/{template}   → show (Admin & Teachers)
GET    /timetables/templates/{template}/edit → edit (Admin only)
PUT    /timetables/templates/{template}   → update (Admin only)
DELETE /timetables/templates/{template}   → destroy (Admin only)
POST   /timetables/templates/{template}/publish → publish (Admin only)
POST   /timetables/templates/{template}/archive → archive (Admin only)

// Periods
GET    /timetables/periods         → index (Admin & Teachers)
GET    /timetables/periods/create  → create (Admin only)
POST   /timetables/periods         → store (Admin only)
GET    /timetables/periods/{period} → show (Admin & Teachers)
GET    /timetables/periods/{period}/edit → edit (Admin only)
PUT    /timetables/periods/{period} → update (Admin only)
DELETE /timetables/periods/{period} → destroy (Admin only)

// Slots
GET    /timetables/slots         → index (Admin & Teachers)
GET    /timetables/slots/create  → create (Admin only)
POST   /timetables/slots         → store (Admin only)
GET    /timetables/slots/{slot}  → show (Admin & Teachers)
GET    /timetables/slots/{slot}/edit → edit (Admin only)
PUT    /timetables/slots/{slot}  → update (Admin only)
DELETE /timetables/slots/{slot}  → destroy (Admin only)

// Rooms
GET    /timetables/rooms         → index (Admin & Teachers)
GET    /timetables/rooms/create  → create (Admin only)
POST   /timetables/rooms         → store (Admin only)
GET    /timetables/rooms/{room}  → show (Admin & Teachers)
GET    /timetables/rooms/{room}/edit → edit (Admin only)
PUT    /timetables/rooms/{room}  → update (Admin only)
DELETE /timetables/rooms/{room}  → destroy (Admin only)

// Teacher Availability
GET    /timetables/availability              → index (Admin & Teachers)
GET    /timetables/availability/create       → create (Admin & Teachers)
POST   /timetables/availability              → store (Admin & Teachers)
GET    /timetables/availability/{availability} → show (Admin & Teachers)
GET    /timetables/availability/{availability}/edit → edit (Admin & Teachers)
PUT    /timetables/availability/{availability} → update (Admin & Teachers)
DELETE /timetables/availability/{availability} → destroy (Admin & Teachers)
```

### **API Routes**
```php
GET /api/grades/{grade}/subjects → Returns active subjects for grade
```

---

## 🎯 RECOMMENDATIONS

### **Priority 1: Data Integrity (CRITICAL)**
1. **Add validation in TimetableSlotController:**
   - Validate subject is assigned to grade
   - Validate teacher is assigned to grade
   - Validate against sessions_per_week (warning, not blocking)

2. **Add database constraints:**
   - Consider CHECK constraints for referential integrity
   - Add indexes for performance

### **Priority 2: User Experience**
1. **Add UI warnings:**
   - Show warning when slot count ≠ sessions_per_week
   - Show warning when teacher specialization ≠ subject
   - Show summary of curriculum vs actual slots

2. **Add validation feedback:**
   - Real-time validation in slot creation form
   - Bulk validation report before publishing

### **Priority 3: Architecture**
1. **Clarify data ownership:**
   - Document which module owns what data
   - Define single source of truth for teaching assignments
   - Consider merging or deprecating redundant fields

2. **Add automated tests:**
   - Test validation rules
   - Test constraint enforcement
   - Test edge cases

---

## 📝 NEXT STEPS

1. **Review this document** with stakeholders
2. **Prioritize fixes** based on business impact
3. **Create implementation plan** for validation layer
4. **Update documentation** to reflect actual behavior
5. **Add tests** to prevent regression

---

**Document Status:** ✅ COMPLETE
**Last Updated:** 2025-12-26
**Reviewed By:** [Pending]

