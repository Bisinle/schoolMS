# User Guide: Automated Timetable Generation

## Overview
This guide walks you through the complete process of generating and managing timetables using the automated blueprint-based system.

## Prerequisites

Before generating a timetable, ensure you have completed the following setup:

### 1. Create Subjects
**Navigation:** Academics → Subjects → Create Subject

- Add all subjects your school teaches
- Assign appropriate categories (CORE, SCIENCE, LANGUAGES, ARTS, etc.)
- Set subject codes for easy identification

### 2. Create Teachers
**Navigation:** Staff → Teachers → Create Teacher

- Add all teaching staff
- **Important:** Select subject specializations for each teacher
- This helps the system suggest appropriate teachers for specialist subjects

### 3. Create Rooms
**Navigation:** Facilities → Rooms → Create Room

- Add all classrooms
- Assign room types (Classroom, Laboratory, Library, etc.)
- Set capacity for each room

### 4. Create Grades
**Navigation:** Academics → Grades → Create Grade

**Required Fields:**
- Grade name (e.g., "Grade 3", "Form 1")
- Grade level (ECD, LOWER PRIMARY, UPPER PRIMARY, JUNIOR SECONDARY)
- **Class Teacher** (mandatory - must be assigned)
- Default room (optional but recommended)

**Assign Subjects to Grade:**
- Click "Manage Subjects" on the grade
- Add subjects with:
  - Weekly hours (e.g., Mathematics: 5 hours)
  - Priority (High, Medium, Low)
  - Must be daily (checkbox for subjects like Math, English)
  - Can repeat same day (checkbox if subject can appear twice in one day)

### 5. Create Blueprint for Grade Level
**Navigation:** Timetables → Blueprints → Create Blueprint

**What is a Blueprint?**
A blueprint defines the structure of a school day for a specific grade level (e.g., all LOWER PRIMARY grades share the same day structure).

**Steps:**
1. Select grade level
2. Enter blueprint name (e.g., "Lower Primary Day Structure")
3. Set start and end times
4. Add periods:
   - **Lesson periods** (high/medium/low priority)
   - **Break periods** (short break, lunch, breakfast)
   - **Assembly periods**
   - **Other periods** (prayer, sports, activities)

**Example Blueprint:**
```
08:00 - 08:15  Assembly (15 min)
08:15 - 09:00  Lesson 1 - High Priority (45 min)
09:00 - 09:45  Lesson 2 - High Priority (45 min)
09:45 - 10:00  Short Break (15 min)
10:00 - 10:45  Lesson 3 - Medium Priority (45 min)
10:45 - 11:30  Lesson 4 - Medium Priority (45 min)
11:30 - 12:00  Lunch (30 min)
12:00 - 12:45  Lesson 5 - Low Priority (45 min)
12:45 - 13:30  Lesson 6 - Low Priority (45 min)
```

## Generating a Timetable

### Step 1: Create Timetable Template
**Navigation:** Timetables → Templates → Create Template

1. Select grade
2. Select academic term
3. Enter template name (e.g., "Grade 3 - Term 1 2024")
4. Set effective date
5. Click "Create"

### Step 2: Generate from Blueprint
1. After creating the template, you'll be redirected to the Grid View
2. The system will automatically validate if generation is possible
3. If validation passes, click **"Generate Timetable"** button

**What Happens During Generation:**
- ✅ System creates slots for all periods across Monday-Friday
- ✅ Allocates subjects based on priorities and constraints
- ✅ Assigns class teacher to ALL lesson slots
- ✅ Marks all assignments as "auto-assigned" for easy identification

**Validation Checks:**
- ❌ Grade must have a class teacher assigned
- ❌ Blueprint must exist for the grade level
- ❌ Grade must have subjects assigned with weekly hours
- ⚠️  Warnings shown if subjects don't have enough slots

### Step 3: Review Generated Timetable

After generation, you'll see:

**Visual Indicators:**
- 🟢 **Green border** = Fully assigned (subject + teacher)
- 🟡 **Yellow triangle** = Auto-assigned to class teacher
- 🟠 **Orange border** = Specialist subject needing review

**Generation Summary Panel:**
- Total slots created
- Lesson slots vs break slots
- Assignment progress percentage
- **Review Needed section** showing:
  - Count of auto-assigned slots
  - List of specialist subjects (PE, Music, Art, Computer, Drama, Dance)

## Assigning Specialist Teachers

### Method 1: Bulk Change (Recommended)
**Use this when:** You want to change the teacher for ALL slots of a specific subject

**Steps:**
1. Click **"Bulk Change Teachers"** button
2. Select subject from dropdown (e.g., "Physical Education")
3. Select teacher from filtered list (only shows teachers specialized in that subject)
4. Review the count of slots that will be updated
5. Click "Update All Slots"

**Result:**
- All slots with that subject are updated to the new teacher
- Auto-assigned flag is cleared
- Orange borders and yellow triangles removed

### Method 2: Individual Slot Edit
**Use this when:** You want to change a specific slot

**Steps:**
1. Click on the slot in the grid
2. Edit teacher, room, or other details
3. Save changes

**Result:**
- Only that specific slot is updated
- Auto-assigned flag is cleared for that slot

## Publishing and Managing Timetables

### Draft Status
- Timetable is editable
- Not visible to teachers or students
- Can regenerate or make changes freely

### Publishing
**Navigation:** Timetables → Templates → [Select Template] → Publish

1. Review the timetable thoroughly
2. Ensure all specialist teachers are assigned
3. Click "Publish"
4. Timetable becomes visible to teachers and students

### Archiving
**When to archive:** End of term or when timetable is no longer active

1. Click "Archive" on the template
2. Archived templates are read-only
3. Can be unarchived if needed

### Regenerating
**Use this when:** You want to update the timetable structure while preserving manual edits

1. Click **"Regenerate"** button
2. System will:
   - Delete all auto-generated slots
   - Recreate structure from blueprint
   - Preserve manually created/edited slots

## Best Practices

### 1. Subject Priorities
- **High Priority:** Core subjects (Math, English, Science) - scheduled in morning slots
- **Medium Priority:** Important subjects (Languages, Social Studies)
- **Low Priority:** Electives, Arts - scheduled in afternoon slots

### 2. Must Be Daily
- Enable for subjects that should appear every day (Math, English)
- System ensures one slot per day

### 3. Can Repeat Same Day
- Enable if subject can appear twice in one day
- Useful for subjects with high weekly hours

### 4. Teacher Specializations
- Always assign subject specializations to teachers
- This enables smart filtering in bulk change feature
- Helps identify qualified teachers for specialist subjects

### 5. Review Workflow
1. Generate timetable
2. Check "Review Needed" section
3. Use bulk change for specialist subjects
4. Review individual slots for conflicts
5. Publish when satisfied

## Troubleshooting

### "Cannot Generate Timetable" Error

**Possible Causes:**
1. **No class teacher assigned to grade**
   - Solution: Go to Grades → Edit → Assign class teacher

2. **No blueprint for grade level**
   - Solution: Create blueprint for the grade level

3. **No subjects assigned to grade**
   - Solution: Go to Grades → Manage Subjects → Add subjects

4. **No active academic term**
   - Solution: Create and activate an academic term

### "Not Enough Slots" Warning

**Cause:** Subject's weekly hours exceed available lesson slots

**Solutions:**
- Reduce weekly hours for the subject
- Add more lesson periods to blueprint
- Enable "can repeat same day" for the subject

### Conflicts Detected

**Types of Conflicts:**
- Teacher double-booked (same teacher, same time, different classes)
- Room double-booked (same room, same time, different classes)

**Solution:**
- Click on conflicting slot
- Change teacher or room
- Conflicts auto-resolve when fixed

## Summary

**Complete Workflow:**
1. ✅ Setup: Subjects → Teachers → Rooms → Grades → Blueprints
2. ✅ Create: Timetable Template
3. ✅ Generate: Click "Generate Timetable"
4. ✅ Review: Check generation summary
5. ✅ Assign: Use bulk change for specialist subjects
6. ✅ Publish: Make timetable active

**Time Savings:**
- Manual creation: ~4-6 hours per timetable
- Automated generation: ~5-10 minutes (including specialist assignment)
- **80-90% automation achieved!**

