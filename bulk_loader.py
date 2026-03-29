import os
import json
import requests
from datasets import load_dataset

# --- 1. CONFIGURATION & DIRECTORIES ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_DIR = os.path.join(BASE_DIR, "pending_cases_json")
US_DIR = os.path.join(JSON_DIR, "US")
INDIA_DIR = os.path.join(JSON_DIR, "Indian")

# Create directories if they don't exist
for directory in [US_DIR, INDIA_DIR]:
    os.makedirs(directory, exist_ok=True)
    print(f"Directory ready: {directory}")

# --- 2. FETCH AND FORMAT INDIAN CASES ---
def load_indian_cases():
    print("\nFetching Indian Bail Judgments from GitHub...")
    url = "https://raw.githubusercontent.com/SnehaDeshmukh28/IndianBailJudgments-1200/main/indian_bail_judgments.json"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        raw_data = response.json()
        
        count = 0
        for i, case in enumerate(raw_data):
            # Synthesize a realistic Indian docket ID if missing
            case_id = f"IN-BAIL-2023-{str(i+1).zfill(4)}"
            
            # Extract safe text
            title = case.get("Case Name", "State v. Unknown")
            facts = case.get("Facts", "No facts provided.")
            if len(facts) > 1500: # Keep it manageable for the local LLM
                facts = facts[:1500] + "..."

            formatted_case = {
                "case_id": case_id,
                "timestamp": "2023-01-01", # Placeholder for sorting
                "case_type": "Criminal Defense",
                "title": title,
                "summary": facts,
                "flags": {
                    "region": "India",
                    "bail_case": True,
                    "ipc_sections_present": bool(case.get("IPC Sections"))
                }
            }
            
            # Save the file
            filename = os.path.join(INDIA_DIR, f"{case_id}.json")
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(formatted_case, f, indent=4)
            count += 1
            
        print(f"Successfully loaded {count} Indian cases.")
        
    except Exception as e:
        print(f"Failed to load Indian cases: {e}")

# --- 3. FETCH AND FORMAT US CASES ---
def load_us_cases(target_count=1000):
    print(f"\nStreaming {target_count} US Supreme Court cases from Hugging Face...")
    try:
        # Using lex_glue SCOTUS split for high-quality legal text
        dataset = load_dataset("lex_glue", "scotus", split="train", streaming=True)
        
        count = 0
        for case in dataset:
            if count >= target_count:
                break
                
            # Synthesize a realistic US case citation format
            case_id = f"US-SCOTUS-{str(count+100).zfill(4)}"
            
            text = case.get("text", "No text provided.")
            if len(text) > 1500:
                text = text[:1500] + "..."

            formatted_case = {
                "case_id": case_id,
                "timestamp": "2020-01-01",
                "case_type": "Civil Litigation", # Defaulting for SCOTUS baseline
                "title": f"Supreme Court Docket {case_id}",
                "summary": text,
                "flags": {
                    "region": "USA",
                    "supreme_court": True
                }
            }
            
            filename = os.path.join(US_DIR, f"{case_id}.json")
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(formatted_case, f, indent=4)
            count += 1
            
        print(f"Successfully loaded {count} US cases.")
        
    except Exception as e:
        print(f"Failed to load US cases: {e}")

# --- 4. EXECUTION ---
if __name__ == "__main__":
    print("Initializing Data Ingestion Pipeline...")
    load_indian_cases()
    load_us_cases(1000)
    print("\n✅ Bulk loading complete. Data is formatted and ready for the AI Judge.")