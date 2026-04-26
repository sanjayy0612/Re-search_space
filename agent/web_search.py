import os
from typing import List
import httpx


async def perform_web_search(query: str) -> List[str]:
    """
    Performs a web search using Google Custom Search API
    and returns a list of formatted results (title + snippet + link).
    """

    search_url = "https://www.googleapis.com/customsearch/v1"
    api_key = os.getenv("GOOGLE_API_KEY")
    search_engine_id = os.getenv("SEARCH_ENGINE_ID")

    # 🔒 Validate API keys
    if not api_key or not search_engine_id:
        return ["Web search error: Missing API credentials"]

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                search_url,
                params={
                    "key": api_key,
                    "cx": search_engine_id,
                    "q": query,
                },
            )

            response.raise_for_status()
            results = response.json()

            items = results.get("items", [])

            if not items:
                return ["No web results found."]

            # 📌 Extract top 5 results with richer info
            formatted_results = []
            for item in items[:5]:
                title = item.get("title", "No title")
                snippet = item.get("snippet", "No description")
                link = item.get("link", "")

                formatted_results.append(
                    f"Title: {title}\nSnippet: {snippet}\nLink: {link}"
                )

            return formatted_results

    except httpx.TimeoutException:
        return ["Web search timeout. Try again."]

    except httpx.HTTPStatusError as e:
        return [f"Web search HTTP error: {e.response.status_code}"]

    except Exception as e:
        return [f"Web search failed: {str(e)}"]