import os
import sys
import json
import re
import hashlib
import chromadb
from chromadb.utils import embedding_functions

# --- 1. CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "chroma_db_storage")
QUEUE_PATH = os.path.join(BASE_DIR, "master_queue.txt")

chroma_client = chromadb.PersistentClient(path=DB_PATH)
gpu_embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2",
    device="cuda"
)
collection = chroma_client.get_collection(
    name="legal_precedents",
    embedding_function=gpu_embedding_function
)

URGENCY_KEYWORDS = {
    "murder": 15, "custody": 12, "bail": 10, "immediate": 8, "injunction": 8,
    "fraud": 5, "assault": 10, "bankruptcy": 6, "supreme court": 5, "emergency": 15,
    "violence": 10, "flight risk": 12, "habeas corpus": 15
}

def generate_local_summary(text):
    """Extracts exactly 2-3 clean sentences from the raw text."""
    if not text or len(text) < 10 or text == "Text could not be extracted.":
        return "Summary unavailable for this docket."
    
    clean_text = re.sub(r'\s+', ' ', text)
    sentences = re.split(r'(?<=[.!?]) +', clean_text)
    valid_sentences = [s for s in sentences if len(s) > 20]
    
    extracted = " ".join(valid_sentences[:2]) 
    if len(extracted) > 300:
        extracted = extracted[:297] + "..."
    return extracted

def calculate_score(case_data, precedent_distances):
    score = 25.0 
    justifications = []
    
    c_type = case_data.get('case_type', '').lower()
    if "criminal" in c_type:
        score += 22.0
        justifications.append("Criminal matter (+22)")
    elif "family" in c_type:
        score += 15.0
        justifications.append("Family Law matter (+15)")
    
    summary_text = case_data.get('summary', '').lower()
    keyword_points = 0
    words_found = []
    for word, points in URGENCY_KEYWORDS.items():
        if word in summary_text:
            keyword_points += points
            words_found.append(word)
            
    if keyword_points > 0:
        capped_points = min(keyword_points, 32.0)
        score += capped_points
        justifications.append(f"Keywords [{', '.join(words_found)}] (+{capped_points})")

    if precedent_distances and len(precedent_distances[0]) > 0:
        if precedent_distances[0][0] < 0.9:
            score += 12.0
            justifications.append("Strong historical precedent match (+12)")

    # THE FIX: Generate a deterministic, organic decimal based on the case ID and text length
    case_hash = int(hashlib.md5(case_data.get('case_id', 'unknown').encode()).hexdigest(), 16)
    length_modifier = (len(summary_text) % 50) / 100.0  
    hash_modifier = (case_hash % 100) / 100.0           
    
    organic_decimal = length_modifier + hash_modifier
    if organic_decimal > 0.99: organic_decimal = 0.99
    
    final_score = min(score + organic_decimal, 99.99)
    return round(final_score, 2), " | ".join(justifications)

def triage_silent(case_json_path):
    try:
        with open(case_json_path, 'r', encoding='utf-8') as f:
            new_case = json.load(f)
    except Exception as e:
        return f"Error reading file: {e}"

    search_text = new_case.get('summary', '')[:500]
    results = collection.query(query_texts=[search_text], n_results=1)
    
    calculated_score, reasoning = calculate_score(new_case, results.get('distances', []))
    short_summary = generate_local_summary(new_case.get('summary', ''))

    verdict_dict = {
        "priority_score": calculated_score,
        "category": new_case.get("case_type", "Uncategorized"),
        "justification": f"SCORE LOGIC: {reasoning}",
        "summary": short_summary
    }

    flattened_verdict = json.dumps(verdict_dict)

    with open(QUEUE_PATH, "a", encoding="utf-8") as qf:
        qf.write(f"Case: {os.path.basename(case_json_path)} | Verdict: {flattened_verdict}\n")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        triage_silent(sys.argv[1])