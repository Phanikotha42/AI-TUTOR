"""
Web Search Route - Direct web search endpoint
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.web_retrieval import duckduckgo_search, web_search_and_retrieve
from services.wikipedia_service import search_wikipedia
from services.arxiv_service import search_arxiv

router = APIRouter()


class SearchRequest(BaseModel):
    query: str
    sources: Optional[list] = ["web", "wikipedia", "arxiv"]


@router.post("/")
async def web_search(request: SearchRequest):
    """Search across multiple web sources."""
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    results = {}

    if "web" in request.sources:
        web_results = duckduckgo_search(request.query)
        results["web"] = [
            {"title": r.get("title", ""), "snippet": r.get("body", "")[:200], "url": r.get("href", "")}
            for r in web_results
        ]

    if "wikipedia" in request.sources:
        wiki = search_wikipedia(request.query, sentences=3)
        results["wikipedia"] = wiki or "No Wikipedia results found."

    if "arxiv" in request.sources:
        arxiv = search_arxiv(request.query, max_results=2)
        results["arxiv"] = arxiv or "No Arxiv papers found."

    return {"query": request.query, "results": results}
