# Frontend - Simplified (No InstantDB!)

## ✅ What Changed

**Removed InstantDB SDK from frontend** - Backend handles all InstantDB operations!

- ❌ No `@instantdb/react` dependency
- ❌ No `VITE_INSTANTDB_APP_ID` needed
- ❌ No `.env` file needed
- ✅ Frontend just calls backend API
- ✅ Much simpler setup!

---

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

That's it! No `.env` file needed.

---

## How It Works

- **Frontend** → Calls backend API (`/api/*`)
- **Backend** → Handles all InstantDB operations
- **Simple!** → Frontend doesn't need to know about InstantDB

---

## API Endpoints

All endpoints are proxied to backend (configured in `vite.config.js`):

- `GET /api/games` - List games
- `GET /api/results/{gameType}` - Get results
- `POST /api/predict/{gameType}` - Generate predictions
- `GET /api/predictions/{gameType}` - Get predictions
- `GET /api/stats/{gameType}` - Get statistics
- `POST /api/scrape` - Scrape data

---

## Requirements

- Backend must be running on `http://localhost:5000`
- No InstantDB credentials needed in frontend!

