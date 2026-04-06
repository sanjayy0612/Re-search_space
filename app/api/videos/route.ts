import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateWorkspace } from "@/lib/workspace";

export async function GET() {
  try {
    const workspace = await getOrCreateWorkspace();
    const videos = await prisma.video.findMany({
      where: {
        workspaceId: workspace.id
      },
      include: {
        chunks: {
          orderBy: {
            chunkIndex: "asc"
          },
          take: 1
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json({ workspace, videos });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not load videos."
      },
      { status: 500 }
    );
  }
}
