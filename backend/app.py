"""
AI Tutor - FastAPI Backend
Main application entry point
"""
import os
import sys
from contextlib import asynccontextmanager

# Windows consoles often use cp1252; avoid UnicodeEncodeError on startup logs.
if sys.platform == "win32":
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routes.chat import router as chat_router
from routes.upload import router as upload_router
from routes.exam import router as exam_router
from routes.analytics import router as analytics_router
from routes.web_search import router as web_search_router
from database.db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[AI Tutor] Starting backend...")
    await init_db()
    print("[AI Tutor] Database initialized")
    chroma_dir = os.getenv("CHROMA_PERSIST_DIR", "./rag/vector_db")
    os.makedirs(os.getenv("UPLOAD_DIR", "./rag/uploaded_docs"), exist_ok=True)
    os.makedirs(chroma_dir, exist_ok=True)
    os.makedirs("./rag/embeddings", exist_ok=True)
    print("[AI Tutor] Directories ready")
    try:
        from services.vector_service import get_embedder
        print("[AI Tutor] Loading embedding model (first run may download weights)...")
        get_embedder()
        print("[AI Tutor] Embedding model ready")
    except Exception as exc:
        print(f"[AI Tutor] Warning: embedding model not preloaded: {exc}")
    yield
    print("[AI Tutor] Shutting down...")


app = FastAPI(
    title="AI Tutor API",
    description="Intelligent AI Tutor with RAG, Ollama, and Web Retrieval",
    version="1.0.0",
    lifespan=lifespan,
)

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router, prefix="/chat", tags=["Chat"])
app.include_router(upload_router, prefix="/upload", tags=["Upload"])
app.include_router(exam_router, prefix="/exam", tags=["Exam"])
app.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])
app.include_router(web_search_router, prefix="/web-search", tags=["Web Search"])


@app.get("/")
async def root():
    return {"message": "AI Tutor API is running", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    from services.ollama_service import OLLAMA_BASE_URL, get_available_models

    ollama_ok = False
    models: list[str] = []
    try:
        models = await get_available_models()
        ollama_ok = len(models) > 0
    except Exception:
        ollama_ok = False

    return {
        "status": "healthy",
        "service": "AI Tutor Backend",
        "ollama": {
            "url": OLLAMA_BASE_URL,
            "reachable": ollama_ok,
            "models": models,
        },
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
