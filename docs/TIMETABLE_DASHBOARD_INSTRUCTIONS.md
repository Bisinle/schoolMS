# 📊 Timetable Dashboard - Instructions & Data Flow

## 🎯 What is the Timetable Dashboard?

The **Timetable Dashboard** is your central hub for managing school timetables. It shows:
- **Progress tracking** - See which steps you've completed
- **Statistics** - Count of templates, periods, rooms, and slots
- **Step-by-step guide** - Interactive instructions for creating timetables
- **Quick actions** - Fast access to common tasks

---

## 🚀 How to Access

1. Login as **Admin** or **Teacher**
2. Click **Timetables** in the sidebar
3. Click **Dashboard** (first item in submenu)

**Direct URL:** `/timetables/dashboard`

---

## 📋 The 6-Step Process (In Order)

### **Visual Flow:**
```
START
  ↓
1️⃣ Create Time Periods (08:00-08:45, etc.)
  ↓
2️⃣ Create Rooms (Room 101, Lab 1, etc.)
  ↓
3️⃣ Create Timetable Template (Grade 1 - Term 1)
  ↓
4️⃣ Add Timetable Slots (Math - Mr. Smith - Room 101)
  ↓
5️⃣ Review & Verify (Check for conflicts)
  ↓
6️⃣ Publish Timetable (Make it visible)
  ↓
DONE ✅
```

---

## 📖 Detailed Instructions

### **STEP 1: Create Time Periods** ⏰
**What:** Define when classes happen (e.g., Period 1: 08:00-08:45)

**Why First:** You can't schedule classes without time slots

**How:**
- Click **"Add Period"** button on dashboard
- OR go to **Timetables → Periods → Create**
- Fill in: Name, Type (Lesson/Break/Lunch), Start Time, End Time
- Click **"Create Period"**

**Example:**
```
Period 1:       08:00 - 08:45 (Lesson)
Morning Break:  08:45 - 09:00 (Break)
Period 2:       09:00 - 09:45 (Lesson)
Lunch:          10:30 - 11:00 (Lunch)
```

**Status:** ✅ Green checkmark when you have at least 1 period

---

### **STEP 2: Create Rooms** 🚪
**What:** Register all classrooms and facilities

**Why Second:** You need rooms to assign to classes

**How:**
- Click **"Add Room"** button on dashboard
- OR go to **Timetables → Rooms → Create**
- Fill in: Room Number, Name, Type, Capacity, Facilities
- Click **"Create Room"**

**Example:**
```
Room 101 - Science Lab (Capacity: 25, Lab Equipment)
Room 102 - Computer Lab (Capacity: 30, Computers)
Room 201 - Classroom (Capacity: 35, Projector)
```

**Status:** ✅ Green checkmark when you have at least 1 room

---

### **STEP 3: Create Timetable Template** 📅
**What:** Create a timetable container for a specific grade and term

**Why Third:** This is where all your slots will be stored

**How:**
- Click **"New Template"** button on dashboard
- OR go to **Timetables → Templates → Create**
- Fill in: Grade, Academic Term, Template Name, Effective Date
- Click **"Create Template"**

**Example:**
```
Grade 1 - Term 1 2024/2025 Timetable
```

**Status:** ✅ Green checkmark when you have at least 1 template

---

### **STEP 4: Add Timetable Slots** 📝
**What:** Fill in the actual class schedule (Subject + Teacher + Room + Time)

**Why Fourth:** This is the actual timetable content

**How (Recommended - Grid View):**
- Go to **Timetables → Templates**
- Click **"Grid View"** on your template
- Click any empty cell
- Fill in: Subject, Teacher, Room
- Click **"Create Slot"**
- Repeat for all cells

**Example:**
```
Monday, Period 1: Mathematics - Mr. Smith - Room 101
Monday, Period 2: English - Ms. Johnson - Room 101
Tuesday, Period 1: Science - Dr. Brown - Lab 1
```

**Status:** ✅ Green checkmark when you have at least 1 slot

---

### **STEP 5: Review & Verify** 🔍
**What:** Check for conflicts and completeness

**Why Fifth:** Ensure quality before publishing

**How:**
- Open **Grid View** of your template
- Check for:
  - ❌ Same teacher in two places at once
  - ❌ Same room assigned twice at same time
  - ❌ Empty cells (missing classes)
  - ✅ All periods filled
  - ✅ Proper subject distribution

**Status:** 🟠 Orange highlight when ready to review

---

### **STEP 6: Publish Timetable** 🚀
**What:** Make the timetable visible to teachers and students

**Why Final:** This activates the timetable

**How:**
- Go to **Timetables → Templates**
- Find your template
- Click **"Publish"** button
- Confirm

**What Happens:**
- ✅ Teachers can see their schedules
- ✅ Students can see their classes
- ✅ Status changes to "Published"

**Status:** ✅ Green checkmark when published

---

## 📊 Dashboard Components

### **1. Statistics Cards**
Shows counts of:
- Total Templates
- Time Periods
- Rooms
- Total Slots
- Published Templates
- Draft Templates

**Click any card** to view that section.

---

### **2. Setup Guide (Main Component)**
Interactive step-by-step guide with:
- ✅ **Green** = Completed
- 🟠 **Orange** = Current step (what to do next)
- ⚪ **Gray** = Not started

Each step shows:
- Step number and title
- Description
- Examples
- Action buttons ("Create Now", "View All")
- Progress indicator

---

### **3. Progress Bar**
Shows overall completion percentage:
- 0% = Just started
- 50% = Halfway done
- 100% = All steps completed

---

### **4. Recent Templates**
Shows last 5 templates created with:
- Template name
- Grade and term
- Status (Draft/Published)
- Number of slots

**Click any template** to view details.

---

### **5. Quick Actions**
Fast access buttons:
- **Add Period** → Create new time period
- **Add Room** → Register new room
- **New Template** → Create new timetable
- **Availability** → Manage teacher availability

---

## 🎨 Color Coding

| Color | Meaning |
|-------|---------|
| 🟢 Green | Completed step |
| 🟠 Orange | Current/active step |
| ⚪ Gray | Not started |
| 🔵 Blue | Information/tips |
| 🟡 Yellow | Draft status |
| 🟢 Green | Published status |

---

## 💡 Tips for Success

1. **Follow the order** - Don't skip steps
2. **Use Grid View** - Fastest way to add slots
3. **Save frequently** - Don't lose your work
4. **Review before publishing** - Check for conflicts
5. **Start with one grade** - Don't try to do everything at once

---

## ❓ Common Questions

**Q: Can I skip steps?**
A: No, follow the order. You need periods and rooms before creating slots.

**Q: What if I make a mistake?**
A: You can edit or delete anything. Just click on it and make changes.

**Q: Can I create multiple templates?**
A: Yes! Create one template per grade per term.

**Q: What's the difference between Draft and Published?**
A: Draft = Only you can see it. Published = Everyone can see it.

**Q: Can I edit a published timetable?**
A: Yes! Changes are immediately visible to users.

---

## 🔄 Data Flow Diagram

```
Admin Creates Periods
        ↓
Admin Creates Rooms
        ↓
Admin Creates Template
        ↓
Admin Adds Slots (connects Subject + Teacher + Room + Period + Day)
        ↓
Admin Reviews (checks for conflicts)
        ↓
Admin Publishes
        ↓
Teachers See Their Schedules
Students See Their Classes
Parents See Children's Timetables
```

---

## 🎯 Success Criteria

Before publishing, ensure:
- [ ] At least 5-8 periods created
- [ ] At least 10-20 rooms created
- [ ] Template created for correct grade and term
- [ ] All lesson periods have slots (no gaps)
- [ ] No teacher conflicts (same teacher, same time)
- [ ] No room conflicts (same room, same time)
- [ ] Reviewed in Grid View
- [ ] Ready to publish

---

## 📞 Need Help?

If you're stuck:
1. Check the **Setup Guide** on the dashboard
2. Read the **TIMETABLE_WORKFLOW_GUIDE.md** document
3. Contact your system administrator

---

**Last Updated:** December 25, 2025
**Version:** 1.0.0
**Status:** ✅ Production Ready

