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

export async function upsertDocumentEmbeddings(
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
        `UPDATE "DocumentChunk"
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
  sourceIds?: string[];
  limit?: number;
}) {
  const client = await getPool().connect();

  try {
    const params: unknown[] = [toVectorLiteral(args.embedding), args.limit ?? 8];
    let videoFilterSql = "";
    let documentFilterSql = "";

    if (args.sourceIds?.length) {
      params.push(args.sourceIds);
      videoFilterSql = `AND tc."videoId" = ANY($3::text[])`;
      documentFilterSql = `AND dc."documentId" = ANY($3::text[])`;
    }

    const result = await client.query<SearchChunkResult>(
      `SELECT *
      FROM (
        SELECT
          tc.id AS "chunkId",
          v.id AS "sourceId",
          'VIDEO' AS "sourceType",
          v.title,
          tc."startSec",
          tc."endSec",
          CONCAT('Timestamp ', tc."startSec", 's-', tc."endSec", 's') AS "locator",
          tc.content,
          1 - (tc.embedding <=> $1::vector) AS score
        FROM "TranscriptChunk" tc
        INNER JOIN "Video" v ON v.id = tc."videoId"
        WHERE tc.embedding IS NOT NULL
          ${videoFilterSql}

        UNION ALL

        SELECT
          dc.id AS "chunkId",
          d.id AS "sourceId",
          'FILE' AS "sourceType",
          d.title,
          NULL::integer AS "startSec",
          NULL::integer AS "endSec",
          CONCAT('Chunk ', dc."chunkIndex" + 1) AS "locator",
          dc.content,
          1 - (dc.embedding <=> $1::vector) AS score
        FROM "DocumentChunk" dc
        INNER JOIN "Document" d ON d.id = dc."documentId"
        WHERE dc.embedding IS NOT NULL
          ${documentFilterSql}
      ) matches
      ORDER BY score DESC
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

export async function deleteDocumentVectors(documentId: string) {
  const client = await getPool().connect();
  try {
    await client.query(`DELETE FROM "DocumentChunk" WHERE "documentId" = $1`, [documentId]);
  } finally {
    client.release();
  }
}
