"""
Wikipedia Service - Fetch AI topic summaries
"""
import wikipedia
from typing import Optional


def search_wikipedia(query: str, sentences: int = 5) -> Optional[str]:
    """Search Wikipedia and return a summary."""
    try:
        wikipedia.set_lang("en")
        search_results = wikipedia.search(query + " artificial intelligence", results=3)
        if not search_results:
            search_results = wikipedia.search(query, results=3)

        for result in search_results:
            try:
                page = wikipedia.page(result, auto_suggest=False)
                summary = wikipedia.summary(result, sentences=sentences, auto_suggest=False)
                return f"[Wikipedia - {page.title}]: {summary}"
            except wikipedia.DisambiguationError as e:
                # Try the first option
                try:
                    summary = wikipedia.summary(e.options[0], sentences=sentences)
                    return f"[Wikipedia]: {summary}"
                except Exception:
                    continue
            except Exception:
                continue
        return None
    except Exception as e:
        print(f"Wikipedia error: {e}")
        return None
