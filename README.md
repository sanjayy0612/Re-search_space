# YT RAG Dashboard

A weekend-scale `Next.js` app for importing one or more YouTube links, fetching transcripts, chunking and embedding them into `Postgres + pgvector`, and chatting across videos with timestamped citations.

## Features

- Multi-video import with YouTube URL normalization and deduplication
- Transcript-first ingestion using YouTube captions
- `pgvector` retrieval with per-video or cross-video filtering
- Research dashboard UI with summaries, connections, and cited answers
- Thin vector-store layer so Milvus can be added later

## Stack

- `Next.js` App Router
- `Prisma` with `Postgres + pgvector`
- `OpenAI` for embeddings, summaries, and grounded answer generation
- `youtube-transcript` for caption fetching

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start Postgres and enable pgvector:

```sql
CREATE DATABASE yt_rag;
\c yt_rag
CREATE EXTENSION IF NOT EXISTS vector;
```

3. Copy env vars:

```bash
cp .env.example .env.local
```

4. Generate the Prisma client and push the schema:

```bash
npm run db:generate
npm run db:push
```

5. Start the app:

```bash
npm run dev
```

## Notes

- Transcript ingestion currently runs inline inside the import route to keep the weekend build simple.
- If a video has no public captions, the import is marked `FAILED` and the UI shows the reason.
- The connections panel is a lightweight bridge toward GraphRAG rather than a full graph retrieval system.
