# BayanWin 🎯

A modern, full-stack web application that scrapes lottery results from Google Sheets, stores them in InstantDB, and provides 5 different ML-based prediction models for multiple lottery games.

## 🎨 Design

**Modern Tech Aesthetic:**
- **Electric Blue (#3498DB)** – Innovation, clarity
- **Bright Orange (#E67E22)** – Excitement, urgency  
- **Charcoal Black (#2C3E50)** – Sleek, modern background
- **Silver (#BDC3C7)** – Futuristic accents

**Typography:**
- **BayanWin Title**: Montserrat Bold
- Clean, modern UI with smooth animations and hover effects

## ✨ Features

- **Data Scraping**: Automated scraping of lottery results from Google Sheets for 5 games
  - Auto-scrapes new data when a game is selected
  - Uses pandas to read CSV exports directly from Google Sheets
  - Automatically detects and skips duplicate entries
- **Database**: InstantDB BaaS (Backend-as-a-Service)
  - Backend uses InstantDB Admin SDK via Node.js bridge scripts for reliable writes
  - REST API used for reads and queries
  - All predictions are automatically saved to InstantDB
- **5 ML Prediction Models**:
  - **XGBoost**: Gradient boosting model using historical patterns
  - **Decision Tree**: Random Forest classifier based on frequency analysis
  - **Markov Chain**: State transition model for sequence prediction
  - **Normal Distribution**: Gaussian distribution analysis - highest probability patterns
  - **Deep Reinforcement Learning (DRL)**: DRL agent with 3 feedback loops (optimized to 5 episodes)
- **Smart Model Training**: Models automatically retrain when switching between game types
- **Modern Web Interface**: React frontend with Vite, Tailwind CSS, and modern tech design
  - Real-time "Learning..." status indicators for each model
  - Partial results display - shows successful predictions immediately
  - Error states clearly displayed for failed models
- **Error Distance Analysis**: Track prediction accuracy with multiple metrics
- **Gaussian Distribution Analysis**: Visualize sum and product distributions with scatter plots
  - Highlights draws with winners
  - Statistical analysis of number patterns
- **Real-time Statistics**: Frequency analysis, hot/cold numbers, overdue numbers

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
│   ├── app.py           # Main FastAPI application
│   ├── config.py        # Configuration (InstantDB credentials, Google Sheets IDs)
│   ├── services/        # InstantDB client service
│   ├── ml_models/       # 5 ML prediction models
│   ├── scrapers/        # Google Sheets scraper (pandas-based)
│   ├── scripts/         # Node.js bridge scripts for InstantDB writes
│   │   ├── save_results.js      # Save lottery results via Admin SDK
│   │   ├── save_predictions.js   # Save predictions via Admin SDK
│   │   └── query_results.js      # Query results with proper sorting
│   ├── utils/           # Utility functions
│   └── requirements.txt # Python dependencies
├── frontend/            # React frontend with Vite
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── services/    # API service layer
│   │   ├── assets/      # Images (Logo.png)
│   │   └── styles/      # CSS styles
│   ├── package.json     # Node dependencies
│   └── tailwind.config.js # Tailwind configuration
├── .gitignore          # Git ignore rules
└── README.md          # This file
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+** (Python 3.13+ recommended)
- **Node.js 16+** (required for InstantDB Admin SDK bridge scripts)
- **InstantDB Account** (https://www.instantdb.com)
- **Google Sheets** with publicly accessible lottery data (or service account credentials)

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

# Google Sheets (Optional - uses public sheets by default)
# Only needed if sheets are private
GOOGLE_SERVICE_ACCOUNT_FILE=path/to/service-account.json

# Optional (for uvicorn reload)
DEBUG=True
```

**Get your InstantDB credentials:**
- **App ID**: https://www.instantdb.com/dash → Your App → App ID
- **Admin Token**: https://www.instantdb.com/dash → Admin → Secret field (click to reveal)

**Google Sheets:**
- The app uses publicly accessible Google Sheets by default
- Google Sheets IDs are configured in `backend/config.py`
- If sheets are private, provide service account credentials

7. **Deploy InstantDB Schema:**

Navigate to the `lof-v2-db` directory and deploy the schema:
```bash
cd ../lof-v2-db
npm install
npm run dev
```

This deploys the database schema and permissions required for the app to function.

8. **Run FastAPI server:**
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

The frontend will be available at `http://localhost:5173` (Vite default port)

**Note:** The frontend communicates exclusively with the backend API. No InstantDB SDK or frontend `.env` file is required.

## 🔧 Configuration

### Backend Environment Variables

The `.env` file in the `backend` directory should contain:

| Variable | Required | Description |
|----------|----------|-------------|
| `INSTANTDB_APP_ID` | ✅ Yes | Your InstantDB App ID from dashboard |
| `INSTANTDB_ADMIN_TOKEN` | ✅ Yes | Your InstantDB Admin Token (Secret) |
| `GOOGLE_SERVICE_ACCOUNT_FILE` | ❌ No | Path to Google service account JSON (only if sheets are private) |
| `DEBUG` | ❌ No | Set to `True` for uvicorn auto-reload (development) |

**Important:** 
- Never commit `.env` files to Git
- InstantDB credentials are required for backend to function
- Google Sheets are accessed via public CSV export by default
- Node.js and `@instantdb/admin` are required for saving data
- No PostgreSQL connection string needed - InstantDB handles everything!

## 📡 API Endpoints

### Game Management
- `GET /api/games` - List all available games

### Results
- `GET /api/results/{game_type}` - Get historical results (paginated, sorted by draw_date)
  - Query params: `page`, `limit`
- `POST /api/scrape` - Trigger data scraping from Google Sheets
  - Body: `{ "game_type": "ultra_lotto_6_58" }` (optional - scrapes all games if omitted)
  - Auto-scrapes when a game is selected in the frontend
  - Automatically skips duplicate entries based on draw_date and draw_number

### Predictions
- `POST /api/predict/{game_type}` - Generate predictions from all 5 ML models
- `GET /api/predictions/{game_type}` - Get stored predictions
  - Query params: `limit`
- `GET /api/predictions/{game_type}/accuracy` - Get prediction accuracy metrics
  - Query params: `limit`
- `POST /api/predictions/{prediction_id}/calculate-accuracy` - Calculate accuracy for a prediction
  - Body: `{ "result_id": "...", "game_type": "..." }`

### Statistics
- `GET /api/stats/{game_type}` - Get frequency statistics
  - Returns: hot numbers, cold numbers, overdue numbers, general stats
- `GET /api/stats/{game_type}/gaussian` - Get Gaussian distribution analysis
  - Returns: sum/product distributions, statistics, winners data for scatter plot visualization

### Health Check
- `GET /health` - API health check

**Full API Documentation:** Visit `http://localhost:5000/docs` when backend is running

## 🎯 Usage

1. **Deploy InstantDB schema** (run `npm run dev` in `lof-v2-db` directory)
2. **Start the backend server** (port 5000)
3. **Start the frontend development server** (port 5173)
4. **Open browser** to `http://localhost:5173`
5. **Select a game** from the game selector
   - Automatically scrapes new data from Google Sheets
   - Shows "Learning..." status for each model
6. **Click "⚡ Generate Predictions"** to get predictions from all 5 ML models
   - Models train automatically for the selected game type
   - Predictions are saved to InstantDB automatically
   - Results appear in real-time as each model completes
7. **View statistics** and error distance analysis for each game
   - Gaussian distribution analysis with scatter plots
   - Highlights draws with winners
   - Error distance trends and model comparison

## 🏗️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **InstantDB** - Backend-as-a-Service (REST API + Admin SDK via Node.js)
- **Uvicorn** - ASGI server
- **Pandas** - Google Sheets CSV reading and data processing
- **XGBoost, TensorFlow, scikit-learn** - ML libraries
- **NumPy** - Numerical computing
- **Node.js** - Bridge scripts for InstantDB Admin SDK writes

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **Recharts** - Chart library
- **React Router** - Routing

## 🎨 Design System

### Colors
- **Electric Blue** (`#3498DB`): Primary actions, headers, accents
- **Bright Orange** (`#E67E22`): CTAs, number balls, highlights
- **Charcoal Black** (`#2C3E50`): Background, dark elements
- **Silver** (`#BDC3C7`): Borders, subtle accents

### Typography
- **BayanWin Title**: Montserrat Bold (Google Fonts)
- **Body**: Inter, system fonts

## 📝 Notes

- **Data Source**: Lottery data is scraped from publicly accessible Google Sheets
- **Auto-Scraping**: Data is automatically scraped when a game is selected
- **Model Training**: Models automatically retrain when switching between game types
- **Prediction Saving**: All predictions are automatically saved to InstantDB
- **Performance**: 
  - XGBoost: ~6-10 seconds
  - DecisionTree: ~4-6 seconds
  - MarkovChain: ~1-3 seconds
  - AnomalyDetection: ~0.1-0.5 seconds
  - DRL: ~20-40 seconds (5 episodes)
- **Node.js Required**: Must have Node.js installed for InstantDB writes to work
- Make sure your InstantDB credentials are correct in `.env`
- First-time prediction generation may take longer as models train
- Historical data is required for accurate predictions
- Frontend runs on Vite dev server (port 5173 by default)
- Backend runs on FastAPI/Uvicorn (port 5000)
- **Schema Deployment**: Must deploy InstantDB schema before first use (run `npm run dev` in `lof-v2-db`)

## 🔒 Security

- `.env` files are gitignored - never commit sensitive data
- `venv/` and `node_modules/` are gitignored
- InstantDB Admin Token should be kept secret
- Google Sheets service account credentials (if used) should be kept secret
- Use environment variables for all sensitive configuration
- Google Sheets are accessed via public CSV export (no authentication needed for public sheets)

## 📄 License

MIT License

---

**Built with ❤️ using FastAPI, React, and InstantDB**
