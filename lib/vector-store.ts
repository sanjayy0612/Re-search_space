// Stores and searches transcript embeddings directly in Postgres/pgvector.
import { Pool } from "pg";
import type { SearchChunkResult } from "@/lib/types";
import { getEnv } from "@/lib/env";

declare global {
  // eslint-disable-next-line no-var
  var pgPool: Pool | undefined;
}

function getPool() {
  if (!global.pgPool) {
    global.pgPool = new Pool({
      connectionString: getEnv().databaseUrl
    });
  }

  return global.pgPool;
}

function toVectorLiteral(values: number[]) {
  return `[${values.join(",")}]`;
}

export async function upsertChunkEmbeddings(
  rows: Array<{
    chunkId: string;
    embedding: number[];
  }>
) {
  if (!rows.length) return;

  const client = await getPool().connect();
  try {
    await client.query("BEGIN");

    for (const row of rows) {
      await client.query(
        `UPDATE "TranscriptChunk"
         SET "embedding" = $2::vector
         WHERE id = $1`,
        [row.chunkId, toVectorLiteral(row.embedding)]
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function searchChunks(args: {
  embedding: number[];
  videoIds?: string[];
  limit?: number;
}) {
  const client = await getPool().connect();

  try {
    const params: unknown[] = [toVectorLiteral(args.embedding), args.limit ?? 8];
    let filterSql = "";

    if (args.videoIds?.length) {
      params.push(args.videoIds);
      filterSql = `AND tc."videoId" = ANY($3::text[])`;
    }

    const result = await client.query<SearchChunkResult>(
      `SELECT
        tc.id AS "chunkId",
        v.id AS "videoId",
        v.title,
        tc."startSec",
        tc."endSec",
        tc.content,
        1 - (tc.embedding <=> $1::vector) AS score
      FROM "TranscriptChunk" tc
      INNER JOIN "Video" v ON v.id = tc."videoId"
      WHERE tc.embedding IS NOT NULL
        ${filterSql}
      ORDER BY tc.embedding <=> $1::vector
      LIMIT $2`,
      params
    );

    return result.rows;
  } finally {
    client.release();
  }
}

export async function deleteVideoVectors(videoId: string) {
  const client = await getPool().connect();
  try {
    await client.query(`DELETE FROM "TranscriptChunk" WHERE "videoId" = $1`, [videoId]);
  } finally {
    client.release();
  }
}
