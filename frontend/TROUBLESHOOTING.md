# Frontend Troubleshooting Guide

## Issue: Blank Page / Nothing Showing

If you see a blank page when running `npm run dev`, follow these steps:

### Step 1: Check Browser Console
1. Open http://localhost:3000 in your browser
2. Press `F12` or `Right-click → Inspect`
3. Go to **Console** tab
4. Look for any red error messages

### Step 2: Verify .env File
Make sure `frontend/.env` exists and contains:
```env
VITE_INSTANTDB_APP_ID=beb7efd4-c8f7-4157-ad5a-80b2f55f4f87
```

### Step 3: Restart Dev Server
After creating/editing `.env` file:
1. Stop the server (`Ctrl+C`)
2. Restart: `npm run dev`
3. **Important:** Vite needs a restart to pick up `.env` changes!

### Step 4: Check Network Tab
1. Open browser DevTools (`F12`)
2. Go to **Network** tab
3. Refresh the page
4. Look for failed requests (red)

### Step 5: Common Errors

**Error: "VITE_INSTANTDB_APP_ID is not defined"**
- Solution: Create `.env` file with `VITE_INSTANTDB_APP_ID=...`
- Restart dev server

**Error: "Cannot connect to InstantDB"**
- Check your internet connection
- Verify App ID is correct

**Error: "Failed to fetch"**
- Backend might not be running
- Start backend: `cd backend && uvicorn app:app --port 5000`

### Step 6: Clear Browser Cache
1. Press `Ctrl+Shift+R` (hard refresh)
2. Or clear browser cache

### Step 7: Check Terminal Output
Look at the terminal where `npm run dev` is running for any errors.

---

## Quick Fix Checklist

- [ ] `.env` file exists in `frontend/` directory
- [ ] `.env` contains `VITE_INSTANTDB_APP_ID=...`
- [ ] Dev server restarted after creating `.env`
- [ ] Browser console checked for errors
- [ ] Backend is running on port 5000
- [ ] Internet connection is working

---

## Still Not Working?

Share the error message from:
1. Browser Console (F12 → Console tab)
2. Terminal output from `npm run dev`

