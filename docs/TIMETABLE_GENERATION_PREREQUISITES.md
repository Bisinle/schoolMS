# Timetable Auto-Generation Prerequisites Guide

## Overview

The timetable auto-generation system performs comprehensive prerequisite validation before allowing generation. This ensures all required data is in place and prevents generation failures.

## Validation System

When you attempt to generate a timetable, the system checks:

### ✅ **Critical Requirements** (Block Generation)

These MUST be satisfied before generation can proceed:

1. **Class Teacher Assignment**
2. **Subjects Assigned to Grade**
3. **Active Blueprint for Grade Level**
4. **Curriculum Rules Configured**
5. **Sufficient Available Slots**

### ⚠️ **Warnings** (Allow Generation with Caution)

These are recommended but not required:

1. **Default Room Assignment**
2. **Teacher Subject Specializations**

---

## Detailed Requirements

### 1. Class Teacher Assignment ✅

**Error Message:**
```
No class teacher assigned. Please go to Grades → Edit → Assign a teacher as class teacher.
```

**Why Required:**
The auto-generation service assigns the class teacher to ALL lesson slots initially. Specialist teachers can be assigned manually after generation.

**How to Fix:**
1. Go to **Grades** → Find your grade → Click **Edit**
2. In the **Teachers** section, find a teacher
3. Check the **"Is Class Teacher"** checkbox
4. Click **Save**

---

### 2. Subjects Assigned to Grade ✅

**Error Message:**
```
No subjects assigned to this grade. Please go to Grades → Subjects → Assign subjects.
```

**Why Required:**
The system needs to know which subjects to schedule for this grade.

**How to Fix:**
1. Go to **Grades** → Find your grade → Click **Subjects** tab
2. Click **Assign Subjects**
3. Select subjects from the list
4. Click **Save**

---

### 3. Active Blueprint for Grade Level ✅

**Error Message:**
```
No active blueprint found for {LEVEL} level. Please go to Blueprints → Create blueprint for {LEVEL}.
```

**Why Required:**
The blueprint defines the daily schedule structure (periods, breaks, lunch, etc.) that the timetable will follow.

**How to Fix:**
1. Go to **Blueprints** → Click **Create Blueprint**
2. Fill in:
   - **Name**: e.g., "ECD Daily Schedule"
   - **Level**: Select the grade level (ECD, Lower Primary, etc.)
   - **Start Time**: e.g., 8:00 AM
3. Add periods:
   - **Lesson periods** (mark as "Teachable")
   - **Breaks** (short break, lunch, prayer, etc.)
4. Set **Is Active** to **Yes**
5. Click **Save**
6. Click **Generate Periods** to create period records

**Blueprint Requirements:**
- Must have at least 1 teachable period
- Must be marked as active
- Must match the grade's level

---

### 4. Curriculum Rules Configured ✅

**Error Message:**
```
Curriculum rules missing for subjects: Math, English, Science. 
Please go to Grades → Subjects → Edit each subject and set 'Sessions per Week'.
```

**Why Required:**
The system needs to know:
- How many times per week each subject should be taught
- Which subjects are high priority (morning slots)
- Which subjects must appear daily

**How to Fix:**
1. Go to **Grades** → Find your grade → Click **Subjects** tab
2. For each subject, click **Edit** (pencil icon)
3. Configure:
   - **Sessions per Week**: e.g., 5 for Math, 3 for Art
   - **Priority**: high/neutral/low
   - **Must be Daily**: Check for Math, English
   - **Can Repeat Same Day**: Check for subjects with 6+ sessions
4. Click **Save**

**Curriculum Allocation Reference:**

#### ECD & Lower Primary (Grade 1-3)
- English: 5 sessions (daily, high priority)
- Mathematics: 5 sessions (daily, high priority)
- Creative Arts: 6 sessions (neutral, can repeat)
- Environmental Activities: 5 sessions (daily, neutral)
- Islamic Religious Education: 3 sessions (neutral)

#### Upper Primary (Grade 4-6)
- English: 5 (daily, high)
- Mathematics: 5 (daily, high)
- Science & Technology: 4 (high)
- Kiswahili/KSL: 4 (neutral)
- Religious Education: 3 (neutral)
- Agriculture: 4 (neutral)
- Social Studies: 3 (neutral)
- Creative Arts: 6 (neutral, can repeat)
- Pastoral/Religious: 1 (low)

#### Junior Secondary (Grade 7-9)
- English: 5 (daily, high)
- Mathematics: 5 (daily, high)
- Integrated Science: 5 (daily, high)
- Kiswahili/KSL: 4 (neutral)
- Religious Education: 4 (neutral)
- Social Studies: 4 (neutral)
- Pre-Technical Studies: 4 (neutral)
- Agriculture: 4 (neutral)
- Creative Arts & Sports: 5 (neutral)
- Pastoral/Religious: 1 (low)

---

### 5. Sufficient Available Slots ✅

**Error Message:**
```
Total required sessions (45) exceeds available slots (35). 
Please reduce sessions_per_week for some subjects or add more lesson periods to the blueprint.
```

**Why Required:**
The total number of required sessions must fit within the available teachable slots.

**Calculation:**
- Available Slots = Teachable Periods per Day × 5 days
- Required Sessions = Sum of all subjects' sessions_per_week

**How to Fix:**

**Option A: Reduce Sessions**
1. Go to **Grades** → **Subjects**
2. Reduce `sessions_per_week` for some subjects
3. Ensure total ≤ available slots

**Option B: Add More Lesson Periods**
1. Go to **Blueprints** → Edit your blueprint
2. Add more lesson periods
3. Reduce break durations if needed
4. Click **Regenerate Periods**

---

## Warnings (Non-Blocking)

### Default Room Assignment ⚠️

**Warning Message:**
```
No default room assigned. Lesson slots will be created without room assignments. 
Please go to Grades → Edit → Set default room.
```

**Impact:**
- Generation will proceed
- All lesson slots will have `room_id = null`
- You'll need to assign rooms manually later

**How to Fix:**
1. Go to **Rooms** → Create rooms if none exist
2. Go to **Grades** → Edit your grade
3. Select a **Default Room**
4. Click **Save**

---

### Teacher Subject Specializations ⚠️

**Warning Message:**
```
Teachers without subject specializations: Margaret Teacher, John Doe. 
All lessons will be assigned to class teacher. Set specializations for better teacher matching.
```

**Impact:**
- Generation will proceed
- ALL lessons assigned to class teacher
- No automatic specialist teacher matching

**How to Fix:**
1. Go to **Teachers** → Edit each teacher
2. In **Subject Specializations**, select subjects they can teach
3. Click **Save**

---

## Generation Summary

After validation passes, you'll see a summary:

```
📊 GENERATION SUMMARY:
   Blueprint: ECD Daily Schedule
   Total Slots: 35
   Lesson Slots: 30
   Empty Slots: 5
   Subjects: 9
   Teachers: 3
```

This shows:
- **Total Slots**: All slots that will be created (lessons + breaks)
- **Lesson Slots**: Slots with subjects assigned
- **Empty Slots**: Teachable slots without subjects (can be used for study time)
- **Subjects**: Number of subjects configured
- **Teachers**: Number of teachers assigned to grade

---

## Common Scenarios

### Scenario 1: New Grade Setup

**Steps:**
1. ✅ Create grade
2. ✅ Assign class teacher
3. ✅ Assign subjects
4. ✅ Configure curriculum rules (sessions, priority)
5. ✅ Create/activate blueprint for level
6. ✅ Generate periods from blueprint
7. ✅ Create timetable template
8. ✅ Click "Generate"

### Scenario 2: Missing Blueprint

**Error:**
```
No active blueprint found for UPPER PRIMARY level.
```

**Solution:**
1. Go to **Blueprints** → **Create**
2. Set level to **UPPER PRIMARY**
3. Add periods (9-10 lesson periods recommended)
4. Mark as **Active**
5. Click **Generate Periods**

### Scenario 3: Too Many Sessions

**Error:**
```
Total required sessions (50) exceeds available slots (45).
```

**Solution:**
Either reduce sessions OR add periods:
- Reduce: Math 5→4, Science 5→4 (saves 2 slots)
- Add periods: Add 1 more lesson period to blueprint

---

## Best Practices

1. **Start with Blueprint**: Create blueprints for all levels first
2. **Use Standard Allocations**: Follow the curriculum allocation reference
3. **Set Priorities**: High for Math/English/Science, Neutral for others
4. **Daily Subjects**: Mark Math and English as "must_be_daily"
5. **Room Assignment**: Assign default rooms to avoid manual work later
6. **Teacher Specializations**: Configure before generation for better matching

---

## Troubleshooting

### "No periods generated from blueprint"

**Cause:** Blueprint exists but periods not generated

**Fix:**
1. Go to **Blueprints**
2. Find your blueprint
3. Click **Generate Periods** button

### "Curriculum rules missing for subjects"

**Cause:** Subjects assigned but `sessions_per_week` not set

**Fix:**
1. Go to **Grades** → **Subjects**
2. Edit each subject
3. Set `sessions_per_week` (default is 4)

### Generation succeeds but slots are empty

**Cause:** `sessions_per_week = 0` for all subjects

**Fix:**
1. Check curriculum rules
2. Ensure `sessions_per_week > 0`
3. Regenerate timetable

---

## Technical Details

### Validation Flow

```
User clicks "Generate"
    ↓
Controller calls Grade::canGenerateTimetable()
    ↓
Validation checks all prerequisites
    ↓
If errors exist → Block generation, show errors
    ↓
If warnings only → Allow generation, show warnings
    ↓
TimetableGenerationService::generate()
    ↓
Success → Redirect with success message + warnings
```

### Error Message Format

```
Cannot generate timetable for grade 'Pre-Primary 1'. Please fix the following issues:

1. No class teacher assigned. Please go to Grades → Edit → Assign a teacher as class teacher.
2. Curriculum rules missing for subjects: Math, English. Please go to Grades → Subjects → Edit each subject and set 'Sessions per Week'.

Warnings:
⚠ No default room assigned. Lesson slots will be created without room assignments. Please go to Grades → Edit → Set default room.
```

---

## Related Documentation

- [Timetable Generation User Guide](USER_GUIDE_TIMETABLE_GENERATION.md)
- [Blueprint Creation Guide](BLUEPRINT_CREATION_GUIDE.md)
- [Curriculum Management](CURRICULUM_MANAGEMENT.md)

