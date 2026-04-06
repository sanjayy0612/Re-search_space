-- Enables pgvector so transcript chunk embeddings can be stored and queried in Postgres.
CREATE EXTENSION IF NOT EXISTS vector;

-- Speeds up nearest-neighbor retrieval over transcript chunk embeddings.
-- The app uses the cosine-distance operator (`<=>`), so the index uses
-- `vector_cosine_ops` to match the query pattern in `lib/vector-store.ts`.
CREATE INDEX IF NOT EXISTS transcript_chunk_embedding_hnsw_idx
ON "TranscriptChunk"
USING hnsw ("embedding" vector_cosine_ops)
WHERE "embedding" IS NOT NULL;
