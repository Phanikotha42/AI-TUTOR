"""
Arxiv Service - Fetch recent AI research papers
"""
import arxiv
from typing import Optional, List


def search_arxiv(query: str, max_results: int = 3) -> Optional[str]:
    """Search Arxiv for relevant AI papers."""
    try:
        client = arxiv.Client()
        search = arxiv.Search(
            query=query,
            max_results=max_results,
            sort_by=arxiv.SortCriterion.Relevance,
            sort_order=arxiv.SortOrder.Descending,
        )
        results = list(client.results(search))
        if not results:
            return None

        parts = []
        for paper in results[:2]:
            abstract_preview = paper.summary[:300] + "..." if len(paper.summary) > 300 else paper.summary
            parts.append(
                f"[Arxiv Paper: {paper.title}]\n"
                f"Authors: {', '.join(str(a) for a in paper.authors[:3])}\n"
                f"Abstract: {abstract_preview}"
            )

        return "\n\n".join(parts)
    except Exception as e:
        print(f"Arxiv error: {e}")
        return None
