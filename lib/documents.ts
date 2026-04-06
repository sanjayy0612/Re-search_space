// Ingests uploaded text-based files into document chunks, embeddings, and a
// summary so they can participate in the same retrieval flow as YouTube videos.
import { prisma } from "@/lib/db";
import { chunkTextContent } from "@/lib/chunking";
import { embedTexts } from "@/lib/embeddings";
import { summarizeVideo } from "@/lib/summarize";
import { upsertDocumentEmbeddings } from "@/lib/vector-store";

const SUPPORTED_TEXT_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "application/ld+json"
]);

function isSupportedFile(file: File) {
  return SUPPORTED_TEXT_TYPES.has(file.type) || /\.(txt|md|mdx|csv|json)$/i.test(file.name);
}

async function readFileText(file: File) {
  if (!isSupportedFile(file)) {
    throw new Error(
      "Only text-based files are supported right now (.txt, .md, .mdx, .csv, .json)."
    );
  }

  return (await file.text()).trim();
}

export async function importFiles(files: File[], workspaceId: string) {
  if (!files.length) {
    throw new Error("At least one file is required.");
  }

  const results = [];

  for (const file of files) {
    const document = await prisma.document.create({
      data: {
        workspaceId,
        title: file.name,
        fileName: file.name,
        mimeType: file.type || null,
        ingestionStatus: "QUEUED"
      }
    });

    try {
      await prisma.document.update({
        where: { id: document.id },
        data: {
          ingestionStatus: "FETCHING_TRANSCRIPT"
        }
      });

      const content = await readFileText(file);

      if (!content) {
        throw new Error("The uploaded file was empty.");
      }

      await prisma.document.update({
        where: { id: document.id },
        data: {
          ingestionStatus: "CHUNKING"
        }
      });

      const chunks = chunkTextContent(content);

      if (!chunks.length) {
        throw new Error("The uploaded file did not contain usable text.");
      }

      const storedChunks = await prisma.$transaction(
        chunks.map((chunk) =>
          prisma.documentChunk.create({
            data: {
              documentId: document.id,
              chunkIndex: chunk.chunkIndex,
              content: chunk.content,
              tokenCount: chunk.tokenCount
            }
          })
        )
      );

      await prisma.document.update({
        where: { id: document.id },
        data: {
          ingestionStatus: "EMBEDDING"
        }
      });

      const embeddings = await embedTexts(
        storedChunks.map((chunk: { content: string }) => chunk.content)
      );

      await upsertDocumentEmbeddings(
        storedChunks.map((chunk: { id: string }, index: number) => ({
          chunkId: chunk.id,
          embedding: embeddings[index]
        }))
      );

      const summary = await summarizeVideo(file.name, content);

      const readyDocument = await prisma.document.update({
        where: { id: document.id },
        data: {
          summary,
          ingestionStatus: "READY"
        }
      });

      results.push(readyDocument);
    } catch (error) {
      const failureMessage =
        error instanceof Error ? error.message : "Unexpected document ingestion failure.";

      const failedDocument = await prisma.document.update({
        where: { id: document.id },
        data: {
          ingestionStatus: "FAILED",
          failureReason: failureMessage
        }
      });

      results.push(failedDocument);
    }
  }

  return results;
}
