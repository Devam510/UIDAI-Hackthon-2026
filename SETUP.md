# 🚀 Quick Setup Guide

## For Judges / Reviewers / New Developers

This guide will get the UIDAI Aadhaar Trends Platform running on your machine in **under 5 minutes**.

---

## ✅ Prerequisites Check

Before starting, ensure you have:

```bash
# Check Python version (need 3.9+)
python --version

# Check Node.js version (need 16+)
node --version

# Check npm
npm --version

# Check Git
git --version
```

If any are missing:
- **Python**: https://www.python.org/downloads/
- **Node.js**: https://nodejs.org/
- **Git**: https://git-scm.com/downloads

---

## 📥 Step 1: Clone Repository

```bash
git clone https://github.com/Devam510/UIDAI-Hackthon-2026.git
cd UIDAI-Hackthon-2026
```

---

## 🐍 Step 2: Backend Setup (Python)

### Windows:
```bash
cd uidai_hackathon
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### Linux/Mac:
```bash
cd uidai_hackathon
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

**Expected time**: 2-3 minutes

---

## ⚛️ Step 3: Frontend Setup (Node.js)

Open a **new terminal** (keep backend terminal open):

```bash
cd frontend
npm install
```

**Expected time**: 1-2 minutes

---

## ▶️ Step 4: Run the Application

### Terminal 1 - Backend:
```bash
cd uidai_hackathon
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux/Mac
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

**Look for**: `Uvicorn running on http://0.0.0.0:8000`

### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

**Look for**: `Local: http://localhost:5173/`

---

## 🌐 Step 5: Access the Application

Open your browser and navigate to:

- **🎨 Frontend Dashboard**: http://localhost:5173
- **📡 Backend API**: http://localhost:8000
- **📚 API Documentation**: http://localhost:8000/docs

---

## 🎯 First-Time Setup Notes

### Database Auto-Generation
On first run, the backend will:
1. Read CSV data from `uidai_hackathon/data/processed/`
2. Create `uidai.db` SQLite database (~2.4 GB)
3. This takes **30-60 seconds** on first startup

**You'll see**: `INFO: Loading data from CSV...` in the backend terminal

### ML Models
ML models are trained **on-demand** when you first visit:
- **Forecast page**: Trains Prophet model for selected state
- **Biometric Risks**: Trains biometric quality model
- **District Hotspots**: Trains anomaly detection model

**First load**: 5-10 seconds per state  
**Subsequent loads**: Instant (models cached)

---

## 🔧 Troubleshooting

### Backend won't start
```bash
# Make sure virtual environment is activated
.venv\Scripts\activate          # Windows
source .venv/bin/activate       # Linux/Mac

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### Frontend won't start
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Port already in use
```bash
# Backend (change port)
python -m uvicorn backend.main:app --reload --port 8001

# Frontend (change port)
npm run dev -- --port 5174
```

### Database issues
```bash
# Delete and regenerate database
cd uidai_hackathon
rm uidai.db
# Restart backend - database will auto-regenerate
```

---

## 📊 Testing the Application

### 1. Home Page
- Should show India map with state-wise data
- Click on states to see details

### 2. Overview Page
- View top states by enrollment
- See growth trends and comparisons

### 3. Forecast Page
- Select a state (e.g., "Gujarat")
- View trend direction analysis
- Check for blue warning banner about trend analysis

### 4. District Hotspots
- Select a state
- See district-level risk scores
- Interactive charts and maps

### 5. Biometric Risks
- View biometric quality analysis
- See failure patterns and trends

---

## 🎓 For Judges

### Key Features to Review:
1. **Trend Analysis** (Forecast page) - Shows direction, not predictions
2. **ML Models** - Prophet, anomaly detection, risk scoring
3. **Data Quality** - Transparent about limitations (9 months, missing data)
4. **Interactive UI** - Responsive, dark mode, charts
5. **API Documentation** - Auto-generated Swagger docs

### Data Source:
- CSV files in `uidai_hackathon/data/processed/`
- 9 months of 2025 data (Jan, Feb, Aug missing)
- ~2.4 GB SQLite database (auto-generated)

### Tech Stack:
- **Backend**: FastAPI + Prophet + scikit-learn
- **Frontend**: React + TypeScript + Vite + ECharts
- **Database**: SQLite (from CSV)

---

## 🛑 Stopping the Application

### Stop Backend:
Press `Ctrl+C` in backend terminal

### Stop Frontend:
Press `Ctrl+C` in frontend terminal

### Deactivate Virtual Environment:
```bash
deactivate
```

---

## 📞 Need Help?

1. **API Docs**: http://localhost:8000/docs
2. **GitHub Issues**: https://github.com/Devam510/UIDAI-Hackthon-2026/issues
3. **Check logs** in terminal for error messages

---

## ✨ Next Steps

After setup, explore:
- Different states and their trends
- ML model predictions and confidence levels
- District-level risk analysis
- API endpoints via Swagger UI

---

**Setup complete! 🎉**

**Estimated total time**: 5 minutes  
**Project ready for**: Development, Testing, Judging, Deployment
