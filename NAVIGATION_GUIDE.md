# 🧭 Navigation Guide - School Management System

## Quick Access URLs

After logging in as an admin, you can access these pages directly:

### 📚 Core Entities

| Entity | List View | Create New |
|--------|-----------|------------|
| **Subjects** | `/subjects` | `/subjects/create` |
| **Teachers** | `/teachers` | `/teachers/create` |
| **Guardians** | `/guardians` | `/guardians/create` |
| **Grades** | `/grades` | `/grades/create` |
| **Streams** | `/streams` | `/streams/create` |
| **Students** | `/students` | `/students/create` |
| **Rooms** | `/rooms` | `/rooms/create` |

### 📊 Academic Operations

| Feature | URL |
|---------|-----|
| **Attendance** | `/attendance` |
| **Exams** | `/exams` |
| **Exam Results** | `/exams/{exam_id}/results` |
| **Reports** | `/reports` |

### ⏰ Timetable Management

| Feature | URL |
|---------|-----|
| **Blueprints** | `/timetables/blueprints` |
| **Templates** | `/timetables/templates` |
| **Periods** | `/timetables/periods` |
| **Rooms** | `/timetables/rooms` |
| **Slots** | `/timetables/slots` |

### ⚙️ Settings

| Setting | URL |
|---------|-----|
| **Academic Settings** | `/settings/academic` |
| **School Profile** | `/settings/school` |
| **Users** | `/users` |

---

## 🎯 Step-by-Step Navigation for Setup

### STEP 1: Create Rooms (Optional)

1. Click **"Timetables"** in the sidebar
2. Click **"Rooms"**
3. Click **"Create Room"** button
4. Fill in the form
5. Click **"Save"**

**Direct URL:** `/rooms/create`

---

### STEP 2: Create Subjects

1. Click **"Subjects"** in the sidebar
2. Click **"Create Subject"** button
3. Fill in:
   - Subject Name
   - Category (academic/islamic)
   - Subject Code (optional)
   - Status (active)
4. Click **"Save"**

**Direct URL:** `/subjects/create`

**Tips:**
- You can assign subjects to grades later
- Create all your subjects first before creating grades

---

### STEP 3: Create Teachers

1. Click **"Teachers"** in the sidebar
2. Click **"Create Teacher"** button
3. Fill in:
   - Full Name
   - Email (unique)
   - Phone Number
   - Employee Number
   - Date of Joining
   - Subject Specialization (select from subjects)
   - Status (active)
4. Click **"Save"**

**Direct URL:** `/teachers/create`

**Important:**
- A user account is automatically created
- Teachers can log in with their email
- You can assign teachers to grades later

---

### STEP 4: Create Guardians

1. Click **"Guardians"** in the sidebar
2. Click **"Create Guardian"** button
3. Fill in:
   - Full Name
   - Email (unique)
   - Phone Number
   - Guardian Number
   - Relationship (father/mother/guardian/other)
   - Status (active)
4. Click **"Save"**

**Direct URL:** `/guardians/create`

**Important:**
- A user account is automatically created
- Guardians can log in to view their children's progress

---

### STEP 5: Create Grades

1. Click **"Grades"** in the sidebar
2. Click **"Create Grade"** button
3. Fill in:
   - Grade Name (e.g., "Grade 1")
   - Grade Code (e.g., "G1")
   - Level (ECD/Lower Primary/Upper Primary/Junior Secondary)
   - Default Room (optional)
   - Status (active)
4. **Assign Teachers:**
   - Select at least 1 teacher
   - Designate one as Class Teacher (required)
5. **Assign Subjects (optional):**
   - Select subjects from the list
   - You can configure curriculum rules later
6. Click **"Save"**

**Direct URL:** `/grades/create`

**Important:**
- You MUST assign at least one teacher
- You MUST designate a class teacher
- Subjects can be assigned now or later

---

### STEP 6: Configure Subject Curriculum Rules (Important for Timetables)

1. Click **"Grades"** in the sidebar
2. Click on a grade to view details
3. Click **"Edit"** button
4. Scroll to **"Subjects"** section
5. For each subject, set:
   - **Sessions per week** (e.g., 5 for Math)
   - **Priority:**
     - `high` = Morning slots (Math, English, Science)
     - `neutral` = Anytime (Social Studies)
     - `low` = Afternoon slots (Art, Music, PE)
   - **Must be daily** (optional)
   - **Can repeat same day** (optional)
6. Click **"Save"**

**Direct URL:** `/grades/{grade_id}/edit`

**Example Configuration:**
```
Mathematics: 5 sessions/week, priority: high
English: 5 sessions/week, priority: high
Science: 4 sessions/week, priority: high
Kiswahili: 4 sessions/week, priority: neutral
Social Studies: 3 sessions/week, priority: neutral
Art: 2 sessions/week, priority: low
Music: 2 sessions/week, priority: low
PE: 2 sessions/week, priority: low
```

---

### STEP 7: Create Streams

1. Click **"Settings"** in the sidebar (or navigate to `/streams`)
2. Click **"Streams"**
3. Click **"Create Stream"** button
4. Fill in:
   - Grade (select from dropdown)
   - Stream Name (e.g., "Main", "North", "South")
   - Stream Code (e.g., "G1-N")
   - Capacity (number of students)
   - Room (optional)
   - Status (active)
5. Click **"Save"**

**Direct URL:** `/streams/create`

**Recommended:**
- Create at least one stream per grade (usually "Main")
- For multiple streams, use "North", "South", "East", "West" or "A", "B", "C", "D"

---

### STEP 8: Create Students

1. Click **"Students"** in the sidebar
2. Click **"Create Student"** button
3. Fill in:
   - First Name
   - Last Name
   - Gender
   - Date of Birth
   - Guardian (select from dropdown)
   - **Stream** (select stream - this automatically assigns the grade)
   - Admission Number
   - Enrollment Date
   - Status (active)
4. Click **"Save"**

**Direct URL:** `/students/create`

**Important:**
- Students are assigned to STREAMS, not grades
- The grade is automatically determined by the stream
- Each student must have a guardian

---

### STEP 9: Mark Attendance

1. Click **"Attendance"** in the sidebar
2. Select **Date** (default: today)
3. Select **Stream** (not grade!)
4. View list of students in that stream
5. Mark each student as:
   - Present
   - Absent
   - Late
   - Excused
6. Add remarks if needed
7. Click **"Save Attendance"**

**Direct URL:** `/attendance`

**Tips:**
- Attendance is marked per stream
- You can view attendance reports by clicking "Reports"
- You can view individual student attendance history

---

### STEP 10: Create Exams

1. Click **"Exams"** in the sidebar
2. Click **"Create Exam"** button
3. Fill in:
   - Exam Name (e.g., "Mid-Term Math Exam")
   - Exam Type (mid-term/end-term/quiz/assignment)
   - Term (1, 2, 3)
   - Academic Year (e.g., 2024)
   - Exam Date
   - **Stream** (select stream)
   - Subject (select from subjects assigned to the grade)
   - Total Marks
   - Pass Mark
   - Duration
4. Click **"Save"**

**Direct URL:** `/exams/create`

**Important:**
- Exams are created per stream
- If you have multiple streams, create separate exams for each
- You can enter results after creating the exam

---

### STEP 11: Enter Exam Results

1. Click **"Exams"** in the sidebar
2. Click on an exam to view details
3. Click **"Enter Results"** button
4. Enter marks for each student
5. Click **"Save Results"**

**Direct URL:** `/exams/{exam_id}/results`

---

### STEP 12: Create Timetables

#### 12.1: Create Level Blueprint (One-time setup)

1. Click **"Timetables"** in the sidebar
2. Click **"Blueprints"**
3. Click **"Create Blueprint"** button
4. Fill in:
   - Blueprint Name (e.g., "Lower Primary Schedule")
   - Level (ECD/Lower Primary/Upper Primary/Junior Secondary)
   - Status (active)
5. **Define Periods:**
   - Add time blocks (e.g., 8:00-8:40)
   - Mark which are teachable (lessons)
   - Mark which are non-teachable (break, lunch, assembly)
   - Set priority bands (morning_high, neutral, afternoon_low)
6. Click **"Save"**

**Direct URL:** `/timetables/blueprints/create`

#### 12.2: Generate Periods from Blueprint

1. Go to **Timetables → Blueprints**
2. Click on a blueprint
3. Click **"Generate Periods"** button
4. Confirm

**Direct URL:** `/timetables/blueprints/{blueprint_id}`

#### 12.3: Create Timetable Template

1. Click **"Timetables"** in the sidebar
2. Click **"Templates"**
3. Click **"Create Template"** button
4. Fill in:
   - Grade
   - Stream (if grade has multiple streams)
   - Academic Term
   - Template Name
   - Status (draft/published)
5. Click **"Validate Prerequisites"** to check if everything is ready
6. If validation passes:
   - Click **"Auto-Generate"** (recommended) OR
   - Click **"Create Manually"**
7. Review the generated timetable
8. Click **"Publish"** when ready

**Direct URL:** `/timetables/templates/create`

---

## 🔍 Finding Things

### How to find a specific student?
1. Go to `/students`
2. Use the search bar at the top
3. Or filter by grade/stream

### How to view a grade's details?
1. Go to `/grades`
2. Click on the grade name
3. You'll see students, teachers, subjects, streams

### How to view attendance reports?
1. Go to `/attendance`
2. Click **"Reports"** tab
3. Filter by date range, grade, or stream

### How to view exam results?
1. Go to `/exams`
2. Click on an exam
3. Click **"View Results"**

---

## 🚨 Common Navigation Issues

### "Page not found" error
- Make sure you're logged in as an admin
- Check that the URL is correct
- Some pages require specific roles (admin/teacher/guardian)

### "Access denied" error
- You don't have permission to access that page
- Log in as an admin to access all features

### Can't find the "Create" button
- Make sure you're on the list page (e.g., `/subjects`, not `/subjects/1`)
- Some pages only show the create button to admins

---

## 📱 Mobile Navigation

The sidebar collapses on mobile devices. Click the hamburger menu (☰) in the top-left to open it.

---

## 🎓 Quick Links for Common Tasks

| Task | URL |
|------|-----|
| Create a new student | `/students/create` |
| Mark today's attendance | `/attendance` |
| Create a new exam | `/exams/create` |
| View all grades | `/grades` |
| Manage subjects | `/subjects` |
| Create timetable | `/timetables/templates/create` |
| View reports | `/reports` |

---

Happy navigating! 🚀

