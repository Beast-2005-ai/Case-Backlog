import os
import sys
import json
import joblib
import chromadb
import hashlib
from chromadb.utils import embedding_functions
import shap
from feature_engineering import extract_features
from rule_engine import rule_score

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "chroma_db_storage")
QUEUE_PATH = os.path.join(BASE_DIR, "master_queue.txt")
MODEL_PATH = os.path.join(BASE_DIR, "priority_model.pkl")
CONFIG_PATH = os.path.join(BASE_DIR, "system_config.json")

chroma_client = chromadb.PersistentClient(path=DB_PATH)
gpu_embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2", device="cuda")
collection = chroma_client.get_collection(name="legal_precedents", embedding_function=gpu_embedding_function)

# CORE DEFAULTS - Always applied
BASE_URGENCY_KEYWORDS = {
    "murder": 15, "homicide": 15, "manslaughter": 15, "killed": 15, "fatal": 15,
    "assault": 10, "violence": 10, "beaten": 10, "attack": 10, "battery": 10,
    "custody": 12, "bail": 10, "remand": 12, "prison": 12, "detained": 12, "flight risk": 12,
    "immediate": 8, "emergency": 15, "habeas corpus": 15, "injunction": 8,
    "rape": 15, "raping": 15, "sexual assault": 15, "child abuse": 15, "pocso": 15, "domestic violence": 12,
    "fraud": 5, "bankruptcy": 6, "embezzlement": 5, "scam": 5,
    "supreme court": 5
}

FEATURE_NAMES = ["Criminal Base", "Family Base", "Keyword Density", "Precedent Match", "Text Complexity"]

ml_model = None
explainer = None
if os.path.exists(MODEL_PATH):
    ml_model = joblib.load(MODEL_PATH)
    explainer = shap.TreeExplainer(ml_model)

def get_dynamic_keywords():
    """Merges the base dictionary with ALL active custom configurations"""
    combined_keywords = BASE_URGENCY_KEYWORDS.copy()
    try:
        if os.path.exists(CONFIG_PATH):
            with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
                data = json.load(f)
                active_ids = data.get("active_ids", [])
                
                for c in data.get("configs", []):
                    if c["id"] in active_ids:
                        combined_keywords.update(c["keywords"])
    except:
        pass
    return combined_keywords

def triage_silent(case_json_path):
    try:
        with open(case_json_path, 'r', encoding='utf-8') as f:
            new_case = json.load(f)
    except: return
    
    active_keywords = get_dynamic_keywords()
    
    search_text = new_case.get('summary', '')[:500]
    results = collection.query(query_texts=[search_text], n_results=1)
    distances = results.get('distances', [])
    
    # --- NEW: EXTRACT THE ACTUAL PRECEDENT FROM CHROMADB ---
    precedent_id = "No exact match found"
    precedent_text = "Vector database returned no close precedents."
    
    if results and 'ids' in results and len(results['ids']) > 0 and len(results['ids'][0]) > 0:
        precedent_id = results['ids'][0][0]
        # Try to get the document text to show the clerk
        docs = results.get('documents')
        if docs and len(docs) > 0 and len(docs[0]) > 0 and docs[0][0]:
            precedent_text = docs[0][0][:150] + '...'
        else:
            precedent_text = "Historical precedent matched in vector space."
            
    r_score = float(rule_score(new_case, distances, active_keywords))
    justification_str = f"SCORE LOGIC: Rule Score {r_score}"
    final_score = r_score

    if ml_model and explainer:
        features = extract_features(new_case, distances, active_keywords)
        ml_score = float(ml_model.predict([features])[0])
        shap_values = explainer.shap_values([features])[0]
        
        xai_breakdown = []
        for i in range(len(FEATURE_NAMES)):
            if abs(shap_values[i]) > 0.1: 
                xai_breakdown.append({
                    "feature": FEATURE_NAMES[i],
                    "impact": round(float(shap_values[i]), 2),
                    "direction": "positive" if shap_values[i] > 0 else "negative" 
                })
        
        xai_breakdown = sorted(xai_breakdown, key=lambda x: abs(x["impact"]), reverse=True)
        raw_final = (0.4 * r_score) + (0.6 * ml_score)
        
        case_id = new_case.get("case_id", "unknown")
        unique_hash = int(hashlib.md5(case_id.encode()).hexdigest(), 16)
        text_len = len(new_case.get("summary", ""))
        decimal_modifier = ((unique_hash % 89) + (text_len % 10)) / 100.0
        final_score = raw_final + decimal_modifier
        
        justification_data = {
            "rule_score": round(r_score, 2),
            "ml_score": round(ml_score, 2),
            "precedent_id": precedent_id,         # NEW
            "precedent_text": precedent_text,     # NEW
            "xai": xai_breakdown
        }
        justification_str = f"XAI_DATA: {json.dumps(justification_data)}"

    verdict_dict = {
        "priority_score": float(round(min(final_score, 99.99), 2)),
        "category": new_case.get("case_type", "Uncategorized"),
        "justification": justification_str,
        "summary": new_case.get('summary', '')[:300] + '...'
    }

    with open(QUEUE_PATH, "a", encoding="utf-8") as qf:
        qf.write(f"Case: {os.path.basename(case_json_path)} | Verdict: {json.dumps(verdict_dict)}\n")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        triage_silent(sys.argv[1])