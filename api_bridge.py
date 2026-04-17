import json
import os
import random
import uuid
import re
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from pydantic import BaseModel
from typing import Dict, List

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
QUEUE_FILE = os.path.join(BASE_DIR, "master_queue.txt")
JSON_FOLDER = os.path.join(BASE_DIR, "pending_cases_json")
LOG_FILE = os.path.join(BASE_DIR, "system_logs.txt")
CONFIG_FILE = os.path.join(BASE_DIR, "system_config.json")

os.makedirs(os.path.join(JSON_FOLDER, "US"), exist_ok=True)
os.makedirs(os.path.join(JSON_FOLDER, "Indian"), exist_ok=True)
os.makedirs(os.path.join(JSON_FOLDER, "International"), exist_ok=True)

def write_log(action, details=""):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = f"[{timestamp}] {action} | {details}\n"
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(log_entry)

def init_config():
    if not os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump({"active_ids": [], "configs": []}, f, indent=4)
init_config()

class ConfigPayload(BaseModel):
    name: str
    keywords: Dict[str, float]

@app.get("/config")
def get_config():
    with open(CONFIG_FILE, 'r', encoding='utf-8') as f: return json.load(f)

@app.post("/config")
def save_config(payload: ConfigPayload):
    # --- STRICT BACKEND VALIDATION ---
    if not payload.name.strip():
        return {"status": "error", "message": "Profile name cannot be empty."}
    
    if not payload.keywords or len(payload.keywords) == 0:
        return {"status": "error", "message": "Profile must contain at least one valid keyword."}

    with open(CONFIG_FILE, 'r', encoding='utf-8') as f: data = json.load(f)
    new_id = f"config_{str(uuid.uuid4().hex)[:8]}"
    new_config = { "id": new_id, "name": payload.name, "keywords": payload.keywords }
    
    if "configs" not in data: data["configs"] = []
    if "active_ids" not in data: data["active_ids"] = []
    
    data["configs"].append(new_config)
    data["active_ids"].append(new_id) 
    
    with open(CONFIG_FILE, 'w', encoding='utf-8') as f: json.dump(data, f, indent=4)
    write_log("CONFIG SAVED", f"Created and activated new AI profile: {payload.name}")
    return {"status": "success", "active_ids": data["active_ids"]}

@app.put("/config/toggle/{config_id}")
def toggle_config(config_id: str):
    with open(CONFIG_FILE, 'r', encoding='utf-8') as f: data = json.load(f)
    if "active_ids" not in data: data["active_ids"] = []
        
    if config_id in data["active_ids"]:
        data["active_ids"].remove(config_id)
        action = "Deactivated"
    else:
        data["active_ids"].append(config_id)
        action = "Activated"
        
    with open(CONFIG_FILE, 'w', encoding='utf-8') as f: json.dump(data, f, indent=4)
    write_log("CONFIG TOGGLED", f"{action} AI Profile ID: {config_id}")
    return {"status": "success", "active_ids": data["active_ids"]}

@app.delete("/config/{config_id}")
def delete_config(config_id: str):
    with open(CONFIG_FILE, 'r', encoding='utf-8') as f: data = json.load(f)
    data["configs"] = [c for c in data.get("configs", []) if c["id"] != config_id]
    if config_id in data.get("active_ids", []): data["active_ids"].remove(config_id)
        
    with open(CONFIG_FILE, 'w', encoding='utf-8') as f: json.dump(data, f, indent=4)
    write_log("CONFIG DELETED", f"Deleted AI Profile ID: {config_id}")
    return {"status": "success"}

@app.get("/queue")
def get_queue():
    processed_data = []
    ai_verdicts = {}

    if os.path.exists(QUEUE_FILE):
        with open(QUEUE_FILE, "r", encoding="utf-8") as f:
            for line in f.readlines():
                try:
                    parts = line.split(" | Verdict: ")
                    if len(parts) < 2: continue
                    filename = parts[0].replace("Case: ", "").strip()
                    verdict = json.loads(parts[1])
                    ai_verdicts[filename] = verdict
                except: continue

    if os.path.exists(JSON_FOLDER):
        for root, dirs, files in os.walk(JSON_FOLDER):
            current_region = "US" if "US" in root else ("India" if "Indian" in root else "International")
            
            for filename in files:
                if filename.endswith('.json'):
                    filepath = os.path.join(root, filename)
                    case_id = filename.replace(".json", "")
                    try:
                        with open(filepath, 'r', encoding='utf-8') as jf:
                            raw_case = json.load(jf)
                            real_title = raw_case.get("title", "Unknown Title")
                            real_summary = raw_case.get("summary", "No summary available.")
                            real_type = raw_case.get("case_type", "Uncategorized")
                    except:
                        real_title, real_summary, real_type = "Error", "Error reading file", "Uncategorized"

                    if filename in ai_verdicts:
                        v = ai_verdicts[filename]
                        processed_data.append({
                            "id": case_id, "region": current_region, "title": real_title,
                            "priority_score": float(v.get("priority_score", 0.0)),
                            "justification": v.get("justification", ""),
                            "summary": real_summary, "type": v.get("category", real_type),
                            "status": "AI Judged"
                        })
                    else:
                        random.seed(filename) 
                        processed_data.append({
                            "id": case_id, "region": current_region, "title": real_title,
                            "priority_score": round(random.uniform(30.00, 49.99), 2),
                            "justification": "Pending AI deep-analysis...",
                            "summary": real_summary, "type": real_type,
                            "status": "Pending"
                        })
    return sorted(processed_data, key=lambda x: x['priority_score'], reverse=True)

@app.post("/upload")
async def upload_case(file: UploadFile = File(...)):
    content = await file.read()
    text = content.decode("utf-8", errors="ignore")
    if len(text.split()) < 20: return {"status": "error", "message": "File rejected: Insufficient facts."}
    
    clean_text = re.sub(r'\s+', ' ', text).strip()[:2000]
    if os.path.exists(JSON_FOLDER):
        for root, dirs, files in os.walk(JSON_FOLDER):
            for filename in files:
                if filename.endswith('.json'):
                    try:
                        with open(os.path.join(root, filename), 'r', encoding='utf-8') as f:
                            existing_case = json.load(f)
                            if existing_case.get("summary", "") == clean_text:
                                return {"status": "error", "message": "Duplicate case detected."}
                    except: pass
    
    text_lower = text.lower()
    
    is_india = any(kw in text_lower for kw in ["ipc", "crpc", "high court", "delhi", "maharashtra", "bail app", "india"])
    is_us = any(kw in text_lower for kw in ["united states", "us district court", "scotus", "federal court", "usa", "california", "texas", "new york"])
    
    if is_india:
        region_folder = "Indian"
        region_flag = "India"
        prefix = "IN-UPLOAD"
    elif is_us:
        region_folder = "US"
        region_flag = "USA"
        prefix = "US-UPLOAD"
    else:
        region_folder = "International"
        region_flag = "International"
        prefix = "INT-UPLOAD"
    
    case_type = "Civil Litigation"
    if any(w in text_lower for w in ['divorce', 'child', 'marriage']): case_type = "Family Law"
    elif any(w in text_lower for w in ['patent', 'copyright', 'tax', 'corporate']): case_type = "Corporate / IP"
    elif any(w in text_lower for w in ['murder', 'assault', 'bail', 'custody']): case_type = "Criminal Defense"

    unique_id = str(uuid.uuid4().hex)[:6].upper()
    case_id = f"{prefix}-2026-{unique_id}"
    
    formatted_case = {
        "case_id": case_id, "timestamp": "2026-03-29", "case_type": case_type,
        "title": f"Direct Client Upload Docket {case_id}", "summary": clean_text, 
        "flags": {"region": region_flag, "direct_upload": True}
    }
    
    save_path = os.path.join(JSON_FOLDER, region_folder, f"{case_id}.json")
    with open(save_path, 'w', encoding='utf-8') as f: json.dump(formatted_case, f, indent=4)
    return {"status": "success", "case_id": case_id}

@app.get("/logs")
def get_logs():
    if not os.path.exists(LOG_FILE): return []
    with open(LOG_FILE, "r", encoding="utf-8") as f:
        return [line.strip() for line in f.readlines() if line.strip()][::-1]

@app.delete("/logs")
def clear_logs():
    with open(LOG_FILE, "w", encoding="utf-8") as f: f.write("")
    write_log("LOGS CLEARED", "System administrator purged the audit logs.")
    return {"status": "cleared"}    

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)