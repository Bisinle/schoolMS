# 🚀 Deployment Workflow - Service Worker Auto-Versioning

## ✅ EVERYTHING IS NOW AUTOMATIC!

You don't need to manually run any scripts. Just follow your normal workflow.

---

## 📋 **Your Daily Workflow (Simple!)**

### **Step 1: Make Your Code Changes**
```bash
# Edit any files - Laravel, React, database, CSS, whatever
vim resources/js/Pages/Students/Index.jsx
vim app/Http/Controllers/StudentController.php
vim database/migrations/xxx_create_students_table.php
```

### **Step 2: Commit and Push (Git Hook Runs Automatically)**
```bash
git add .
git commit -m "Added new student feature"
```

**What happens automatically:**
- ✅ Git pre-commit hook runs
- ✅ `restore-sw-placeholder.sh` executes
- ✅ `sw.js` gets placeholder `__CACHE_VERSION__`
- ✅ Commit proceeds with placeholder in git

```bash
git push origin main
```

### **Step 3: Laravel Cloud Deploys (Postbuild Runs Automatically)**

**What happens automatically:**
1. ✅ Laravel Cloud detects your push
2. ✅ Runs build commands:
   - `composer install`
   - `pnpm install`
   - `pnpm run build`
   - **✅ `postbuild` script runs automatically**
   - **✅ `update-sw-version.sh` injects git commit hash**
3. ✅ Runs deploy commands:
   - `php artisan migrate:fresh --seed --force`
   - `php artisan db:seed --class=SuperAdminSeeder --force`
4. ✅ Deployment complete!

### **Step 4: Users Get Update Notification**

**What happens automatically:**
1. ✅ User visits your app or refreshes page
2. ✅ Browser detects new service worker version
3. ✅ **Navy blue update banner appears** (bottom-right)
4. ✅ User clicks orange "Update" button
5. ✅ Page refreshes with latest code

---

## 🎯 **What You Need to Remember**

### **NOTHING!** 

Just use your normal workflow:
```bash
# Make changes
vim some-file.php

# Commit (automatic placeholder restoration)
git commit -m "message"

# Push (automatic deployment + version update)
git push origin main
```

**That's it!** Everything else is automatic.

---

## 🔍 **What's Happening Behind the Scenes**

### **Local (Your Computer):**
```
You run: git commit -m "message"
    ↓
Git pre-commit hook triggers
    ↓
restore-sw-placeholder.sh runs
    ↓
sw.js changes from: const CACHE_NAME = 'schoolms-43e5051';
                to: const CACHE_NAME = 'schoolms-__CACHE_VERSION__';
    ↓
Commit proceeds with placeholder
```

### **Production (Laravel Cloud):**
```
You run: git push origin main
    ↓
Laravel Cloud detects push
    ↓
Runs: pnpm run build
    ↓
postbuild script triggers
    ↓
update-sw-version.sh runs
    ↓
sw.js changes from: const CACHE_NAME = 'schoolms-__CACHE_VERSION__';
                to: const CACHE_NAME = 'schoolms-a7f3c21';  (new commit hash)
    ↓
Deployment completes with new version
```

### **User's Browser:**
```
User refreshes page
    ↓
Browser checks service worker
    ↓
Detects new version (a7f3c21 vs old 43e5051)
    ↓
Shows update banner
    ↓
User clicks "Update"
    ↓
Page reloads with latest code
```

---

## ⚠️ **Important Notes**

### **1. Git Hook Only Works on Your Computer**
- The `.git/hooks/pre-commit` file is NOT tracked by git
- If you clone the repo on another computer, you need to recreate the hook
- Run this on any new machine:
  ```bash
  cat > .git/hooks/pre-commit << 'EOF'
  #!/bin/bash
  ./scripts/restore-sw-placeholder.sh
  git add public/sw.js
  EOF
  chmod +x .git/hooks/pre-commit
  ```

### **2. What Gets Committed to Git**
- ✅ `sw.js` with `__CACHE_VERSION__` placeholder
- ✅ `scripts/update-sw-version.sh`
- ✅ `scripts/restore-sw-placeholder.sh`
- ✅ `package.json` with `postbuild` script

### **3. What Runs on Production**
- ✅ `postbuild` script (automatic after `pnpm run build`)
- ✅ `update-sw-version.sh` (called by postbuild)
- ✅ Result: `sw.js` has real commit hash

### **4. Every Deployment Triggers Update**
- ✅ Database changes → New version
- ✅ React UI changes → New version
- ✅ Laravel backend → New version
- ✅ CSS changes → New version
- ✅ **ANY code change → New version**

---

## 🧪 **How to Test Locally**

Want to see the update notification on your local machine?

```bash
# 1. Build locally (this runs postbuild)
pnpm run build

# 2. Check sw.js has commit hash
head -n 1 public/sw.js
# Should show: const CACHE_NAME = 'schoolms-43e5051';

# 3. Visit http://localhost:8002
# 4. Make a dummy change and commit
git commit --allow-empty -m "test update"

# 5. Build again
pnpm run build

# 6. Refresh browser
# 7. UPDATE BANNER APPEARS! 🎉
```

---

## 🆘 **Troubleshooting**

### **Problem: Git hook not running**
**Solution:** Make sure it's executable:
```bash
chmod +x .git/hooks/pre-commit
```

### **Problem: sw.js has commit hash in git**
**Solution:** Manually restore and recommit:
```bash
./scripts/restore-sw-placeholder.sh
git add public/sw.js
git commit -m "Restore sw.js placeholder"
git push
```

### **Problem: Update notification not appearing**
**Check:**
1. Did Laravel Cloud build succeed?
2. Check browser console for service worker errors
3. Make sure you refreshed the page after deployment
4. Check `sw.js` on production has commit hash (not placeholder)

---

## 📞 **Quick Reference**

| What You Do | What Happens Automatically |
|-------------|---------------------------|
| `git commit` | Placeholder restored in sw.js |
| `git push` | Laravel Cloud builds → postbuild runs → commit hash injected |
| User refreshes | Update banner appears |

---

**Questions?** Check `scripts/README.md` for more details.

