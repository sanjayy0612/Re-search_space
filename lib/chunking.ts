// Splits transcript lines into retrieval-friendly chunks and records timing/token
// metadata for each chunk.
import type { TranscriptLine } from "@/lib/types";

export type Chunk = {
  content: string;
  startSec: number;
  endSec: number;
  tokenCount: number;
};

const TARGET_CHARS = 900;

export function chunkTranscript(lines: TranscriptLine[]) {
  const chunks: Chunk[] = [];
  let buffer: TranscriptLine[] = [];
  let bufferChars = 0;

  for (const line of lines) {
    buffer.push(line);
    bufferChars += line.text.length;

    if (bufferChars >= TARGET_CHARS) {
      chunks.push(buildChunk(buffer));
      buffer = [];
      bufferChars = 0;
    }
  }

  if (buffer.length) {
    chunks.push(buildChunk(buffer));
  }

  return chunks;
}

function buildChunk(lines: TranscriptLine[]): Chunk {
  const content = lines.map((line) => line.text).join(" ").trim();
  const startSec = lines[0]?.offset ?? 0;
  const lastLine = lines[lines.length - 1];
  const endSec = (lastLine?.offset ?? 0) + (lastLine?.duration ?? 0);

  return {
    content,
    startSec,
    endSec,
    tokenCount: estimateTokens(content)
  };
}

function estimateTokens(content: string) {
  return Math.ceil(content.length / 4);
}

export function chunkTextContent(content: string) {
  const normalized = content.replace(/\r\n/g, "\n").trim();

  if (!normalized) {
    return [];
  }

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const chunks: Array<{
    content: string;
    chunkIndex: number;
    tokenCount: number;
  }> = [];
  let buffer = "";

  for (const paragraph of paragraphs) {
    const candidate = buffer ? `${buffer}\n\n${paragraph}` : paragraph;

    if (candidate.length <= TARGET_CHARS) {
      buffer = candidate;
      continue;
    }

    if (buffer) {
      chunks.push({
        content: buffer,
        chunkIndex: chunks.length,
        tokenCount: estimateTokens(buffer)
      });
      buffer = "";
    }

    if (paragraph.length <= TARGET_CHARS) {
      buffer = paragraph;
      continue;
    }

    const sentences = paragraph.split(/(?<=[.!?])\s+/);
    let sentenceBuffer = "";

    for (const sentence of sentences) {
      const sentenceCandidate = sentenceBuffer ? `${sentenceBuffer} ${sentence}` : sentence;

      if (sentenceCandidate.length <= TARGET_CHARS) {
        sentenceBuffer = sentenceCandidate;
        continue;
      }

      if (sentenceBuffer) {
        chunks.push({
          content: sentenceBuffer,
          chunkIndex: chunks.length,
          tokenCount: estimateTokens(sentenceBuffer)
        });
      }

      sentenceBuffer = sentence;
    }

    if (sentenceBuffer) {
      buffer = sentenceBuffer;
    }
  }

  if (buffer) {
    chunks.push({
      content: buffer,
      chunkIndex: chunks.length,
      tokenCount: estimateTokens(buffer)
    });
  }

  return chunks;
}
