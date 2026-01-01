# 🏗️ TIMETABLE SYSTEM - ARCHITECTURE DOCUMENTATION

**Project:** School Management System - Timetable Module  
**Date:** 2025-12-25  
**Status:** Architecture Documented

---

## 📐 SYSTEM ARCHITECTURE

### **Technology Stack:**
- **Backend:** Laravel 11
- **Frontend:** React 18 + Inertia.js
- **Database:** SQLite (development) / MySQL/PostgreSQL (production)
- **UI:** Tailwind CSS + Headless UI
- **Icons:** Lucide React

---

## 🗄️ DATABASE SCHEMA

### **1. timetable_templates**
**Purpose:** Main timetable container for each grade per term

```sql
- id (PK)
- school_id (FK → schools)
- grade_id (FK → grades)
- academic_term_id (FK → academic_terms)
- name
- description
- is_active (boolean)
- status (enum: draft, published, archived)
- active_days (JSON array)
- school_start_time (time)
- school_end_time (time)
- created_by (FK → users)
- updated_by (FK → users)
- timestamps
- soft_deletes

UNIQUE: (grade_id, academic_term_id, is_active)
```

### **2. timetable_periods**
**Purpose:** Reusable time slot definitions

```sql
- id (PK)
- school_id (FK → schools)
- name (e.g., "Period 1")
- period_number (integer)
- start_time (time)
- end_time (time)
- duration_minutes (integer)
- period_type (enum: lesson, break, lunch, assembly)
- is_break (boolean)
- is_active (boolean)
- description
- color_code
- timestamps

UNIQUE: (school_id, period_number)
```

### **3. rooms**
**Purpose:** Classroom and location management

```sql
- id (PK)
- school_id (FK → schools)
- name
- code
- room_type (enum: classroom, laboratory, library, etc.)
- capacity (integer)
- building
- floor
- facilities (text)
- status (enum: available, maintenance, reserved, inactive)
- is_active (boolean)
- notes
- timestamps
- soft_deletes

UNIQUE: (school_id, code)
```

### **4. timetable_slots**
**Purpose:** Individual schedule entries (the actual timetable grid)

```sql
- id (PK)
- school_id (FK → schools)
- timetable_template_id (FK → timetable_templates, CASCADE)
- timetable_period_id (FK → timetable_periods)
- day_of_week (enum: monday, tuesday, wednesday, thursday, friday)
- subject_id (FK → subjects, nullable)
- teacher_id (FK → teachers, nullable)
- room_id (FK → rooms, nullable)
- slot_type (enum: lesson, break, lunch, etc.)
- notes
- topic
- is_substitution (boolean)
- original_teacher_id (FK → teachers, nullable)
- timestamps

UNIQUE: (timetable_template_id, day_of_week, timetable_period_id)
```

### **5. teacher_availability**
**Purpose:** Track when teachers are available/unavailable

```sql
- id (PK)
- school_id (FK → schools)
- teacher_id (FK → teachers)
- academic_term_id (FK → academic_terms, nullable)
- day_of_week (enum)
- start_time (time)
- end_time (time)
- availability_type (enum: available, unavailable, preferred, limited)
- reason
- notes
- is_recurring (boolean)
- effective_from (date, nullable)
- effective_until (date, nullable)
- timestamps
```

### **6. timetable_conflicts**
**Purpose:** Automatic conflict detection and logging

```sql
- id (PK)
- school_id (FK → schools)
- timetable_template_id (FK → timetable_templates, CASCADE)
- slot_id_1 (FK → timetable_slots, CASCADE)
- slot_id_2 (FK → timetable_slots, CASCADE)
- conflict_type (enum: teacher_double_booking, room_double_booking, etc.)
- description
- severity (enum: low, medium, high, critical)
- status (enum: detected, acknowledged, resolved, ignored)
- resolution_notes
- resolved_by (FK → users, nullable)
- resolved_at (datetime, nullable)
- timestamps
```

---

## 🔗 MODEL RELATIONSHIPS

### **TimetableTemplate**
- `belongsTo(Grade)`
- `belongsTo(AcademicTerm)`
- `hasMany(TimetableSlot)`
- `hasMany(TimetableConflict)`
- `belongsTo(User, 'created_by')`
- `belongsTo(User, 'updated_by')`

### **TimetableSlot**
- `belongsTo(TimetableTemplate)`
- `belongsTo(TimetablePeriod)`
- `belongsTo(Subject)`
- `belongsTo(Teacher)`
- `belongsTo(Room)`
- `belongsTo(Teacher, 'original_teacher_id')`

### **TimetablePeriod**
- `hasMany(TimetableSlot)`

### **Room**
- `hasMany(TimetableSlot)`

### **TeacherAvailability**
- `belongsTo(Teacher)`
- `belongsTo(AcademicTerm)`

### **TimetableConflict**
- `belongsTo(TimetableTemplate)`
- `belongsTo(TimetableSlot, 'slot_id_1')`
- `belongsTo(TimetableSlot, 'slot_id_2')`
- `belongsTo(User, 'resolved_by')`

---

## 🔒 MULTI-TENANCY & SECURITY

### **Multi-Tenancy Pattern:**
1. All tables have `school_id` foreign key
2. `BelongsToSchool` trait applied to all models
3. Global scope automatically filters by `auth()->user()->school_id`
4. `school_id` auto-assigned on model creation

### **Authorization:**
- Policies for each resource (TimetablePolicy, RoomPolicy, etc.)
- Role-based access: `admin`, `teacher`, `guardian`
- Admin: Full CRUD access
- Teacher: View own timetable, view grade timetables
- Guardian: View child's grade timetable (read-only)

---

## 🎯 USER ROLES & PERMISSIONS

### **Admin:**
- ✅ Create/Edit/Delete timetables
- ✅ Manage periods and rooms
- ✅ Assign teachers to slots
- ✅ Resolve conflicts
- ✅ Publish/Archive timetables

### **Teacher:**
- ✅ View own timetable
- ✅ View grade timetables (for assigned grades)
- ✅ Set availability preferences
- ❌ Cannot edit timetables

### **Guardian:**
- ✅ View child's grade timetable
- ❌ Cannot edit anything

---

## 📋 NEXT STEPS

See `TIMETABLE_IMPLEMENTATION_LOG.md` for implementation phases.

