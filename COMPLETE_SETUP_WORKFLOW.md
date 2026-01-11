# Complete School Management System Setup Workflow

## 🎯 Recommended Order of Operations

Follow this order to set up your school management system properly:

### Phase 1: Foundation Setup (Prerequisites)
1. **Rooms** (Optional but recommended for timetables)
2. **Subjects**
3. **Teachers**
4. **Guardians**

### Phase 2: Academic Structure
5. **Grades** (requires Teachers and Subjects)
6. **Streams** (requires Grades)

### Phase 3: Students
7. **Students** (requires Streams and Guardians)

### Phase 4: Academic Operations
8. **Attendance** (requires Students and Streams)
9. **Exams** (requires Streams and Subjects)
10. **Timetables** (requires Grades, Streams, Subjects, Teachers, Rooms)

---

## 📝 Detailed Step-by-Step Guide

### STEP 1: Create Rooms (Optional)

**Navigation:** Settings → Rooms → Create Room

**Required Fields:**
- Room Name (e.g., "Room 1A", "Science Lab", "Library")
- Room Type (classroom, lab, library, hall, office, other)
- Capacity (number of students)
- Status (active/inactive)

**Optional Fields:**
- Building/Floor
- Equipment/Facilities

**Example:**
```
Name: Room 1A
Type: classroom
Capacity: 40
Status: active
```

---

### STEP 2: Create Subjects

**Navigation:** Subjects → Create Subject

**Required Fields:**
- Subject Name (e.g., "Mathematics", "English", "Quran")
- Category (academic/islamic/arts)
- Status (active/inactive)

**Optional Fields:**
- Subject Code (e.g., "MATH101")
- Assign to Grades (can be done later)

**Example:**
```
Name: Mathematics
Category: academic
Code: MATH
Status: active
```

**Recommended Subjects:**
- **Academic:** Mathematics, English, Kiswahili, Science, Social Studies
- **Islamic:** Quran, Islamic Studies, Arabic
- **Arts:** Music, Art & Craft, Physical Education

**Note:** You can assign subjects to grades later when creating grades.

---

### STEP 3: Create Teachers

**Navigation:** Teachers → Create Teacher

**Required Fields:**
- Full Name
- Email (must be unique)
- Phone Number
- Employee Number (auto-generated or manual)
- Date of Joining
- Status (active/inactive)

**Optional Fields:**
- Address
- Qualification
- Subject Specialization (can assign multiple subjects)
- Profile Picture

**Example:**
```
Name: John Doe
Email: john.doe@school.com
Phone: +254712345678
Employee Number: T001
Date of Joining: 2024-01-01
Status: active
Subject Specialization: Mathematics, Science
```

**Important Notes:**
- A user account is automatically created for each teacher
- Teachers can log in using their email
- Default password is usually set by admin or sent via email

---

### STEP 4: Create Guardians

**Navigation:** Guardians → Create Guardian

**Required Fields:**
- Full Name
- Email (must be unique)
- Phone Number
- Guardian Number (auto-generated or manual)
- Relationship to Student (father, mother, guardian, other)
- Status (active/inactive)

**Optional Fields:**
- Address
- Occupation
- Emergency Contact

**Example:**
```
Name: Jane Smith
Email: jane.smith@email.com
Phone: +254723456789
Guardian Number: G001
Relationship: Mother
Status: active
```

**Important Notes:**
- A user account is automatically created for each guardian
- Guardians can log in to view their children's progress
- You can assign students to guardians later

---

### STEP 7: Create Students

**Navigation:** Students → Create Student

**Required Fields:**
- First Name
- Last Name
- Gender (male/female)
- Date of Birth
- Guardian (select from existing guardians)
- **Stream** (select stream, which automatically assigns grade)
- Admission Number (auto-generated or manual)
- Enrollment Date
- Status (active/inactive/graduated/transferred)

**Optional Fields:**
- Profile Picture
- Class Name (deprecated - use stream instead)

**Example:**
```
First Name: Ahmed
Last Name: Mohamed
Gender: male
Date of Birth: 2015-05-15
Guardian: Jane Smith (G001)
Stream: Grade 1 - North
Admission Number: S001
Enrollment Date: 2024-01-15
Status: active
```

**Important Notes:**
- Students are assigned to STREAMS, not grades
- The grade is automatically determined by the stream
- Each student must have a guardian
- Admission numbers should be unique

---

### STEP 8: Mark Attendance

**Navigation:** Attendance → Mark Attendance

**Process:**
1. Select Date (default: today)
2. Select Stream (not grade!)
3. View list of students in that stream
4. Mark each student as:
   - Present
   - Absent
   - Late
   - Excused
5. Add remarks if needed
6. Save attendance

**Example:**
```
Date: 2024-01-15
Stream: Grade 1 - North
Students: [Ahmed Mohamed, Fatima Ali, ...]
Status: Present/Absent/Late/Excused
```

**Important Notes:**
- Attendance is marked per stream, not per grade
- You can view attendance reports by grade (shows all streams)
- Attendance history is tracked for each student

---

### STEP 9: Create Exams

**Navigation:** Exams → Create Exam

**Required Fields:**
- Exam Name (e.g., "Mid-Term Math Exam")
- Exam Type (mid-term, end-term, quiz, assignment)
- Term (1, 2, 3)
- Academic Year (e.g., 2024)
- Exam Date
- **Stream** (select stream, not grade)
- Subject

**Optional Fields:**
- Total Marks
- Pass Mark
- Duration

**Example:**
```
Name: Mid-Term Mathematics Exam
Type: mid-term
Term: 1
Academic Year: 2024
Date: 2024-03-15
Stream: Grade 1 - North
Subject: Mathematics
Total Marks: 100
Pass Mark: 50
```

**Important Notes:**
- Exams are created per stream, not per grade
- If you have multiple streams, create separate exams for each
- You can enter results after creating the exam

---

### STEP 10: Create Timetables

**Navigation:** Timetables → Create Timetable

**Prerequisites (MUST be completed first):**
1. ✅ Grade has a class teacher assigned
2. ✅ Grade has a default room assigned
3. ✅ Grade has subjects assigned with curriculum rules:
   - Sessions per week
   - Priority (high/neutral/low)
4. ✅ Active blueprint exists for the grade's level
5. ✅ Periods generated from blueprint

**Process:**

#### Step 10.1: Create Level Blueprint (One-time setup)

**Navigation:** Timetables → Blueprints → Create Blueprint

**Required Fields:**
- Blueprint Name (e.g., "Lower Primary Schedule")
- Level (ECD, Lower Primary, Upper Primary, Junior Secondary)
- Status (active/inactive)

**Define Periods:**
- Add time blocks (e.g., 8:00-8:40, 8:40-9:20)
- Mark which periods are teachable (lessons)
- Mark which are non-teachable (break, lunch, assembly)
- Set priority bands (morning_high, neutral, afternoon_low)

**Example:**
```
Name: Lower Primary Schedule
Level: Lower Primary
Periods:
  - 8:00-8:40 (Assembly) - Non-teachable
  - 8:40-9:20 (Period 1) - Teachable, morning_high
  - 9:20-10:00 (Period 2) - Teachable, morning_high
  - 10:00-10:20 (Break) - Non-teachable
  - 10:20-11:00 (Period 3) - Teachable, neutral
  - 11:00-11:40 (Period 4) - Teachable, neutral
  - 11:40-12:20 (Period 5) - Teachable, afternoon_low
  - 12:20-1:00 (Lunch) - Non-teachable
```

#### Step 10.2: Generate Periods from Blueprint

**Navigation:** Timetables → Blueprints → [Select Blueprint] → Generate Periods

This creates the actual period records that will be used for timetable generation.

#### Step 10.3: Assign Subjects to Grade with Curriculum Rules

**Navigation:** Grades → [Select Grade] → Edit → Subjects Section

For each subject, set:
- **Sessions per week** (e.g., 5 for Mathematics, 3 for Art)
- **Priority:**
  - `high` = Morning slots (Math, English, Science)
  - `neutral` = Anytime (Social Studies, Kiswahili)
  - `low` = Afternoon slots (Art, Music, PE)
- **Must be daily** (optional - for subjects that should appear every day)
- **Can repeat same day** (optional - allow multiple sessions per day)

**Example:**
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

#### Step 10.4: Create Timetable Template

**Navigation:** Timetables → Templates → Create Template

**Required Fields:**
- Grade
- Stream (if grade has multiple streams)
- Academic Term
- Template Name
- Status (draft/published)

**Process:**
1. Select grade and stream
2. System validates prerequisites
3. If validation passes, you can:
   - **Auto-generate** timetable (recommended)
   - **Manually create** timetable

**Auto-Generation:**
- System automatically assigns subjects to slots
- Respects priority bands (high priority subjects in morning)
- Respects sessions per week requirements
- Avoids teacher conflicts
- Assigns teachers based on subject specialization

**Manual Creation:**
- Drag and drop subjects into time slots
- Assign teachers manually
- System warns about conflicts

---

## ✅ Validation Checklist Before Timetable Generation

Before you can generate a timetable, ensure:

- [ ] Grade has at least one teacher assigned
- [ ] Grade has a class teacher designated
- [ ] Grade has a default room assigned
- [ ] Grade has subjects assigned
- [ ] All subjects have sessions_per_week set (> 0)
- [ ] All subjects have priority set (high/neutral/low)
- [ ] Active blueprint exists for the grade's level
- [ ] Periods have been generated from the blueprint
- [ ] Teachers have subject specializations set (optional but recommended)

---

## 🎯 Quick Start Example

Here's a minimal example to get started quickly:

### 1. Create 1 Subject
- Mathematics (academic, active)

### 2. Create 1 Teacher
- John Doe (john@school.com, active)
- Assign subject: Mathematics

### 3. Create 1 Guardian
- Jane Smith (jane@email.com, active)

### 4. Create 1 Grade
- Grade 1 (Lower Primary, active)
- Assign teacher: John Doe
- Class teacher: John Doe
- Assign subject: Mathematics (5 sessions/week, priority: high)

### 5. Create 1 Stream
- Grade: Grade 1
- Name: Main
- Status: active

### 6. Create 1 Student
- Ahmed Mohamed
- Guardian: Jane Smith
- Stream: Grade 1 - Main
- Status: active

### 7. Mark Attendance
- Select stream: Grade 1 - Main
- Mark Ahmed as Present

### 8. Create 1 Exam
- Mid-Term Math Exam
- Stream: Grade 1 - Main
- Subject: Mathematics

### 9. Create Blueprint & Timetable
- Create Lower Primary blueprint
- Generate periods
- Create timetable for Grade 1 - Main

---

## 🚨 Common Issues & Solutions

### Issue: "Cannot create grade - no teachers available"
**Solution:** Create teachers first before creating grades.

### Issue: "Cannot create student - no streams available"
**Solution:** Create grades and streams first.

### Issue: "Cannot generate timetable - validation failed"
**Solution:** Check the validation checklist above. The system will tell you exactly what's missing.

### Issue: "Subject not available when creating exam"
**Solution:** Assign the subject to the grade/stream first.

### Issue: "Stream not showing in dropdown"
**Solution:** Ensure the stream's status is 'active' and belongs to an active grade.

---

## 📊 Recommended Data for Testing

### Subjects (10)
- Mathematics, English, Kiswahili, Science, Social Studies
- Quran, Islamic Studies, Arabic
- Art, Music, PE

### Teachers (5-10)
- At least 1 per major subject
- Assign subject specializations

### Guardians (5-10)
- Mix of fathers, mothers, guardians

### Grades (3-5)
- PP1, PP2, Grade 1, Grade 2, Grade 3

### Streams (1-2 per grade)
- Single stream: "Main"
- Multiple streams: "North", "South"

### Students (10-20)
- Distribute across streams
- Assign to guardians

---

## 🎓 You're Ready!

Once you've completed these steps, your school management system is fully set up and ready to use for:
- Daily attendance tracking
- Exam management and results
- Timetable generation and management
- Student and teacher management
- Guardian portal access
- Reports and analytics

Good luck! 🚀
### STEP 5: Create Grades

**Navigation:** Grades → Create Grade

**Required Fields:**
- Grade Name (e.g., "Grade 1", "PP1", "Grade 7")
- Level (ECD, Lower Primary, Upper Primary, Junior Secondary)
- Status (active/inactive)
- **At least 1 Teacher** (required)
- **Class Teacher** (required - must be one of the assigned teachers)

**Optional Fields:**
- Grade Code (e.g., "G1", "PP1")
- Default Room
- Subjects (can be assigned now or later)

**Example:**
```
Name: Grade 1
Code: G1
Level: Lower Primary
Status: active
Assigned Teachers: [John Doe, Mary Jane]
Class Teacher: John Doe
Default Room: Room 1A
Subjects: [Mathematics, English, Kiswahili, Science]
```

**Important Notes:**
- You MUST assign at least one teacher
- You MUST designate a class teacher
- Subjects can be assigned during creation or later
- Default room is optional but recommended for timetables

---

### STEP 6: Create Streams

**Navigation:** Settings → Streams → Create Stream

**Required Fields:**
- Grade (select from existing grades)
- Stream Name (e.g., "Main", "North", "South", "A", "B")
- Status (active/inactive)

**Optional Fields:**
- Stream Code (e.g., "G1-N", "G1-S")
- Capacity (number of students)
- Room (specific room for this stream)
- Description

**Example:**
```
Grade: Grade 1
Name: North
Code: G1-N
Capacity: 40
Room: Room 1A
Status: active
```

**Recommended Stream Structure:**
- **Single Stream:** Create "Main" stream for each grade
- **Multiple Streams:** Create "North", "South", "East", "West" or "A", "B", "C", "D"

**Important Notes:**
- Every grade should have at least one stream (usually "Main")
- Students will be assigned to streams, not directly to grades
- Teachers and subjects can be assigned to specific streams

---


