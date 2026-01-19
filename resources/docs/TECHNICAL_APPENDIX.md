# Technical Appendix

## 1. Algorithm Descriptions

### 1.1 Enrollment Forecasting (Ridge Regression)

**Mathematical Formulation:**

```
y_t = β₀ + β₁·t + β₂·y_(t-7) + β₃·MA₇(y) + ε

Where:
- y_t = enrollment at time t
- t = days since first record
- y_(t-7) = enrollment 7 days prior (lag feature)
- MA₇(y) = 7-day moving average
- β = coefficients learned via Ridge regression
- ε = error term
```

**Ridge Regression Objective:**

```
minimize: ||y - Xβ||² + α||β||²

Where:
- α = 1.0 (regularization strength)
- ||β||² = L2 penalty on coefficients
```

**Why Ridge?**
- Handles multicollinearity between t and MA₇
- Prevents overfitting with small datasets
- Computationally efficient for real-time predictions

---

### 1.2 District Risk Scoring

**Component Calculations:**

**1. Enrollment Gap:**
```
Gap = |E_district - E_state_avg| / E_state_avg
Gap_Score = Gap × 10  (scaled to 0-10 range)
```

**2. Negative Ratio:**
```
If E_district < E_state_avg:
    Negative_Ratio = (E_state_avg - E_district) / E_state_avg
Else:
    Negative_Ratio = 0
```

**3. Volatility:**
```
Volatility = min(10, 100 / record_count)
(Inverse of data consistency)
```

**Composite Risk Score:**
```
Risk = (Gap_Score × 0.4) + (Negative_Ratio × 100 × 0.4 / 10) + (Volatility × 0.2)
```

**Severity Classification:**
```
if Risk ≥ 7.0: Severe
elif Risk ≥ 4.0: Moderate
else: Low
```

---

### 1.3 Confidence Interval Calculation

**Historical Error Method:**

```
σ = std(y_recent_30)  // Standard deviation of recent 30 days
CI_95 = ±1.96 × σ × horizon_factor

Where:
horizon_factor = 1 + (forecast_day / total_days) × 0.5
(Widens bounds for longer horizons)
```

**Lower/Upper Bounds:**
```
Lower = max(0, y_pred - CI_95)
Upper = y_pred + CI_95
```

---

## 2. Feature Engineering

### 2.1 Temporal Features

**Time Index (t):**
```python
df["t"] = (df["date"] - df["date"].min()).dt.days
```
- Captures linear trend
- Normalized to start at 0

**Lag Features:**
```python
df["lag_7"] = df["total_enrolment"].shift(7)
```
- Captures weekly seasonality
- Handles momentum/autocorrelation

**Rolling Features:**
```python
df["roll_7"] = df["total_enrolment"].rolling(7).mean()
```
- Smooths noise
- Captures recent trend direction

---

### 2.2 Data Preprocessing

**Date Parsing:**
```python
df["date"] = pd.to_datetime(df["date"], errors="coerce")
df = df.dropna(subset=["date"])
```

**Sorting:**
```python
df = df.sort_values("date")
```
- Critical for time-series integrity

**Missing Value Handling:**
```python
df = df.dropna()  # After feature engineering
```
- Removes rows with NaN in lag/rolling features

---

## 3. Model Training Pipeline

### 3.1 Data Flow

```
SQLite Database
    ↓
Query by state + dataset_type
    ↓
Aggregate to daily totals
    ↓
Feature engineering (t, lag_7, roll_7)
    ↓
Train/validation split (time-series CV)
    ↓
Ridge regression training
    ↓
Model persistence (joblib)
    ↓
API serving
```

---

### 3.2 Time-Series Cross-Validation

**Scikit-learn TimeSeriesSplit:**

```python
tscv = TimeSeriesSplit(n_splits=5)

for train_idx, val_idx in tscv.split(X):
    X_train, X_val = X.iloc[train_idx], X.iloc[val_idx]
    y_train, y_val = y.iloc[train_idx], y.iloc[val_idx]
    
    model.fit(X_train, y_train)
    y_pred = model.predict(X_val)
    
    mae = mean_absolute_error(y_val, y_pred)
    mape = mean_absolute_percentage_error(y_val, y_pred)
```

**Fold Structure (Example with 100 days):**
```
Fold 1: Train[0:20]   → Val[20:40]
Fold 2: Train[0:40]   → Val[40:60]
Fold 3: Train[0:60]   → Val[60:80]
Fold 4: Train[0:80]   → Val[80:100]
Fold 5: Train[0:100]  → Val[100:120] (if data available)
```

---

## 4. Database Schema

### 4.1 UIDAIRecord Table

```sql
CREATE TABLE uidai_records (
    id INTEGER PRIMARY KEY,
    state TEXT NOT NULL,
    district TEXT,
    date DATE NOT NULL,
    dataset_type TEXT,  -- 'ENROLMENT', 'DEMOGRAPHIC', 'BIOMETRIC'
    metric_name TEXT,   -- 'age_0_5', 'age_6_18', etc.
    metric_value REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
```sql
CREATE INDEX idx_state_date ON uidai_records(state, date);
CREATE INDEX idx_district_date ON uidai_records(district, date);
CREATE INDEX idx_dataset_type ON uidai_records(dataset_type);
```

---

### 4.2 Query Patterns

**Enrollment Time Series:**
```sql
SELECT 
    date,
    SUM(metric_value) as total_enrolment
FROM uidai_records
WHERE state = ? 
    AND dataset_type = 'ENROLMENT'
    AND metric_name LIKE 'age_%'
GROUP BY date
ORDER BY date;
```

**District Aggregation:**
```sql
SELECT 
    district,
    SUM(metric_value) as total_enrolment,
    COUNT(*) as record_count,
    AVG(metric_value) as avg_enrolment
FROM uidai_records
WHERE state = ? 
    AND dataset_type = 'ENROLMENT'
    AND date >= ?
GROUP BY district;
```

---

## 5. API Response Schemas

### 5.1 Forecast Endpoint

**Request:**
```
GET /ml/forecast?state=Bihar&days=30
```

**Response:**
```json
{
  "status": "success",
  "state": "Bihar",
  "forecast": [
    {
      "date": "2026-01-15",
      "value": 2450.3,
      "lower": 2205.27,
      "upper": 2695.33
    }
  ],
  "model_metadata": {
    "type": "Ridge Regression",
    "features": ["temporal_trend", "7-day_lag", "7-day_rolling_average"],
    "training_window_days": 180,
    "confidence_method": "Historical error-based (95% CI)",
    "limitations": [...]
  }
}
```

---

### 5.2 District Risk Endpoint

**Request:**
```
GET /analytics/district-risks?state=Bihar&window=30&top=20
```

**Response:**
```json
{
  "status": "success",
  "state": "Bihar",
  "count": 38,
  "critical_count": 5,
  "avg_risk_score": 5.8,
  "districts": [
    {
      "district": "Patna",
      "risk_score": 8.1,
      "gap_abs_mean": 4.5,
      "negative_gap_ratio": 35.2,
      "severity_level": "Severe",
      "risk_breakdown": {
        "enrollment_gap_contribution": 44.4,
        "negative_ratio_contribution": 43.5,
        "volatility_contribution": 12.1
      },
      "explanation": "Primary driver: Enrollment gap"
    }
  ],
  "model_metadata": {...}
}
```

---

## 6. Code Structure

### 6.1 Backend Directory Tree

```
uidai_hackathon/
├── backend/
│   ├── api/              # FastAPI routers
│   │   ├── analytics.py  # Analytics endpoints
│   │   ├── ml.py         # ML model endpoints
│   │   └── chat.py       # Chatbot endpoint
│   ├── ml/               # Machine learning modules
│   │   ├── forecast/
│   │   │   ├── train.py  # Model training
│   │   │   └── predict.py # Inference
│   │   ├── risk/
│   │   │   └── scoring.py # Risk calculation
│   │   └── registry.py   # Model persistence
│   ├── analytics/        # Analytics logic
│   │   └── district_risk_analysis.py
│   ├── db/               # Database layer
│   │   ├── models.py     # SQLAlchemy models
│   │   └── session.py    # DB connection
│   └── main.py           # FastAPI app entry point
├── data/
│   ├── raw/              # CSV source data
│   ├── processed/        # Processed data & models
│   └── validation/       # Case studies
└── docs/                 # Documentation
```

---

### 6.2 Frontend Directory Tree

```
frontend/
├── src/
│   ├── pages/            # React pages
│   │   ├── Home.tsx
│   │   ├── Overview.tsx
│   │   ├── Forecast.tsx
│   │   ├── DistrictHotspots.tsx
│   │   └── BiometricHotspots.tsx
│   ├── components/       # Reusable components
│   │   ├── Common/
│   │   └── Layout/
│   ├── api/              # API client
│   │   ├── client.ts
│   │   └── endpoints.ts
│   └── context/          # React Context (state management)
└── package.json
```

---

## 7. Performance Optimization

### 7.1 Database Optimizations

**Implemented:**
- ✅ Indexes on frequently queried columns
- ✅ Query result limiting (TOP N)
- ✅ Aggregation at database level (not in Python)

**Future:**
- ⚠️ Connection pooling (SQLAlchemy)
- ⚠️ Query result caching (Redis)
- ⚠️ Materialized views for common aggregations

---

### 7.2 API Optimizations

**Implemented:**
- ✅ Efficient data serialization (Pydantic)
- ✅ Minimal data transfer (only required fields)

**Future:**
- ⚠️ Response caching (Redis)
- ⚠️ Rate limiting (slowapi)
- ⚠️ Async database queries (asyncpg)

---

## 8. Testing Strategy

### 8.1 Unit Tests (Recommended)

**Forecast Model:**
```python
def test_forecast_with_sufficient_data():
    result = forecast("Bihar", days=30)
    assert result["status"] == "success"
    assert len(result["forecast"]) == 30
    assert all("value" in f for f in result["forecast"])

def test_forecast_insufficient_data():
    result = forecast("NewState", days=30)
    assert result["status"] == "error"
```

**Risk Scoring:**
```python
def test_risk_calculation():
    result = analyze_district_risks("Bihar", window_days=30)
    assert result["status"] == "success"
    assert all(0 <= d["risk_score"] <= 10 for d in result["districts"])
```

---

### 8.2 Integration Tests (Recommended)

**End-to-End API:**
```python
def test_forecast_api():
    response = client.get("/ml/forecast?state=Bihar&days=30")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
```

---

## 9. Hyperparameter Choices

### 9.1 Ridge Regression

**Alpha (Regularization Strength): 1.0**
- **Rationale:** Balances bias-variance tradeoff
- **Tuning:** Grid search over [0.1, 1.0, 10.0] showed α=1.0 optimal for most states
- **Impact:** Prevents overfitting on small datasets

---

### 9.2 Feature Window Sizes

**Lag Window: 7 days**
- **Rationale:** Captures weekly seasonality
- **Alternatives Tested:** 3, 7, 14 days → 7 performed best

**Rolling Window: 7 days**
- **Rationale:** Smooths daily noise while preserving trends
- **Alternatives Tested:** 3, 7, 14 days → 7 balanced smoothing and responsiveness

---

## 10. Known Technical Debt

1. **SQLite → PostgreSQL Migration:** Required for production scale
2. **Synchronous API:** Async/await would improve concurrency
3. **No Caching Layer:** Redis would reduce database load
4. **Manual Model Retraining:** Needs automated pipeline
5. **Limited Error Logging:** Needs structured logging (ELK stack)

---

## 11. References

### Academic Papers
- Hyndman, R. J., & Athanasopoulos, G. (2018). *Forecasting: principles and practice*. OTexts.
- Bergmeir, C., & Benítez, J. M. (2012). On the use of cross-validation for time series predictor evaluation. *Information Sciences*, 191, 192-213.

### Libraries Used
- **scikit-learn:** Ridge regression, cross-validation
- **pandas:** Data manipulation
- **FastAPI:** Web framework
- **SQLAlchemy:** ORM
- **React:** Frontend framework
- **ECharts:** Visualization library

---

## Conclusion

This technical appendix provides implementation details for judges, developers, and stakeholders to understand the platform's inner workings. All algorithms use standard, well-validated methods with transparent assumptions and limitations.
