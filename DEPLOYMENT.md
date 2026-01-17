# UIDAI Trends Platform - Deployment Guide

## 📋 Prerequisites

### System Requirements
- **Python**: 3.9 or higher
- **Node.js**: 16.x or higher
- **npm**: 8.x or higher
- **RAM**: Minimum 4GB
- **Storage**: 2GB free space

### Required Software
- Git
- Python virtual environment (venv)
- Modern web browser (Chrome, Firefox, Edge)

---

## 🚀 Quick Start (Development)

### 1. Clone Repository
```bash
git clone <repository-url>
cd UIDAI\ Hackthon
```

### 2. Backend Setup

#### Navigate to backend directory
```bash
cd uidai_hackathon
```

#### Create virtual environment
```bash
python -m venv venv
```

#### Activate virtual environment
**Windows**:
```bash
venv\Scripts\activate
```

**Linux/Mac**:
```bash
source venv/bin/activate
```

#### Install dependencies
```bash
pip install -r requirements.txt
```

#### Start backend server
```bash
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: `http://localhost:8000`

### 3. Frontend Setup

#### Navigate to frontend directory (new terminal)
```bash
cd frontend
```

#### Install dependencies
```bash
npm install
```

#### Start development server
```bash
npm run dev
```

Frontend will be available at: `http://localhost:5173`

---

## 🏗️ Production Deployment

### Backend (FastAPI)

#### 1. Install production dependencies
```bash
pip install gunicorn uvicorn[standard]
```

#### 2. Run with Gunicorn
```bash
gunicorn backend.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 120
```

#### 3. Environment Variables
Create `.env` file:
```env
ENV=production
LOG_LEVEL=info
CORS_ORIGINS=https://yourdomain.com
```

### Frontend (React + Vite)

#### 1. Build for production
```bash
cd frontend
npm run build
```

#### 2. Preview build locally
```bash
npm run preview
```

#### 3. Deploy static files
Upload `frontend/dist/` folder to:
- **Vercel**: `vercel deploy`
- **Netlify**: `netlify deploy --prod`
- **AWS S3**: Upload to S3 bucket + CloudFront
- **Nginx**: Copy to `/var/www/html/`

---

## 🐳 Docker Deployment

### Backend Dockerfile
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Dockerfile
```dockerfile
FROM node:16-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose
```yaml
version: '3.8'

services:
  backend:
    build: ./uidai_hackathon
    ports:
      - "8000:8000"
    environment:
      - ENV=production
    volumes:
      - ./uidai_hackathon/data:/app/data

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

Run with:
```bash
docker-compose up -d
```

---

## 🔧 Configuration

### Backend Configuration

#### API Base URL
Update `frontend/src/api/client.ts`:
```typescript
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```

#### CORS Settings
Update `backend/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # Production domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Frontend Configuration

Create `frontend/.env.production`:
```env
VITE_API_URL=https://api.yourdomain.com
```

---

## 📊 Data Setup

### CSV Data Location
Ensure `aadhaar_master_monthly.csv` is in:
```
uidai_hackathon/data/processed/aadhaar_master_monthly.csv
```

### ML Models
Models are auto-trained on first request. To pre-train:
```bash
curl -X POST http://localhost:8000/ml/train-forecast?state=Gujarat
```

---

## 🧪 Testing

### Backend Tests
```bash
cd uidai_hackathon
pytest tests/
```

### Frontend Tests
```bash
cd frontend
npm run test
```

### API Health Check
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{"status": "healthy"}
```

---

## 🔍 Troubleshooting

### Backend Issues

**Port already in use**:
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8000 | xargs kill -9
```

**Module not found**:
```bash
pip install -r requirements.txt --force-reinstall
```

**CSV not loading**:
- Check file path: `uidai_hackathon/data/processed/aadhaar_master_monthly.csv`
- Verify file permissions
- Check file encoding (should be UTF-8)

### Frontend Issues

**Build fails**:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

**API connection error**:
- Check backend is running on port 8000
- Verify CORS settings
- Check network/firewall

---

## 📈 Performance Optimization

### Backend
- Use Redis for caching (optional)
- Enable gzip compression
- Use CDN for static assets
- Implement rate limiting

### Frontend
- Enable code splitting
- Optimize images
- Use lazy loading
- Enable service worker

---

## 🔒 Security

### Production Checklist
- [ ] Change default secrets/keys
- [ ] Enable HTTPS (SSL/TLS)
- [ ] Set secure CORS origins
- [ ] Implement rate limiting
- [ ] Add authentication (if needed)
- [ ] Regular security updates
- [ ] Enable logging and monitoring

---

## 📞 Support

### Logs Location
- **Backend**: Console output or `logs/app.log`
- **Frontend**: Browser console

### Common Commands
```bash
# Check backend status
curl http://localhost:8000/

# View backend logs
tail -f logs/app.log

# Restart services
docker-compose restart

# View running containers
docker ps
```

---

## 🎯 Demo Deployment

For hackathon demo:

1. **Local Network**:
   ```bash
   # Backend
   uvicorn backend.main:app --host 0.0.0.0 --port 8000
   
   # Frontend
   npm run dev -- --host 0.0.0.0
   ```
   Access from other devices: `http://<your-ip>:5173`

2. **Quick Cloud Deploy**:
   - Backend: Railway, Render, or Heroku
   - Frontend: Vercel or Netlify (free tier)

---

## ☁️ Render Deployment (PostgreSQL)

### Overview
Deploy backend to Render with persistent PostgreSQL database. **CSV files are NOT pushed to Git** due to size limits (~22MB). Instead, use one-time manual upload.

### 1. Create PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New** → **PostgreSQL**
3. Configure:
   - **Name**: `uidai-database`
   - **Region**: Choose closest region
   - **Plan**: Free tier
4. Click **Create Database**
5. **Copy Internal Database URL** (needed for backend)

### 2. Deploy Backend Service

1. **New** → **Web Service**
2. Connect GitHub repository
3. Configure:
   - **Name**: `uidai-hackthon-2026`
   - **Region**: Same as database
   - **Root Directory**: `uidai_hackathon`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
4. **Environment Variable**:
   - Key: `DATABASE_URL`
   - Value: (Paste Internal Database URL from Step 1)
5. Click **Create Web Service**

### 3. Initial Deployment

Backend starts successfully but database is **empty**. Check logs:
```
================================================================================
⚠️  CSV FILE NOT FOUND - DATABASE IS EMPTY
================================================================================
```

This is **expected** on first deployment.

### 4. Seed Database (One-Time Only) ⚡

Upload CSV to populate database:

```bash
curl -X POST -F "file=@uidai_hackathon/data/processed/aadhaar_master_monthly.csv" \
  https://uidai-hackthon-2026.onrender.com/admin/upload-csv
```

**Expected response:**
```json
{
  "status": "success",
  "records_loaded": 123456
}
```

### 5. Verify Persistence

1. Check frontend - data should appear
2. Restart backend service on Render
3. Check logs:
   ```
   ✅ Database already contains 123456 records. Skipping data load.
   ```
4. Frontend still shows data ✅

### Important Notes

✅ **Upload CSV only once** - PostgreSQL persists data  
✅ **No re-upload needed** on restarts/redeployments  
🔄 **Re-upload only if** you want to refresh data or recreated database  
🚫 **CSV not in Git** - too large for GitHub limits

### Frontend (GitHub Pages)

1. Update `frontend/.env.production`:
   ```
   VITE_API_BASE_URL=https://uidai-hackthon-2026.onrender.com
   ```

2. Deploy:
   ```bash
   cd frontend
   npm run build
   npm run deploy
   ```



---

## ✅ Deployment Checklist

- [ ] Backend runs without errors
- [ ] Frontend builds successfully
- [ ] All API endpoints respond
- [ ] CSV data loads correctly
- [ ] ML models train successfully
- [ ] Export functionality works
- [ ] AI insights generate properly
- [ ] QuickStartGuide appears on first visit
- [ ] India Map displays correctly
- [ ] All pages load < 2 seconds

---

**Last Updated**: January 15, 2026  
**Version**: 1.0  
**Status**: Production Ready ✅
