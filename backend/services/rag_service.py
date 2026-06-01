"""
RAG Service - PDF ingestion and retrieval
"""
import os
import uuid
from typing import List, Dict
from pypdf import PdfReader
from services.vector_service import add_documents, semantic_search


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """Split text into overlapping chunks."""
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
        i += chunk_size - overlap
    return [c for c in chunks if len(c.strip()) > 50]


def ingest_pdf(file_path: str, filename: str) -> int:
    """Extract text from PDF and add to vector DB."""
    try:
        reader = PdfReader(file_path)
        full_text = ""
        for page in reader.pages:
            text = page.extract_text()
            if text:
                full_text += text + "\n"

        if not full_text.strip():
            return 0

        chunks = chunk_text(full_text)
        texts = []
        metadatas = []
        ids = []

        for i, chunk in enumerate(chunks):
            texts.append(chunk)
            metadatas.append({"source": filename, "chunk_index": i, "type": "pdf"})
            ids.append(f"{filename}_{i}_{uuid.uuid4().hex[:8]}")

        add_documents(texts, metadatas, ids)
        return len(chunks)

    except Exception as e:
        print(f"Error ingesting PDF {filename}: {e}")
        return 0


def retrieve_from_pdf(query: str, n_results: int = 3) -> str:
    """Retrieve relevant chunks from uploaded PDFs."""
    results = semantic_search(query, n_results=n_results)
    if not results:
        return ""

    context_parts = []
    for r in results:
        source = r["metadata"].get("source", "Unknown")
        context_parts.append(f"[From {source}]: {r['text']}")

    return "\n\n".join(context_parts)
