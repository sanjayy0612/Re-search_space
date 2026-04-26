import httpx

async def lookup_in_knowledge_base(term: str) -> str:
    """
    Searches Wikipedia (or other knowledge base) to ground the term.
    """
    wikipedia_api_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{term}"

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(wikipedia_api_url)
            response.raise_for_status()
            result = response.json()
            return result.get("extract", "No information available.")

    except Exception as e:
        print(f"Error during knowledge base lookup: {e}")
        return "An error occurred while fetching knowledge base information."