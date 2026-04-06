# YT RAG Dashboard

A small `Next.js` research workspace that ingests YouTube transcripts and uploaded text files into `Postgres + pgvector`, then answers questions with cited evidence.

## Supported sources

- YouTube URLs with public transcripts
- Text-based files: `.txt`, `.md`, `.mdx`, `.csv`, `.json`

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

- Uploaded files and YouTube transcripts are chunked, embedded, and searched together.
- After changing the Prisma schema, rerun `npm run db:generate` and `npm run db:push`.
- If you already had the app running before this mixed-source update, apply `prisma/init.sql` again so both vector indexes exist.
