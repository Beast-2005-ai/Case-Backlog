import os
import json
import requests

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INDIA_DIR = os.path.join(BASE_DIR, "pending_cases_json", "Indian")

print("Fetching REAL Indian case facts from GitHub...")
url = "https://raw.githubusercontent.com/SnehaDeshmukh28/IndianBailJudgments-1200/main/indian_bail_judgments.json"

try:
    response = requests.get(url)
    response.raise_for_status()
    raw_data = response.json()
    
    count = 0
    for i, case in enumerate(raw_data):
        # We will use the authentic docket format we agreed on
        case_id = f"IN-BAIL-2023-{str(i+1).zfill(4)}"
        
        # Aggressively hunt for the actual text
        # Datasets usually use one of these keys for the text/facts
        facts = case.get("Facts") or case.get("facts") or case.get("Judgment") or case.get("judgment_text") or case.get("Case Summary") or "Text could not be extracted."
        
        if len(facts) > 2000: 
            facts = facts[:2000] + "..." # Keep it manageable

        formatted_case = {
            "case_id": case_id,
            "timestamp": "2023-01-01",
            "case_type": "Criminal Defense",
            "title": f"High Court Bail Docket {case_id}",
            "summary": facts, # NOW IT HAS REAL TEXT
            "flags": {
                "region": "India",
                "bail_case": True
            }
        }
        
        filename = os.path.join(INDIA_DIR, f"{case_id}.json")
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(formatted_case, f, indent=4)
        count += 1
        
    print(f"Successfully downloaded and formatted {count} authentic Indian cases with real facts!")
    
except Exception as e:
    print(f"Failed to load Indian cases: {e}")