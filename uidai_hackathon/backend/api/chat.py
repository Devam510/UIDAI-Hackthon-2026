from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from groq import Groq
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

router = APIRouter()

# Initialize Groq client
# You'll need to set your API key as an environment variable or replace with actual key
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")  # Get from https://console.groq.com

if not GROQ_API_KEY:
    print("WARNING: GROQ_API_KEY not set. Chatbot will not work until you add your API key.")

client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

# System context about the UIDAI platform
SYSTEM_CONTEXT = """You are an AI assistant for the UIDAI Trends Platform - a government analytics dashboard for Aadhaar enrollment monitoring in India.

Platform Overview:
- Real-time monitoring of Aadhaar enrollment trends across all 36 Indian states and union territories
- Tracks enrollment data at state and district levels
- Analyzes enrollment gaps, biometric quality, and identifies high-risk zones

Key Features and Pages:

1. **Home/Landing Page:**
   - National-level priority insights
   - Flash cards showing top anomaly severity and forecast growth states
   - Priority details table with district counts and alerts
   - Quick access to detailed analytics

2. **Overview Page:**
   - State-level KPIs: Risk Score, Anomaly Severity, Negative Gap Ratio, Forecast Growth
   - 30-day trends for enrollment, anomaly, and biometric stability
   - Smart AI summary of state insights
   - District hotspot analysis with interactive charts
   - Tabs for Enrollment Risk and Biometric Risk visualization

3. **Forecast Page:**
   - ML-powered enrollment predictions
   - Date range selector with auto-calculated days
   - Confidence intervals (upper/lower bounds)
   - Interactive chart showing historical actuals vs predictions
   - Aggregation options: Daily, Weekly, Monthly
   - Model training capability

4. **District Hotspots (District Risks):**
   - Identifies high-risk districts based on enrollment gaps
   - KPI cards: Average Risk, Severe Districts, Worst District, Trend
   - Interactive color-coded horizontal bar chart (Red=Severe, Amber=Moderate, Green=Low)
   - District Drilldown Panel with:
     * Risk score and severity badge
     * Gap metrics and enrollment data
     * 30-day trend sparkline
     * Comparison to state average
   - Time window filters: 7d, 30d, 90d
   - Searchable and filterable table
   - Export to CSV functionality

5. **Biometric Hotspots (Biometric Stability Dashboard):**
   - Monitors biometric data quality across districts
   - KPI cards: Avg Biometric Risk, Severe Districts, Worst District, Trend (Improving/Stable/Worsening)
   - Top 20 Biometric Risk Zones chart with severity-based color coding
   - District Drilldown with:
     * Biometric gap metrics
     * Negative gap ratio
     * Points used for analysis
     * 30-day risk trend sparkline
   - AI Biometric Insight panel with automated recommendations
   - Severity filters and search
   - Comprehensive risk details table

Key Metrics Explained:
- **Risk Score:** Combined metric indicating overall enrollment risk (0-10 scale)
- **Anomaly Severity:** Detects unusual patterns in enrollment (0-10 scale)
- **Negative Gap Ratio:** Percentage of districts with actual enrollment below expected
- **Forecast Growth:** Predicted enrollment growth rate
- **Gap (Absolute Mean):** Average difference between expected and actual enrollment
- **Biometric Risk:** Quality issues in fingerprint/iris data capture

Technical Details:
- Built with React (TypeScript) + FastAPI (Python)
- Real-time data from UIDAI database
- ML models for forecasting and anomaly detection
- State normalization handles all Indian states/UTs
- Responsive design for desktop and mobile

User Assistance Guidelines:
- Explain metrics in simple terms
- Help navigate between pages
- Interpret charts and trends
- Suggest relevant actions based on data
- Answer questions about specific states/districts
- Explain color coding (Red=Critical, Amber=Warning, Green=Good)

Keep responses concise, friendly, and actionable. Focus on helping users make data-driven decisions for improving Aadhaar enrollment."""


class ChatRequest(BaseModel):
    message: str
    history: list = []


class ChatResponse(BaseModel):
    status: str
    response: str
    error: str = None


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat endpoint using Groq API with LLaMA models.
    
    Accepts user messages and returns AI-generated responses with context
    about the UIDAI Trends Platform.
    """
    if not client:
        raise HTTPException(
            status_code=500,
            detail="Chatbot not configured. Please set GROQ_API_KEY environment variable."
        )
    
    try:
        # Prepare conversation with system context
        messages = [
            {
                "role": "system",
                "content": SYSTEM_CONTEXT
            }
        ]
        
        # Add conversation history if provided
        for msg in request.history[-10:]:  # Keep last 10 messages for context
            messages.append(msg)
        
        # Add current user message
        messages.append({
            "role": "user",
            "content": request.message
        })
        
        # Call Groq API with LLaMA 3.1 8B Instant (most reliable free model)
        chat_completion = client.chat.completions.create(
            messages=messages,
            model="llama-3.1-8b-instant",  # Most stable Groq model
            temperature=0.7,
            max_tokens=500,
            top_p=0.9,
            stream=False
        )
        
        # Extract response
        ai_response = chat_completion.choices[0].message.content
        
        return ChatResponse(
            status="success",
            response=ai_response
        )
        
    except Exception as e:
        return ChatResponse(
            status="error",
            response="I apologize, but I'm having trouble processing your request right now. Please try again.",
            error=str(e)
        )


@router.get("/chat/health")
async def chat_health():
    """Check if chatbot is configured and ready."""
    return {
        "status": "ready" if client else "not_configured",
        "model": "llama-3.1-70b-versatile",
        "api_key_set": bool(GROQ_API_KEY)
    }
