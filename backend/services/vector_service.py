"""
Vector Database Service - ChromaDB for semantic search
"""
import os
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any

CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./rag/vector_db")
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

# Lazy-loaded globals
_client = None
_collection = None
_embedder = None


def get_embedder() -> SentenceTransformer:
    global _embedder
    if _embedder is None:
        _embedder = SentenceTransformer(EMBEDDING_MODEL)
    return _embedder


def get_chroma_client():
    global _client
    if _client is None:
        os.makedirs(CHROMA_PERSIST_DIR, exist_ok=True)
        _client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
    return _client


def get_collection():
    global _collection
    if _collection is None:
        client = get_chroma_client()
        _collection = client.get_or_create_collection(
            name="ai_tutor_docs",
            metadata={"hnsw:space": "cosine"}
        )
    return _collection


def add_documents(texts: List[str], metadatas: List[Dict], ids: List[str]):
    """Add document chunks to ChromaDB."""
    embedder = get_embedder()
    collection = get_collection()
    embeddings = embedder.encode(texts).tolist()
    collection.add(
        documents=texts,
        embeddings=embeddings,
        metadatas=metadatas,
        ids=ids
    )


def semantic_search(query: str, n_results: int = 5) -> List[Dict[str, Any]]:
    """Search the vector DB for relevant chunks."""
    embedder = get_embedder()
    collection = get_collection()

    count = collection.count()
    if count == 0:
        return []

    n_results = min(n_results, count)
    query_embedding = embedder.encode([query]).tolist()

    results = collection.query(
        query_embeddings=query_embedding,
        n_results=n_results,
        include=["documents", "metadatas", "distances"]
    )

    chunks = []
    for i, doc in enumerate(results["documents"][0]):
        chunks.append({
            "text": doc,
            "metadata": results["metadatas"][0][i],
            "distance": results["distances"][0][i],
        })
    return chunks


def get_document_count() -> int:
    """Return total number of chunks in vector DB."""
    try:
        return get_collection().count()
    except Exception:
        return 0


def delete_document_chunks(source_file: str):
    """Delete all chunks for a specific source file."""
    collection = get_collection()
    results = collection.get(where={"source": source_file})
    if results["ids"]:
        collection.delete(ids=results["ids"])
