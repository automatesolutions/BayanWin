# 🔧 Google Sheets Access Fix

## ❌ Current Issue

The Google Sheets are returning **400 Bad Request** errors, which means they are **not publicly accessible** via CSV export.

## ✅ Solutions

### Option 1: Make Sheets Public (Easiest)

1. **Open each Google Sheet**
2. **Click "Share" button** (top right)
3. **Change access to "Anyone with the link"**
4. **Set permission to "Viewer"**
5. **Click "Done"**

Do this for all 5 sheets:
- Ultra Lotto 6/58
- Grand Lotto 6/55
- Super Lotto 6/49
- Mega Lotto 6/45
- Lotto 6/42

### Option 2: Use Google Service Account (More Secure)

If you prefer to keep sheets private, use a Service Account:

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
2. **Create a new project** (or select existing)
3. **Enable Google Sheets API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google Sheets API"
   - Click "Enable"
4. **Create Service Account**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "Service Account"
   - Fill in details and create
5. **Create Key**:
   - Click on the service account
   - Go to "Keys" tab
   - Click "Add Key" → "Create new key"
   - Choose "JSON" format
   - Download the JSON file
6. **Share Sheets with Service Account**:
   - Open each Google Sheet
   - Click "Share"
   - Add the service account email (from JSON file, looks like `xxx@xxx.iam.gserviceaccount.com`)
   - Give it "Viewer" permission
7. **Add to .env**:
   ```env
   GOOGLE_SERVICE_ACCOUNT_FILE=path/to/your-credentials.json
   ```

## 🧪 Test After Fixing

After making sheets public or setting up service account:

1. **Restart your server**
2. **Try scraping again**:
   ```powershell
   # From frontend or API call
   POST /api/scrape
   ```

## 📝 Current Error

```
400 Client Error: Bad Request
```

This means the sheets are **not publicly accessible**. Follow Option 1 or 2 above.

