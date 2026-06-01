"""
Chat Route - Handles AI chat with hybrid RAG
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from database.db import get_db, ChatHistory
from services.ollama_service import generate_response, stream_response, get_available_models
from services.hybrid_retrieval import hybrid_retrieve
import json

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    model: Optional[str] = "llama3"
    use_web: Optional[bool] = True
    stream: Optional[bool] = False


class ChatResponse(BaseModel):
    response: str
    sources: List[str]
    model: str


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    """Main chat endpoint with hybrid RAG."""
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Retrieve context from all sources
    retrieval = await hybrid_retrieve(request.message, use_web=request.use_web)
    context = retrieval["context"]
    sources = retrieval["sources"]

    # Generate response
    response_text = await generate_response(
        prompt=request.message,
        context=context,
        model=request.model
    )

    # Save to chat history
    history = ChatHistory(
        user_message=request.message,
        ai_response=response_text,
        sources=sources
    )
    db.add(history)
    await db.commit()

    return ChatResponse(
        response=response_text,
        sources=sources,
        model=request.model
    )


@router.get("/stream")
async def chat_stream(message: str, model: str = "llama3", use_web: bool = True):
    """Streaming chat endpoint."""
    if not message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    retrieval = await hybrid_retrieve(message, use_web=use_web)
    context = retrieval["context"]

    async def generate():
        async for token in stream_response(message, context, model):
            yield f"data: {json.dumps({'token': token})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.get("/history")
async def get_chat_history(limit: int = 50, db: AsyncSession = Depends(get_db)):
    """Get recent chat history."""
    result = await db.execute(
        select(ChatHistory).order_by(desc(ChatHistory.created_at)).limit(limit)
    )
    history = result.scalars().all()
    return [
        {
            "id": h.id,
            "user_message": h.user_message,
            "ai_response": h.ai_response,
            "sources": h.sources or [],
            "created_at": h.created_at.isoformat()
        }
        for h in history
    ]


@router.delete("/history")
async def clear_chat_history(db: AsyncSession = Depends(get_db)):
    """Clear all chat history."""
    await db.execute(ChatHistory.__table__.delete())
    await db.commit()
    return {"message": "Chat history cleared"}


@router.get("/models")
async def list_models():
    """List available Ollama models."""
    models = await get_available_models()
    return {"models": models, "default": "llama3"}
