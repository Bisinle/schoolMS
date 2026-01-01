# 🚀 Timetable Module - Quick Start Guide

## 📋 Prerequisites

Before using the timetable module, ensure you have:
- ✅ Laravel application running
- ✅ Database configured and migrated
- ✅ Node.js and npm installed
- ✅ User authentication working
- ✅ Admin and Teacher roles configured

---

## 🏁 Getting Started

### **Step 1: Start Development Server**

```bash
# Terminal 1 - Start Laravel
cd schoolMS
php artisan serve

# Terminal 2 - Start Vite
npm run dev
```

### **Step 2: Access the Application**

1. Open browser: `http://localhost:8000`
2. Login as **Admin** user
3. Navigate to **Timetables** in the sidebar

---

## 📚 Usage Guide

### **A. Create Periods (Time Slots)**

1. Go to **Timetables → Periods**
2. Click **Create Period**
3. Fill in:
   - Period Name (e.g., "Period 1")
   - Period Type (Lesson, Break, Lunch, Assembly)
   - Start Time (e.g., 08:00)
   - End Time (e.g., 08:45)
4. Click **Create Period**

**Example Periods:**
- Period 1: 08:00 - 08:45 (Lesson)
- Morning Break: 08:45 - 09:00 (Break)
- Period 2: 09:00 - 09:45 (Lesson)
- Period 3: 09:45 - 10:30 (Lesson)
- Lunch: 10:30 - 11:00 (Lunch)
- Period 4: 11:00 - 11:45 (Lesson)

---

### **B. Create Rooms**

1. Go to **Timetables → Rooms**
2. Click **Create Room**
3. Fill in:
   - Room Number (e.g., "101")
   - Room Name (e.g., "Science Lab 1")
   - Room Type (Classroom, Laboratory, etc.)
   - Capacity (e.g., 30)
   - Facilities (Projector, Whiteboard, etc.)
4. Click **Create Room**

---

### **C. Create Timetable Template**

1. Go to **Timetables → Templates**
2. Click **Create Template**
3. Fill in:
   - Grade (e.g., "Grade 1")
   - Academic Term (e.g., "Term 1 - 2024/2025")
   - Template Name (e.g., "Grade 1 - Term 1 Timetable")
   - Effective From (Start date)
4. Click **Create Template**

---

### **D. Add Slots to Template**

**Method 1: From Template Show Page**
1. Click on a template to view details
2. Click **Add Slot**
3. Fill in:
   - Day of Week
   - Period
   - Subject
   - Teacher
   - Room (optional)
4. Click **Create Slot**

**Method 2: From Grid View (Recommended)**
1. Click **Grid View** on template
2. Click on any empty cell
3. Fill in the slot details
4. Click **Create Slot**

---

### **E. Publish Template**

1. Go to **Timetables → Templates**
2. Find your template
3. Click **Publish**
4. Confirm publication

**Note:** Published templates are visible to teachers and students.

---

### **F. Teacher Availability (Teachers)**

1. Login as **Teacher**
2. Go to **Timetables → My Availability**
3. Click **Create Availability**
4. Fill in:
   - Day of Week
   - Start Time
   - End Time
   - Availability Type (Available/Unavailable/Preferred)
   - Notes (optional)
5. Click **Create Availability**

---

## 🎯 Common Workflows

### **Workflow 1: Create Complete Timetable**

```
1. Create Periods (6-8 periods per day)
   ↓
2. Create Rooms (10-20 rooms)
   ↓
3. Create Template (for specific grade & term)
   ↓
4. Add Slots (using Grid View)
   ↓
5. Review & Verify
   ↓
6. Publish Template
```

### **Workflow 2: Modify Existing Timetable**

```
1. Find Template
   ↓
2. Open Grid View
   ↓
3. Click on slot to edit
   ↓
4. Update details
   ↓
5. Save changes
```

### **Workflow 3: Teacher Sets Availability**

```
1. Login as Teacher
   ↓
2. Go to My Availability
   ↓
3. Add availability slots
   ↓
4. Admin uses this info when creating timetables
```

---

## 📊 Features Overview

### **Templates**
- ✅ Create multiple templates per grade
- ✅ Draft → Published → Archived workflow
- ✅ Visual grid view
- ✅ Print functionality
- ✅ Effective date management

### **Periods**
- ✅ Flexible time slots
- ✅ Different period types
- ✅ Duration auto-calculation
- ✅ Active/Inactive status

### **Rooms**
- ✅ 11 room types
- ✅ Capacity tracking
- ✅ Facilities management
- ✅ Schedule viewing

### **Slots**
- ✅ Subject assignment
- ✅ Teacher assignment
- ✅ Room assignment
- ✅ Easy editing from grid

### **Availability**
- ✅ Teacher self-service
- ✅ Time range specification
- ✅ Availability types
- ✅ Notes support

---

## 🔍 Navigation Paths

### **Admin Access:**
- `/timetables/templates` - All templates
- `/timetables/periods` - All periods
- `/timetables/rooms` - All rooms
- `/timetables/availability` - All teacher availability
- `/timetables/templates/{id}/grid` - Grid view

### **Teacher Access:**
- `/timetables/templates` - View templates (read-only)
- `/timetables/availability` - Manage own availability

---

## 💡 Tips & Best Practices

1. **Create Periods First**
   - Set up all time periods before creating templates
   - Include breaks and lunch periods

2. **Use Grid View**
   - Fastest way to create/edit slots
   - Visual representation helps avoid conflicts

3. **Room Capacity**
   - Ensure room capacity matches class size
   - Add facilities for better room selection

4. **Teacher Availability**
   - Encourage teachers to set availability early
   - Use "Preferred" type for optimal scheduling

5. **Template Status**
   - Keep templates in "Draft" while editing
   - Publish only when complete and verified
   - Archive old templates instead of deleting

---

## 🐛 Troubleshooting

### **Issue: Can't see Timetables menu**
- **Solution:** Ensure you're logged in as Admin or Teacher

### **Issue: Can't create slot**
- **Solution:** Ensure periods and rooms are created first

### **Issue: Grid view is empty**
- **Solution:** Create periods first, then add slots

### **Issue: Can't publish template**
- **Solution:** Ensure template has at least one slot

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review the implementation guide
3. Contact system administrator

---

**Last Updated:** December 25, 2025
**Version:** 1.0.0
**Status:** ✅ Production Ready

