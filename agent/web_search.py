import httpx
from typing import List

async def perform_web_search(query: str) -> List[str]:
    """
    Performs a web search and returns a list of top results.
    """
    search_url = f"https://www.googleapis.com/customsearch/v1"
    api_key = "YOUR_GOOGLE_API_KEY"  # Replace with your API Key
    search_engine_id = "YOUR_SEARCH_ENGINE_ID"  # Replace with your Search Engine ID

    try:
        async with httpx.AsyncClient() as client:
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

            # Extract the top search results
            top_results = [
                item['snippet'] for item in results.get('items', [])[:5]  # Extract the first 5 snippets
            ]
            return top_results

    except Exception as e:
        print(f"Error during web search: {e}")
        return []