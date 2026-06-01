"""
Web Retrieval Service - DuckDuckGo search + BeautifulSoup scraping
"""
import httpx
from bs4 import BeautifulSoup
from typing import Optional, List
from duckduckgo_search import DDGS


def duckduckgo_search(query: str, max_results: int = 3) -> List[dict]:
    """Search DuckDuckGo and return results."""
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(
                f"{query} artificial intelligence tutorial",
                max_results=max_results
            ))
        return results
    except Exception as e:
        print(f"DuckDuckGo error: {e}")
        return []


def scrape_url(url: str, max_chars: int = 1000) -> Optional[str]:
    """Scrape text content from a URL."""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (compatible; AITutor/1.0)"
        }
        with httpx.Client(timeout=10.0, follow_redirects=True) as client:
            response = client.get(url, headers=headers)
            response.raise_for_status()

        soup = BeautifulSoup(response.text, "lxml")
        # Remove scripts, styles, nav
        for tag in soup(["script", "style", "nav", "header", "footer", "aside"]):
            tag.decompose()

        text = soup.get_text(separator=" ", strip=True)
        # Clean up whitespace
        text = " ".join(text.split())
        return text[:max_chars] if len(text) > max_chars else text
    except Exception as e:
        print(f"Scrape error for {url}: {e}")
        return None


def web_search_and_retrieve(query: str) -> Optional[str]:
    """Full web retrieval: search + scrape top results."""
    results = duckduckgo_search(query, max_results=3)
    if not results:
        return None

    context_parts = []

    # Use DuckDuckGo snippets (faster, no scraping needed)
    for r in results[:3]:
        title = r.get("title", "")
        body = r.get("body", "")
        if body:
            context_parts.append(f"[Web - {title}]: {body[:400]}")

    if context_parts:
        return "\n\n".join(context_parts)

    return None
