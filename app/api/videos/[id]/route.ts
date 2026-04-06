import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        chunks: {
          orderBy: {
            chunkIndex: "asc"
          }
        }
      }
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found." }, { status: 404 });
    }

    return NextResponse.json({ video });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not load video."
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.video.delete({
      where: {
        id
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not delete video."
      },
      { status: 500 }
    );
  }
}
