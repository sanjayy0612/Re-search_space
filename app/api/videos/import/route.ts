// Accepts pasted YouTube URLs, ensures a workspace exists, and kicks off the
// transcript ingestion pipeline for each video.
import { NextResponse } from "next/server";
import { importYoutubeLinks } from "@/lib/ingest";
import { getOrCreateWorkspace } from "@/lib/workspace";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { input?: string };
    const input = body.input?.trim();

    if (!input) {
      return NextResponse.json({ error: "Input is required." }, { status: 400 });
    }

    const workspace = await getOrCreateWorkspace();
    const videos = await importYoutubeLinks(input, workspace.id);

    return NextResponse.json({ workspace, videos });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Import failed."
      },
      { status: 500 }
    );
  }
}
