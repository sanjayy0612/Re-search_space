// Shared TypeScript types used across ingestion, retrieval, and chat flows.
export type Citation = {
  videoId: string;
  title: string;
  chunkId: string;
  startSec: number;
  endSec: number;
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
