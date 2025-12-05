# Deprecated: Old Fee Category System

## ⚠️ SYSTEM DEPRECATED

The old **FeeCategory** and **FeeAmount** system has been **REMOVED** and replaced by the **Fee Preference System**.

---

## 🗑️ What Was Removed

### Models
- ❌ `app/Models/FeeCategory.php`
- ❌ `app/Models/FeeAmount.php`

### Controllers
- ❌ `app/Http/Controllers/FeeCategoryController.php`
- ❌ `app/Http/Controllers/FeeAmountController.php`

### Views
- ❌ `resources/js/Pages/Fees/Categories/Index.jsx`

### Seeders
- ❌ `database/seeders/FeeCategorySeeder.php`
- ❌ `database/seeders/FeeManagementSeeder.php`

### Routes
- ❌ `/fee-categories` (all CRUD routes)
- ❌ `/fee-amounts` (all CRUD routes)

### Database Relationships
- ❌ `Grade::feeCategories()` relationship removed

---

## ✅ New System: Fee Preference System

The new system uses **4 specialized tables** instead of the generic fee_categories/fee_amounts approach:

### 1. **Transport Routes** (`transport_routes`)
- Route name, pickup/dropoff points
- One-way and two-way pricing
- Active/inactive status

### 2. **Tuition Fees** (`tuition_fees`)
- Grade-level tuition fees
- Full-day and half-day pricing
- Academic year specific

### 3. **Universal Fees** (`universal_fees`)
- School-wide fees (Food, Sports, Library, Technology, Other)
- Academic year specific
- Optional custom names for "Other" type

### 4. **Guardian Fee Preferences** (`guardian_fee_preferences`)
- Guardian's choices per student per term
- Tuition type (full-day/half-day)
- Transport route and type (one-way/two-way)
- Universal fee opt-in/opt-out (food, sports)
- Audit tracking (updated_by, previous_values)

---

## 📋 Migration Status

### Deprecated Migrations (Kept for History)
- `2025_12_01_000003_create_fee_categories_table.php` - Original old structure (commented out)
- `2025_12_02_130000_create_new_fee_structure_tables.php` - Intermediate structure (marked deprecated)

Both migrations have been updated with deprecation notices explaining they are no longer used.

### Active Migrations (Fee Preference System)
- `2025_12_05_000001_create_transport_routes_table.php`
- `2025_12_05_000002_create_tuition_fees_table.php`
- `2025_12_05_000003_create_universal_fees_table.php`
- `2025_12_05_000004_create_guardian_fee_preferences_table.php`
- `2025_12_05_160043_add_audit_fields_to_guardian_fee_preferences_table.php`

---

## 🔄 Migration Path

If you have existing data in `fee_categories` and `fee_amounts` tables:

1. **Backup your data** before proceeding
2. **Drop the old tables** (if they exist):
   ```sql
   DROP TABLE IF EXISTS fee_amounts;
   DROP TABLE IF EXISTS fee_categories;
   ```
3. **Run the new migrations**:
   ```bash
   php artisan migrate
   ```
4. **Seed the new system**:
   ```bash
   php artisan db:seed --class=FeePreferenceSystemSeeder
   ```

---

## 📚 Documentation

For complete documentation on the new Fee Preference System, see:
- `FEE_PREFERENCE_SYSTEM_PHASE1_COMPLETE.md` - Phase 1: Database & Models
- `FEE_PREFERENCE_QUICK_REFERENCE.md` - Quick reference guide
- Phase 2-9 documentation files for UI implementation

---

## 🎯 Benefits of New System

1. **Type Safety**: Specific tables for each fee type instead of generic categories
2. **Guardian-Centric**: Preferences stored per guardian per student per term
3. **Flexible Pricing**: Different pricing models (one-way/two-way, full-day/half-day)
4. **Audit Trail**: Track who changed preferences and what the previous values were
5. **Better UX**: Specialized UI for each fee type with real-time cost calculation
6. **Invoice Integration**: Automatic invoice generation based on preferences

---

**Date Deprecated**: December 5, 2025  
**Replaced By**: Fee Preference System (Phases 1-9)

