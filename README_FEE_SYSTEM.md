# 📚 Guardian Fee Preference System - Documentation Index

## 📖 Available Documentation

This directory contains comprehensive documentation for the Guardian Fee Preference System implemented in schoolMS.

---

## 📄 Documentation Files

### 1. **GUARDIAN_FEE_PREFERENCE_SYSTEM_EXPLAINED.md** (669 lines)
**Complete, detailed explanation of the entire system**

**Contents:**
- ✅ Complete database schema with sample data for all tables
- ✅ Guardian fee preference logic (how preferences work)
- ✅ Step-by-step invoice generation process
- ✅ Invoice structure with real examples
- ✅ Payment tracking mechanism
- ✅ Guardian model relationships and usage
- ✅ Controller methods and routes
- ✅ Due date logic
- ✅ Guardian contact information structure
- ✅ Key files reference

**Best for:** Deep understanding of the system before implementing new features

---

### 2. **GUARDIAN_FEE_SYSTEM_QUICK_REFERENCE.md** (200 lines)
**Quick reference guide for developers**

**Contents:**
- ✅ Database schema overview (visual tree structure)
- ✅ How preferences work (with examples)
- ✅ Invoice generation flow (step-by-step)
- ✅ Payment tracking (status flow)
- ✅ Code examples (common queries)

**Best for:** Quick lookups while coding

---

## 🎨 Visual Diagrams

### 3. **Entity Relationship Diagram**
Shows all database tables and their relationships

**Key Entities:**
- Guardians ↔ Students ↔ Fee Preferences
- Invoices ↔ Line Items ↔ Payments
- Tuition Fees, Transport Routes, Universal Fees
- Academic Years ↔ Academic Terms

### 4. **Invoice Generation Flow Diagram**
Visual flowchart showing the complete invoice generation process

**Flow:**
1. Select Guardian & Term
2. Fetch Active Students
3. Fetch Fee Preferences
4. Calculate Fees (Tuition, Transport, Food, Sports)
5. Create Line Items
6. Calculate Totals & Discounts
7. Save Invoice

### 5. **Payment Tracking State Diagram**
Shows invoice status transitions

**States:**
- `pending` → `partial` → `paid`
- `pending/partial` → `overdue` (when due_date passes)

---

## 🚀 Quick Start

### For AI Agents Implementing New Features:

**Step 1:** Read `GUARDIAN_FEE_PREFERENCE_SYSTEM_EXPLAINED.md` (sections 1-3)
- Understand database schema
- Understand preference logic
- Understand invoice generation

**Step 2:** Review the Entity Relationship Diagram
- Visualize table relationships
- Understand foreign keys

**Step 3:** Check `GUARDIAN_FEE_SYSTEM_QUICK_REFERENCE.md`
- See code examples
- Understand common queries

**Step 4:** Review relevant model files
- `app/Models/Guardian.php`
- `app/Models/GuardianInvoice.php`
- `app/Models/GuardianFeePreference.php`

---

## 🎯 System Summary

### Core Concept
**Guardian-centered fee management** where:
- One invoice per guardian per term (consolidates all children)
- Preferences stored per student per term
- Flexible fee structure (tuition type, transport, universal fees)

### Key Tables
1. **guardian_fee_preferences** - Stores guardian's choices for each child
2. **guardian_invoices** - One invoice per guardian per term
3. **invoice_line_items** - One line item per student with JSON fee breakdown
4. **guardian_payments** - Multiple payments per invoice

### Invoice Status Flow
```
pending → partial → paid
   ↓
overdue (if due_date passes)
```

### Fee Components
1. **Tuition** - Full-day or half-day (based on grade)
2. **Transport** - Optional (route + one-way/two-way)
3. **Food** - Universal fee (opt-in/opt-out)
4. **Sports** - Universal fee (opt-in/opt-out)

---

## 📞 Contact Information Structure

**Guardian Contact:**
- `guardians.phone_number` - Primary phone (+254712345678)
- `users.email` - Email (via guardian.user relationship)
- `users.name` - Full name (via guardian.user relationship)

---

## 🔑 Key Relationships

```php
// Guardian → Students
$students = $guardian->students;

// Guardian → Invoices
$invoices = $guardian->invoices;

// Guardian → Fee Preferences
$preferences = $guardian->feePreferences()
    ->where('academic_term_id', $termId)
    ->get();

// Invoice → Line Items
$lineItems = $invoice->lineItems;

// Invoice → Payments
$payments = $invoice->payments;
```

---

## 📊 Common Queries

### Get Unpaid Invoices for a Guardian
```php
$unpaidInvoices = $guardian->invoices()
    ->whereIn('status', ['pending', 'partial', 'overdue'])
    ->get();
```

### Get Overdue Invoices
```php
$overdueInvoices = GuardianInvoice::where('status', 'overdue')->get();
```

### Get Total Outstanding Balance
```php
$totalOutstanding = GuardianInvoice::sum('balance_due');
```

---

**For detailed information, refer to the specific documentation files above.**

