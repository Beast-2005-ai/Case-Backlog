import chromadb
from chromadb.utils import embedding_functions

print("Connecting to ChromaDB...")
chroma_client = chromadb.PersistentClient(path="./chroma_db_storage")

# Load the exact same GPU embedding model we used to build the database
gpu_embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2",
    device="cuda"
)

collection = chroma_client.get_collection(
    name="legal_precedents",
    embedding_function=gpu_embedding_function
)

# This is our test query. We are pretending a new case just came in with this description.
test_query = "A dispute involving a breach of contract between two software companies over intellectual property rights."

print(f"\nSearching database for: '{test_query}'...\n")

# Query the database for the top 3 most semantically similar cases
results = collection.query(
    query_texts=[test_query],
    n_results=3
)

# Display the results
for i in range(len(results['ids'][0])):
    print(f"Match #{i+1}")
    print(f"Case ID: {results['ids'][0][i]}")
    print(f"Title: {results['metadatas'][0][i]['case_title']}")
    print(f"Outcome: {results['metadatas'][0][i]['case_outcome']}")
    # Slicing the summary so it doesn't flood your terminal
    print(f"Summary Snippet: {results['documents'][0][i][:200]}...\n")
    print("-" * 50 + "\n")