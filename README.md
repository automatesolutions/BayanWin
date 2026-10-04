# BayanWin

PCSO lotto results, ticket check, statistics, and **7 model picks** (six ML models plus **Miro**, an optional LLM synthesis). Live site: [bayanwin.net](https://bayanwin.net).

The backend scrapes lottery results from Google Sheets (and optionally [Apify](#apify-optional-ingest)), stores them in InstantDB, and serves the React app. InstantDB is cloud-hosted. You do not start a local database process.
<img width="731" height="200" alt="image" src="https://github.com/user-attachments/assets/8afe2bdd-1548-4047-92cd-474de0942c87" />

<img width="700" height="447" alt="image" src="https://github.com/user-attachments/assets/5b0d852c-e7ba-49c2-97fa-53e1d81ca460" />


<img width="683" height="454" alt="image" src="https://github.com/user-attachments/assets/453a6dc2-b114-4b73-91e6-8f814d237fdf" />


<img width="688" height="368" alt="image" src="https://github.com/user-attachments/assets/581d26c0-73c6-497e-86cb-f07c64ae8fbf" />




> 📚 **Detailed Documentation**: For comprehensive system documentation including workflow flowchart and architecture details, see [SOFTWARE_DOCUMENTATION.html](./SOFTWARE_DOCUMENTATION.html)

## Design

Dark, data-first UI. Tokens live in `frontend/tailwind.config.js` (see `.claude/skills/bayanwin-design/SKILL.md`).

| Role | Token | Hex |
|---|---|---|
| Page | `charcoal-900` | `#0C1119` |
| Cards | `charcoal-800` | `#131A25` |
| Links / focus | `electric-500` | `#3B9EFF` |
| Number balls / primary action | `orange-500` | `#F59331` |
| Body text | `silver-300` | `#C3CBD6` |

**Type:** General Sans (headings), Satoshi (UI), JetBrains Mono (draw numbers and money).

**Motion:** GSAP (ScrollSmoother on desktop, `Reveal`, pipeline draw). Respects `prefers-reduced-motion`. Header and cookie banner sit outside the smooth-scroll wrapper.

## ✨ Features

- **Automated Data Scraping**: 
  - Auto-scrapes new data when a game is selected
  - **Latest results UI** also runs **incremental** sync on a timer (every **90 seconds**), when the browser tab regains focus, and shortly after changing the selected game — so the page can refresh without manual clicks (Google Sheets still does not push live; this polls the backend)
  - Default path uses the **Google Sheets API** (via `gspread`) to read only a sliding row window when `GOOGLE_SERVICE_ACCOUNT_FILE` is set; cursors are stored in InstantDB (`sheet_ingest_cursors`)
  - Falls back to a **full public CSV export** per scrape when service-account credentials are missing; the public CSV URL uses **cache-busting** and the tab name from `SHEETS_WORKSHEET_NAME` (not a hardcoded sheet name)
  - **`full_sync: true`** (body or `?full_sync=true`) re-downloads the **entire** sheet via CSV, reconciles duplicates, and resets the ingest cursor — use after rows were **inserted above** the cursor or for a periodic deep reconcile
  - Incremental / default scrapes do **not** substitute a “tail only” read for full CSV when you requested full sync (full sync always pulls the whole export)
  - **Background server sync**: `POST /api/cron/ingest-sheets` (optional `CRON_SCRAPE_SECRET`) runs the same ingest as a normal scrape so **Cloud Scheduler** can update InstantDB even when no one has the site open
  - Automatically detects and skips duplicate entries based on draw_date and draw_number
  - Supports 5 lottery games with separate data sources (sheet IDs in `backend/config.py`)
  
- **InstantDB**:
  - Cloud database. No local Instant process to activate
  - Backend writes through Node Admin SDK scripts (`backend/scripts/`)
  - Frontend calls only the FastAPI `/api` routes
  - Predictions and results are stored in InstantDB
  - Accuracy updates when new draws are ingested

- **Six core ML prediction models**:
  - **XGBoost**: Gradient boosting model using historical patterns (~6-10 seconds)
  - **Decision Tree**: Random Forest classifier based on frequency analysis (~4-6 seconds)
  - **Markov Chain**: State transition model for sequence prediction (~1-3 seconds)
  - **Anomaly Detection**: Monte Carlo / Gaussian (sum/product) distribution analysis for highest-probability patterns (~0.5-3 seconds)
  - **NashHotFilter**: Nash Equilibrium mixed-strategy + Hot-Number probability filter (smart wheel, 3-even/3-odd balance; instant)
  - **Deep Reinforcement Learning (DRL)**: DRL agent with 3 feedback loops, continuously improves through accuracy feedback (~20-40 seconds, 5 episodes)

- **Miro — LLM “swarm” synthesis (7th prediction)**  
  *Naming:* the codebase and UI use **`Miro`** (`model_type: "Miro"`). “Swarm” here means a **coordinated multi-voice LLM workflow** (specialist round + chair), not separate third-party agent services.  
  After the six models finish, the backend can run **Miro**: a **two-step OpenAI-compatible LLM** workflow — **one structured JSON “round table”** simulating the six specialist names, then a **chairman** call that outputs six numbers.  
  - **Round 1:** The model is prompted to simulate **six named specialists** (same names as your ML models: XGBoost … DRL) and return JSON (`reaction_to_others`, optional `preferred_numbers`, `concerns`) over a shared analytics bundle.  
  - **Round 2 (chairman):** A second call reads that transcript **plus** the same context and returns **`final_numbers`** (six distinct integers in game bounds).  
  - **Context** (`build_miro_context` in `backend/services/miro_strategy.py`) includes: base model picks, **pairwise overlap**, **historical error-by-model**, hot/cold snapshot, **overdue** numbers, **Gaussian sum + product bands** (including log-mean / log-std on products via `backend/utils/gaussian_summary.py`), top **co-occurrence** and **cross-draw transition** edges, and draw metadata. Apify-ingested rows are included automatically because they live in the same InstantDB `*_results` tables.  
  - **Validation:** Bounds and uniqueness checks, one **repair** LLM pass if needed, then a **deterministic vote fallback** across the six base models’ numbers so the UI rarely breaks.  
  - **Persistence:** Same shape as other models — `model_type: "Miro"` saved via InstantDB.  
  - **Config:** Requires `LLM_API_KEY`; toggle with `MIRO_STRATEGY_ENABLED` (see [`backend/.env.example`](./backend/.env.example)). **Advisory only** — does not retrain the six ML models.  
  - **UI:** “Core models” grid plus a separate **“Miro — LLM synthesis”** panel in `PredictionDisplay`.

- **AI Council (separate from Miro)**  
  Optional **advisory prose** (`POST /api/predict/.../council-report` or bundled when `include_council=true`): overlap, historical leaders, caveats — **text only**, not a replacement for Miro’s numeric pick.

- **Smart Model Training**: 
  - Models automatically retrain when switching between game types
  - Parallel processing for faster prediction generation
  - Real-time training status indicators

- **Site and UI** (homepage + editorial pages):
  - Home: latest draws first, game selector, ticket checker, 7-model run, stats, error-distance, graphs
  - `LatestDrawsBoard` plus incremental result sync (timer, tab focus, game change)
  - Blog, About, Methodology, Responsible play, Contact, Privacy, Terms
  - Cookie consent banner; AdSense loads only on long-form routes (not the homepage tool)
  - Route-level code splitting; SEO tags, sitemap, and `robots.txt`
  - Training status, partial model results, and error states per model

- **Accuracy Tracking & Analysis**:
  - Auto-calculate accuracy when predictions match actual results
  - Error Distance Analysis with multiple metrics
  - Track prediction accuracy trends over time
  - Compare model performance across different time periods

- **Statistical Analysis**:
  - **Frequency Analysis**: Hot numbers, cold numbers, overdue numbers
  - **Gaussian Distribution Analysis**: Visualize sum and product distributions with scatter plots
  - Highlights draws with winners
  - Statistical analysis of number patterns
  - Real-time statistics dashboard

## 🎮 Supported Games

- Ultra Lotto 6/58
- Grand Lotto 6/55
- Super Lotto 6/49
- Mega Lotto 6/45
- Lotto 6/42

## 📁 Project Structure

```
LOF_V2/
├── backend/              # FastAPI backend API
│   ├── .gcloudignore    # Shrinks Cloud Build upload (venv, caches, .env)
│   ├── app.py           # Main FastAPI application
│   ├── config.py        # Configuration (InstantDB credentials, Google Sheets IDs)
│   ├── services/        # InstantDB, Apify ingest, prediction council, Miro LLM strategy
│   ├── ml_models/       # 6 ML prediction models
│   ├── scrapers/        # Google Sheets scraper (CSV + gspread incremental)
│   ├── scripts/         # Node.js bridge scripts for InstantDB writes
│   │   ├── save_results.js      # Save lottery results via Admin SDK
│   │   ├── save_predictions.js   # Save predictions via Admin SDK
│   │   └── query_results.js      # Query results with proper sorting
│   ├── utils/           # Utility functions
│   └── requirements.txt # Python dependencies
├── frontend/            # React + Vite (dev: http://localhost:3000)
│   ├── .dockerignore
│   ├── src/
│   │   ├── pages/       # Home, blog, About, Methodology, legal
│   │   ├── components/  # Dashboard, ticket checker, UI, motion
│   │   ├── constants/   # AdSense allow-list (`adsense.js`)
│   │   ├── seo/         # Per-route titles and descriptions
│   │   ├── services/    # API client
│   │   ├── assets/
│   │   └── styles/      # Design-system CSS
│   ├── public/          # ads.txt, robots.txt, sitemap
│   └── tailwind.config.js
├── lof-v2-db/           # InstantDB schema (push once; not a local DB server)
├── .gitignore         # Git ignore rules
├── README.md          # This file
└── SOFTWARE_DOCUMENTATION.html  # Detailed system documentation with flowchart
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+** (Python 3.13+ recommended)
- **Node.js 16+** (InstantDB Admin SDK bridge scripts)
- **InstantDB account** (https://www.instantdb.com) — cloud only
- **Google Sheets** with lottery data (public CSV or service-account access)

Docker is not required to run the app locally.

### Backend Setup

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Create virtual environment:**
```bash
python -m venv venv
```

3. **Activate virtual environment:**
   - **Windows PowerShell:**
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **Windows Command Prompt:**
     ```cmd
     venv\Scripts\activate.bat
     ```
   - **Linux/Mac:**
     ```bash
     source venv/bin/activate
     ```

4. **Install Python dependencies:**
```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

5. **Install Node.js dependencies (for InstantDB bridge scripts):**
```bash
npm install @instantdb/admin
```

**Note:** The Node.js bridge scripts are required for saving data to InstantDB. The Admin SDK provides reliable write operations.

6. **Set up environment variables:**

Create a `.env` file in the `backend` directory:
```env
# InstantDB Configuration (REQUIRED)
INSTANTDB_APP_ID=your-app-id-here
INSTANTDB_ADMIN_TOKEN=your-admin-token-here

# Google Sheets
# Service account JSON: required for private sheets and for incremental API sync (recommended).
GOOGLE_SERVICE_ACCOUNT_FILE=path/to/service-account.json
SHEETS_INCREMENTAL_ENABLED=true
SHEETS_INCREMENTAL_WINDOW=250
SHEETS_WORKSHEET_NAME=Sheet1

# Optional (for uvicorn reload)
DEBUG=True

# OpenAI-compatible LLM — required for Miro (7th prediction) and optional AI Council
LLM_API_KEY=
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL_NAME=gpt-4o-mini
LLM_COUNCIL_ENABLED=true
MIRO_STRATEGY_ENABLED=true

# Apify (optional) — merge actor dataset into same InstantDB *_results as Sheets
APIFY_API_TOKEN=
APIFY_ACTOR_ID=
APIFY_AUTO_INGEST=true

# Optional — protect POST /api/cron/ingest-sheets (header X-Scrape-Cron-Secret); use with Cloud Scheduler
# CRON_SCRAPE_SECRET=your-long-random-secret
```

**Get your InstantDB credentials:**
- **App ID**: https://www.instantdb.com/dash → Your App → App ID
- **Admin Token**: https://www.instantdb.com/dash → Admin → Secret field (click to reveal)

**Google Sheets:**
- Sheet IDs are configured in `backend/config.py`
- With **`GOOGLE_SERVICE_ACCOUNT_FILE`** set (and the spreadsheet shared with that service account as **Viewer**, **Google Sheets API** enabled on the GCP project), scrapes use **incremental range reads** and persist the next row in InstantDB
- Without credentials, the backend uses the **public CSV export URL** every time (full download)
- **New rows appended below** the cursor are picked up on the next incremental scrape (UI timer, game select, or cron). **Rows inserted above the cursor** still require a **`full_sync`** (full CSV + cursor reset) or fixing sheet order
- Assume a single header row on the tab named by `SHEETS_WORKSHEET_NAME` (default `Sheet1`)

7. **InstantDB schema (first time or after schema edits only):**

InstantDB is already online. `npm run dev` in `lof-v2-db` **pushes schema**, it does not start a database.

```bash
cd ../lof-v2-db
npm install
npm run dev
```

Skip this on later days if the Instant app already has the lottery schema.

8. **Run FastAPI server:**

On Windows, if `pip` or `uvicorn` fails with `aswMonFltProxy` / `SSLKEYLOGFILE`, Avast is intercepting TLS. In that PowerShell session run `$env:SSLKEYLOGFILE = $null` first.

```bash
uvicorn app:app --host 0.0.0.0 --port 5000 --reload
```

The API will be available at `http://localhost:5000`
- API docs: `http://localhost:5000/docs`
- Alternative docs: `http://localhost:5000/redoc`

### Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start development server:**
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000` (port set in `vite.config.js`)

**Note:** The frontend talks only to the backend (`/api` is proxied to `http://localhost:5000` in `vite.config.js`). No InstantDB SDK and no frontend `.env` file.

## Site pages, SEO, and AdSense

Production hostname: **bayanwin.net**.

| Path | Role | AdSense script |
|---|---|---|
| `/` | Results, ticket check, 7 models | Off (tool / first screen) |
| `/blog`, `/blog/…` | Long-form posts | On |
| `/about`, `/methodology`, `/responsible-play` | Editorial | On |
| `/privacy`, `/terms`, `/contact`, 404 | Legal / utility | Off |

Allow-list: `frontend/src/constants/adsense.js` (`isAdSenseAllowedPath`). `ConditionalAdSense` loads auto-ads only on those routes and tears the script down when you leave them.

`frontend/public/ads.txt` must match publisher `ca-pub-5394062342441330`. Cookie banner is for consent; the loader itself is not gated on consent.

AdSense reviews **the live domain**, not `localhost`. If Google shows **Needs attention** and a review cooldown (for example until 10 Oct 2026), wait for that date, then **Sites → bayanwin.net → Request review**. Do not delete the site and re-add it.

## Deployment to Google Cloud Platform

The application is deployed on **Google Cloud Run** for production use. For complete deployment documentation, see:

- **[GOOGLE_CLOUD_DEPLOYMENT.md](./GOOGLE_CLOUD_DEPLOYMENT.md)** - Detailed markdown guide
- **[GOOGLE_CLOUD_DEPLOYMENT.html](./GOOGLE_CLOUD_DEPLOYMENT.html)** - Browser-friendly HTML guide

### Quick Deployment Overview

**Deployed Services:**
- **Frontend**: React app on Cloud Run, custom domain **[bayanwin.net](https://bayanwin.net)** (or a `*.run.app` URL)
- **Backend**: FastAPI API on Cloud Run (same region as the frontend; production has used **`asia-southeast1`**)
- **Database**: InstantDB (cloud-hosted, no deployment needed)

**Deployment Process:**
1. **Backend**: Build and deploy to Cloud Run with InstantDB credentials, **`--memory 2Gi --cpu 2`** (512 MiB is often too low for this stack), optional `CRON_SCRAPE_SECRET`
2. **Frontend**: Docker build with `VITE_API_URL` pointing at the **HTTPS backend URL** (run.app or custom API host), then deploy to Cloud Run
3. **Optional**: Cloud Scheduler → `POST /api/cron/ingest-sheets` for background sheet ingest (see [GOOGLE_CLOUD_DEPLOYMENT.md](./GOOGLE_CLOUD_DEPLOYMENT.md))
4. **Schema**: Deploy InstantDB schema once (local `npm run dev` in `lof-v2-db`)

**Build notes:** The frontend `Dockerfile` uses `npx vite build` so Cloud Build does not depend on a executable `vite` bit from `npm run build`; keep `frontend/.dockerignore` so local `node_modules` is not copied into the image.

**Checking Your Project ID:**
```powershell
# See current Google Cloud project ID
gcloud config get-value project

# List all projects
gcloud projects list
```

**Updating Deployments:**
- **Backend changes**: Rebuild and redeploy backend service
- **Frontend changes**: Rebuild with backend URL and redeploy
- **Schema changes**: Run `npm run dev` in `lof-v2-db` to sync

For detailed step-by-step instructions, troubleshooting, and update procedures, see the [Google Cloud Deployment Guide](./GOOGLE_CLOUD_DEPLOYMENT.md).

## 🔧 Configuration

### Backend Environment Variables

The `.env` file in the `backend` directory should contain:

| Variable | Required | Description |
|----------|----------|-------------|
| `INSTANTDB_APP_ID` | ✅ Yes | Your InstantDB App ID from dashboard |
| `INSTANTDB_ADMIN_TOKEN` | ✅ Yes | Your InstantDB Admin Token (Secret) |
| `GOOGLE_SERVICE_ACCOUNT_FILE` | ❌ No | Service account JSON **path** (local) — private sheets + incremental Sheets API sync |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | ❌ No | Raw service-account JSON (e.g. Cloud Run secret) — same as FILE when path not used |
| `SHEETS_INCREMENTAL_ENABLED` | ❌ No | `true`/`false` — disable API incremental path (default true) |
| `SHEETS_INCREMENTAL_WINDOW` | ❌ No | Rows per incremental `get` (default `250`) |
| `SHEETS_WORKSHEET_NAME` | ❌ No | Worksheet tab name (default `Sheet1`) |
| `DEBUG` | ❌ No | Set to `True` for uvicorn auto-reload (development) |
| `LLM_API_KEY` | ✅ For Miro / Council | OpenAI-compatible API key (`sk-` or `sk-proj-`) |
| `LLM_BASE_URL` | ❌ No | Default `https://api.openai.com/v1` |
| `LLM_MODEL_NAME` | ❌ No | Chat model id (e.g. `gpt-4o-mini`) |
| `MIRO_STRATEGY_ENABLED` | ❌ No | `true`/`false` — run Miro after the six ML models (default true) |
| `APIFY_API_TOKEN` | ❌ No | Run actor + ingest dataset into InstantDB |
| `APIFY_ACTOR_ID` | ❌ No | Actor id for PCSO / bulletin scrape |
| `APIFY_AUTO_INGEST` | ❌ No | If true, optional auto-run after `POST /api/scrape` |
| `CRON_SCRAPE_SECRET` | ❌ No | If set, `POST /api/cron/ingest-sheets` requires header `X-Scrape-Cron-Secret` (use with Cloud Scheduler) |

**Important:** 
- Never commit `.env` files to Git
- InstantDB credentials are required for backend to function
- Without service-account credentials (`GOOGLE_SERVICE_ACCOUNT_FILE` locally or `GOOGLE_SERVICE_ACCOUNT_JSON` on Cloud Run), Google Sheets are accessed via public CSV export (full download per scrape path)
- Node.js and `@instantdb/admin` are required for saving data
- No PostgreSQL connection string. InstantDB is the database.

## Apify (optional ingest)

Actor runs can **append** normalized draw rows into the **same** InstantDB `*_results` entities used by Google Sheets (`backend/services/apify_ingest.py`). Dedupe uses `draw_date|draw_number`. Triggers:

- `POST /api/ingest/apify` — body: `run_id`, optional `game_type`
- `POST /api/webhooks/apify` — optional HMAC/secret if configured
- After `POST /api/scrape` — when `APIFY_API_TOKEN`, `APIFY_ACTOR_ID`, and `APIFY_AUTO_INGEST` are set

Downstream **Miro**, graphs (co-occurrence, transitions), and statistics **automatically** include Apify-backed rows because they all read `get_results`.

## 📡 API Endpoints

### Game Management
- `GET /api/games` - List all available games

### Results
- `GET /api/results/{game_type}` - Get historical results (paginated, sorted by draw_date)
  - Query params: `page`, `limit`
- `POST /api/scrape` - Trigger data scraping from Google Sheets
  - Body: `{ "game_type": "ultra_lotto_6_58", "full_sync": false }` (`game_type` optional — scrapes all games if omitted)
  - Query: `?full_sync=true` — same as `full_sync: true` in the body (weekly reconcile recommended)
  - Response stats include per-game `sync_mode`, `rows_fetched`, and `cursor_after` when available
  - Auto-scrapes when a game is selected in the frontend; Latest Results also triggers incremental sync periodically and on tab focus
  - Automatically skips duplicate entries based on draw_date and draw_number
- `POST /api/cron/ingest-sheets` - Same ingest as `/api/scrape` for **scheduled** runs (all games, incremental by default). If `CRON_SCRAPE_SECRET` is set in the environment, the request must include header `X-Scrape-Cron-Secret: <same value>`

### Predictions
- `POST /api/predict/{game_type}` - Generate predictions from all **six core ML models**, then **Miro** (if `LLM_API_KEY` is set and `MIRO_STRATEGY_ENABLED=true`)
  - Query param: `include_council` — optional LLM advisory report (separate from Miro’s numeric pick)
  - Returns a predictions map including **`Miro`** (numbers or error); saves each pick to InstantDB
  - Triggers background accuracy calculation
- `POST /api/predict/{game_type}/council-report` - LLM advisory summary (agreement, outliers, caveats, etc.)
- `GET /api/predictions/{game_type}` - Get stored predictions
  - Query params: `limit`
- `GET /api/predictions/{game_type}/accuracy` - Get prediction accuracy metrics
  - Query params: `limit`
  - Returns error distance, numbers matched, and distance metrics
- `POST /api/predictions/{prediction_id}/calculate-accuracy` - Calculate accuracy for a prediction
  - Body: `{ "result_id": "...", "game_type": "..." }`
- `POST /api/accuracy/auto-calculate` - Manually trigger auto-calculation of accuracy
  - Body: `{ "game_type": "..." }` (optional - processes all games if omitted)

### Statistics
- `GET /api/stats/{game_type}` - Get frequency statistics
  - Returns: hot numbers, cold numbers, overdue numbers, general stats
- `GET /api/stats/{game_type}/gaussian` - Get Gaussian distribution analysis
  - Returns: sum/product distributions, statistics, winners data for scatter plot visualization

### Graphs (D3 frontend)
- `GET /api/graphs/{game_type}/cooccurrence` — pair counts within draws
- `GET /api/graphs/{game_type}/markov-edges` — directed transitions between consecutive draws
- `POST /api/graphs/{game_type}/sankey` — hot vs “other” counts per model pick (body: current `predictions` map)

### Accuracy Diagnostics
- `GET /api/accuracy/diagnostics/{game_type}` - Get diagnostic info (results/predictions/accuracy counts, date ranges, matching status) for debugging

### Health Check
- `GET /api/health` - API health check (use this path on Cloud Run, e.g. `https://your-backend.../api/health`)

**Full API Documentation:** Visit `http://localhost:5000/docs` when backend is running

## 🎯 Usage

### Getting Started

1. Confirm InstantDB credentials in `backend/.env` (schema already on the Instant app, or push once from `lof-v2-db`)
2. Start the backend (`uvicorn` on port **5000**)
3. Start the frontend (`npm run dev` on port **3000**)
4. Open `http://localhost:3000`

### Workflow

1. **Select a game**
   - Incremental scrape from Google Sheets
   - New rows saved to InstantDB (duplicates skipped)
   - Accuracy updated when a draw matches a stored pick
   - Check six numbers against history with the ticket checker

2. **Generate predictions** (Run all 7 models)
   - System fetches historical data from InstantDB
   - All six core ML models train and predict (thread pool with per-model timeouts)
   - **Miro** runs afterward (LLM swarm synthesis, ~2 API calls, server timeout up to ~180s) when enabled and `LLM_API_KEY` is set
   - Predictions appear in the UI; all picks including Miro are saved to InstantDB
   - Background process matches predictions to results and calculates accuracy

3. **View results and analysis**
   - Core models in a grid; **Miro** in its own panel
   - Latest draws board and paginated history
   - Hot / cold / overdue stats, error-distance, Gaussian scatter, D3 graphs
   - Editorial routes: `/blog`, `/about`, `/methodology`, `/responsible-play`

4. **DRL Learning Loop** (Automatic)
   - DRL agent receives feedback from accuracy calculations
   - Continuously improves predictions based on error metrics
   - Learning happens automatically when accuracy records are available

## Stage-by-stage workflow (with code)

Each stage below maps to the actual code paths so you can trace requests end-to-end.

### Stage 1: User selects a game → Auto-scrape

- **Frontend:** In `frontend/src/App.jsx`, `handleGameSelect(gameType)` runs when the user picks a game. It sets `selectedGame`, then calls `scrapeData({ game_type: gameType })` from `frontend/src/services/api.js`.
- **API call:** `api.js` uses Axios with `baseURL: API_BASE_URL` (from `frontend/src/utils/constants.js`, default `http://localhost:5000`). So the request is `POST /api/scrape` with body `{ game_type: "ultra_lotto_6_58" }` (or the chosen game).
- **Backend:** In `backend/app.py`, `@app.post("/api/scrape")` receives the request. It builds a `GoogleSheetsScraper()`, then calls `scrape_game(..., full_sync=...)` or `scrape_all_games(full_sync=...)`. Incremental pulls use `gspread` when credentials exist; `full_sync` forces the CSV path and resets the stored cursor. Rows are written via `instantdb_client` / `save_results.js`.
- **After scrape:** If new results were added, the backend calls `auto_calculate_accuracy_for_new_results()` and may trigger DRL learning from new accuracy records. The response (e.g. `success`, `stats`, `message`) is returned to the frontend.

### Stage 2: User clicks “Generate Predictions”

- **Frontend:** In `App.jsx`, `handleGeneratePredictions()` calls `generatePredictions(selectedGame)` from `api.js`, which sends `POST /api/predict/{game_type}` to the backend.
- **Backend:** In `app.py`, `@app.post("/api/predict/{game_type}")` runs the six core entries in `model_types` (XGBoost … DRL) with `ThreadPoolExecutor` timeouts. Historical data is read from InstantDB via each model / `data_processor` as before.
- **Miro:** After that loop, if `MIRO_STRATEGY_ENABLED` and `LLM_API_KEY` are set, `run_miro_strategy_predict` from `backend/services/miro_strategy.py` runs (separate pool, long timeout), then `create_prediction` with `model_type: "Miro"`. If the LLM key is missing, the response still includes `Miro` with an error message for the UI.
- **Saving predictions:** Each successful prediction is stored with `instantdb.create_prediction(...)`. A background thread runs `auto_calculate_accuracy_for_new_results(game_type)` afterward.
- **Response:** `{ success, game_type, target_draw_date, predictions, timestamp }` plus optional `council_report` when requested. `predictions` includes **`Miro`**.

### Stage 3: Viewing results, stats, and accuracy

- **Historical results:** Components like `HistoricalResults` call `getResults(gameType, page, limit)` → `GET /api/results/{game_type}`. In `app.py`, `@app.get("/api/results/{game_type}")` (around line 96) uses `instantdb.get_results(...)` and returns paginated results.
- **Statistics:** `StatisticsPanel` uses `getStatistics(gameType)` → `GET /api/stats/{game_type}`. The backend uses `utils/frequency_analysis.py` (e.g. `get_hot_numbers`, `get_cold_numbers`, `get_overdue_numbers`) and returns JSON for the panel.
- **Error distance:** `ErrorDistanceAnalysis` uses `getPredictionAccuracy(gameType)` → `GET /api/predictions/{game_type}/accuracy`. The backend uses `instantdb.get_prediction_accuracy()` and `utils/error_distance_calculator.py` to build the metrics returned to the frontend.
- **Gaussian view:** Any component that shows Gaussian distribution calls `getGaussianDistribution(gameType)` → `GET /api/stats/{game_type}/gaussian`; the backend computes sum/product stats and returns data for the scatter visualization.

### Stage 4: CORS and how the frontend reaches the backend

- **Why CORS matters:** The React app runs in the browser at `http://localhost:3000`. The API runs at `http://localhost:5000`. Browsers enforce the same-origin policy, so a request from the frontend origin to the backend origin is “cross-origin” and the backend must send allowed CORS headers for the browser to accept the response.
- **Backend CORS (FastAPI):** In `backend/app.py`, right after creating the FastAPI app (around lines 50–56), the app adds `CORSMiddleware`:
  - `allow_origins=["*"]` — any origin (e.g. `http://localhost:3000`) can call the API. In production you should set this to your real frontend origin(s).
  - `allow_credentials=True` — allows cookies/credentials if you add them later.
  - `allow_methods=["*"]` and `allow_headers=["*"]` — all usual HTTP methods and headers are allowed.
  So every response from the FastAPI server includes CORS headers that tell the browser “this cross-origin response is allowed.”
- **Development proxy (optional):** In development, `frontend/vite.config.js` configures a proxy: requests to path `/api` are forwarded to `http://localhost:5000`. The frontend can then use `API_BASE_URL` as the same origin (e.g. relative `/api` or full URL depending on config). When using the proxy, the browser only sees same-origin requests to the Vite server; Vite forwards `/api/*` to the backend, so CORS is less of an issue in that setup. If the frontend is configured to call `http://localhost:5000` directly (e.g. `API_BASE_URL = 'http://localhost:5000'`), then CORS middleware on the backend is what allows those cross-origin requests to succeed.

## 🏗️ System Architecture

BayanWin follows a **three-tier architecture** with clear separation of concerns:

- **Frontend Layer**: React-based user interface with real-time updates
- **Backend Layer**: FastAPI REST API with ML model orchestration
- **Data Layer**: InstantDB BaaS for data storage and management

> 📊 For detailed architecture diagrams and workflow flowchart, see [SOFTWARE_DOCUMENTATION.html](./SOFTWARE_DOCUMENTATION.html)

### Tech Stack

**Backend:**
- **FastAPI** - Modern Python web framework with async support
- **InstantDB** - Backend-as-a-Service (REST API + Admin SDK via Node.js)
- **Uvicorn** - ASGI server for high-performance async operations
- **Pandas** - Google Sheets CSV reading and data processing
- **XGBoost, TensorFlow, scikit-learn** - ML libraries for predictions
- **OpenAI-compatible API** (`openai` Python SDK) — Miro + optional AI Council
- **NumPy** - Numerical computing and array operations
- **Node.js** - Bridge scripts for InstantDB Admin SDK writes

**Frontend:**
- **React 18** + **Vite** (dev port 3000) + **React Router**
- **Tailwind CSS** + design tokens in `tailwind.config.js`
- **GSAP** (ScrollTrigger, ScrollSmoother, SplitText, DrawSVG)
- **Axios**, **D3.js**, **Recharts**
- **react-helmet-async** for per-route SEO

## Design system (code)

See `.claude/skills/bayanwin-design/SKILL.md`. Do not put raw hex in JSX; use Tailwind tokens.

- Surfaces: `charcoal-900` page, `charcoal-800` cards
- Interactive: `electric-400` / `electric-500`
- Primary action and balls: `orange-500` (one primary button per view)
- Type: `font-display` (General Sans), `font-sans` (Satoshi), `font-mono` (JetBrains Mono)
- Shared UI: `Notice`, `EmptyState`, `CardHeader`, `Spinner`, `Reveal` in `frontend/src/components/ui/`

## 📝 Important Notes

### Data Management
- **Data Source**: Lottery data is scraped from Google Sheets (public CSV or Sheets API + service account)
- **Auto-Scraping**: Data is automatically scraped when a game is selected
- **Duplicate Detection**: System automatically skips duplicate entries based on draw_date and draw_number
- **Auto-Accuracy Calculation**: Accuracy is automatically calculated when new results are scraped

### Model Performance
- **XGBoost**: ~6-10 seconds per prediction (includes training time)
- **Decision Tree**: ~4-6 seconds per prediction
- **Markov Chain**: ~1-3 seconds per prediction
- **Anomaly Detection**: ~0.5-3 seconds per prediction (vectorized Monte Carlo)
- **NashHotFilter**: Instant (Nash equilibrium + hot-number filter, no training)
- **DRL Agent**: ~20-40 seconds per prediction (5 episodes, continuous learning)
- **Miro (LLM swarm)**: Highly variable — typically **tens of seconds to a few minutes** (two `chat.completions` JSON calls; server timeout **180s**). Requires `LLM_API_KEY`. Disable with `MIRO_STRATEGY_ENABLED=false` to save latency/cost.
- **Total wall time**: Six core models (much runs in parallel) **plus** Miro when enabled — budget **several minutes** end-to-end on a slow LLM.

### Model Training & Learning
- **Smart Retraining**: Models automatically retrain when switching between game types
- **DRL Feedback Loop**: DRL agent continuously improves through feedback from accuracy records
- **Historical Data Requirement**: Historical data is required for accurate predictions
- **First-time Training**: First-time prediction generation may take longer as models train

### Technical Requirements
- **Node.js Required**: Must have Node.js installed for InstantDB writes to work (Admin SDK bridge scripts)
- **Environment Variables**: Make sure your InstantDB credentials are correct in `.env`
- **Schema**: Push InstantDB schema once (`npm run dev` in `lof-v2-db`). Not needed every local run.
- **Ports**: 
  - Frontend: Vite dev server (port 3000; see `frontend/vite.config.js`)
  - Backend: FastAPI/Uvicorn (port 5000)

### Data Storage
- **Prediction Saving**: All predictions are automatically saved to InstantDB
- **Accuracy Tracking**: All accuracy metrics are stored for trend analysis
- **Result Storage**: Historical results are stored with full metadata (draw_date, numbers, jackpot, winners)

## 🔒 Security

- **Environment Variables**: `.env` files are gitignored - never commit sensitive data
- **Dependencies**: `venv/` and `node_modules/` are gitignored
- **Credentials**: InstantDB Admin Token should be kept secret and never shared
- **Google Sheets**: Service account credentials (if used) should be kept secret
- **Configuration**: Use environment variables for all sensitive configuration
- **Data Access**: Prefer a locked-down spreadsheet shared with a service account; public CSV remains a fallback without credentials
- **API Security**: In production, configure CORS middleware to allow only specific origins
- **Cron endpoint**: Keep `CRON_SCRAPE_SECRET` long and random; Cloud Scheduler should send it only in the `X-Scrape-Cron-Secret` header

## 📚 Documentation

- **README.md** (this file) - Quick start guide and overview
- **[SOFTWARE_DOCUMENTATION.html](./SOFTWARE_DOCUMENTATION.html)** - Comprehensive system documentation with:
  - Detailed system overview
  - Architecture diagrams
  - Complete workflow flowchart
  - ML models detailed explanation
  - Data flow and storage details
  - API endpoints reference
  - Performance characteristics

## 📄 License

MIT License

---

**Built with ❤️ using FastAPI, React, InstantDB, and Machine Learning**

---

## 🔄 System Workflow Summary

1. **User selects game** → Incremental Sheets scrape; latest-draws UI also polls (timer + tab focus). Production: Cloud Scheduler → `/api/cron/ingest-sheets`
2. **Data validation** → New rows in InstantDB (duplicates skipped)
3. **Ticket check (optional)** → Six numbers compared to stored draws
4. **User runs models** → History from InstantDB
5. **ML + Miro** → Six core models in parallel; Miro if enabled
6. **Picks saved** → Including Miro
7. **Accuracy** → Matched when a new result lands
8. **DRL** → Learns from accuracy records
9. **UI** → Home dashboard plus blog / methodology pages (AdSense only on editorial routes)

## Contributing

Contributions are welcome. Fork the repo, make your changes, and open a pull request.

If you found this project helpful or learned something new from it, you can support the development with just a cup of coffee ☕. It's always appreciated and keeps the ideas flowing!

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Support-blue?style=for-the-badge&logo=coffee&logoColor=white)](https://buymeacoffee.com/jonelpericon)


For detailed flowchart visualization, see [SOFTWARE_DOCUMENTATION.html](./SOFTWARE_DOCUMENTATION.html)
