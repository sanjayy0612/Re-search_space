// Accepts pasted YouTube URLs, ensures a workspace exists, and kicks off the
// transcript ingestion pipeline for each video.
import { NextResponse } from "next/server";
import { importYoutubeLinks } from "@/lib/ingest";
import { getOrCreateWorkspace } from "@/lib/workspace";

export async function POST(request: Request) {
  try {
    let body: { input?: string };
    try {
      body = (await request.json()) as { input?: string };
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const input = body.input?.trim();

    if (!input) {
      return NextResponse.json({ error: "Input is required." }, { status: 400 });
    }

    let workspace;
    try {
      workspace = await getOrCreateWorkspace();
    } catch (dbError) {
      console.error("Database error in getOrCreateWorkspace:", dbError);
      const errorMessage = dbError instanceof Error ? dbError.message : "Database connection failed";
      return NextResponse.json({ error: `Database error: ${errorMessage}` }, { status: 500 });
    }

    const videos = await importYoutubeLinks(input, workspace.id);

    return NextResponse.json({ workspace, videos });
  } catch (error) {
    console.error("Import error:", error);
    const errorMessage = error instanceof Error ? error.message : "Import failed";
    return NextResponse.json(
      {
        error: `${errorMessage}`
      },
      { status: 500 }
    );
  }
}
