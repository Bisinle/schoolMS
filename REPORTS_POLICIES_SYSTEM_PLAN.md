# Reports, Policies & Regulations System - Implementation Plan

## 📋 Overview

A comprehensive system for managing:
1. **Policies & Regulations** (Rich text content with versioning)
2. **Incident Reports** (Form-based: Accidents & Behavioral incidents)
3. **System Reports** (Data-driven reports from existing system data)

---

## ✅ Phase 1: Database & Models (COMPLETED)

### Migrations Created:
- ✅ `2026_01_20_000001_create_policies_table.php`
  - `policies` - Main policy documents
  - `policy_acknowledgments` - Track who has read policies
  - `policy_revisions` - Version history

- ✅ `2026_01_20_000002_create_incident_reports_table.php`
  - `accident_reports` - Physical accidents/injuries
  - `incident_reports` - Behavioral/security incidents

- ✅ `2026_01_20_000003_create_system_reports_table.php`
  - `system_reports` - Generated reports from system data
  - `report_schedules` - Recurring report automation

### Models Created:
- ✅ `Policy.php` - Policy management with versioning
- ✅ `PolicyAcknowledgment.php` - Track policy acknowledgments
- ✅ `PolicyRevision.php` - Policy version history
- ✅ `AccidentReport.php` - Accident reporting
- ✅ `IncidentReport.php` - Incident reporting
- ✅ `SystemReport.php` - Generated reports

---

## 📦 Phase 2: Controllers & Routes (TODO)

### Controllers to Create:

#### 1. PolicyController
```php
- index()          // List all policies
- create()         // Create new policy (rich text editor)
- store()          // Save policy
- show()           // View policy (increment view count)
- edit()           // Edit policy
- update()         // Update policy (create revision)
- destroy()        // Delete policy
- publish()        // Publish policy
- acknowledge()    // User acknowledges reading policy
- revisions()      // View revision history
- compare()        // Compare two versions
```

#### 2. AccidentReportController
```php
- index()          // List accident reports
- create()         // Create accident report form
- store()          // Save accident report
- show()           // View accident report
- edit()           // Edit accident report
- update()         // Update accident report
- review()         // Admin reviews report
- close()          // Close report
- export()         // Export to PDF
```

#### 3. IncidentReportController
```php
- index()          // List incident reports
- create()         // Create incident report form
- store()          // Save incident report
- show()           // View incident report
- edit()           // Edit incident report
- update()         // Update incident report
- resolve()        // Mark as resolved
- close()          // Close report
- studentHistory() // View all incidents for a student
```

#### 4. SystemReportController
```php
- index()          // List generated reports
- create()         // Report generation form
- generate()       // Generate report (async job)
- show()           // View report
- download()       // Download PDF/Excel
- destroy()        // Delete report
- schedule()       // Schedule recurring report
```

#### 5. Report Generators (Services)
```php
- FinancialReportGenerator
- AttendanceReportGenerator
- EnrollmentReportGenerator
- FeeCollectionReportGenerator
- AcademicPerformanceReportGenerator
- TeacherWorkloadReportGenerator
```

---

## 🎨 Phase 3: Frontend Components (TODO)

### Rich Text Editor for Policies
**Recommended: TipTap Editor (Vue/React)**
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image
```

Features needed:
- Headings, bold, italic, underline
- Lists (ordered, unordered)
- Links
- Tables
- Images
- Code blocks
- Text alignment
- Save as HTML

### Pages to Create:

#### Policies & Regulations
```
resources/js/Pages/Policies/
├── Index.jsx           // List all policies
├── Create.jsx          // Create policy (rich text editor)
├── Edit.jsx            // Edit policy
├── Show.jsx            // View policy (public view)
├── Revisions.jsx       // Version history
└── Acknowledgments.jsx // Track who acknowledged
```

#### Incident Reports
```
resources/js/Pages/Reports/Incidents/
├── Accidents/
│   ├── Index.jsx       // List accident reports
│   ├── Create.jsx      // Create accident report form
│   ├── Show.jsx        // View accident report
│   └── Edit.jsx        // Edit accident report
└── Behavioral/
    ├── Index.jsx       // List incident reports
    ├── Create.jsx      // Create incident report form
    ├── Show.jsx        // View incident report
    └── Edit.jsx        // Edit incident report
```

#### System Reports
```
resources/js/Pages/Reports/System/
├── Index.jsx           // List generated reports
├── Generate.jsx        // Report generation wizard
├── Show.jsx            // View report data
└── Schedule.jsx        // Schedule recurring reports
```

---

## 🔧 Phase 4: Report Generators (TODO)

### Financial Report Generator
**Data Sources:**
- `guardian_payments` table
- `guardian_invoices` table
- `invoice_line_items` table
- `tuition_fees`, `universal_fees`, `one_time_fees`

**Output:**
```json
{
  "period": "January 2026",
  "total_revenue": 500000,
  "total_invoiced": 600000,
  "total_paid": 500000,
  "outstanding": 100000,
  "payment_methods": {
    "cash": 200000,
    "bank_transfer": 250000,
    "mobile_money": 50000
  },
  "by_grade": [...],
  "by_fee_type": [...],
  "top_payers": [...],
  "overdue_accounts": [...]
}
```

### Attendance Report Generator
**Data Sources:**
- `attendances` table
- `students` table
- `grades` table

**Output:**
```json
{
  "period": "January 2026",
  "total_students": 500,
  "average_attendance_rate": 92.5,
  "by_grade": [...],
  "by_day": [...],
  "chronic_absentees": [...],
  "perfect_attendance": [...]
}
```

### Enrollment Report Generator
**Data Sources:**
- `students` table
- `grades` table

**Output:**
```json
{
  "total_students": 500,
  "by_grade": [...],
  "by_gender": {...},
  "new_enrollments": 50,
  "withdrawals": 5,
  "net_change": 45
}
```

---

## 🚀 Phase 5: Routes (TODO)

```php
// routes/web.php

// Policies & Regulations
Route::middleware(['auth'])->prefix('policies')->name('policies.')->group(function () {
    Route::get('/', [PolicyController::class, 'index'])->name('index');
    Route::get('/create', [PolicyController::class, 'create'])->name('create')->middleware('role:admin');
    Route::post('/', [PolicyController::class, 'store'])->name('store')->middleware('role:admin');
    Route::get('/{policy}', [PolicyController::class, 'show'])->name('show');
    Route::get('/{policy}/edit', [PolicyController::class, 'edit'])->name('edit')->middleware('role:admin');
    Route::put('/{policy}', [PolicyController::class, 'update'])->name('update')->middleware('role:admin');
    Route::delete('/{policy}', [PolicyController::class, 'destroy'])->name('destroy')->middleware('role:admin');
    Route::post('/{policy}/publish', [PolicyController::class, 'publish'])->name('publish')->middleware('role:admin');
    Route::post('/{policy}/acknowledge', [PolicyController::class, 'acknowledge'])->name('acknowledge');
    Route::get('/{policy}/revisions', [PolicyController::class, 'revisions'])->name('revisions');
});

// Accident Reports
Route::middleware(['auth'])->prefix('reports/accidents')->name('reports.accidents.')->group(function () {
    Route::get('/', [AccidentReportController::class, 'index'])->name('index');
    Route::get('/create', [AccidentReportController::class, 'create'])->name('create');
    Route::post('/', [AccidentReportController::class, 'store'])->name('store');
    Route::get('/{accidentReport}', [AccidentReportController::class, 'show'])->name('show');
    Route::get('/{accidentReport}/edit', [AccidentReportController::class, 'edit'])->name('edit');
    Route::put('/{accidentReport}', [AccidentReportController::class, 'update'])->name('update');
    Route::post('/{accidentReport}/review', [AccidentReportController::class, 'review'])->name('review')->middleware('role:admin');
});

// Incident Reports
Route::middleware(['auth'])->prefix('reports/incidents')->name('reports.incidents.')->group(function () {
    Route::get('/', [IncidentReportController::class, 'index'])->name('index');
    Route::get('/create', [IncidentReportController::class, 'create'])->name('create');
    Route::post('/', [IncidentReportController::class, 'store'])->name('store');
    Route::get('/{incidentReport}', [IncidentReportController::class, 'show'])->name('show');
    Route::get('/{incidentReport}/edit', [IncidentReportController::class, 'edit'])->name('edit');
    Route::put('/{incidentReport}', [IncidentReportController::class, 'update'])->name('update');
    Route::post('/{incidentReport}/resolve', [IncidentReportController::class, 'resolve'])->name('resolve');
});

// System Reports
Route::middleware(['auth'])->prefix('reports/system')->name('reports.system.')->group(function () {
    Route::get('/', [SystemReportController::class, 'index'])->name('index');
    Route::get('/create', [SystemReportController::class, 'create'])->name('create')->middleware('role:admin');
    Route::post('/generate', [SystemReportController::class, 'generate'])->name('generate')->middleware('role:admin');
    Route::get('/{systemReport}', [SystemReportController::class, 'show'])->name('show');
    Route::get('/{systemReport}/download', [SystemReportController::class, 'download'])->name('download');
    Route::delete('/{systemReport}', [SystemReportController::class, 'destroy'])->name('destroy')->middleware('role:admin');
});
```

---

## 📊 Next Steps

1. **Run migrations:**
   ```bash
   php artisan migrate
   ```

2. **Create controllers** (Phase 2)

3. **Install rich text editor:**
   ```bash
   npm install @tiptap/react @tiptap/starter-kit
   ```

4. **Create frontend pages** (Phase 3)

5. **Build report generators** (Phase 4)

6. **Add routes** (Phase 5)

7. **Create policies** (for authorization)

8. **Test the system**

---

## 🎯 Priority Order

**Week 1:**
- ✅ Database & Models (DONE)
- Controllers for Policies
- Rich text editor integration
- Basic policy CRUD

**Week 2:**
- Accident Report forms
- Incident Report forms
- Report viewing/editing

**Week 3:**
- System Report generators
- Financial reports
- Attendance reports

**Week 4:**
- Report scheduling
- PDF generation
- Email notifications
- Testing & refinement

---

Would you like me to start implementing any specific part?

