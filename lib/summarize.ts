// Wraps LLM-powered summary, Q&A, and cross-video connection generation helpers.
import { generateText } from "@/lib/llm";
import type { Citation, ConnectionInsight } from "@/lib/types";

export async function answerQuestion(args: {
  question: string;
  citations: Citation[];
}) {
  const context = args.citations
    .map(
      (citation, index) =>
        `[${index + 1}] ${citation.title} (${formatCitationLocation(citation)}): ${citation.content}`
    )
    .join("\n");

  return generateText({
    messages: [
      {
        role: "system",
        content:
          "Answer using only the provided source evidence. Be concise, compare sources when relevant, and mention uncertainty if the support is weak."
      },
      {
        role: "user",
        content: `Question: ${args.question}\n\nSource evidence:\n${context}`
      }
    ]
  });
}

export async function summarizeVideo(title: string, transcript: string) {
  return generateText({
    messages: [
      {
        role: "system",
        content:
          "Write a 3-4 sentence research summary of a source transcript or document. Focus on the main argument, notable claims, and practical takeaway."
      },
      {
        role: "user",
        content: `Source title: ${title}\n\nContent:\n${transcript.slice(0, 12000)}`
      }
    ]
  });
}

export async function buildConnections(
  summaries: Array<{ videoTitle: string; summary: string }>
) {
  const response = await generateText({
    messages: [
      {
        role: "system",
        content:
          "Identify 3 to 5 shared themes or entities across source summaries. Return each item as 'label | comma-separated source titles | strength from 1 to 5'."
      },
      {
        role: "user",
        content: summaries
          .map((summary) => `${summary.videoTitle}: ${summary.summary}`)
          .join("\n\n")
      }
    ]
  });

  return parseConnections(response);
}

function parseConnections(text: string): ConnectionInsight[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, videosRaw, strengthRaw] = line.split("|").map((item) => item.trim());
      return {
        label,
        videos: (videosRaw ?? "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        strength: Number.parseInt(strengthRaw ?? "3", 10) || 3
      };
    })
    .filter((item) => item.label && item.videos.length);
}

export function formatTimestamp(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatCitationLocation(citation: Citation) {
  if (citation.startSec !== null && citation.endSec !== null) {
    return `${formatTimestamp(citation.startSec)}-${formatTimestamp(citation.endSec)}`;
  }

  return citation.locator ?? "Excerpt";
}
