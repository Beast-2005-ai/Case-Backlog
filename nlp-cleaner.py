import os
import json
import re

# --- 1. CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_DIR = os.path.join(BASE_DIR, "pending_cases_json")

# --- 2. LOCAL NLP EXTRACTOR ---
def nlp_extractive_summary(text, num_sentences=3):
    """Parses text and extracts 2-3 readable sentences without an API."""
    if not text or len(text) < 10:
        return "No facts provided in original docket."
    
    # Split the text into actual sentences (looking for punctuation followed by space)
    sentences = re.split(r'(?<=[.!?]) +', text.replace('\n', ' '))
    
    # Filter out super short garbage chunks (like "1.", "IPC.", etc.)
    valid_sentences = [s.strip() for s in sentences if len(s.strip()) > 15]
    
    # Grab the top sentences and combine them
    extracted = " ".join(valid_sentences[:num_sentences])
    return extracted if extracted else "Summary unavailable."

# --- 3. EXECUTION ---
print("Initiating NLP Summary Extraction & Title Cleanup...")
count = 0

for root, dirs, files in os.walk(JSON_DIR):
    for filename in files:
        if filename.endswith(".json"):
            filepath = os.path.join(root, filename)
            
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    case = json.load(f)
                
                # 1. Apply true NLP summary to ALL cases (US and Indian)
                raw_text = case.get('summary', '')
                case['summary'] = nlp_extractive_summary(raw_text)
                
                # 2. Fix Indian Titles (Strictly professional, no synthetic data)
                if "Indian" in root:
                    case_id = case.get('case_id', filename.replace('.json', ''))
                    case['title'] = f"High Court Bail Docket {case_id}"
                
                # Save the cleaned data back to the file
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(case, f, indent=4)
                    
                count += 1
            except Exception as e:
                print(f"Error processing {filename}: {e}")

print(f"\n✅ Success! {count} cases cleaned.")
print("All files now feature native NLP summaries and professional docket titles.")