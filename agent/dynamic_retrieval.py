from typing import List
from .vector_store import searchChunks

async def dynamic_retrieval(existing_chunks: List[str], query: str, source_ids: List[str]) -> List[dict]:
    """
    Fetch additional chunks dynamically when required during reasoning.
    """
    embedding = await embedTexts([query])  # Assuming embedTexts is available globally
    
    if not embedding:
        print("Failed to generate embedding for the query.")
        return []

    new_chunks = await searchChunks({
        "embedding": embedding[0],
        "sourceIds": source_ids,
        "limit": 10
    })

    # Combine the new chunks with existing ones
    combined_chunks = existing_chunks + [chunk['content'] for chunk in new_chunks]

    return combined_chunks