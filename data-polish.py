import os
import json
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_DIR = os.path.join(BASE_DIR, "pending_cases_json")

def categorize_case(text):
    text_lower = text.lower()
    if any(word in text_lower for word in ['divorce', 'child', 'custody', 'marriage', 'domestic']):
        return "Family Law"
    elif any(word in text_lower for word in ['patent', 'copyright', 'trademark', 'corporate', 'tax', 'revenue', 'business']):
        return "Corporate / IP"
    elif any(word in text_lower for word in ['murder', 'assault', 'theft', 'bail', 'custody', 'police', 'conviction', 'guilty']):
        return "Criminal Defense"
    else:
        return "Civil Litigation"

def clean_us_summary(text):

    cleaned = re.sub(r'^.*?(?:Decided [A-Za-z]+ \d{1,2}, \d{4}\.?|\[Syllabus.*?\]|PER CURIAM\.?)', '', text, flags=re.IGNORECASE | re.DOTALL)
    
    # If the regex stripped too much, fall back to the original text
    if len(cleaned.strip()) < 50:
         return text.strip()
    return cleaned.strip()

def extract_better_summary(text):
    if not text or len(text) < 10:
        return "Summary unavailable."
    
    sentences = re.split(r'(?<=[.!?]) +', text.replace('\n', ' '))
    valid_sentences = [s.strip() for s in sentences if len(s.strip()) > 30]
    
    extracted = " ".join(valid_sentences[:2])
    if len(extracted) > 300:
        extracted = extracted[:297] + "..."
    return extracted

print("Running Final Polish: Categorization & Summary Cleanup...")
count = 0

for root, dirs, files in os.walk(JSON_DIR):
    for filename in files:
        if filename.endswith(".json"):
            filepath = os.path.join(root, filename)
            
            with open(filepath, 'r', encoding='utf-8') as f:
                case = json.load(f)
            
            raw_text = case.get('summary', '')
            
        
            if "US" in root:
                raw_text = clean_us_summary(raw_text)
                
            
            case['case_type'] = categorize_case(raw_text)
            
            
            case['summary'] = extract_better_summary(raw_text)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(case, f, indent=4)
            count += 1

print(f"✅ Success! {count} cases categorized and polished.")