# 📋 Quick Reference Card

## 🎯 Setup Order (Must Follow!)

```
1. Rooms (optional)
2. Subjects
3. Teachers
4. Guardians
5. Grades (needs Teachers)
6. Configure Subject Rules (for timetables)
7. Streams (needs Grades)
8. Students (needs Streams + Guardians)
9. Attendance/Exams/Timetables
```

---

## 🔗 Quick URLs

| What | Where |
|------|-------|
| Create Subject | `/subjects/create` |
| Create Teacher | `/teachers/create` |
| Create Guardian | `/guardians/create` |
| Create Grade | `/grades/create` |
| Create Stream | `/streams/create` |
| Create Student | `/students/create` |
| Mark Attendance | `/attendance` |
| Create Exam | `/exams/create` |
| Create Timetable | `/timetables/templates/create` |

---

## ✅ Required Fields Cheat Sheet

### Subject
- ✅ Name
- ✅ Category (academic/islamic)
- ✅ Status (active)

### Teacher
- ✅ Name
- ✅ Email (unique)
- ✅ Phone
- ✅ Employee Number
- ✅ Date of Joining
- ✅ Status (active)

### Guardian
- ✅ Name
- ✅ Email (unique)
- ✅ Phone
- ✅ Guardian Number
- ✅ Relationship
- ✅ Status (active)

### Grade
- ✅ Name
- ✅ Level
- ✅ Status (active)
- ✅ At least 1 Teacher
- ✅ Class Teacher (must be one of assigned teachers)

### Stream
- ✅ Grade
- ✅ Name
- ✅ Status (active)

### Student
- ✅ First Name
- ✅ Last Name
- ✅ Gender
- ✅ Date of Birth
- ✅ Guardian
- ✅ Stream (not grade!)
- ✅ Admission Number
- ✅ Enrollment Date
- ✅ Status (active)

### Exam
- ✅ Name
- ✅ Type
- ✅ Term
- ✅ Academic Year
- ✅ Date
- ✅ Stream (not grade!)
- ✅ Subject

---

## 🎓 Subject Priority Guide (for Timetables)

### High Priority (Morning Slots)
- Mathematics
- English
- Science
- Kiswahili

### Neutral Priority (Anytime)
- Social Studies
- Islamic Studies
- Arabic

### Low Priority (Afternoon Slots)
- Art & Craft
- Music
- Physical Education

---

## 📊 Recommended Sessions Per Week

| Subject | Sessions/Week |
|---------|---------------|
| Mathematics | 5 |
| English | 5 |
| Kiswahili | 4 |
| Science | 4 |
| Social Studies | 3 |
| Islamic Studies | 3 |
| Quran | 5 |
| Arabic | 3 |
| Art | 2 |
| Music | 2 |
| PE | 2 |

---

## 🚨 Common Mistakes to Avoid

❌ **Creating students before streams**
✅ Create streams first, then students

❌ **Creating grades without teachers**
✅ Create teachers first, then assign to grades

❌ **Assigning students to grades**
✅ Assign students to streams (which belong to grades)

❌ **Creating exams for grades**
✅ Create exams for streams

❌ **Forgetting to set subject curriculum rules**
✅ Set sessions/week and priority for each subject in each grade

❌ **Not generating periods from blueprint**
✅ Generate periods before creating timetables

---

## 🔍 Troubleshooting

### "Cannot create grade - no teachers available"
→ Create teachers first

### "Cannot create student - no streams available"
→ Create grades and streams first

### "Cannot generate timetable - validation failed"
→ Check:
  - Class teacher assigned?
  - Default room assigned?
  - Subjects have sessions/week set?
  - Subjects have priority set?
  - Blueprint exists for level?
  - Periods generated?

### "Subject not showing in exam creation"
→ Assign subject to the grade first

### "Stream not showing in dropdown"
→ Check stream status is 'active'

---

## 💡 Pro Tips

1. **Start Small:** Create 1-2 of each entity first to test the workflow
2. **Use Codes:** Set meaningful codes (G1, G2, MATH, ENG) for easy reference
3. **Default Room:** Always assign a default room to grades for timetables
4. **Subject Rules:** Configure subject rules immediately after creating grades
5. **Streams:** Use "Main" for single-stream grades, "North/South" for multiple
6. **Bulk Import:** After testing, consider bulk importing data via CSV
7. **Backup:** Take database backups before major operations

---

## 📞 Need Help?

1. Check `COMPLETE_SETUP_WORKFLOW.md` for detailed instructions
2. Check `NAVIGATION_GUIDE.md` for navigation help
3. Check `STREAM_TESTING_CHECKLIST.md` for testing procedures
4. Check validation messages - they tell you exactly what's wrong

---

## 🎯 Minimal Test Setup (5 minutes)

```
1. Create 1 Subject: Mathematics (academic)
2. Create 1 Teacher: John Doe (assign Math)
3. Create 1 Guardian: Jane Smith
4. Create 1 Grade: Grade 1 (assign John as class teacher)
5. Configure Math: 5 sessions/week, priority: high
6. Create 1 Stream: Grade 1 - Main
7. Create 1 Student: Ahmed (assign to Grade 1 - Main, guardian: Jane)
8. Mark Attendance: Grade 1 - Main (mark Ahmed present)
9. Create 1 Exam: Math Mid-Term (Grade 1 - Main)
10. Create Blueprint → Generate Periods → Create Timetable
```

Done! You now have a working system to test all features.

---

## 📈 Full Production Setup (1-2 hours)

```
1. Create 10 Subjects (Math, English, Kiswahili, Science, etc.)
2. Create 5-10 Teachers (assign specializations)
3. Create 5-10 Guardians
4. Create 3-5 Grades (PP1, PP2, G1, G2, G3)
5. Configure all subject rules for all grades
6. Create 1-2 Streams per grade
7. Create 10-20 Students (distribute across streams)
8. Create Blueprints for each level (ECD, Lower Primary)
9. Generate Periods
10. Create Timetables for each grade/stream
```

Now you're ready for production! 🚀

---

## 🎨 Color Coding in UI

- 🟢 **Green:** Active/Success
- 🔴 **Red:** Inactive/Error
- 🟡 **Yellow:** Warning/Pending
- 🔵 **Blue:** Info/Neutral
- 🟣 **Purple:** Special/Featured

---

## 📅 Academic Year Setup

1. Go to `/settings/academic`
2. Set current academic year
3. Set current term (1, 2, or 3)
4. Set term start/end dates
5. This affects exams, reports, and timetables

---

## 🔐 User Roles

| Role | Access |
|------|--------|
| **Admin** | Full access to everything |
| **Teacher** | View students, mark attendance, enter exam results, view timetables |
| **Guardian** | View own children, attendance, exam results |

---

## 📱 Mobile Access

- Responsive design works on all devices
- Guardians can access via mobile browser
- Teachers can mark attendance on tablets
- No app installation needed

---

## 🎓 Remember

> **Students belong to STREAMS, not GRADES!**
> 
> This is the most important concept in the system.

---

Good luck with your setup! 🌟

