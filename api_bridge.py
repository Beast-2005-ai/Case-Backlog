import json
import os
import random
import uuid
import re
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

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

# Ensure directories exist
os.makedirs(os.path.join(JSON_FOLDER, "US"), exist_ok=True)
os.makedirs(os.path.join(JSON_FOLDER, "Indian"), exist_ok=True)

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
                except:
                    continue

    if os.path.exists(JSON_FOLDER):
        for root, dirs, files in os.walk(JSON_FOLDER):
            current_region = "US" if "US" in root else ("India" if "Indian" in root else "Global")
            
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
                            "id": case_id,
                            "region": current_region,
                            "title": real_title,
                            "priority_score": float(v.get("priority_score", 0.0)),
                            "justification": v.get("justification", ""),
                            "summary": real_summary,
                            "type": v.get("category", real_type),
                            "status": "AI Judged"
                        })
                    else:
                        random.seed(filename) 
                        processed_data.append({
                            "id": case_id,
                            "region": current_region,
                            "title": real_title,
                            "priority_score": round(random.uniform(30.00, 49.99), 2),
                            "justification": "Pending AI deep-analysis in background queue...",
                            "summary": real_summary,
                            "type": real_type,
                            "status": "Pending"
                        })

    return sorted(processed_data, key=lambda x: x['priority_score'], reverse=True)

# --- NEW: SMART IMPORT ENDPOINT ---
@app.post("/upload")
async def upload_case(file: UploadFile = File(...)):
    # Read the raw uploaded text
    content = await file.read()
    text = content.decode("utf-8", errors="ignore")
    
    # 1. Smart Region Detection (Look for Indian legal keywords)
    text_lower = text.lower()
    is_india = any(kw in text_lower for kw in ["ipc", "crpc", "high court", "delhi", "maharashtra", "bail app"])
    
    region_folder = "Indian" if is_india else "US"
    region_flag = "India" if is_india else "USA"
    
    # 2. Dynamic Type Detection
    case_type = "Civil Litigation"
    if any(w in text_lower for w in ['divorce', 'child', 'marriage']): case_type = "Family Law"
    elif any(w in text_lower for w in ['patent', 'copyright', 'tax', 'corporate']): case_type = "Corporate / IP"
    elif any(w in text_lower for w in ['murder', 'assault', 'bail', 'custody']): case_type = "Criminal Defense"

    # 3. Generate Official IDs
    unique_id = str(uuid.uuid4().hex)[:6].upper()
    prefix = "IN-UPLOAD" if is_india else "US-UPLOAD"
    case_id = f"{prefix}-2026-{unique_id}"
    
    # 4. Clean formatting for summary
    clean_text = re.sub(r'\s+', ' ', text).strip()
    
    # 5. Build the strict JSON format
    formatted_case = {
        "case_id": case_id,
        "timestamp": "2026-03-29",
        "case_type": case_type,
        "title": f"Direct Client Upload Docket {case_id}",
        "summary": clean_text[:2000], # Cap length to prevent DB overflow
        "flags": {
            "region": region_flag,
            "direct_upload": True,
            "bail_case": "bail" in text_lower
        }
    }
    
    # 6. Save to the correct folder for Watchdog to catch
    save_path = os.path.join(JSON_FOLDER, region_folder, f"{case_id}.json")
    with open(save_path, 'w', encoding='utf-8') as f:
        json.dump(formatted_case, f, indent=4)
        
    return {"status": "success", "case_id": case_id, "region_detected": region_folder}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)