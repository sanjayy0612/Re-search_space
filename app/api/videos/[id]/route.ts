// Supports reading a single source's stored chunks and deleting a source from
// the workspace library.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [video, document] = await Promise.all([
      prisma.video.findUnique({
        where: { id },
        include: {
          chunks: {
            orderBy: {
              chunkIndex: "asc"
            }
          }
        }
      }),
      prisma.document.findUnique({
        where: { id },
        include: {
          chunks: {
            orderBy: {
              chunkIndex: "asc"
            }
          }
        }
      })
    ]);

    if (!video && !document) {
      return NextResponse.json({ error: "Source not found." }, { status: 404 });
    }

    return NextResponse.json({ source: video ?? document });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not load source."
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
    const deletedDocument = await prisma.document.deleteMany({
      where: {
        id
      }
    });

    if (!deletedDocument.count) {
      await prisma.video.delete({
        where: {
          id
        }
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not delete source."
      },
      { status: 500 }
    );
  }
}
