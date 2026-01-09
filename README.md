# BayanWin 🎯

A modern, full-stack web application that scrapes lottery results from Google Sheets, stores them in InstantDB, and provides 5 different ML-based prediction models for multiple lottery games.

> 📚 **Detailed Documentation**: For comprehensive system documentation including workflow flowchart and architecture details, see [SOFTWARE_DOCUMENTATION.html](./SOFTWARE_DOCUMENTATION.html)

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

- **Automated Data Scraping**: 
  - Auto-scrapes new data when a game is selected
  - Uses pandas to read CSV exports directly from Google Sheets
  - Automatically detects and skips duplicate entries based on draw_date and draw_number
  - Supports 5 lottery games with separate data sources
  
- **InstantDB Database Integration**:
  - Backend-as-a-Service (BaaS) for seamless data management
  - Backend uses InstantDB Admin SDK via Node.js bridge scripts for reliable writes
  - REST API used for reads and queries
  - All predictions are automatically saved to InstantDB
  - Automatic accuracy calculation when new results are scraped

- **5 Machine Learning Prediction Models**:
  - **XGBoost**: Gradient boosting model using historical patterns (~6-10 seconds)
  - **Decision Tree**: Random Forest classifier based on frequency analysis (~4-6 seconds)
  - **Markov Chain**: State transition model for sequence prediction (~1-3 seconds)
  - **Normal Distribution**: Gaussian distribution analysis - highest probability patterns (~0.1-0.5 seconds)
  - **Deep Reinforcement Learning (DRL)**: DRL agent with 3 feedback loops, continuously improves through accuracy feedback (~20-40 seconds, 5 episodes)

- **Smart Model Training**: 
  - Models automatically retrain when switching between game types
  - Parallel processing for faster prediction generation
  - Real-time training status indicators

- **Modern Web Interface**: 
  - React 18 frontend with Vite, Tailwind CSS, and modern tech design
  - Real-time "Learning..." status indicators for each model
  - Partial results display - shows successful predictions immediately
  - Error states clearly displayed for failed models
  - Responsive design with smooth animations

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
├── lof-v2-db/         # InstantDB schema and configuration
├── .gitignore         # Git ignore rules
├── README.md          # This file
└── SOFTWARE_DOCUMENTATION.html  # Detailed system documentation with flowchart
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
  - Returns predictions from all models in real-time as they complete
  - Automatically saves predictions to InstantDB
  - Triggers background accuracy calculation
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

### Health Check
- `GET /health` - API health check

**Full API Documentation:** Visit `http://localhost:5000/docs` when backend is running

## 🎯 Usage

### Getting Started

1. **Deploy InstantDB schema** (run `npm run dev` in `lof-v2-db` directory)
2. **Start the backend server** (port 5000)
3. **Start the frontend development server** (port 5173)
4. **Open browser** to `http://localhost:5173`

### Workflow

1. **Select a Game** from the game selector
   - Automatically scrapes new data from Google Sheets
   - Validates and saves new results to InstantDB (skips duplicates)
   - Auto-calculates accuracy for matching predictions and results

2. **Generate Predictions** by clicking "⚡ Generate Predictions"
   - System fetches historical data from InstantDB
   - All 5 ML models train and predict in parallel
   - Predictions appear in real-time as each model completes
   - All predictions are automatically saved to InstantDB
   - Background process matches predictions to results and calculates accuracy

3. **View Results & Analysis**
   - **Predictions Display**: See all 5 model predictions with real-time status
   - **Historical Results**: Browse past lottery results with pagination
   - **Statistics Panel**: View hot/cold/overdue numbers and frequency analysis
   - **Error Distance Analysis**: Track prediction accuracy with detailed metrics
   - **Gaussian Distribution**: Visualize sum/product distributions with scatter plots
     - Highlights draws with winners
     - Statistical analysis of number patterns

4. **DRL Learning Loop** (Automatic)
   - DRL agent receives feedback from accuracy calculations
   - Continuously improves predictions based on error metrics
   - Learning happens automatically when accuracy records are available

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
- **NumPy** - Numerical computing and array operations
- **Node.js** - Bridge scripts for InstantDB Admin SDK writes

**Frontend:**
- **React 18** - Modern UI library with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client for API communication
- **Recharts** - Chart library for data visualization
- **React Router** - Client-side routing

## 🎨 Design System

### Colors
- **Electric Blue** (`#3498DB`): Primary actions, headers, accents
- **Bright Orange** (`#E67E22`): CTAs, number balls, highlights
- **Charcoal Black** (`#2C3E50`): Background, dark elements
- **Silver** (`#BDC3C7`): Borders, subtle accents

### Typography
- **BayanWin Title**: Montserrat Bold (Google Fonts)
- **Body**: Inter, system fonts

## 📝 Important Notes

### Data Management
- **Data Source**: Lottery data is scraped from publicly accessible Google Sheets
- **Auto-Scraping**: Data is automatically scraped when a game is selected
- **Duplicate Detection**: System automatically skips duplicate entries based on draw_date and draw_number
- **Auto-Accuracy Calculation**: Accuracy is automatically calculated when new results are scraped

### Model Performance
- **XGBoost**: ~6-10 seconds per prediction (includes training time)
- **Decision Tree**: ~4-6 seconds per prediction
- **Markov Chain**: ~1-3 seconds per prediction
- **Normal Distribution**: ~0.1-0.5 seconds per prediction (fastest)
- **DRL Agent**: ~20-40 seconds per prediction (5 episodes, continuous learning)
- **Total Prediction Time**: ~30-60 seconds for all models (parallel execution)

### Model Training & Learning
- **Smart Retraining**: Models automatically retrain when switching between game types
- **DRL Feedback Loop**: DRL agent continuously improves through feedback from accuracy records
- **Historical Data Requirement**: Historical data is required for accurate predictions
- **First-time Training**: First-time prediction generation may take longer as models train

### Technical Requirements
- **Node.js Required**: Must have Node.js installed for InstantDB writes to work (Admin SDK bridge scripts)
- **Environment Variables**: Make sure your InstantDB credentials are correct in `.env`
- **Schema Deployment**: Must deploy InstantDB schema before first use (run `npm run dev` in `lof-v2-db`)
- **Ports**: 
  - Frontend: Vite dev server (port 5173 by default)
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
- **Data Access**: Google Sheets are accessed via public CSV export (no authentication needed for public sheets)
- **API Security**: In production, configure CORS middleware to allow only specific origins

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

1. **User selects game** → Auto-scrapes data from Google Sheets
2. **Data validation** → Saves new results to InstantDB (skips duplicates)
3. **User generates predictions** → System fetches historical data
4. **ML models train & predict** → All 5 models process in parallel
5. **Predictions saved** → Automatically stored in InstantDB
6. **Accuracy calculated** → Auto-matched with results when available
7. **DRL learning loop** → Agent improves through feedback
8. **Results displayed** → Real-time updates on frontend with statistics

## Contributing

Contributions are welcome! If you'd like to improve this project, fix bugs, or add new features, feel free to fork the repository, make your changes, and submit a pull request. Your efforts will help make this trading application even better!

If you found this project helpful or learned something new from it, you can support the development with just a cup of coffee ☕. It's always appreciated and keeps the ideas flowing!

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Support-blue?style=for-the-badge&logo=coffee&logoColor=white)](https://buymeacoffee.com/jonelpericon)



For detailed flowchart visualization, see [SOFTWARE_DOCUMENTATION.html](./SOFTWARE_DOCUMENTATION.html)
