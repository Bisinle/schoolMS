# 📋 Timetable Setup Workflow - Complete Guide

## 🎯 Overview

This guide explains the **exact order** and **step-by-step process** for creating a complete timetable in the School Management System. Follow these steps in order for the best results.

---

## 🚀 Quick Start: The Correct Order

```
1. Create Time Periods (FIRST - Required)
   ↓
2. Create Rooms (SECOND - Required)
   ↓
3. Create Timetable Template (THIRD - Required)
   ↓
4. Add Timetable Slots (FOURTH - Required)
   ↓
5. Review & Verify (FIFTH - Required)
   ↓
6. Publish Timetable (FINAL - Required)
```

---

## 📊 Step-by-Step Instructions

### **STEP 1: Create Time Periods** ⏰

**Why First?** Periods define the time structure of your school day. You need these before you can assign any classes.

**How to Create:**
1. Navigate to **Timetables → Dashboard**
2. Click **"Add Period"** or go to **Timetables → Periods → Create Period**
3. Fill in the form:
   - **Period Name**: e.g., "Period 1", "Morning Break", "Lunch"
   - **Period Type**: Choose from:
     - `Lesson` - Regular teaching period
     - `Break` - Short break between classes
     - `Lunch` - Lunch break
     - `Assembly` - Morning assembly or special events
   - **Start Time**: e.g., 08:00
   - **End Time**: e.g., 08:45
   - **Is Active**: Check to enable

**Example Periods for a Typical School Day:**
```
Period 1       08:00 - 08:45  (Lesson)
Morning Break  08:45 - 09:00  (Break)
Period 2       09:00 - 09:45  (Lesson)
Period 3       09:45 - 10:30  (Lesson)
Lunch Break    10:30 - 11:00  (Lunch)
Period 4       11:00 - 11:45  (Lesson)
Period 5       11:45 - 12:30  (Lesson)
Afternoon Break 12:30 - 12:45 (Break)
Period 6       12:45 - 13:30  (Lesson)
```

**✅ Completion Check:** You should have at least 5-8 periods created.

---

### **STEP 2: Create Rooms** 🚪

**Why Second?** Rooms are where classes happen. You need to register all available spaces before scheduling.

**How to Create:**
1. Navigate to **Timetables → Rooms → Create Room**
2. Fill in the form:
   - **Room Number**: e.g., "101", "Lab-1", "Library"
   - **Room Name**: e.g., "Science Laboratory 1"
   - **Room Type**: Choose from:
     - Classroom, Laboratory, Computer Lab, Library, Auditorium, Gymnasium, Music Room, Art Room, Staff Room, Conference Room, Other
   - **Capacity**: Number of students (e.g., 30)
   - **Facilities**: Select available equipment:
     - Projector, Whiteboard, Smartboard, Computer, Air Conditioning, etc.
   - **Is Active**: Check to enable

**Example Rooms:**
```
Room 101 - Science Lab        (Laboratory, Capacity: 25)
Room 102 - Computer Lab       (Computer Lab, Capacity: 30)
Room 201 - Grade 1 Classroom  (Classroom, Capacity: 35)
Room 202 - Grade 2 Classroom  (Classroom, Capacity: 35)
Library  - School Library     (Library, Capacity: 50)
Hall     - Main Auditorium    (Auditorium, Capacity: 200)
```

**✅ Completion Check:** You should have at least 10-20 rooms created.

---

### **STEP 3: Create Timetable Template** 📅

**Why Third?** The template is the container for your timetable. It links to a specific grade and term.

**How to Create:**
1. Navigate to **Timetables → Templates → Create Template**
2. Fill in the form:
   - **Grade**: Select the grade (e.g., "Grade 1")
   - **Academic Term**: Select the term (e.g., "Term 1 - 2024/2025")
   - **Template Name**: Auto-generated or custom (e.g., "Grade 1 - Term 1 Timetable")
   - **Effective From**: Start date for this timetable
   - **Status**: Leave as "Draft" (you'll publish later)

**Example Templates:**
```
Grade 1 - Term 1 2024/2025 Timetable
Grade 2 - Term 1 2024/2025 Timetable
Grade 3 - Term 1 2024/2025 Timetable
```

**✅ Completion Check:** Template created and saved as "Draft".

---

### **STEP 4: Add Timetable Slots** 📝

**Why Fourth?** Slots are the actual class assignments - what subject, which teacher, in which room, at what time.

**How to Create (Recommended: Grid View):**
1. Navigate to **Timetables → Templates**
2. Find your template and click **"Grid View"**
3. You'll see a weekly calendar grid
4. Click on any **empty cell** to add a slot
5. Fill in the form:
   - **Day of Week**: Pre-selected based on column clicked
   - **Period**: Pre-selected based on row clicked
   - **Subject**: Select subject (e.g., "Mathematics")
   - **Teacher**: Select teacher (e.g., "Mr. John Smith")
   - **Room**: Select room (e.g., "Room 201") - Optional
6. Click **"Create Slot"**
7. Repeat for all time slots

**Alternative Method (Manual):**
1. From template show page, click **"Add Slot"**
2. Manually select day, period, subject, teacher, room
3. Click **"Create Slot"**

**Example Slots:**
```
Monday, Period 1    → Mathematics, Mr. Smith, Room 201
Monday, Period 2    → English, Ms. Johnson, Room 201
Monday, Period 3    → Science, Dr. Brown, Lab 101
Tuesday, Period 1   → History, Mr. Davis, Room 201
Tuesday, Period 2   → Geography, Ms. Wilson, Room 202
```

**💡 Tips:**
- Use Grid View for faster entry
- Colors are auto-assigned to subjects
- Click on filled cells to edit existing slots
- Leave break/lunch periods empty

**✅ Completion Check:** All lesson periods filled for all days of the week.

---

### **STEP 5: Review & Verify** 🔍

**Why Fifth?** Check for conflicts and ensure quality before publishing.

**What to Check:**
1. **Teacher Conflicts**: Same teacher in two places at once?
2. **Room Conflicts**: Same room assigned twice at same time?
3. **Coverage**: All periods filled? Any gaps?
4. **Teacher Load**: Is workload distributed fairly?
5. **Room Suitability**: Science in lab? PE in gymnasium?

**How to Review:**
1. Open **Grid View** of your template
2. Visually scan for issues
3. Check each day column by column
4. Verify teacher assignments make sense
5. Ensure rooms match subject requirements

**✅ Completion Check:** No conflicts, all slots properly assigned.

---

### **STEP 6: Publish Timetable** 🚀

**Why Final?** Publishing makes the timetable visible to teachers, students, and parents.

**How to Publish:**
1. Navigate to **Timetables → Templates**
2. Find your template (should be in "Draft" status)
3. Click the **"Publish"** button
4. Confirm publication

**What Happens After Publishing:**
- ✅ Status changes from "Draft" to "Published"
- ✅ Timetable becomes visible to teachers
- ✅ Timetable becomes visible to students
- ✅ Teachers can view their schedules
- ✅ Students can view their class schedules

**⚠️ Important Notes:**
- You can still edit published timetables
- Changes to published timetables are immediately visible
- You can archive old timetables when no longer needed

**✅ Completion Check:** Template status is "Published".

---

## 🎓 Optional: Teacher Availability

**When to Do This:** Anytime, but ideally before creating templates.

**Purpose:** Teachers can set when they're available, unavailable, or prefer to teach.

**How Teachers Set Availability:**
1. Teacher logs in
2. Navigate to **Timetables → My Availability**
3. Click **"Create Availability"**
4. Fill in:
   - **Day of Week**: e.g., Monday
   - **Start Time**: e.g., 08:00
   - **End Time**: e.g., 12:00
   - **Availability Type**:
     - `Available` - Can teach during this time
     - `Unavailable` - Cannot teach (personal reasons, other duties)
     - `Preferred` - Prefers to teach during this time
   - **Notes**: Optional explanation

**How Admins Use This:**
- When creating slots, check teacher availability
- Avoid scheduling teachers during unavailable times
- Prioritize preferred times when possible

---

## 📈 Progress Tracking

The **Timetable Dashboard** shows your progress:

- ✅ **Green checkmark** = Step completed
- 🟠 **Orange highlight** = Current step to work on
- ⚪ **Gray** = Not yet started

**Progress Bar** shows overall completion percentage.

---

## 🔄 Common Workflows

### **Workflow 1: New School Year**
```
1. Create new academic year and terms (Settings)
2. Create/update periods if schedule changed
3. Create/update rooms if facilities changed
4. Create new templates for each grade
5. Copy slots from previous year (if similar)
6. Update teacher assignments
7. Review and publish
```

### **Workflow 2: Mid-Term Changes**
```
1. Find published template
2. Open Grid View
3. Click slot to edit
4. Update teacher/room/subject
5. Save changes (immediately visible)
```

### **Workflow 3: New Grade Added**
```
1. Ensure periods and rooms exist
2. Create new template for new grade
3. Add all slots
4. Review and publish
```

---

## ❓ Frequently Asked Questions

**Q: Can I create templates before periods?**
A: Yes, but you won't be able to add slots until periods exist.

**Q: Can I edit a published timetable?**
A: Yes! Changes are immediately visible to users.

**Q: What if I make a mistake?**
A: Just edit the slot or delete and recreate it.

**Q: Can I copy a timetable?**
A: Not yet, but you can manually recreate similar timetables.

**Q: How do I handle teacher absences?**
A: Edit the slot to assign a substitute teacher.

---

## 🎯 Success Checklist

Before publishing, ensure:
- [ ] All periods created (5-8 periods minimum)
- [ ] All rooms registered (10-20 rooms minimum)
- [ ] Template created with correct grade and term
- [ ] All lesson slots filled (no gaps)
- [ ] No teacher conflicts
- [ ] No room conflicts
- [ ] Rooms match subject requirements
- [ ] Teacher workload is balanced
- [ ] Reviewed in Grid View
- [ ] Ready to publish

---

**Last Updated:** December 25, 2025
**Version:** 1.0.0

