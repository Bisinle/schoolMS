# Fee Preference System - Phase 1 Complete ✅

## 📊 What Was Implemented

Phase 1 has been successfully completed! Here's what was created:

### 1. Database Tables (4 new tables)

#### ✅ `transport_routes`
- Stores transport routes with one-way and two-way pricing
- Fields: `route_name`, `amount_two_way`, `amount_one_way`, `description`, `is_active`
- Unique constraint: `school_id` + `route_name`

#### ✅ `tuition_fees`
- Stores tuition fees per grade with full-day and half-day options
- Fields: `grade_id`, `academic_year_id`, `amount_full_day`, `amount_half_day`, `is_active`
- Unique constraint: `grade_id` + `academic_year_id`

#### ✅ `universal_fees`
- Stores universal fees that apply to all grades (Food, Sports, Library, Technology)
- Fields: `fee_type`, `fee_name`, `academic_year_id`, `amount`, `description`, `is_active`
- Unique constraint: `school_id` + `fee_type` + `academic_year_id`

#### ✅ `guardian_fee_preferences`
- Stores guardian's fee preferences per student per term
- Fields: `guardian_id`, `student_id`, `academic_term_id`, `tuition_type`, `transport_route_id`, `transport_type`, `include_food`, `include_sports`, `notes`
- Unique constraint: `student_id` + `academic_term_id`

---

### 2. Laravel Models (4 new models)

#### ✅ `TransportRoute`
- Relationships: `guardianFeePreferences()`
- Scopes: `active()`
- Helper: `getAmountForType(string $type)` - Returns amount for 'one_way' or 'two_way'

#### ✅ `TuitionFee`
- Relationships: `grade()`, `academicYear()`
- Scopes: `active()`, `forGrade()`, `forYear()`
- Helpers:
  - `getAmountForType(string $type)` - Returns amount for 'full_day' or 'half_day'
  - `getForGradeAndYear(int $gradeId, int $academicYearId)` - Static method to get tuition fee

#### ✅ `UniversalFee`
- Constants: `TYPE_FOOD`, `TYPE_SPORTS`, `TYPE_LIBRARY`, `TYPE_TECHNOLOGY`, `TYPE_OTHER`
- Relationships: `academicYear()`
- Scopes: `active()`, `forYear()`, `ofType()`
- Helpers:
  - `getDisplayNameAttribute()` - Returns formatted fee name
  - `getForYear(int $academicYearId)` - Static method to get all universal fees for a year
  - `getByType(string $type, int $academicYearId)` - Static method to get specific fee type

#### ✅ `GuardianFeePreference`
- Constants: `TUITION_FULL_DAY`, `TUITION_HALF_DAY`, `TRANSPORT_ONE_WAY`, `TRANSPORT_TWO_WAY`
- Relationships: `guardian()`, `student()`, `academicTerm()`, `transportRoute()`
- Scopes: `forGuardian()`, `forStudent()`, `forTerm()`
- Helpers:
  - `usesTransport()` - Check if student uses transport
  - `getTransportAmount()` - Get transport amount based on preference
  - `getOrCreateForStudentTerm()` - Get or create preference with defaults
  - `getForStudentTerm()` - Get existing preference or null

---

### 3. Updated Existing Models

#### ✅ `Guardian`
- Added relationship: `feePreferences()`

#### ✅ `Student`
- Added relationship: `feePreference()`

#### ✅ `Grade`
- Added relationship: `tuitionFees()`

#### ✅ `AcademicYear`
- Added relationships: `tuitionFees()`, `universalFees()`

#### ✅ `AcademicTerm`
- Added relationship: `guardianFeePreferences()`

---

### 4. Database Seeders (3 new seeders)

#### ✅ `TransportRouteSeeder`
Seeds 5 sample transport routes:
- Eastleigh (KSh 12,000 two-way, KSh 7,000 one-way)
- South C (KSh 15,000 two-way, KSh 8,500 one-way)
- Ngara (KSh 10,000 two-way, KSh 6,000 one-way)
- Parklands (KSh 13,000 two-way, KSh 7,500 one-way)
- Umoja (KSh 11,000 two-way, KSh 6,500 one-way)

#### ✅ `TuitionFeeSeeder`
Seeds tuition fees for all grades based on level:
- ECD: KSh 28,000 full-day, KSh 18,000 half-day
- Lower Primary: KSh 33,000 full-day, KSh 22,000 half-day
- Upper Primary: KSh 38,000 full-day, KSh 26,000 half-day
- Junior Secondary: KSh 45,000 full-day, KSh 32,000 half-day

#### ✅ `UniversalFeeSeeder`
Seeds 4 universal fees:
- Food: KSh 8,000
- Sports: KSh 5,000
- Library: KSh 3,000
- Technology: KSh 4,000

#### ✅ `FeePreferenceSystemSeeder`
Master seeder that runs all three seeders above with nice output formatting.

---

## 🚀 How to Run

### Step 1: Run Migrations
```bash
cd schoolMS
php artisan migrate
```

This will create the 4 new tables:
- `transport_routes`
- `tuition_fees`
- `universal_fees`
- `guardian_fee_preferences`

### Step 2: Seed Initial Data
```bash
php artisan db:seed --class=FeePreferenceSystemSeeder
```

This will populate:
- 5 transport routes per school
- Tuition fees for all grades in the active academic year
- 4 universal fees for the active academic year

---

## 📋 Database Structure

### Transport Routes
```
transport_routes
├── id
├── school_id (FK → schools)
├── route_name (unique per school)
├── amount_two_way
├── amount_one_way
├── description
├── is_active
└── timestamps
```

### Tuition Fees
```
tuition_fees
├── id
├── school_id (FK → schools)
├── grade_id (FK → grades, unique with academic_year_id)
├── academic_year_id (FK → academic_years)
├── amount_full_day
├── amount_half_day
├── is_active
└── timestamps
```

### Universal Fees
```
universal_fees
├── id
├── school_id (FK → schools)
├── fee_type (enum: food, sports, library, technology, other)
├── fee_name (for 'other' type)
├── academic_year_id (FK → academic_years)
├── amount
├── description
├── is_active
└── timestamps
```

### Guardian Fee Preferences
```
guardian_fee_preferences
├── id
├── school_id (FK → schools)
├── guardian_id (FK → guardians)
├── student_id (FK → students, unique with academic_term_id)
├── academic_term_id (FK → academic_terms)
├── tuition_type (enum: full_day, half_day)
├── transport_route_id (FK → transport_routes, nullable)
├── transport_type (enum: one_way, two_way, nullable)
├── include_food (boolean, default true)
├── include_sports (boolean, default true)
├── notes
└── timestamps
```

---

## ✅ Phase 1 Checklist

- [x] Create `transport_routes` table migration
- [x] Create `tuition_fees` table migration
- [x] Create `universal_fees` table migration
- [x] Create `guardian_fee_preferences` table migration
- [x] Create `TransportRoute` model with relationships
- [x] Create `TuitionFee` model with relationships
- [x] Create `UniversalFee` model with relationships
- [x] Create `GuardianFeePreference` model with relationships
- [x] Update `Guardian` model with relationships
- [x] Update `Student` model with relationships
- [x] Update `Grade` model with relationships
- [x] Update `AcademicYear` model with relationships
- [x] Update `AcademicTerm` model with relationships
- [x] Create `TransportRouteSeeder`
- [x] Create `TuitionFeeSeeder`
- [x] Create `UniversalFeeSeeder`
- [x] Create `FeePreferenceSystemSeeder`

---

## 🎯 Next Steps (Phase 2)

Phase 2 will focus on:
1. Creating UI for managing transport routes
2. Creating UI for managing tuition fees
3. Creating UI for managing universal fees
4. Creating UI for guardian fee preferences
5. Integrating preferences into invoice generation

---

## 📝 Notes

- All tables use the `BelongsToSchool` trait for multi-tenancy
- All models have proper relationships defined
- All migrations are reversible
- Seeders are idempotent (can be run multiple times safely)
- Sample data uses realistic Kenyan pricing

---

**Phase 1 Status**: ✅ **COMPLETE**
**Next Phase**: Phase 2 - UI Implementation

