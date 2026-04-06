// Lists the sources currently tracked in the workspace so the dashboard can show
// ingestion status, summaries, and available chat scope.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateWorkspace } from "@/lib/workspace";
import type { LibrarySource } from "@/lib/types";

export async function GET() {
  try {
    const workspace = await getOrCreateWorkspace();
    const [videos, documents] = await Promise.all([
      prisma.video.findMany({
        where: {
          workspaceId: workspace.id
        },
        orderBy: {
          createdAt: "desc"
        }
      }),
      prisma.document.findMany({
        where: {
          workspaceId: workspace.id
        },
        orderBy: {
          createdAt: "desc"
        }
      })
    ]);

    const sources: LibrarySource[] = [
      ...videos.map((video) => ({
        id: video.id,
        sourceType: "VIDEO" as const,
        title: video.title,
        subtitle: video.channelName,
        summary: video.summary,
        ingestionStatus: video.ingestionStatus,
        failureReason: video.failureReason,
        createdAt: video.createdAt
      })),
      ...documents.map((document) => ({
        id: document.id,
        sourceType: "FILE" as const,
        title: document.title,
        subtitle: document.fileName,
        summary: document.summary,
        ingestionStatus: document.ingestionStatus,
        failureReason: document.failureReason,
        createdAt: document.createdAt
      }))
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json({ workspace, sources });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not load sources."
      },
      { status: 500 }
    );
  }
}
