import os
import uuid
import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional

from llm_client import LlmSettings, text_to_speech_async
from workflow import compiled_workflow
from database import get_history, add_history_entry, init_db

app = FastAPI(title="AI-Powered Crop Advisory & Disease Resolution Assistant API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SETTINGS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "settings.json")

def load_settings() -> LlmSettings:
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return LlmSettings(**data)
        except Exception:
            pass
    return LlmSettings()

def save_settings(settings: LlmSettings):
    os.makedirs(os.path.dirname(SETTINGS_FILE), exist_ok=True)
    with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
        f.write(settings.model_dump_json(indent=2))

import json

# Initialize DB on startup
@app.on_event("startup")
def startup_event():
    init_db()
    # Create empty settings file if it doesn't exist
    if not os.path.exists(SETTINGS_FILE):
        save_settings(LlmSettings())

class AdviseRequest(BaseModel):
    crop_name: str
    query: str
    image_base64: Optional[str] = None
    soil_metrics: Dict[str, Any] = Field(default_factory=lambda: {"pH": 6.5, "moisture": 50, "N": 40, "P": 40, "K": 40})
    weather: Dict[str, Any] = Field(default_factory=lambda: {"temp": 25, "humidity": 60, "rain": "Moderate", "location": "Central Farm"})
    language: str = "English"

@app.get("/api/settings", response_model=LlmSettings)
def get_settings():
    return load_settings()

@app.post("/api/settings")
def post_settings(settings: LlmSettings):
    save_settings(settings)
    return {"status": "success", "message": "Settings saved successfully."}

@app.post("/api/advise")
def post_advise(req: AdviseRequest):
    settings = load_settings()
    
    # Prepare initial state
    initial_state = {
        "crop_name": req.crop_name,
        "query": req.query,
        "image_base64": req.image_base64,
        "soil_metrics": req.soil_metrics,
        "weather": req.weather,
        "language": req.language,
        "llm_settings": settings.model_dump()
    }
    
    try:
        # Execute LangGraph workflow
        final_state = compiled_workflow.invoke(initial_state)
        report = final_state.get("final_report", {})
        
        # Save to database
        history_entry = {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
            "crop_name": req.crop_name,
            "query": req.query,
            "image_base64": req.image_base64, # Save the image too!
            "soil_metrics": req.soil_metrics,
            "weather": req.weather,
            "language": req.language,
            "diagnosed_diseases": final_state.get("diagnosed_diseases", []),
            "final_report": report,
            "is_fallback": final_state.get("is_fallback", False),
            "fallback_reason": final_state.get("fallback_reason")
        }
        add_history_entry(history_entry)
        
        return history_entry
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Workflow failed: {str(e)}")

@app.get("/api/history")
def get_history_api():
    return get_history()

@app.get("/api/weather")
def get_weather(location: str):
    loc_lower = location.lower()
    if not loc_lower:
        loc_lower = "default"
        
    # Mocking different climates based on keyword
    if "dry" in loc_lower or "desert" in loc_lower or "sahara" in loc_lower:
        temp = 38
        humidity = 15
        rain = "None"
    elif "rain" in loc_lower or "wet" in loc_lower or "jungle" in loc_lower or "tropical" in loc_lower:
        temp = 28
        humidity = 88
        rain = "Heavy Rain"
    elif "cold" in loc_lower or "hill" in loc_lower or "mountain" in loc_lower or "alpine" in loc_lower:
        temp = 12
        humidity = 70
        rain = "Light Drizzle"
    elif "coast" in loc_lower or "beach" in loc_lower or "ocean" in loc_lower:
        temp = 26
        humidity = 80
        rain = "Moderate Rain"
    else:
        # Default moderate weather
        temp = 24
        humidity = 55
        rain = "Moderate"
        
    return {
        "location": location or "Central Valley Farm",
        "temp": temp,
        "humidity": humidity,
        "rain": rain
    }


class TtsRequest(BaseModel):
    text: str
    language: str = "English"


@app.post("/api/tts")
async def post_tts(req: TtsRequest):
    try:
        audio_bytes = await text_to_speech_async(req.text, req.language)
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"TTS failed: {str(e)}")
