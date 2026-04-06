// Handles YouTube URL parsing plus metadata and transcript fetching for ingestion.
import { YoutubeTranscript } from "youtube-transcript";
import type { TranscriptLine } from "@/lib/types";

const YOUTUBE_ID_REGEX =
  /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/;

export function extractYoutubeVideoId(url: string) {
  const trimmed = url.trim();
  const directMatch = trimmed.match(YOUTUBE_ID_REGEX);
  if (directMatch) {
    return directMatch[1];
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      if (id) return id;
    }
  } catch {
    return null;
  }

  return null;
}

export function normalizeYoutubeUrls(raw: string) {
  const candidates = raw
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  const deduped = new Map<string, string>();

  for (const candidate of candidates) {
    const videoId = extractYoutubeVideoId(candidate);
    if (!videoId) continue;
    deduped.set(videoId, `https://www.youtube.com/watch?v=${videoId}`);
  }

  return [...deduped.entries()].map(([videoId, url]) => ({ videoId, url }));
}

export async function fetchYoutubeMetadata(videoId: string) {
  const response = await fetch(
    `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
    {
      next: { revalidate: 3600 }
    }
  );

  if (!response.ok) {
    throw new Error("Could not fetch YouTube metadata.");
  }

  const data = (await response.json()) as {
    title?: string;
    author_name?: string;
    thumbnail_url?: string;
  };

  return {
    title: data.title ?? "Untitled video",
    channelName: data.author_name ?? "Unknown creator",
    thumbnailUrl: data.thumbnail_url ?? null
  };
}

export async function fetchTranscript(videoId: string) {
  const lines = (await YoutubeTranscript.fetchTranscript(videoId)) as Array<{
    text: string;
    offset: number;
    duration: number;
    lang?: string;
  }>;

  if (!lines.length) {
    throw new Error("Transcript was empty.");
  }

  return {
    transcriptLanguage: lines[0]?.lang ?? "unknown",
    lines: lines.map<TranscriptLine>((line) => ({
      text: line.text,
      offset: Math.floor(line.offset / 1000),
      duration: Math.max(1, Math.floor(line.duration / 1000))
    }))
  };
}
