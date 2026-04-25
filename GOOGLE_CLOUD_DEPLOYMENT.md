# Google Cloud Platform Deployment Guide

Complete guide for deploying LOF V2 (Lotto Prediction App) to Google Cloud Platform.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [How to Check Your Project ID](#how-to-check-your-project-id)
- [Architecture Overview](#architecture-overview)
- [Initial Deployment](#initial-deployment)
  - [Backend Deployment](#backend-deployment)
  - [Frontend Deployment](#frontend-deployment)
  - [InstantDB Schema Deployment](#instantdb-schema-deployment)
- [Updating Deployments](#updating-deployments)
- [Verification & Testing](#verification--testing)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts & Tools

1. **Google Cloud Account** with billing enabled
   - Sign up: https://cloud.google.com
   - Enable billing: https://console.cloud.google.com/billing

2. **Google Cloud SDK (gcloud CLI)**
   - Download: https://cloud.google.com/sdk/docs/install
   - Verify installation: `gcloud --version`

3. **Docker Desktop** (for local frontend builds)
   - Download: https://www.docker.com/products/docker-desktop

4. **Node.js** (for InstantDB schema deployment)
   - Download: https://nodejs.org (v18 or later)

5. **InstantDB Credentials**
   - **App ID**: Get from https://www.instantdb.com/dash
   - **Admin Token**: Dashboard → Admin → Secret

### Initial Setup

```bash
# 1. Login to Google Cloud
gcloud auth login

# 2. Create or select project
gcloud projects create lof-v2 --name="LOF V2"
# OR use existing project
gcloud config set project YOUR_PROJECT_ID

# 3. Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# 4. Configure Docker authentication
gcloud auth configure-docker
```

### How to Check Your Project ID

You'll need your Google Cloud **Project ID** (not Project Name) for deployment commands. Here are several ways to find it:

**Option 1: Using gcloud CLI (Recommended)**
```powershell
# See current project
gcloud config get-value project

# List all your projects
gcloud projects list
```

**Option 2: Google Cloud Console (Web Interface)**
1. Go to: https://console.cloud.google.com
2. Look at the top of the page - the Project ID is shown in the project selector dropdown
3. Or go to: https://console.cloud.google.com/cloud-resource-manager

**Option 3: From Project Settings**
1. Go to: https://console.cloud.google.com/iam-admin/settings
2. The **Project ID** is displayed on the Project Settings page

**Important Notes:**
- **Project ID** is a unique identifier (e.g., `bayanwin`, `lof-v2-123456`)
- **Project Name** is a human-readable name (can be changed)
- Always use **Project ID** in commands (not Project Name)

**Example:**
If your project ID is `bayanwin`, use it like this:
```powershell
gcloud builds submit --tag gcr.io/bayanwin/lof-backend
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Google Cloud Platform                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐          ┌──────────────────┐         │
│  │  Frontend        │          │  Backend         │         │
│  │  (Cloud Run)     │─────────▶│  (Cloud Run)     │         │
│  │  Port: 8080      │  HTTPS   │  Port: 8080      │         │
│  │                  │          │                  │         │
│  │  React + Nginx   │          │  FastAPI         │         │
│  └──────────────────┘          └────────┬─────────┘         │
│                                         │                    │
│                                         │ REST API           │
│                                         ▼                    │
│                                  ┌──────────────────┐        │
│                                  │  InstantDB       │        │
│                                  │  (Cloud-hosted)  │        │
│                                  │                  │        │
│                                  │  Database API    │        │
│                                  └──────────────────┘        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Components:**
- **Frontend**: React app served via Nginx, deployed on Cloud Run
- **Backend**: FastAPI application, deployed on Cloud Run
- **Database**: InstantDB (cloud-hosted, no deployment needed)

---

## Initial Deployment

### Backend Deployment

#### Step 1: Navigate to Backend Directory

```powershell
cd C:\Users\jonel\OneDrive\Desktop\Jonel_Projects\LOF_V2\backend
```

#### Step 2: Build and Push Docker Image

```powershell
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/lof-backend
```

**Replace `YOUR_PROJECT_ID`** with your actual Google Cloud project ID (e.g., `bayanwin`).

**Expected output:**
```
Creating temporary archive...
Uploading tarball...
DONE
```

#### Step 3: Deploy to Cloud Run

```powershell
gcloud run deploy lof-backend `
  --image gcr.io/YOUR_PROJECT_ID/lof-backend `
  --platform managed `
  --region us-central1 `
  --allow-unauthenticated `
  --port 8080 `
  --memory 2Gi `
  --cpu 2 `
  --timeout 300 `
  --set-env-vars "INSTANTDB_APP_ID=YOUR_APP_ID,INSTANTDB_ADMIN_TOKEN=YOUR_TOKEN"
```

**Important:**
- Replace `YOUR_PROJECT_ID` with your project ID
- Replace `YOUR_APP_ID` with your InstantDB App ID
- Replace `YOUR_TOKEN` with your InstantDB Admin Token
- **Do NOT** include `PORT=8080` in env vars (Cloud Run sets it automatically)

**Expected output:**
```
Service [lof-backend] revision [...] has been deployed
Service URL: https://lof-backend-XXXXX.run.app
```

**Save the Service URL** - you'll need it for frontend deployment!

---

### Frontend Deployment

#### Step 1: Navigate to Frontend Directory

```powershell
cd C:\Users\jonel\OneDrive\Desktop\Jonel_Projects\LOF_V2\frontend
```

#### Step 2: Build Docker Image with Backend URL

**Option A: Using Docker (Recommended)**

```powershell
# Build with backend URL (replace with your actual backend URL from Step 3 above)
docker build --build-arg VITE_API_URL=https://lof-backend-XXXXX.run.app -t gcr.io/YOUR_PROJECT_ID/lof-frontend .

# Push to Google Container Registry
docker push gcr.io/YOUR_PROJECT_ID/lof-frontend
```

**Option B: Using Cloud Build**

Create `cloudbuild.yaml` in `frontend` folder:

```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '--build-arg'
      - 'VITE_API_URL=${_BACKEND_URL}'
      - '-t'
      - 'gcr.io/$PROJECT_ID/lof-frontend'
      - '.'
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/lof-frontend']
images:
  - 'gcr.io/$PROJECT_ID/lof-frontend'
```

Then run:
```powershell
gcloud builds submit --config cloudbuild.yaml --substitutions=_BACKEND_URL=https://lof-backend-XXXXX.run.app
```

#### Step 3: Deploy to Cloud Run

```powershell
gcloud run deploy lof-frontend `
  --image gcr.io/YOUR_PROJECT_ID/lof-frontend `
  --platform managed `
  --region us-central1 `
  --allow-unauthenticated `
  --port 8080
```

**Expected output:**
```
Service [lof-frontend] revision [...] has been deployed
Service URL: https://lof-frontend-XXXXX.run.app
```

---

### InstantDB Schema Deployment

**Important:** This is a **one-time** operation. Run it once locally, then stop (Ctrl+C).

#### Step 1: Navigate to Schema Directory

```powershell
cd C:\Users\jonel\OneDrive\Desktop\Jonel_Projects\LOF_V2\lof-v2-db
```

#### Step 2: Install Dependencies (if not already done)

```powershell
npm install
```

#### Step 3: Deploy Schema

```powershell
npm run dev
```

**What to expect:**
- The app will start and connect to InstantDB
- Wait for "Schema synced" or similar confirmation message
- Press `Ctrl+C` to stop (once sync is complete)

**Duration:** Usually 30 seconds to 2 minutes

**Note:** This only needs to be run **once**, not every deployment!

---

## Updating Deployments

When you make code changes, follow these steps to update your deployment:

### Backend Updates

**When to update:**
- Changed Python code (`.py` files)
- Updated `requirements.txt`
- Modified `backend/Dockerfile`
- Changed environment variables

**Steps:**

```powershell
# 1. Navigate to backend directory
cd C:\Users\jonel\OneDrive\Desktop\Jonel_Projects\LOF_V2\backend

# 2. Rebuild and push image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/lof-backend

# 3. Redeploy (Cloud Run will use new image automatically)
gcloud run deploy lof-backend `
  --image gcr.io/YOUR_PROJECT_ID/lof-backend `
  --platform managed `
  --region us-central1
```

**Note:** Environment variables persist - you don't need to set them again unless you want to change them.

### Background sheet sync (no browser open)

Google Sheets does not push to your app. To keep InstantDB updated on a schedule (e.g. every 15–30 minutes) when nobody has the site open:

1. Add a long random secret to Cloud Run **lof-backend** env: `CRON_SCRAPE_SECRET` (same as in `backend/.env` locally if you test there).
2. Redeploy the backend so `POST /api/cron/ingest-sheets` is available.
3. Enable **Cloud Scheduler API** and create a job in the **same region you use for other schedulers** (often `asia-southeast1`):

```powershell
gcloud services enable cloudscheduler.googleapis.com

# Replace YOUR_BACKEND_URL, YOUR_REGION, and use a strong secret (no commas in the secret value)
gcloud scheduler jobs create http lof-sheets-cron `
  --location=YOUR_REGION `
  --schedule="*/20 * * * *" `
  --uri="YOUR_BACKEND_URL/api/cron/ingest-sheets" `
  --http-method=POST `
  --headers="Content-Type=application/json,X-Scrape-Cron-Secret=YOUR_CRON_SECRET" `
  --message-body="{}"
```

The job runs an **incremental** scrape for all games (`full_sync=false`), same as a normal sync. Use a conservative schedule to limit API load (e.g. every 20–30 minutes).

---

### Frontend Updates

**When to update:**
- Changed React code (`.jsx`, `.js` files)
- Updated `package.json`
- Modified `frontend/Dockerfile` or `nginx.conf`
- Backend URL changed (need to rebuild with new URL)

**Steps:**

```powershell
# 1. Navigate to frontend directory
cd C:\Users\jonel\OneDrive\Desktop\Jonel_Projects\LOF_V2\frontend

# 2. Rebuild Docker image (use same backend URL as before)
docker build --build-arg VITE_API_URL=https://lof-backend-XXXXX.run.app -t gcr.io/YOUR_PROJECT_ID/lof-frontend .

# 3. Push updated image
docker push gcr.io/YOUR_PROJECT_ID/lof-frontend

# 4. Redeploy
gcloud run deploy lof-frontend `
  --image gcr.io/YOUR_PROJECT_ID/lof-frontend `
  --platform managed `
  --region us-central1
```

**Important:** If your backend URL changed, use the new URL in the `--build-arg VITE_API_URL=...` command.

---

### Updating Environment Variables (Backend)

**When to update:**
- Changed InstantDB credentials
- Need to update other config values

**Steps:**

```powershell
# Update environment variables without rebuilding
gcloud run services update lof-backend `
  --set-env-vars "INSTANTDB_APP_ID=NEW_APP_ID,INSTANTDB_ADMIN_TOKEN=NEW_TOKEN" `
  --region us-central1
```

**Or via Cloud Console:**
1. Go to https://console.cloud.google.com/run
2. Click on `lof-backend` service
3. Click "Edit & Deploy New Revision"
4. Go to "Variables & Secrets"
5. Update values and click "Deploy"

---

### Updating InstantDB Schema

**When to update:**
- Modified `lof-v2-db/src/instant.schema.ts`
- Added/removed entities

**Steps:**

```powershell
# 1. Navigate to schema directory
cd C:\Users\jonel\OneDrive\Desktop\Jonel_Projects\LOF_V2\lof-v2-db

# 2. Run schema sync again
npm run dev

# 3. Wait for sync confirmation, then Ctrl+C
```

**Note:** InstantDB will merge your schema changes. No backend restart needed!

---

## Verification & Testing

### Check Deployment Status

```powershell
# List all Cloud Run services
gcloud run services list

# Get detailed info about a service
gcloud run services describe lof-backend --region us-central1
gcloud run services describe lof-frontend --region us-central1
```

### Test Your Deployment

1. **Frontend**
   - Open: `https://lof-frontend-XXXXX.run.app`
   - Should load the React application

2. **Backend Health Check**
   - Open: `https://lof-backend-XXXXX.run.app/health`
   - Should return: `{"status":"healthy"}`

3. **Backend API Documentation**
   - Open: `https://lof-backend-XXXXX.run.app/docs`
   - Should show Swagger UI

4. **Frontend → Backend Connection**
   - Use the frontend UI to make API calls
   - Check browser console for any connection errors

---

## Troubleshooting

### Backend Won't Start

**Problem:** Service fails to deploy or crashes

**Solutions:**
```powershell
# Check logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=lof-backend" --limit 50

# Verify environment variables
gcloud run services describe lof-backend --region us-central1 --format="value(spec.template.spec.containers[0].env)"
```

**Common issues:**
- Missing `INSTANTDB_APP_ID` or `INSTANTDB_ADMIN_TOKEN`
- Port mismatch (should be 8080)
- Memory too low (increase with `--memory 4Gi`)

---

### Frontend Can't Connect to Backend

**Problem:** Frontend shows API errors

**Solutions:**
1. **Verify backend URL in frontend build:**
   - Check that `VITE_API_URL` was set correctly during build
   - Rebuild frontend if URL changed

2. **Check CORS settings:**
   - Backend should have `allow_origins=["*"]` in `app.py`

3. **Verify backend is running:**
   ```powershell
   gcloud run services list
   ```

---

### Port Configuration Issues

**Problem:** Container failed to start - port misconfiguration

**Solutions:**
- Backend: Ensure Dockerfile uses `${PORT:-8000}` and Cloud Run uses `--port 8080`
- Frontend: Ensure `nginx.conf` has `listen 8080;` and Cloud Run uses `--port 8080`

---

### Docker Push Authentication Errors

**Problem:** `error getting credentials` when pushing

**Solution:**
```powershell
# Re-authenticate Docker
gcloud auth configure-docker
```

---

### Schema Not Syncing

**Problem:** InstantDB schema changes not appearing

**Solutions:**
1. Verify InstantDB credentials are correct
2. Check that `lof-v2-db` folder has correct `.env` file
3. Ensure `npm run dev` runs to completion before stopping

---

## Quick Reference Commands

### Deployment Commands

```powershell
# Backend
cd backend
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/lof-backend
gcloud run deploy lof-backend --image gcr.io/YOUR_PROJECT_ID/lof-backend --platform managed --region us-central1 --allow-unauthenticated --port 8080 --memory 2Gi --cpu 2 --timeout 300 --set-env-vars "INSTANTDB_APP_ID=XXX,INSTANTDB_ADMIN_TOKEN=XXX"

# Frontend
cd frontend
docker build --build-arg VITE_API_URL=https://BACKEND_URL.run.app -t gcr.io/YOUR_PROJECT_ID/lof-frontend .
docker push gcr.io/YOUR_PROJECT_ID/lof-frontend
gcloud run deploy lof-frontend --image gcr.io/YOUR_PROJECT_ID/lof-frontend --platform managed --region us-central1 --allow-unauthenticated --port 8080

# Schema (one-time)
cd lof-v2-db
npm install
npm run dev  # Then Ctrl+C when done
```

### Update Commands

```powershell
# Update backend
cd backend
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/lof-backend
gcloud run deploy lof-backend --image gcr.io/YOUR_PROJECT_ID/lof-backend --region us-central1

# Update frontend
cd frontend
docker build --build-arg VITE_API_URL=https://BACKEND_URL.run.app -t gcr.io/YOUR_PROJECT_ID/lof-frontend .
docker push gcr.io/YOUR_PROJECT_ID/lof-frontend
gcloud run deploy lof-frontend --image gcr.io/YOUR_PROJECT_ID/lof-frontend --region us-central1

# Update env vars only
gcloud run services update lof-backend --set-env-vars "KEY=value" --region us-central1
```

---

## Cost Estimation

**Free Tier (First 90 days):**
- $300 free credits
- Cloud Run: 2 million requests/month free
- Cloud Build: 120 build-minutes/day free

**After Free Tier:**
- Cloud Run: ~$0.40 per million requests
- Cloud Build: ~$0.003 per build-minute
- Storage: ~$0.026 per GB/month

**Estimated monthly cost for small app:** $5-15/month

---

## Support & Resources

- **Google Cloud Console**: https://console.cloud.google.com
- **Cloud Run Documentation**: https://cloud.google.com/run/docs
- **InstantDB Documentation**: https://www.instantdb.com/docs
- **Check Service Logs**: https://console.cloud.google.com/logs

---

**Last Updated:** January 2025  
**Project:** LOF V2 - Lotto Prediction Application  
**Deployment Platform:** Google Cloud Platform (Cloud Run)
