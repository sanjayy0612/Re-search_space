// Orchestrates YouTube ingestion by fetching metadata/transcripts, chunking text,
// creating embeddings, generating a summary, and storing everything in the database.
import { prisma } from "@/lib/db";
import { chunkTranscript } from "@/lib/chunking";
import { embedTexts } from "@/lib/embeddings";
import { summarizeVideo } from "@/lib/summarize";
import { fetchTranscript, fetchYoutubeMetadata, normalizeYoutubeUrls } from "@/lib/youtube";
import { upsertChunkEmbeddings } from "@/lib/vector-store";

export async function importYoutubeLinks(rawInput: string, workspaceId: string) {
  const parsedUrls = normalizeYoutubeUrls(rawInput);

  if (!parsedUrls.length) {
    throw new Error("No valid YouTube links were found in the input.");
  }

  const results = [];

  for (const item of parsedUrls) {
    const existing = await prisma.video.findUnique({
      where: {
        youtubeVideoId: item.videoId
      }
    });

    if (existing) {
      results.push(existing);
      continue;
    }

    const metadata = await fetchYoutubeMetadata(item.videoId);

    const video = await prisma.video.create({
      data: {
        workspaceId,
        youtubeVideoId: item.videoId,
        url: item.url,
        title: metadata.title,
        channelName: metadata.channelName,
        thumbnailUrl: metadata.thumbnailUrl,
        ingestionStatus: "QUEUED"
      }
    });

    try {
      await prisma.video.update({
        where: { id: video.id },
        data: {
          ingestionStatus: "FETCHING_TRANSCRIPT"
        }
      });

      const transcript = await fetchTranscript(item.videoId);

      await prisma.video.update({
        where: { id: video.id },
        data: {
          transcriptLang: transcript.transcriptLanguage,
          ingestionStatus: "CHUNKING"
        }
      });

      const chunks = chunkTranscript(transcript.lines);

      const storedChunks = await prisma.$transaction(
        chunks.map((chunk, index) =>
          prisma.transcriptChunk.create({
            data: {
              videoId: video.id,
              chunkIndex: index,
              content: chunk.content,
              startSec: chunk.startSec,
              endSec: chunk.endSec,
              tokenCount: chunk.tokenCount
            }
          })
        )
      );

      await prisma.video.update({
        where: { id: video.id },
        data: {
          ingestionStatus: "EMBEDDING"
        }
      });

      const embeddings = await embedTexts(
        storedChunks.map((chunk: { content: string }) => chunk.content)
      );
      await upsertChunkEmbeddings(
        storedChunks.map((chunk: { id: string }, index: number) => ({
          chunkId: chunk.id,
          embedding: embeddings[index]
        }))
      );

      const summary = await summarizeVideo(
        metadata.title,
        storedChunks
          .map((chunk: { content: string }) => chunk.content)
          .join("\n")
      );

      const readyVideo = await prisma.video.update({
        where: { id: video.id },
        data: {
          summary,
          ingestionStatus: "READY"
        }
      });

      results.push(readyVideo);
    } catch (error) {
      const failureMessage =
        error instanceof Error ? error.message : "Unexpected transcript ingestion failure.";

      const failedVideo = await prisma.video.update({
        where: { id: video.id },
        data: {
          ingestionStatus: "FAILED",
          failureReason: failureMessage
        }
      });

      results.push(failedVideo);
    }
  }

  return results;
}
