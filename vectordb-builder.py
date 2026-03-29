import os
import json
import chromadb
from chromadb.utils import embedding_functions

# --- 1. CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_DIR = os.path.join(BASE_DIR, "pending_cases_json")
DB_PATH = os.path.join(BASE_DIR, "chroma_db_storage")

print("Initializing local Vector Database...")
chroma_client = chromadb.PersistentClient(path=DB_PATH)

# Leveraging your GPU for high-speed local embeddings
gpu_embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2",
    device="cuda"
)

# Create a fresh collection
collection = chroma_client.get_or_create_collection(
    name="legal_precedents",
    embedding_function=gpu_embedding_function
)

# --- 2. EMBEDDING LOGIC ---
def process_folder(folder_path):
    if not os.path.exists(folder_path):
        print(f"Warning: Could not find {folder_path}")
        return
        
    files = [f for f in os.listdir(folder_path) if f.endswith('.json')]
    print(f"\nFound {len(files)} cases in {os.path.basename(folder_path)}. Embedding now...")
    
    # We batch the uploads (250 at a time) to prevent memory spikes
    batch_size = 250
    for i in range(0, len(files), batch_size):
        batch_files = files[i:i+batch_size]
        ids = []
        documents = []
        metadatas = []
        
        for filename in batch_files:
            filepath = os.path.join(folder_path, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                case_data = json.load(f)
                
                ids.append(case_data['case_id'])
                # The 'summary' is the actual text the AI will search against
                documents.append(case_data['summary']) 
                # Metadata helps the Judge know the outcome/context
                metadatas.append({
                    "case_title": case_data['title'],
                    "case_type": case_data['case_type'],
                    "region": case_data['flags'].get('region', 'Unknown')
                })
        
        if ids:
            collection.add(
                ids=ids,
                documents=documents,
                metadatas=metadatas
            )
        print(f" -> Processed {min(i+batch_size, len(files))} / {len(files)}")

# --- 3. EXECUTION ---
if __name__ == "__main__":
    print("Starting Vector Build Process...")
    
    process_folder(os.path.join(JSON_DIR, "Indian"))
    process_folder(os.path.join(JSON_DIR, "US"))
    
    print("\n✅ Database rebuilt successfully! The AI Judge now has historical context.")