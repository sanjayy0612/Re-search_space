# Mixed-Source Research Dashboard

`Mixed-Source Research` is a `Next.js` research workspace that lets you combine YouTube links and uploaded text files into one searchable knowledge base. It chunks content, generates embeddings, stores them in `Postgres + pgvector`, and answers questions with source-aware citations.

## Why this exists

Most research workflows are scattered across videos, notes, reports, CSVs, transcripts, and personal documents. This project brings them into one place so you can:

- mix files and URLs in one shared context
- find patterns across different source types
- surface stronger correlations and insights
- ask grounded questions instead of manually searching everything yourself

## Core use cases

### 1. Research and pattern discovery

Upload notes, reports, exported data, and YouTube links together to:

- compare ideas across multiple sources
- find recurring themes, contradictions, or hidden overlap
- identify trends that are easy to miss when sources are separated
- build a richer context window for better answers

### 2. Financial research

Use it for:

- earnings call notes plus market commentary videos
- investment memos plus macro research documents
- personal watchlists plus thesis tracking notes
- comparing claims across multiple analysts, creators, or reports

### 3. Education and learning

Use it as a study workspace for:

- lecture videos plus your class notes
- reading material plus summaries
- revision packs plus concept explanations from YouTube
- quick comparison of topics, definitions, and examples across sources

### 4. Personal knowledge management

Use it for:

- journaling and reflection notes
- personal docs, plans, and idea dumps
- saved learning resources and article exports
- building your own searchable second-brain style workspace

## Extra ways it can help

- content research for creators
- startup and product research
- competitive analysis
- internal team knowledge lookup
- synthesizing long-form information quickly
- turning scattered source material into cited answers

## Current features

- import YouTube URLs with public transcripts
- upload text-based files: `.txt`, `.md`, `.mdx`, `.csv`, `.json`
- chunk and embed all sources into one shared vector-backed retrieval layer
- ask questions across mixed sources instead of a single content type
- get citations back with timestamps for videos and chunk references for files
- discover cross-source themes and connections
- use source selection to narrow chat scope when needed

## How it works

1. You add YouTube links or upload files.
2. The app extracts text, chunks it, and stores the chunks.
3. Embeddings are generated for each chunk and stored in `pgvector`.
4. When you ask a question, the question is embedded.
5. The app retrieves the closest chunks across both videos and files.
6. The LLM answers using only the retrieved evidence.

## Tech stack

- `Next.js`
- `TypeScript`
- `Prisma`
- `Postgres + pgvector`
- `OpenAI`

## Setup

```bash
npm install
cp .env.example .env.local
npm run db:generate
npm run db:push
psql "$DATABASE_URL" -f prisma/init.sql
npm run dev
```

## Notes

- YouTube transcripts and uploaded files are embedded into the same retrieval system.
- If you update the Prisma schema, rerun `npm run db:generate` and `npm run db:push`.
- If the database already existed before the mixed-source upgrade, rerun `psql "$DATABASE_URL" -f prisma/init.sql` so both vector indexes exist.
- Right now file support is focused on text-based uploads. PDF and DOCX ingestion can be added next.
