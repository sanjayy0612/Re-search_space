// Splits transcript lines into retrieval-friendly chunks and records timing/token
// metadata for each chunk.
import type { TranscriptLine } from "@/lib/types";

type Chunk = {
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
