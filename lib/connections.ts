// Loads ready source summaries for a workspace and derives cross-source theme
// connections from them.
import { prisma } from "@/lib/db";
import { buildConnections } from "@/lib/summarize";

export async function getWorkspaceConnections(workspaceId: string) {
  const [videos, documents] = await Promise.all([
    prisma.video.findMany({
      where: {
        workspaceId,
        ingestionStatus: "READY",
        summary: {
          not: null
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    }),
    prisma.document.findMany({
      where: {
        workspaceId,
        ingestionStatus: "READY",
        summary: {
          not: null
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    })
  ]);

  const sources = [
    ...videos.map((video) => ({ title: video.title, summary: video.summary ?? "" })),
    ...documents.map((document) => ({ title: document.title, summary: document.summary ?? "" }))
  ];

  if (sources.length < 2) {
    return [];
  }

  return buildConnections(
    sources.map((source) => ({
      videoTitle: source.title,
      summary: source.summary
    }))
  );
}
