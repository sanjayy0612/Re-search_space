// Shared TypeScript types used across ingestion, retrieval, and chat flows.
export type SourceType = "VIDEO" | "FILE";

export type Citation = {
  sourceId: string;
  sourceType: SourceType;
  title: string;
  chunkId: string;
  startSec: number | null;
  endSec: number | null;
  locator: string | null;
  content: string;
};

export type SearchChunkResult = Citation & {
  score: number;
};

export type TranscriptLine = {
  text: string;
  offset: number;
  duration: number;
};

export type ConnectionInsight = {
  label: string;
  videos: string[];
  strength: number;
};

export type LibrarySource = {
  id: string;
  sourceType: SourceType;
  title: string;
  subtitle: string | null;
  summary: string | null;
  ingestionStatus: string;
  failureReason: string | null;
  createdAt: Date;
};
