# Manual Testing Guide for Timetable Generation Validation

**Date:** 2026-01-03  
**Purpose:** Manual testing of all 8 validation scenarios

---

## Prerequisites

Before testing, ensure you have:
1. ✅ A school with admin access
2. ✅ At least one grade created
3. ✅ At least one academic term created
4. ✅ At least one timetable template created

---

## Test Scenario 1: All Requirements Met ✅

**Expected:** Validation passes, generate button enabled, generation succeeds

### Setup Steps:
1. Go to **Grades** → Select a grade → **Edit**
2. Assign a **class teacher**
3. Assign a **default classroom**
4. Go to **Grades** → Select same grade → **Subjects**
5. Assign at least 1 subject with:
   - `sessions_per_week` = 5
   - `priority` = high
6. Go to **Blueprints** → Create blueprint for grade's level
7. Mark blueprint as **active**
8. Go to **Blueprints** → Select blueprint → **Generate Periods**

### Test Steps:
1. Go to **Timetables** → Select template → **Grid View**
2. **Expected Results:**
   - ✅ No error panel shown
   - ✅ "Generate Timetable" button is **ENABLED** (blue)
   - ✅ No validation errors displayed
3. Click **"Generate Timetable"**
4. **Expected Results:**
   - ✅ Success message shown
   - ✅ Timetable slots created
   - ✅ Grid populated with lessons

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Scenario 2: Missing Class Teacher ❌

**Expected:** Validation fails, clear error shown, button disabled

### Setup Steps:
1. Complete all requirements from Scenario 1
2. Go to **Grades** → Select grade → **Edit**
3. **Remove** the class teacher assignment

### Test Steps:
1. Go to **Timetables** → Select template → **Grid View**
2. **Expected Results:**
   - ❌ Red error panel shown at top
   - ❌ Error message: "Cannot Generate Timetable for [Grade Name]"
   - ❌ Missing Requirements section shows:
     ```
     ❌ No class teacher assigned
        → Go to Grades → [Grade Name] → Edit → Assign a class teacher
     ```
   - ❌ "Generate Timetable" button is **DISABLED** (grayed out)
   - ❌ Button tooltip: "Fix validation errors before generating"
3. Try clicking **"Generate Timetable"** (should be disabled)
4. **Expected Results:**
   - ❌ Button does not respond (disabled)

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Scenario 3: Missing Default Room ❌

**Expected:** Validation fails, clear error shown, button disabled

### Setup Steps:
1. Complete all requirements from Scenario 1
2. Go to **Grades** → Select grade → **Edit**
3. **Remove** the default classroom assignment

### Test Steps:
1. Go to **Timetables** → Select template → **Grid View**
2. **Expected Results:**
   - ❌ Red error panel shown
   - ❌ Missing Requirements section shows:
     ```
     ❌ No default classroom assigned
        → Go to Grades → [Grade Name] → Edit → Assign a default room
     ```
   - ❌ "Generate Timetable" button is **DISABLED**

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Scenario 4: Missing Subject Curriculum ❌

**Expected:** Validation fails, shows which subjects need configuration, button disabled

### Setup Steps:
1. Complete all requirements from Scenario 1
2. Go to **Grades** → Select grade → **Subjects**
3. Edit subject and set:
   - `sessions_per_week` = **null** or **0**
   - OR `priority` = **null**

### Test Steps:
1. Go to **Timetables** → Select template → **Grid View**
2. **Expected Results:**
   - ❌ Red error panel shown
   - ❌ Missing Requirements section shows:
     ```
     ❌ [X] subjects missing curriculum rules (sessions per week, priority)
        → Go to Grades → [Grade Name] → Subjects → Configure: [Subject Names]
     ```
   - ❌ Subject names are listed (e.g., "Math, English, Science")
   - ❌ "Generate Timetable" button is **DISABLED**

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Scenario 5: No Blueprint ❌

**Expected:** Validation fails, suggests creating blueprint, button disabled

### Setup Steps:
1. Complete all requirements from Scenario 1
2. Go to **Blueprints** → Find blueprint for grade's level
3. **Deactivate** or **delete** the blueprint

### Test Steps:
1. Go to **Timetables** → Select template → **Grid View**
2. **Expected Results:**
   - ❌ Red error panel shown
   - ❌ Missing Requirements section shows:
     ```
     ❌ No active timetable blueprint found for [Level] level
        → Go to Blueprints → Create blueprint for [Level]
     ```
   - ❌ "Generate Timetable" button is **DISABLED**

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Scenario 6: No Periods Generated ❌

**Expected:** Validation fails, suggests generating periods from blueprint, button disabled

### Setup Steps:
1. Complete all requirements from Scenario 1
2. Go to **Blueprints** → Select blueprint
3. **Delete** all generated periods

### Test Steps:
1. Go to **Timetables** → Select template → **Grid View**
2. **Expected Results:**
   - ❌ Red error panel shown
   - ❌ Missing Requirements section shows:
     ```
     ❌ No periods generated from blueprint for [Level] level
        → Go to Blueprints → [Blueprint Name] → Generate Periods
     ```
   - ❌ "Generate Timetable" button is **DISABLED**

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Scenario 7: Multiple Errors ❌

**Expected:** Shows ALL errors at once, not one-by-one

### Setup Steps:
1. Create a fresh grade with NO setup
2. Create a timetable template for this grade
3. Do NOT assign:
   - Class teacher
   - Default room
   - Subjects
   - Blueprint
   - Periods

### Test Steps:
1. Go to **Timetables** → Select template → **Grid View**
2. **Expected Results:**
   - ❌ Red error panel shown
   - ❌ Missing Requirements section shows **ALL** errors:
     ```
     ❌ No class teacher assigned
        → Go to Grades → [Grade Name] → Edit → Assign a class teacher
     
     ❌ No default classroom assigned
        → Go to Grades → [Grade Name] → Edit → Assign a default room
     
     ❌ No subjects assigned
        → Go to Grades → [Grade Name] → Subjects → Assign subjects
     
     ❌ No active timetable blueprint found for [Level] level
        → Go to Blueprints → Create blueprint for [Level]
     ```
   - ❌ **ALL errors shown at once** (not one-by-one)
   - ❌ "Generate Timetable" button is **DISABLED**

**Status:** ⬜ Pass / ⬜ Fail

---

## Test Scenario 8: Warnings Only ⚠️

**Expected:** Allow generation, show warnings clearly, user can proceed

### Setup Steps:
1. Complete all requirements from Scenario 1
2. Go to **Teachers** → Select a teacher (NOT class teacher)
3. Ensure teacher has **NO subject specializations** set
4. Assign this teacher to the grade (as regular teacher, not class teacher)

### Test Steps:
1. Go to **Timetables** → Select template → **Grid View**
2. **Expected Results:**
   - ✅ No red error panel
   - ⚠️ Yellow warning panel shown:
     ```
     Warnings:
     ⚠️ No subject specializations set for teachers: [Teacher Name]
        → Go to Teachers → [Teacher Name] → Edit → Add subject specializations
     ```
   - ✅ "Generate Timetable" button is **ENABLED** (blue)
   - ✅ User can proceed despite warnings
3. Click **"Generate Timetable"**
4. **Expected Results:**
   - ✅ Generation succeeds
   - ✅ Success message shown
   - ✅ Timetable created

**Status:** ⬜ Pass / ⬜ Fail

---

## Additional Test: Multi-Tenant Data Isolation 🔒

**Expected:** Validation only checks data from same school

### Setup Steps:
1. Login as **School A** admin
2. Create grade with complete setup
3. Logout
4. Login as **School B** admin
5. Create grade with **NO setup** (same level as School A)

### Test Steps:
1. As **School B** admin, go to timetable grid
2. **Expected Results:**
   - ❌ Validation should **FAIL** for School B
   - ❌ Should **NOT** use School A's data
   - ❌ Errors shown for School B's missing requirements

**Status:** ⬜ Pass / ⬜ Fail

---

## Summary Checklist

- [ ] Scenario 1: All requirements met ✅
- [ ] Scenario 2: Missing class teacher ❌
- [ ] Scenario 3: Missing default room ❌
- [ ] Scenario 4: Missing subject curriculum ❌
- [ ] Scenario 5: No blueprint ❌
- [ ] Scenario 6: No periods generated ❌
- [ ] Scenario 7: Multiple errors ❌
- [ ] Scenario 8: Warnings only ⚠️
- [ ] Multi-tenant data isolation 🔒

---

## Critical Rules Verification

### DO NOT ❌
- [ ] Allow generation without validation
- [ ] Show generic error messages ("Something went wrong")
- [ ] Block generation silently (always explain why)
- [ ] Validate one requirement at a time (check all at once)
- [ ] Assume default values for critical fields

### ALWAYS ✅
- [ ] Check all requirements before generation
- [ ] Show clear, specific error messages
- [ ] Provide actionable next steps
- [ ] Validate in frontend AND backend
- [ ] Return all errors at once (not progressive)
- [ ] Use visual indicators (✅❌⚠️)
- [ ] Test with multiple schools (multi-tenant)

---

## Notes

Record any issues or observations here:

```
[Your notes here]
```

