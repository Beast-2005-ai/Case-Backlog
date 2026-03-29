import os
import json
import re
from datasets import load_dataset

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
US_DIR = os.path.join(BASE_DIR, "pending_cases_json", "US")

os.makedirs(US_DIR, exist_ok=True)

def extract_real_us_story(text):
    if not text:
        return "Summary unavailable."

    # 1. Nuke bracketed text (e.g., [Syllabus from pages 160-162 intentionally omitted])
    text = re.sub(r'\[.*?\]', ' ', text)

    # 2. Fast-forward past the lawyers and citations to the actual opinion
    if "opinion of the Court." in text:
        text = text.split("opinion of the Court.", 1)[1]
    elif "PER CURIAM." in text:
        text = text.split("PER CURIAM.", 1)[1]

    # 3. Clean up whitespace
    clean_text = re.sub(r'\s+', ' ', text).strip()
    
    # 4. Split into sentences and filter
    sentences = re.split(r'(?<=[.!?]) +', clean_text)
    valid_sentences = []
    
    for s in sentences:
        s_lower = s.lower()
        s_strip = s.strip()
        
        # Ruthless filtering of legal header garbage
        if len(s_strip) < 40: continue
        if "certiorari" in s_lower: continue
        if re.search(r'\d+ u\.s\. \d+', s_lower): continue # Catches 329 U.S. 362
        if re.search(r'\d+ s\.ct\. \d+', s_lower): continue # Catches 67 S.Ct. 340
        if s_strip.startswith("Mr.") or s_strip.startswith("Justice"): continue
        if "argued" in s_lower and "decided" in s_lower: continue
        
        valid_sentences.append(s_strip)

    if not valid_sentences:
        return "Case narrative could not be cleanly extracted from transcripts."

    # Grab the first 2 clean sentences
    extracted = " ".join(valid_sentences[:2])
    if len(extracted) > 300:
        return extracted[:297] + "..."
    return extracted

print("Executing Deep-Clean US Case Refetch...")
try:
    dataset = load_dataset("lex_glue", "scotus", split="train", streaming=True)
    count = 0
    
    for case in dataset:
        if count >= 1000: break
            
        case_id = f"US-SCOTUS-{str(count+100).zfill(4)}"
        raw_text = case.get("text", "")
        
        clean_summary = extract_real_us_story(raw_text)
        
        formatted_case = {
            "case_id": case_id,
            "timestamp": "2020-01-01",
            "case_type": "Civil Litigation",
            "title": f"Supreme Court Docket {case_id}",
            "summary": clean_summary,
            "flags": {"region": "USA", "supreme_court": True}
        }
        
        # Dynamic Categorization
        text_lower = raw_text.lower()
        if any(w in text_lower for w in ['divorce', 'child', 'marriage']): formatted_case['case_type'] = "Family Law"
        elif any(w in text_lower for w in ['patent', 'copyright', 'tax', 'revenue']): formatted_case['case_type'] = "Corporate / IP"
        elif any(w in text_lower for w in ['murder', 'assault', 'guilty', 'police']): formatted_case['case_type'] = "Criminal Defense"
        
        filename = os.path.join(US_DIR, f"{case_id}.json")
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(formatted_case, f, indent=4)
            
        count += 1
        
    print(f"✅ Successfully downloaded and surgically cleaned {count} US cases!")
except Exception as e:
    print(f"Failed to load US cases: {e}")