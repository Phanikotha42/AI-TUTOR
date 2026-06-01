"""
Hybrid Retrieval Service - Combines PDF, Vector DB, Wikipedia, Arxiv, Web
"""
import asyncio
from typing import Dict, Optional
from services.rag_service import retrieve_from_pdf
from services.web_retrieval import web_search_and_retrieve
from services.wikipedia_service import search_wikipedia
from services.arxiv_service import search_arxiv


async def hybrid_retrieve(query: str, use_web: bool = True) -> Dict[str, str]:
    """
    Retrieve context from all sources asynchronously.
    Returns dict with sources and combined context string.
    """
    sources_used = []
    context_parts = []

    # 1. Local vector DB / PDF search (always fast)
    pdf_context = retrieve_from_pdf(query, n_results=3)
    if pdf_context:
        context_parts.append(f"=== From Uploaded Documents ===\n{pdf_context}")
        sources_used.append("PDF Documents")

    if use_web:
        # 2. Run web sources concurrently
        wiki_task = asyncio.get_event_loop().run_in_executor(None, search_wikipedia, query)
        arxiv_task = asyncio.get_event_loop().run_in_executor(None, search_arxiv, query)
        web_task = asyncio.get_event_loop().run_in_executor(None, web_search_and_retrieve, query)

        wiki_result, arxiv_result, web_result = await asyncio.gather(
            wiki_task, arxiv_task, web_task,
            return_exceptions=True
        )

        if wiki_result and not isinstance(wiki_result, Exception):
            context_parts.append(f"=== Wikipedia ===\n{wiki_result}")
            sources_used.append("Wikipedia")

        if arxiv_result and not isinstance(arxiv_result, Exception):
            context_parts.append(f"=== Research Papers (Arxiv) ===\n{arxiv_result}")
            sources_used.append("Arxiv")

        if web_result and not isinstance(web_result, Exception):
            context_parts.append(f"=== Web Sources ===\n{web_result}")
            sources_used.append("Web Search")

    combined_context = "\n\n".join(context_parts) if context_parts else ""

    # Limit total context to avoid overwhelming the LLM
    if len(combined_context) > 4000:
        combined_context = combined_context[:4000] + "\n...[truncated]"

    return {
        "context": combined_context,
        "sources": sources_used,
        "has_context": bool(combined_context)
    }
