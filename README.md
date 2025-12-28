# BayanWin 🎯

A modern, full-stack web application that scrapes PCSO lottery results, stores them in InstantDB, and provides 5 different ML-based prediction models for multiple lottery games.

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

- **Data Scraping**: Automated scraping of PCSO lottery results for 5 games
- **Database**: InstantDB BaaS (Backend-as-a-Service) - Pure InstantDB API integration
  - Backend uses InstantDB REST API exclusively
  - Frontend communicates with backend API only (no InstantDB SDK)
- **5 ML Prediction Models**:
  - XGBoost
  - Decision Trees
  - Markov Chain
  - Anomaly Detection & Distribution Limits
  - Deep Reinforcement Learning (DRL)
- **Modern Web Interface**: React frontend with Vite, Tailwind CSS, and modern tech design
- **Error Distance Analysis**: Track prediction accuracy with multiple metrics
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
│   ├── config.py        # Configuration (InstantDB credentials)
│   ├── services/        # InstantDB client service
│   ├── ml_models/       # 5 ML prediction models
│   ├── scrapers/        # PCSO web scraper
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

- **Python 3.8+**
- **Node.js 16+**
- **InstantDB Account** (https://www.instantdb.com)
- **Chrome/Chromium** (for Selenium scraper)

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

4. **Install dependencies:**
```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

5. **Set up environment variables:**

Create a `.env` file in the `backend` directory:
```env
# InstantDB Configuration (REQUIRED)
INSTANTDB_APP_ID=your-app-id-here
INSTANTDB_ADMIN_TOKEN=your-admin-token-here

# Optional (for uvicorn reload)
DEBUG=True
```

**Get your InstantDB credentials:**
- **App ID**: https://www.instantdb.com/dash → Your App → App ID
- **Admin Token**: https://www.instantdb.com/dash → Admin → Secret field (click to reveal)

6. **Run FastAPI server:**
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
| `DEBUG` | ❌ No | Set to `True` for uvicorn auto-reload (development) |

**Important:** 
- Never commit `.env` files to Git
- InstantDB credentials are required for backend to function
- No PostgreSQL connection string needed - InstantDB handles everything!

## 📡 API Endpoints

### Game Management
- `GET /api/games` - List all available games

### Results
- `GET /api/results/{game_type}` - Get historical results (paginated)
  - Query params: `page`, `limit`
- `POST /api/scrape` - Trigger data scraping
  - Body: `{ "start_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD" }` (optional)

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

### Health Check
- `GET /health` - API health check

**Full API Documentation:** Visit `http://localhost:5000/docs` when backend is running

## 🎯 Usage

1. **Start the backend server** (port 5000)
2. **Start the frontend development server** (port 5173)
3. **Open browser** to `http://localhost:5173`
4. **Select a game** from the game selector
5. **Click "Generate Predictions"** to get predictions from all 5 ML models
6. **Use "Scrape New Data"** button to fetch latest lottery results
7. **View statistics** and error distance analysis for each game

## 🏗️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **InstantDB** - Backend-as-a-Service (REST API)
- **Uvicorn** - ASGI server
- **Selenium** - Web scraping
- **XGBoost, TensorFlow, scikit-learn** - ML libraries
- **Pandas, NumPy** - Data processing

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

- The scraper requires Chrome/Chromium browser installed
- Make sure your InstantDB credentials are correct in `.env`
- First-time prediction generation may take longer as models train
- Historical data is required for accurate predictions
- Frontend runs on Vite dev server (port 5173 by default)
- Backend runs on FastAPI/Uvicorn (port 5000)

## 🔒 Security

- `.env` files are gitignored - never commit sensitive data
- `venv/` and `node_modules/` are gitignored
- InstantDB Admin Token should be kept secret
- Use environment variables for all sensitive configuration

## 📄 License

MIT License

---

**Built with ❤️ using FastAPI, React, and InstantDB**
