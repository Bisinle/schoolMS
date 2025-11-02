# School Management System - Complete Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Database Schema](#database-schema)
5. [Core Features](#core-features)
6. [Module Details](#module-details)
7. [API Endpoints](#api-endpoints)
8. [Frontend Components](#frontend-components)
9. [Business Logic](#business-logic)
10. [Setup & Installation](#setup--installation)

---

## System Overview

### Purpose
A comprehensive Islamic school management system designed for Kenyan schools following the Competency-Based Curriculum (CBC) with integrated Islamic studies. The system manages students, teachers, guardians, grades, subjects, exams, and generates academic reports.

### Key Characteristics
- **Multi-role system**: Admin, Teacher, Guardian roles with specific permissions
- **Dual curriculum**: Academic subjects (CBC) and Islamic subjects
- **Grade levels**: ECD, Lower Primary (1-3), Upper Primary (4-6), Junior Secondary (7-9)
- **Term-based system**: 3 terms per academic year
- **Exam types**: Opening, Midterm, End-Term exams
- **Dynamic reporting**: On-demand report card generation from exam results

---

## Technology Stack

### Backend
- **Framework**: Laravel 11.x
- **PHP Version**: 8.2+
- **Database**: SQLite (development), MySQL/PostgreSQL (production)
- **Authentication**: Laravel Breeze with Inertia.js

### Frontend
- **Framework**: React 18
- **Routing**: Inertia.js
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Build Tool**: Vite

### Additional Tools
- **PDF Generation**: DomPDF (planned)
- **Code Quality**: PHP CS Fixer, ESLint

---

## User Roles & Permissions

### Admin Role
**Full system access including:**
- User management (create/edit/delete all users)
- Grade and subject management
- Teacher-grade assignments
- Exam creation and management
- View all student records
- Edit all exam results
- Add teacher and headteacher comments
- Lock/unlock report comments
- System configuration

### Teacher Role
**Access limited to assigned grades:**
- View students in assigned grades
- Create exams for assigned grades
- Enter and edit marks for assigned exams
- View reports for students in assigned grades
- Add teacher comments (class teachers only)
- Lock own teacher comments

### Guardian Role
**Access limited to own children:**
- View own children's information
- View children's exam results
- View children's report cards
- Cannot edit any data
- Cannot add comments

---

## Database Schema

### Core Tables

#### Users Table
```sql
- id (PK)
- name (string)
- email (string, unique)
- password (string, hashed)
- role (enum: 'admin', 'teacher', 'guardian')
- email_verified_at (timestamp, nullable)
- remember_token (string, nullable)
- timestamps
```

#### Teachers Table
```sql
- id (PK)
- user_id (FK -> users.id) ON DELETE CASCADE
- employee_number (string, unique)
- phone_number (string)
- address (text, nullable)
- qualification (string, nullable)
- subject_specialization (string, nullable)
- date_of_joining (date)
- status (enum: 'active', 'inactive') DEFAULT 'active'
- timestamps
```

#### Guardians Table
```sql
- id (PK)
- user_id (FK -> users.id) ON DELETE CASCADE
- phone_number (string)
- address (text, nullable)
- occupation (string, nullable)
- relationship (string)
- timestamps
```

#### Grades Table
```sql
- id (PK)
- name (string, unique) -- e.g., "Grade 1", "Pre-Primary 1"
- code (string, nullable, unique) -- e.g., "G1", "PP1"
- level (enum: 'ECD', 'LOWER PRIMARY', 'UPPER PRIMARY', 'JUNIOR SECONDARY')
- capacity (integer) DEFAULT 40
- description (text, nullable)
- status (enum: 'active', 'inactive') DEFAULT 'active'
- timestamps
```

**Grade Levels:**
- **ECD**: Early Childhood Development (Pre-Primary 1 & 2)
- **LOWER PRIMARY**: Grades 1-3
- **UPPER PRIMARY**: Grades 4-6
- **JUNIOR SECONDARY**: Grades 7-9

#### Subjects Table
```sql
- id (PK)
- name (string, unique)
- code (string, nullable, unique)
- category (enum: 'academic', 'islamic')
- status (enum: 'active', 'inactive') DEFAULT 'active'
- timestamps
```

**Subject Categories:**
- **Academic**: Mathematics, English, Kiswahili, Science, Social Studies, Creative Arts, Physical Education
- **Islamic**: Qur'an, Arabic, Islamic Studies, Hadith, Fiqh

#### Students Table
```sql
- id (PK)
- admission_number (string, unique)
- first_name (string)
- last_name (string)
- gender (enum: 'male', 'female')
- date_of_birth (date)
- guardian_id (FK -> guardians.id) ON DELETE CASCADE
- grade_id (FK -> grades.id, nullable) ON DELETE SET NULL
- class_name (string, nullable) -- Legacy field, synced with grade name
- enrollment_date (date)
- status (enum: 'active', 'inactive') DEFAULT 'active'
- timestamps
```

**Business Rule**: One student belongs to ONE grade at a time.

#### Grade-Teacher Pivot Table (grade_teacher)
```sql
- id (PK)
- grade_id (FK -> grades.id) ON DELETE CASCADE
- teacher_id (FK -> teachers.id) ON DELETE CASCADE
- is_class_teacher (boolean) DEFAULT false
- timestamps
- UNIQUE(grade_id, teacher_id)
```

**Business Rule**: Multiple teachers per grade, but only ONE class teacher per grade.

#### Grade-Subject Pivot Table (grade_subject)
```sql
- id (PK)
- grade_id (FK -> grades.id) ON DELETE CASCADE
- subject_id (FK -> subjects.id) ON DELETE CASCADE
- timestamps
- UNIQUE(grade_id, subject_id)
```

**Business Rule**: Subjects are assigned to grades (many-to-many).

#### Exams Table
```sql
- id (PK)
- name (string)
- exam_type (enum: 'opening', 'midterm', 'end_term')
- term (enum: '1', '2', '3')
- academic_year (integer)
- exam_date (date)
- grade_id (FK -> grades.id) ON DELETE CASCADE
- subject_id (FK -> subjects.id) ON DELETE CASCADE
- created_by (FK -> users.id) ON DELETE CASCADE
- deleted_at (timestamp, nullable) -- Soft deletes
- timestamps
- UNIQUE(grade_id, subject_id, term, exam_type, academic_year)
```

**Business Rules:**
- One exam per subject, per grade, per term, per exam type, per year
- Term 3 can ONLY have 'end_term' exams (no opening or midterm)
- Terms 1 & 2 can have: opening, midterm, and end_term exams

#### Exam Results Table
```sql
- id (PK)
- exam_id (FK -> exams.id) ON UPDATE CASCADE, ON DELETE RESTRICT
- student_id (FK -> students.id) ON DELETE CASCADE
- marks (decimal: 5,2) -- Range: 0.00 to 100.00
- timestamps
- UNIQUE(exam_id, student_id)
```

**Business Rule**: One result per student per exam.

#### Report Comments Table
```sql
- id (PK)
- student_id (FK -> students.id) ON DELETE CASCADE
- term (enum: '1', '2', '3')
- academic_year (integer)
- teacher_comment (text, nullable)
- teacher_comment_locked_at (timestamp, nullable)
- teacher_locked_by (FK -> users.id, nullable)
- headteacher_comment (text, nullable)
- headteacher_comment_locked_at (timestamp, nullable)
- headteacher_locked_by (FK -> users.id, nullable)
- timestamps
- UNIQUE(student_id, term, academic_year)
```

**Business Rules:**
- Comments are optional
- Once locked, comments cannot be edited
- Only class teachers can add/lock teacher comments
- Only admins can add/lock headteacher comments

#### Attendances Table
```sql
- id (PK)
- student_id (FK -> students.id) ON DELETE CASCADE
- grade_id (FK -> grades.id) ON DELETE CASCADE
- marked_by (FK -> users.id) ON DELETE CASCADE
- attendance_date (date)
- status (enum: 'present', 'absent', 'late', 'excused') DEFAULT 'present'
- remarks (text, nullable)
- timestamps
- UNIQUE(student_id, attendance_date)
- INDEX(grade_id, attendance_date)
- INDEX(student_id, attendance_date)
```

---

## Core Features

### 1. User Management
- Multi-role authentication (Admin, Teacher, Guardian)
- Role-based access control (RBAC)
- User profile management
- Password reset functionality

### 2. Grade Management
- Create and manage grades (PP1, PP2, G1-G9)
- Assign levels (ECD, Lower Primary, Upper Primary, Junior Secondary)
- Set grade capacity
- Assign multiple teachers to grades
- Designate class teachers

### 3. Subject Management
- Create academic and Islamic subjects
- Assign subjects to multiple grades
- Subject categorization (academic/islamic)
- Subject code management

### 4. Student Management
- Student registration with admission numbers
- Assign students to ONE grade
- Link students to guardians
- Filter students by grade, gender, status
- Search functionality

### 5. Teacher Management
- Teacher profiles with qualifications
- Assign teachers to multiple grades
- Designate class teachers
- View assigned students

### 6. Exam Management
- Create exams by: grade, subject, term, type, year
- Three exam types: Opening, Midterm, End-Term
- Term-specific rules (Term 3 = End-Term only)
- Enter marks for all students in a grade
- Real-time mark validation (0-100)
- Progress tracking

### 7. Report Card System
**Dynamic Generation (No storage):**
- Generate report cards on-demand
- Query exam results in real-time
- Display marks by subject category (Academic/Islamic)
- Calculate averages automatically
- Apply grading rubric
- Teacher and headteacher comments
- Lockable comments
- Print-friendly format

---

## Module Details

### Grade Module

#### Grade Model Relationships
```php
// Grade.php
public function subjects() {
    return $this->belongsToMany(Subject::class);
}

public function teachers() {
    return $this->belongsToMany(Teacher::class)
                ->withPivot('is_class_teacher')
                ->withTimestamps();
}

public function students() {
    return $this->hasMany(Student::class);
}

public function exams() {
    return $this->hasMany(Exam::class);
}

// Constants
const LEVELS = [
    'ECD' => 'Early Childhood Development',
    'LOWER PRIMARY' => 'Lower Primary (Grade 1-3)',
    'UPPER PRIMARY' => 'Upper Primary (Grade 4-6)',
    'JUNIOR SECONDARY' => 'Junior Secondary (Grade 7-9)',
];
```

#### Grade Controller Methods
- `index()` - List all grades with filters (search, level)
- `create()` - Show form with subjects and teachers
- `store()` - Create grade with subject and teacher assignments
- `show()` - Display grade details with students and teachers
- `edit()` - Edit grade with current assignments
- `update()` - Update grade and sync relationships
- `destroy()` - Delete grade (soft delete recommended)

#### Grade Pages (React/Inertia)
1. **Index** (`/grades`)
   - Grid display with cards
   - Search by name/code
   - Filter by level dropdown
   - Shows: student count, subject count, status badge
   - Actions: View, Edit, Delete

2. **Create** (`/grades/create`)
   - Grade name and code
   - Level dropdown (4 options)
   - Capacity (default: 40)
   - Description (optional)
   - Status (active/inactive)
   - Multi-select subjects (grouped by category)
   - Multi-select teachers
   - Designate class teacher

3. **Edit** (`/grades/{id}/edit`)
   - Same as create, pre-filled with existing data
   - Shows warning if grade has students/exams

4. **Show** (`/grades/{id}`)
   - Grade information card
   - List of assigned subjects (grouped by category)
   - List of assigned teachers (class teacher highlighted)
   - List of students
   - Statistics: total students, total subjects

### Subject Module

#### Subject Model Relationships
```php
// Subject.php
public function grades() {
    return $this->belongsToMany(Grade::class);
}

public function exams() {
    return $this->hasMany(Exam::class);
}
```

#### Subject Controller Methods
- `index()` - List subjects with filters (search, category)
- `create()` - Show creation form
- `store()` - Create subject
- `show()` - Display subject with assigned grades
- `edit()` - Edit subject
- `update()` - Update subject
- `destroy()` - Delete subject (check for exams first)

#### Subject Pages
1. **Index** (`/subjects`)
   - Table view with category badges
   - Filter by category (academic/islamic)
   - Search functionality
   - Shows: grade count

2. **Create/Edit** (`/subjects/create`, `/subjects/{id}/edit`)
   - Subject name
   - Subject code (optional)
   - Category (academic/islamic)
   - Status

3. **Show** (`/subjects/{id}`)
   - Subject details
   - List of grades using this subject
   - Statistics

### Student Module

#### Student Model Relationships
```php
// Student.php
public function grade() {
    return $this->belongsTo(Grade::class);
}

public function guardian() {
    return $this->belongsTo(Guardian::class);
}

public function examResults() {
    return $this->hasMany(ExamResult::class);
}

public function attendances() {
    return $this->hasMany(Attendance::class);
}

public function reportComments() {
    return $this->hasMany(ReportComment::class);
}

// Accessor
public function getFullNameAttribute() {
    return "{$this->first_name} {$this->last_name}";
}
```

#### Student Controller Methods
- `index()` - List students with filters (search, grade, gender, status)
- `create()` - Show form with guardians and grades
- `store()` - Create student (auto-sync class_name from grade)
- `show()` - Display student profile with recent attendance
- `edit()` - Edit student
- `update()` - Update student (auto-sync class_name)
- `destroy()` - Delete student

#### Student Pages
1. **Index** (`/students`)
   - Table view with avatars
   - Multi-filter: search, grade, gender, status
   - Pagination
   - Actions: View, Edit, Delete, **Generate Report**
   - Shows: admission number, name, grade, guardian

2. **Create** (`/students/create`)
   - Personal info: admission number, first/last name, gender, DOB
   - Academic info: **Grade dropdown** (single selection), enrollment date
   - Guardian selection (dropdown with phone numbers)
   - Status

3. **Edit** (`/students/{id}/edit`)
   - Same as create
   - Can change grade (student transfers)

4. **Show** (`/students/{id}`)
   - Student profile card
   - Recent attendance (last 10)
   - Grade information
   - Guardian information
   - **Generate Report** button

### Exam Module

#### Exam Model Relationships
```php
// Exam.php
public function grade() {
    return $this->belongsTo(Grade::class);
}

public function subject() {
    return $this->belongsTo(Subject::class);
}

public function creator() {
    return $this->belongsTo(User::class, 'created_by');
}

public function results() {
    return $this->hasMany(ExamResult::class);
}

// Helper Methods
public function hasResults() {
    return $this->results()->exists();
}

public function getExamTypeNameAttribute() {
    return match($this->exam_type) {
        'opening' => 'Opening Exam',
        'midterm' => 'Mid-Term Exam',
        'end_term' => 'End of Term Exam',
    };
}
```

#### Exam Controller Methods
- `index()` - List exams with filters (search, grade, term, year, type)
- `create()` - Show form (grades and subjects loaded dynamically)
- `store()` - Create exam (validate uniqueness and term rules)
- `show()` - Display exam with results progress
- `edit()` - Edit exam (with warnings if results exist)
- `update()` - Update exam (warn about impact on reports)
- `destroy()` - Delete exam (prevent if results exist)

#### Exam Pages
1. **Index** (`/exams`)
   - Table view with badges
   - Multi-filter: search, grade, term, year, exam type
   - Shows: exam name, grade, subject, type, term, year, date
   - Actions: View, Edit, Delete
   - Link to enter marks

2. **Create** (`/exams/create`)
   - Academic year (default: current year)
   - Term (1, 2, 3)
   - Exam type (opening, midterm, end_term)
   - Grade selection
   - **Subject loads dynamically** based on grade (via API)
   - Exam date
   - Auto-generated name (can be edited)
   - **Term 3 restriction**: Locks exam_type to 'end_term'

3. **Edit** (`/exams/{id}/edit`)
   - Same as create
   - Warning if exam has results
   - Cannot change if results locked

4. **Show** (`/exams/{id}`)
   - Exam details card
   - Results progress (entered/total, percentage)
   - Progress bar
   - Recent results preview (top 10)
   - **"Enter Marks"** button

### Exam Results Module

#### ExamResult Model
```php
// ExamResult.php
public function exam() {
    return $this->belongsTo(Exam::class);
}

public function student() {
    return $this->belongsTo(Student::class);
}

// Accessors
public function getRubricAttribute() {
    if ($this->marks >= 90) return 'EE'; // Exceeding Expectation
    if ($this->marks >= 75) return 'ME'; // Meeting Expectation
    if ($this->marks >= 50) return 'AE'; // Approaching Expectation
    return 'BE'; // Below Expectation
}

public function getRubricColorAttribute() {
    if ($this->marks >= 90) return 'green';
    if ($this->marks >= 75) return 'blue';
    if ($this->marks >= 50) return 'yellow';
    return 'red';
}
```

#### ExamResult Controller Methods
- `index(Exam $exam)` - Show marks entry form for all students
- `store(Request $request, Exam $exam)` - Save/update marks for multiple students

#### Exam Results Page (`/exams/{exam}/results`)
**Features:**
- Lists all students in the grade
- Input fields for each student (0-100 validation)
- Real-time rubric display
- Color-coded cells based on marks
- Progress indicator (how many marks entered)
- Bulk save (saves all entered marks at once)
- Success indicators after save
- Grading rubric reference at bottom

**UX Details:**
- Can enter partial marks (doesn't require all students)
- Marks validated: min=0, max=100, allows decimals
- Shows student: avatar, admission number, name
- Auto-calculates rubric as you type
- Green checkmark shows on saved students

### Report Module

#### Report Generation (Dynamic, No Storage)

**Controller Method:**
```php
public function generate(Request $request) {
    // Validate input (student_id, term, academic_year)
    // Load student with relationships
    // Check authorization
    // Generate report data by querying exam results
    // Return Inertia view with data
}
```

**Report Data Structure:**
```php
[
    'academic_subjects' => [
        [
            'id' => 1,
            'name' => 'Mathematics',
            'opening' => 85.00,
            'midterm' => 90.00,
            'end_term' => 88.00,
            'average' => 87.67,
            'rubric' => 'ME',
        ],
        // ... more subjects
    ],
    'islamic_subjects' => [
        // Same structure
    ],
    'overall_average' => 85.50,
    'overall_rubric' => 'ME',
    'comments' => [
        'teacher_comment' => '...',
        'teacher_comment_locked_at' => '2025-01-15 10:30:00',
        'teacher_locked_by' => User object,
        'headteacher_comment' => '...',
        'headteacher_comment_locked_at' => null,
        'headteacher_locked_by' => null,
    ],
]
```

**Report Generation Flow:**
1. User clicks "Generate Report" button (from Students page)
2. Modal opens asking for: Term (1/2/3), Academic Year
3. User clicks "Generate"
4. POST request to `/reports/generate`
5. Controller queries all exams for that student, term, year
6. Organizes results by subject and exam type
7. Calculates averages
8. Loads comments (if exist)
9. Returns Inertia view with data

**Report Card Display:**
- School header with logo
- Student information (name, admission no, grade, term, year)
- Academic subjects table with columns:
  - Subject name
  - Opening marks
  - Midterm marks
  - End-Term marks
  - Average
  - Rubric
- Islamic subjects table (same structure)
- Overall performance summary
- Teacher comment section (editable by class teacher)
- Headteacher comment section (editable by admin)
- Grading rubric key
- Signature lines (print only)
- Print button

**Grading Rubric:**
- **EE (Exceeding Expectation)**: 90-100%
- **ME (Meeting Expectation)**: 75-89%
- **AE (Approaching Expectation)**: 50-74%
- **BE (Below Expectation)**: 0-49%

#### Report Comments Management

**Adding Comments:**
- Class teachers can add teacher comments
- Admins can add both teacher and headteacher comments
- Comments are optional
- Maximum 1000 characters
- Saved immediately

**Locking Comments:**
- Once locked, comments become read-only
- Records who locked and when
- Only unlockers: same person who locked, or admin
- Prevents accidental edits after report distribution

---

## API Endpoints

### Authentication
```
POST   /login                    - User login
POST   /register                 - User registration (admin only in production)
POST   /logout                   - User logout
POST   /forgot-password          - Password reset request
POST   /reset-password           - Password reset
```

### Users
```
GET    /users                    - List users (admin only)
POST   /users                    - Create user (admin only)
GET    /users/{id}               - View user (admin or self)
PUT    /users/{id}               - Update user (admin or self)
DELETE /users/{id}               - Delete user (admin only)
```

### Grades
```
GET    /grades                   - List grades (filtered by role)
POST   /grades                   - Create grade (admin only)
GET    /grades/create            - Show create form (admin only)
GET    /grades/{id}              - View grade details
PUT    /grades/{id}              - Update grade (admin only)
DELETE /grades/{id}              - Delete grade (admin only)
GET    /grades/{id}/edit         - Show edit form (admin only)
```

### Subjects
```
GET    /subjects                 - List subjects
POST   /subjects                 - Create subject (admin only)
GET    /subjects/create          - Show create form (admin only)
GET    /subjects/{id}            - View subject details
PUT    /subjects/{id}            - Update subject (admin only)
DELETE /subjects/{id}            - Delete subject (admin only)
GET    /subjects/{id}/edit       - Show edit form (admin only)
```

### Students
```
GET    /students                 - List students (filtered by role)
POST   /students                 - Create student (admin only)
GET    /students/create          - Show create form (admin only)
GET    /students/{id}            - View student profile
PUT    /students/{id}            - Update student (admin only)
DELETE /students/{id}            - Delete student (admin only)
GET    /students/{id}/edit       - Show edit form (admin only)
```

### Teachers
```
GET    /teachers                 - List teachers
POST   /teachers                 - Create teacher (admin only)
GET    /teachers/create          - Show create form (admin only)
GET    /teachers/{id}            - View teacher profile
PUT    /teachers/{id}            - Update teacher (admin only)
DELETE /teachers/{id}            - Delete teacher (admin only)
GET    /teachers/{id}/edit       - Show edit form (admin only)
```

### Guardians
```
GET    /guardians                - List guardians
POST   /guardians                - Create guardian (admin only)
GET    /guardians/create         - Show create form (admin only)
GET    /guardians/{id}           - View guardian profile
PUT    /guardians/{id}           - Update guardian (admin only)
DELETE /guardians/{id}           - Delete guardian (admin only)
GET    /guardians/{id}/edit      - Show edit form (admin only)
```

### Exams
```
GET    /exams                    - List exams (filtered by role)
POST   /exams                    - Create exam (admin, teacher)
GET    /exams/create             - Show create form (admin, teacher)
GET    /exams/{id}               - View exam details
PUT    /exams/{id}               - Update exam (admin, teacher)
DELETE /exams/{id}               - Delete exam (admin)
GET    /exams/{id}/edit          - Show edit form (admin, teacher)
```

### Exam Results
```
GET    /exams/{exam}/results     - Show marks entry form (admin, teacher)
POST   /exams/{exam}/results     - Save marks (admin, teacher)
PUT    /exam-results/{id}        - Update individual result (admin, teacher)
```

### Reports
```
POST   /reports/generate         - Generate report card (all roles)
POST   /reports/students/{student}/comments        - Save comment
POST   /reports/students/{student}/comments/lock   - Lock comment
```

### API Routes (AJAX)
```
GET    /api/grades/{grade}/subjects  - Get subjects for a grade
```

---

## Frontend Components

### Shared Components

#### AuthenticatedLayout
```jsx
// Layout wrapper with navigation
Props: { header: string }
Features:
- Top navigation bar with user menu
- Sidebar navigation (role-based links)
- Breadcrumbs
- Flash messages
- Responsive design
```

#### ConfirmationModal
```jsx
// Reusable confirmation dialog
Props: {
  show: boolean,
  onClose: function,
  onConfirm: function,
  title: string,
  message: string,
  confirmText: string,
  type: 'danger' | 'warning' | 'info'
}
```

### Page Components Structure

**Standard CRUD Page Structure:**
```
Pages/
  ModuleName/
    Index.jsx      - List view with filters
    Create.jsx     - Creation form
    Edit.jsx       - Edit form
    Show.jsx       - Detail view
```

**Common Features Across Pages:**
- Search functionality
- Filtering (dropdowns, date pickers)
- Pagination
- Action buttons (View, Edit, Delete)
- Responsive tables/grids
- Loading states
- Error handling
- Success messages

### Styling Conventions

**Color Palette:**
- Primary (Orange): `#F97316` - Main actions, active states
- Orange Dark: `#EA580C` - Hover states
- Success (Green): `#10B981` - Success messages, positive actions
- Warning (Yellow): `#F59E0B` - Warnings, attention
- Danger (Red): `#EF4444` - Destructive actions, errors
- Info (Blue): `#3B82F6` - Information, secondary actions
- Gray Scale: Tailwind defaults for text and backgrounds

**Typography:**
- Headings: `font-bold` with size classes (`text-2xl`, `text-xl`, etc.)
- Body: Default Tailwind sans-serif
- Code: Monospace for admission numbers, codes

**Spacing:**
- Container padding: `p-6` standard
- Card spacing: `space-y-6` for vertical rhythm
- Grid gaps: `gap-4` or `gap-6`

**Responsive Design:**
- Mobile-first approach
- Breakpoints: `sm:`, `md:`, `lg:`, `xl:`
- Grid: 1 column mobile, 2-3 columns desktop

---

## Business Logic

### Exam System Rules

#### Term-Based Restrictions
```
Term 1:
  - Can have: Opening, Midterm, End-Term exams
  
Term 2:
  - Can have: Opening, Midterm, End-Term exams
  
Term 3:
  - Can ONLY have: End-Term exams
  - Opening and Midterm are blocked
```

#### Exam Uniqueness
One exam per combination of:
- Grade
- Subject
- Term
- Exam Type
- Academic Year

**Example:**
- ✅ Allowed: Grade 1, Math, Term 1, Opening, 2025
- ✅ Allowed: Grade 1, Math, Term 1, Midterm, 2025
- ❌ Not Allowed: Grade 1, Math, Term 1, Opening, 2025 (duplicate)

#### Marks Validation
- Range: 0.00 to 100.00
- Decimal places: 2
- Required: Yes
- Null allowed: No (but can be entered later)

### Report Generation Logic

#### Average Calculation
```
For each subject:
  average = (opening + midterm + end_term) / count_of_non_null_marks
  
For overall:
  overall_average = sum_of_all_subject_averages / count_of_subjects_with_marks
```

**Examples:**
```
Subject A: Opening=80, Midterm=85, End-Term=90
Average = (80 + 85 + 90) / 3 = 85.00

Subject B: Opening=75, Midterm=null, End-Term=80
Average = (75 + 80) / 2 = 77.50

Overall: Subject A=85, Subject B=77.50, Subject C=90
Overall Average = (85 + 77.50 + 90) / 3 = 84.17
```

#### Rubric Assignment
```php
function getRubric($marks) {
    if ($marks >= 90) return 'EE'; // Exceeding Expectation
    if ($marks >= 75) return 'ME'; // Meeting Expectation
    if ($marks >= 50) return 'AE'; // Approaching Expectation
    return 'BE'; // Below Expectation
}
```

### Authorization Logic

#### Policy Structure
Each model has a Policy class defining:
- `viewAny` - Can view list
- `view` - Can view single record
- `create` - Can create new record
- `update` - Can update record
- `delete` - Can delete record

**Example: Exam Policy**
```php
public function create(User $user) {
    return $user->isAdmin() || $user->isTeacher();
}

public function update(User $user, Exam $exam) {
    if ($user->isAdmin()) return true;
    
    if ($user->isTeacher()) {
        // Check if teacher is assigned to the exam's grade
        return $user->teacher->grades->contains($exam->grade_id);
    }
    
    return false;
}
```

#### Middleware
```php
Route::middleware(['auth'])->group(function () {
    // Authenticated routes
});

Route::middleware(['auth', 'role:admin'])->group(function () {
    // Admin-only routes
});
```

---

## Setup & Installation

### Prerequisites
- PHP 8.2 or higher
- Composer
- Node.js 18+ and NPM
- SQLite (development) or MySQL/PostgreSQL (production)

### Installation Steps

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd schoolMS
   ```

2. **Install PHP Dependencies**
   ```bash
   composer install
   ```

3. **Install JavaScript Dependencies**
   ```bash
   npm install
   ```

4. **Environment Setup**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

5. **Database Configuration**
   
   For SQLite (development):
   ```bash
   touch database/database.sqlite
   ```
   
   Update `.env`:
   ```
   DB_CONNECTION=sqlite
   DB_DATABASE=/absolute/path/to/database/database.sqlite
   ```

6. **Run Migrations**
   ```bash
   php artisan migrate
   ```

7. **Seed Database**
   ```bash
   php artisan db:seed
   ```
   
   This creates:
   - 1 Admin user
   - 3 Teacher users
   - 1 Guardian user
   - 11 Grades (PP1, PP2, G1-G9)
   - 12 Subjects (7 Academic, 5 Islamic)
   - 5 Sample students

8. **Build Assets**
   ```bash
   npm run dev    # Development
   npm run build  # Production
   ```

9. **Start Server**
   ```bash
   php artisan serve
   ```

10. **Access Application**
    ```
    http://localhost:8000
    ```

### Default Credentials
```
Admin:
  Email: admin@school.com
  Password: password

Teacher 1:
  Email: teacher@school.com
  Password: password

Teacher 2:
  Email: teacher2@school.com
  Password: password

Teacher 3:
  Email: teacher3@school.com
  Password: password

Guardian:
  Email: guardian@school.com
  Password: password
```

### Seeded Data
- **Grades**: PP1, PP2, G1, G2, G3, G4, G5, G6, G7, G8, G9
- **Subjects**: Math, English, Kiswahili, Science, Social Studies, Creative Arts, PE, Qur'an, Arabic, Islamic Studies, Hadith, Fiqh
- **Teacher Assignments**:
  - Teacher 1: Grade 1 (Class Teacher), Grade 2
  - Teacher 2: Grade 3 (Class Teacher), Grade 4
  - Teacher 3: PP1 (Class Teacher), PP2
- **Students**: 5 sample students across different grades

---

## Development Workflow

### Creating a New Feature

1. **Backend (Laravel)**
   ```bash
   # Create migration
   php artisan make:migration create_table_name
   
   # Create model with migration
   php artisan make:model ModelName -m
   
   # Create controller
   php artisan make:controller ModelNameController --resource
   
   # Create policy
   php artisan make:policy ModelNamePolicy --model=ModelName
   
   # Create seeder
   php artisan make:seeder ModelNameSeeder
   ```

2. **Run Migration**
   ```bash
   php artisan migrate
   ```

3. **Frontend (React/Inertia)**
   ```bash
   # Create page components in resources/js/Pages/
   # Follow naming convention: ModuleName/Action.jsx
   ```

4. **Add Routes**
   ```php
   // routes/web.php
   Route::resource('resource-name', ResourceController::class);
   ```

5. **Register Policy**
   ```php
   // app/Providers/AuthServiceProvider.php
   protected $policies = [
       ModelName::class => ModelNamePolicy::class,
   ];
   ```

### Common Artisan Commands

```bash
# Clear caches
php artisan config:clear
php artisan route:clear
php artisan cache:clear
php artisan view:clear

# Fresh migration with seeding
php artisan migrate:fresh --seed

# Run specific seeder
php artisan db:seed --class=SeederName

# List routes
php artisan route:list

# List routes filtered
php artisan route:list | grep exam
```

---

## Testing Guide

### Manual Testing Checklist

#### User Management
- [ ] Login with each role (admin, teacher, guardian)
- [ ] Verify role-based navigation menu
- [ ] Test unauthorized access (403 errors)

#### Grade Management
- [ ] Create grade with subjects and teachers
- [ ] Edit grade and update assignments
- [ ] View grade details
- [ ] Delete grade (check constraints)
- [ ] Filter grades by level
- [ ] Search grades

#### Subject Management
- [ ] Create academic subject
- [ ] Create Islamic subject
- [ ] Assign subjects to grades
- [ ] View subject with assigned grades

#### Student Management
- [ ] Register new student
- [ ] Assign student to grade
- [ ] Link student to guardian
- [ ] Edit student and change grade
- [ ] Filter students by grade
- [ ] Search students

#### Exam Management
- [ ] Create Term 1 Opening exam
- [ ] Create Term 1 Midterm exam
- [ ] Create Term 1 End-Term exam
- [ ] Try creating duplicate exam (should fail)
- [ ] Try creating Term 3 Opening exam (should fail)
- [ ] Filter exams by grade, term, year

#### Exam Results
- [ ] Enter marks for all students
- [ ] Save partial marks (some students)
- [ ] Edit existing marks
- [ ] Verify rubric calculation
- [ ] Check validation (0-100 range)

#### Report Generation
- [ ] Generate Term 1 report
- [ ] Verify all marks display correctly
- [ ] Check average calculations
- [ ] Verify rubric assignments
- [ ] Add teacher comment (as class teacher)
- [ ] Add headteacher comment (as admin)
- [ ] Lock comments
- [ ] Try editing locked comment (should fail)
- [ ] Print report (check formatting)
- [ ] Generate report as guardian (read-only)

### Test Data Scenarios

**Scenario 1: Complete Term Flow**
1. Create all exams for Grade 1, Math, Term 1
2. Enter marks for all students
3. Generate report for a student
4. Verify marks display correctly
5. Add comments
6. Lock comments
7. Print report

**Scenario 2: Partial Marks**
1. Create exam
2. Enter marks for only 50% of students
3. Generate report
4. Verify students without marks show "-"

**Scenario 3: Student Transfer**
1. Create student in Grade 1
2. Enter marks for Term 1
3. Transfer student to Grade 2
4. Create new exams in Grade 2
5. Verify old marks still accessible

---

## Troubleshooting

### Common Issues

**1. Subjects not loading in Exam Create form**
- Check API route: `GET /api/grades/{grade}/subjects`
- Verify grade has assigned subjects
- Check browser console for errors

**2. Cannot save exam marks**
- Verify marks are between 0-100
- Check exam exists and isn't deleted
- Verify user has permission (teacher/admin)

**3. Report shows no data**
- Verify exams exist for that term/year
- Check student has exam results
- Confirm grade has subjects assigned

**4. Comments not saving**
- Verify user is class teacher (for teacher comments)
- Verify user is admin (for headteacher comments)
- Check comment isn't locked
- Verify comment length < 1000 characters

**5. Teacher cannot see students**
- Verify teacher is assigned to grade
- Check grade_teacher pivot table
- Confirm students have grade_id set

**6. Guardian cannot see children**
- Verify students have guardian_id set
- Check guardian user_id matches logged-in user

### Debug Mode
Enable detailed error messages:
```
# .env
APP_DEBUG=true
APP_ENV=local
```

### Logs
Check Laravel logs:
```bash
tail -f storage/logs/laravel.log
```

---

## Future Enhancements

### Planned Features
1. **Attendance Module**
   - Daily attendance marking
   - Attendance reports
   - Automated notifications to guardians

2. **Fee Management**
   - Fee structure setup
   - Invoice generation
   - Payment tracking
   - Receipt printing

3. **Notifications**
   - Email notifications for low marks
   - SMS notifications for absent students
   - Report card availability alerts

4. **Advanced Reports**
   - Class performance analytics
   - Subject-wise analysis
   - Trend analysis over terms
   - Comparative reports

5. **Time Table Management**
   - Create time tables
   - Assign teachers to periods
   - Room allocation

6. **Library Management**
   - Book inventory
   - Issue/return tracking
   - Fine calculation

7. **Health Records**
   - Medical information
   - Immunization tracking
   - Emergency contacts

8. **Parent Portal**
   - Real-time grade viewing
   - Attendance monitoring
   - Fee payment online
   - Teacher communication

### Technical Improvements
1. **PDF Generation**
   - DomPDF integration for report cards
   - Bulk report generation
   - Email delivery

2. **API Development**
   - RESTful API for mobile apps
   - API authentication (Sanctum)
   - Rate limiting

3. **Performance Optimization**
   - Query optimization
   - Caching (Redis)
   - Eager loading improvements

4. **Security Enhancements**
   - Two-factor authentication
   - Activity logging
   - Role permissions management

5. **Testing**
   - Unit tests
   - Feature tests
   - Browser tests (Dusk)

---

## Maintenance

### Database Backup
```bash
# SQLite
cp database/database.sqlite database/backups/backup-$(date +%Y%m%d).sqlite

# MySQL
mysqldump -u username -p database_name > backup-$(date +%Y%m%d).sql
```

### Backup Schedule
- Daily: Automatic database backup
- Weekly: Full system backup
- Monthly: Archived backups

### Update Procedure
1. Backup database
2. Pull latest code
3. Run `composer install`
4. Run `npm install`
5. Run migrations: `php artisan migrate`
6. Clear caches
7. Build assets: `npm run build`
8. Test critical features

---

## Support & Documentation

### Internal Documentation
- This file: Complete system overview
- Code comments: Inline documentation
- PHPDoc blocks: Method documentation

### External Resources
- Laravel Docs: https://laravel.com/docs
- Inertia.js Docs: https://inertiajs.com
- React Docs: https://react.dev
- Tailwind CSS: https://tailwindcss.com

### Getting Help
1. Check this documentation
2. Review Laravel logs
3. Check browser console for frontend errors
4. Review database queries (Laravel Telescope recommended)
5. Consult team lead

---

## Glossary

**Terms:**
- **CBC**: Competency-Based Curriculum (Kenyan education system)
- **ECD**: Early Childhood Development
- **Rubric**: Performance level descriptor (EE, ME, AE, BE)
- **Class Teacher**: Primary teacher responsible for a grade
- **Academic Year**: Calendar year (e.g., 2025)
- **Term**: One of three periods in an academic year
- **Pivot Table**: Junction table for many-to-many relationships

**Abbreviations:**
- **EE**: Exceeding Expectation
- **ME**: Meeting Expectation
- **AE**: Approaching Expectation
- **BE**: Below Expectation
- **PP**: Pre-Primary
- **G**: Grade (e.g., G1 = Grade 1)

---

## Changelog

### Version 1.0.0 (Current)
- Initial system development
- Complete user management
- Grade, subject, student CRUD
- Exam creation and management
- Marks entry system
- Dynamic report card generation
- Comment system with locking
- Print-friendly reports

### Recent Updates (This Session)
- Fixed grade level enum (4 levels)
- Added grade code field
- Implemented subject-grade assignments
- Implemented teacher-grade assignments
- Added class teacher designation
- Updated student to single grade assignment
- Completed exam system with term rules
- Implemented marks entry interface
- Built dynamic report generation
- Added comment system with permissions
- Created print-friendly report layout

---

## Credits

**Development Team:**
- System Architecture: [Your Name]
- Backend Development: Laravel 11 + PHP 8.2
- Frontend Development: React 18 + Inertia.js
- UI/UX Design: Tailwind CSS + Lucide Icons

**Special Thanks:**
- Anthropic Claude AI for development assistance
- Laravel community for excellent documentation
- Inertia.js team for seamless React-Laravel integration

---

**Last Updated:** November 1, 2025  
**Version:** 1.0.0  
**Status:** Production Ready (Pending Report Card UI Refinement)

---

*This documentation is maintained as a living document and should be updated with each significant system change.*