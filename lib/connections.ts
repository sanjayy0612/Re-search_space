// Loads ready video summaries for a workspace and derives cross-video theme
// connections from them.
import { prisma } from "@/lib/db";
import { buildConnections } from "@/lib/summarize";

export async function getWorkspaceConnections(workspaceId: string) {
  const videos = await prisma.video.findMany({
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
  });

  if (videos.length < 2) {
    return [];
  }

  return buildConnections(
    videos.map((video: { title: string; summary: string | null }) => ({
      videoTitle: video.title,
      summary: video.summary ?? ""
    }))
  );
}
