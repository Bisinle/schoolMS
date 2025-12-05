# 🧪 Fee Preference System - Testing Guide

## 📋 Pre-Testing Setup

### **1. Run Migrations**
```bash
cd schoolMS
php artisan migrate
```

### **2. Seed Test Data** (Optional)
```bash
php artisan db:seed --class=TransportRouteSeeder
php artisan db:seed --class=TuitionFeeSeeder
php artisan db:seed --class=UniversalFeeSeeder
```

### **3. Start Development Server**
```bash
php artisan serve
# Visit: http://localhost:8002
```

---

## 🧪 Testing Checklist

### **Phase 1-4: Fee Setup**

#### **Transport Routes**
- [ ] Navigate to Fees → Transport Routes
- [ ] Click "Add Transport Route"
- [ ] Create route: "Eastleigh" with one-way: 6000, two-way: 12000
- [ ] Verify route appears in list
- [ ] Edit route and change pricing
- [ ] Toggle active status
- [ ] Delete route (if no dependencies)

#### **Tuition Fees**
- [ ] Navigate to Fees → Tuition Fees
- [ ] Select academic year
- [ ] Click "Bulk Add Tuition Fees"
- [ ] Enter amounts for all grades
- [ ] Verify fees appear grouped by level
- [ ] Edit individual fee
- [ ] Toggle active status

#### **Universal Fees**
- [ ] Navigate to Fees → Universal Fees
- [ ] Select academic year
- [ ] Click "Bulk Add Universal Fees"
- [ ] Enter amounts for Food, Sports, Library, Technology
- [ ] Verify color-coded cards appear
- [ ] Edit individual fee
- [ ] Toggle active status

---

### **Phase 5: Guardian Preferences**

#### **Index Page**
- [ ] Navigate to Fees → Fee Preferences
- [ ] Select academic term
- [ ] Verify guardian list loads
- [ ] Check stats: Total, With Preferences, Without Preferences
- [ ] Filter by "With Preferences"
- [ ] Filter by "Without Preferences"

#### **Edit Preferences**
- [ ] Click "Set Preferences" for a guardian
- [ ] Verify all children listed
- [ ] For first child:
  - [ ] Select "Full Day" tuition
  - [ ] Select transport route "Eastleigh"
  - [ ] Select "Two Way" transport
  - [ ] Check "Include Food"
  - [ ] Check "Include Sports"
- [ ] Verify total updates in real-time
- [ ] Click "Copy to All Children"
- [ ] Verify all children have same preferences
- [ ] Modify second child to "Half Day"
- [ ] Verify grand total updates
- [ ] Save preferences
- [ ] Verify success message

#### **Bulk Apply Defaults**
- [ ] Go back to index
- [ ] Click "Bulk Apply Defaults"
- [ ] Select guardians without preferences
- [ ] Set default: Full Day, Eastleigh 2-Way, Food, Sports
- [ ] Apply defaults
- [ ] Verify guardians now have preferences

---

### **Phase 6: Invoice Generation**

#### **Single Invoice Creation**
- [ ] Navigate to Invoices → Create Invoice
- [ ] Select guardian with preferences
- [ ] Select term
- [ ] Verify preview shows:
  - [ ] All children listed
  - [ ] Fee breakdown matches preferences
  - [ ] Totals calculated correctly
- [ ] Generate invoice
- [ ] Verify success message

#### **Bulk Invoice Generation**
- [ ] Navigate to Invoices → Bulk Generate
- [ ] Select term
- [ ] Verify stats dashboard shows:
  - [ ] Total guardians
  - [ ] With preferences
  - [ ] Without preferences
- [ ] Filter "With Preferences Only"
- [ ] Preview guardians
- [ ] Generate invoices
- [ ] Verify progress/summary

---

### **Phase 7: Invoice Display**

#### **View Invoice**
- [ ] Navigate to Invoices
- [ ] Click on an invoice
- [ ] Verify invoice shows:
  - [ ] Student names and grades
  - [ ] Fee breakdown with types (Full Day, 2-Way, etc.)
  - [ ] Correct amounts
  - [ ] Grand total
- [ ] Test on mobile (resize browser)
- [ ] Verify mobile card layout

#### **PDF Invoice**
- [ ] Click "Download PDF"
- [ ] Verify PDF shows:
  - [ ] Fee types in parentheses
  - [ ] Professional formatting
  - [ ] All line items
  - [ ] Correct totals

---

### **Phase 8: Preference Change Workflow**

#### **Update Preferences (No Invoice)**
- [ ] Select guardian without invoice for current term
- [ ] Edit preferences
- [ ] Verify no warning banner
- [ ] Save preferences
- [ ] Verify success message

#### **Update Preferences (Unpaid Invoice)**
- [ ] Select guardian with pending invoice
- [ ] Edit preferences
- [ ] Verify amber warning banner appears
- [ ] Verify invoice details shown (number, status, amounts)
- [ ] **Test A**: Save without regenerating
  - [ ] Leave checkbox unchecked
  - [ ] Save
  - [ ] Verify message: "Changes will apply to next invoice"
  - [ ] Verify invoice unchanged
- [ ] **Test B**: Regenerate invoice
  - [ ] Edit preferences again
  - [ ] Check "Regenerate invoice"
  - [ ] Save
  - [ ] Verify message: "Invoice regenerated"
  - [ ] View invoice
  - [ ] Verify new amounts match updated preferences

#### **Update Preferences (Paid Invoice)**
- [ ] Create invoice and mark as paid
- [ ] Edit preferences
- [ ] Verify warning shows "Invoice is paid"
- [ ] Verify no regenerate checkbox
- [ ] Save preferences
- [ ] Verify message: "Saved for next term only"

#### **View Change History**
- [ ] Edit guardian preferences
- [ ] Click "View History" button
- [ ] Verify modal opens
- [ ] Verify history shows:
  - [ ] Student names
  - [ ] Preference details
  - [ ] Updated by (your name)
  - [ ] Timestamp
- [ ] Make another change
- [ ] View history again
- [ ] Verify new entry appears

---

## 🐛 Common Issues & Solutions

### **Issue: Fees not appearing**
**Solution**: Check academic year/term selection, verify fees are active

### **Issue: Invoice generation fails**
**Solution**: Ensure preferences exist, check for duplicate invoices

### **Issue: Totals incorrect**
**Solution**: Verify fee amounts in setup, check preference selections

### **Issue: History not showing**
**Solution**: Ensure you're logged in, check term filter

---

## ✅ Success Criteria

### **All Tests Pass If**:
- [ ] All fee types can be created, edited, deleted
- [ ] Preferences can be set and saved
- [ ] Invoices generate correctly from preferences
- [ ] Invoice display shows detailed breakdowns
- [ ] Preference changes tracked in history
- [ ] Invoice warnings appear correctly
- [ ] Regeneration works for unpaid invoices
- [ ] Paid invoices protected from regeneration
- [ ] Mobile responsive on all pages
- [ ] No console errors
- [ ] No PHP errors in logs

---

## 📝 Test Data Recommendations

### **Transport Routes**
- Eastleigh: 6000 / 12000
- Parklands: 5000 / 10000
- Westlands: 7000 / 14000

### **Tuition Fees** (Example for Grade 1)
- Full Day: 35000
- Half Day: 20000

### **Universal Fees**
- Food: 8000
- Sports: 5000
- Library: 2000
- Technology: 3000

---

## 🎯 Next Steps After Testing

1. **Production Deployment**
   - Backup database
   - Run migrations on production
   - Seed initial fee data
   - Test with real guardians

2. **User Training**
   - Train admin staff on fee setup
   - Train on preference management
   - Train on invoice generation
   - Train on handling mid-term changes

3. **Monitoring**
   - Monitor invoice generation success rate
   - Track preference coverage
   - Review change history regularly
   - Monitor for errors

4. **Future Enhancements** (Optional)
   - Guardian self-service portal
   - Email notifications for preference changes
   - Automated preference reminders
   - Advanced reporting and analytics

---

## 📞 Support

If you encounter issues during testing:
1. Check Laravel logs: `storage/logs/laravel.log`
2. Check browser console for JS errors
3. Verify database migrations ran successfully
4. Ensure all seeders completed

**Happy Testing! 🎉**

