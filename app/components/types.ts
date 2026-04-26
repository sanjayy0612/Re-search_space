export type Source = {
  id: string;
  sourceType: "VIDEO" | "FILE";
  title: string;
  subtitle: string | null;
  summary: string | null;
  ingestionStatus: string;
  failureReason: string | null;
};

export type Citation = {
  sourceId: string;
  sourceType: "VIDEO" | "FILE";
  chunkId: string;
  title: string;
  startSec: number | null;
  endSec: number | null;
  locator: string | null;
  content: string;
};

export type SourceDrawerTab = "urls" | "files";

export type ChatMode = "standard" | "mode1" | "mode2";
