# BayanWin Setup Guide

## Prerequisites

- **Python 3.8+**
- **Node.js 16+**
- **InstantDB Account** (https://www.instantdb.com)
- **Chrome/Chromium** (for Selenium scraper)

## Backend Setup

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
   - **Windows Command Prompt (cmd):**
     ```cmd
     venv\Scripts\activate.bat
     ```
   - **Linux/Mac:**
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies:**

   **Important:** First upgrade pip to ensure you get pre-built wheels:
   ```powershell
   python.exe -m pip install --upgrade pip
   ```

   Then install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

   **Note for Windows users:** If TensorFlow installation fails, ensure you have Visual C++ Redistributable installed.

5. **Set up environment variables:**

Create a `.env` file in the `backend` directory:
```env
# InstantDB Configuration (REQUIRED)
INSTANTDB_APP_ID=your-app-id-here
INSTANTDB_ADMIN_TOKEN=your-admin-token-here

# Optional (for uvicorn auto-reload)
DEBUG=True
```

**How to get InstantDB credentials:**
1. Go to https://www.instantdb.com/dash
2. Sign in or create an account
3. **App ID**: Found in your app dashboard
4. **Admin Token**: Go to Admin section → Look for "Secret" field → Click to reveal/copy

6. **Run FastAPI server:**
```bash
uvicorn app:app --host 0.0.0.0 --port 5000 --reload
```

The API will be available at:
- **API**: `http://localhost:5000`
- **Interactive Docs**: `http://localhost:5000/docs`
- **Alternative Docs**: `http://localhost:5000/redoc`

## Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

**Note:** The frontend uses Vite (not Create React App) and communicates exclusively with the backend API. No InstantDB SDK or frontend `.env` file is required.

3. **Start development server:**
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` (Vite default port)

## Usage

1. **Start the backend server first** (port 5000)
2. **Start the frontend development server** (port 5173)
3. **Open browser** to `http://localhost:5173`
4. **Select a game** from the game selector
5. **Click "Generate Predictions"** to get predictions from all 5 ML models
6. **Use "Scrape New Data"** button to fetch latest lottery results
7. **View statistics** and error distance analysis for each game

## Troubleshooting

### Backend Issues

**Problem: Missing InstantDB credentials**
```
ValueError: INSTANTDB_APP_ID environment variable is required
```
**Solution:** Make sure your `.env` file exists in the `backend` directory and contains both `INSTANTDB_APP_ID` and `INSTANTDB_ADMIN_TOKEN`.

**Problem: Port already in use**
```
ERROR: [Errno 48] Address already in use
```
**Solution:** Change the port:
```bash
uvicorn app:app --host 0.0.0.0 --port 5001 --reload
```

**Problem: Module not found**
```
ModuleNotFoundError: No module named 'fastapi'
```
**Solution:** Make sure your virtual environment is activated and dependencies are installed:
```bash
pip install -r requirements.txt
```

### Frontend Issues

**Problem: Cannot connect to backend**
```
Network Error: Failed to fetch
```
**Solution:** 
- Make sure backend is running on port 5000
- Check CORS settings in `backend/app.py`
- Verify API URL in `frontend/src/services/api.js`

**Problem: Port already in use**
```
Port 5173 is in use
```
**Solution:** Vite will automatically try the next available port, or specify one:
```bash
npm run dev -- --port 3000
```

### Scraper Issues

**Problem: ChromeDriver not found**
```
selenium.common.exceptions.WebDriverException: Message: 'chromedriver' executable needs to be in PATH
```
**Solution:** 
- Make sure Chrome/Chromium is installed
- Selenium 4+ should automatically manage ChromeDriver
- If issues persist, install ChromeDriver manually

**Problem: Scraping fails**
```
Failed to scrape data
```
**Solution:**
- Check internet connection
- Verify PCSO website is accessible
- Check browser console for errors
- Ensure Chrome/Chromium is installed

## Production Build

### Backend Production

```bash
# Install production dependencies
pip install -r requirements.txt

# Set DEBUG=False in .env
# Use production ASGI server (Gunicorn with Uvicorn workers)
gunicorn app:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:5000
```

### Frontend Production

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Or serve with a static file server
# The built files will be in frontend/dist/
```

## Notes

- The scraper requires Chrome/Chromium browser installed
- Make sure your InstantDB connection credentials are correct
- First-time prediction generation may take longer as models train
- Historical data is required for accurate predictions
- Backend uses FastAPI (not Flask)
- Frontend uses Vite (not Create React App)
- All database operations go through InstantDB API (no direct PostgreSQL)

## Environment Variables Reference

### Backend `.env` file:
```env
# Required
INSTANTDB_APP_ID=beb7efd4-c8f7-4157-ad5a-80b2f55f4f87
INSTANTDB_ADMIN_TOKEN=your-admin-token-here

# Optional
DEBUG=True  # Enables uvicorn auto-reload
```

### Frontend:
No `.env` file needed! Frontend communicates with backend API only.

---

For more information, see [README.md](./README.md)
