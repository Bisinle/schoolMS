# Service Worker Auto-Versioning Scripts

These scripts automatically version your service worker based on git commit hash, ensuring users get update notifications on every deployment.

---

## 📁 Files

- **`update-sw-version.sh`** - Injects git commit hash into sw.js (run before deployment)
- **`restore-sw-placeholder.sh`** - Restores placeholder in sw.js (run before committing to git)

---

## 🚀 Deployment Workflow

### **Step 1: Make Your Code Changes**
```bash
# Edit your Laravel/React code, database migrations, etc.
# Make all your changes as usual
```

### **Step 2: Commit to Git (with placeholder)**
```bash
# Make sure sw.js has the placeholder (not the commit hash)
./scripts/restore-sw-placeholder.sh

# Commit your changes
git add .
git commit -m "Your commit message"
git push origin main
```

### **Step 3: Deploy to Production**
```bash
# SSH into your production server
ssh user@your-server.com

# Pull latest code
cd /path/to/schoolMS
git pull origin main

# Update service worker version with commit hash
./scripts/update-sw-version.sh

# Run Laravel deployment commands
composer install --optimize-autoloader --no-dev
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Build frontend assets
npm install
npm run build

# Restart services if needed
sudo systemctl restart php8.2-fpm
sudo systemctl reload nginx
```

---

## 🔄 How It Works

### **Before Deployment:**
```javascript
// sw.js in git repository
const CACHE_NAME = 'schoolms-__CACHE_VERSION__';
```

### **After Running `update-sw-version.sh`:**
```javascript
// sw.js on production server
const CACHE_NAME = 'schoolms-43e5051';  // ← Git commit hash
```

### **What Happens:**
1. User visits your app
2. Browser detects new service worker version (different commit hash)
3. Update notification banner appears
4. User clicks "Update"
5. Page refreshes with latest code

---

## 🛠️ Manual Usage

### **Update Version (Before Deployment)**
```bash
cd schoolMS
./scripts/update-sw-version.sh
```

**Output:**
```
🔄 Updating Service Worker version...
✅ Service Worker updated successfully!
   Version: 43e5051
✨ Done! Deploy this version to trigger update notification for users.
```

### **Restore Placeholder (Before Git Commit)**
```bash
cd schoolMS
./scripts/restore-sw-placeholder.sh
```

**Output:**
```
🔄 Restoring Service Worker placeholder...
✅ Placeholder restored successfully!
   You can now commit sw.js to git
✨ Done!
```

---

## 🤖 Automated Deployment (Recommended)

Create a deployment script that runs everything automatically:

**`deploy.sh`:**
```bash
#!/bin/bash

echo "🚀 Starting deployment..."

# Update service worker version
./scripts/update-sw-version.sh

# Laravel deployment
composer install --optimize-autoloader --no-dev
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Frontend build
npm install
npm run build

# Restart services
sudo systemctl restart php8.2-fpm
sudo systemctl reload nginx

echo "✅ Deployment complete!"
```

Then just run:
```bash
./deploy.sh
```

---

## ⚠️ Important Notes

1. **Always restore placeholder before committing to git**
   - Git should have `__CACHE_VERSION__` placeholder
   - Production server should have actual commit hash

2. **The script uses git commit hash**
   - Make sure you're in a git repository
   - If git fails, it falls back to timestamp

3. **Every deployment triggers update notification**
   - Database changes → New version
   - React UI changes → New version
   - Laravel backend changes → New version
   - ANY code change → New version

4. **Users must click "Update" button**
   - Update is not automatic
   - Users see a banner and must click to update
   - Old version continues working until they update

---

## 🧪 Testing Locally

1. **Run the update script:**
   ```bash
   ./scripts/update-sw-version.sh
   ```

2. **Check sw.js has commit hash:**
   ```bash
   head -n 4 public/sw.js
   ```

3. **Visit your app and check console:**
   - Should see: `Service Worker registered`
   - Version should match commit hash

4. **Make a change and run script again:**
   ```bash
   git commit -m "test change"
   ./scripts/update-sw-version.sh
   ```

5. **Refresh browser:**
   - Update notification should appear
   - Click "Update" to see new version

---

## 📝 Troubleshooting

**Problem:** Script says "Not a git repository"
- **Solution:** Make sure you're in the schoolMS directory and it's a git repo

**Problem:** Update notification doesn't appear
- **Solution:** Check browser console for service worker errors
- **Solution:** Make sure you refreshed the page after deployment

**Problem:** sw.js has placeholder on production
- **Solution:** Run `./scripts/update-sw-version.sh` on production server

**Problem:** Can't commit sw.js to git
- **Solution:** Run `./scripts/restore-sw-placeholder.sh` first

---

## 🎯 Quick Reference

| Action | Command |
|--------|---------|
| Deploy to production | `./scripts/update-sw-version.sh` |
| Commit to git | `./scripts/restore-sw-placeholder.sh` then `git commit` |
| Check current version | `head -n 1 public/sw.js` |
| Test locally | `./scripts/update-sw-version.sh` then refresh browser |

---

**Questions?** Check the main README or contact the development team.

