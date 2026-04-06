// Accepts uploaded text-based files, ensures a workspace exists, and ingests
// them into the shared retrieval pipeline.
import { NextResponse } from "next/server";
import { importFiles } from "@/lib/documents";
import { getOrCreateWorkspace } from "@/lib/workspace";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const fileEntries = formData
      .getAll("files")
      .filter((value): value is File => value instanceof File);

    if (!fileEntries.length) {
      return NextResponse.json({ error: "At least one file is required." }, { status: 400 });
    }

    const workspace = await getOrCreateWorkspace();
    const documents = await importFiles(fileEntries, workspace.id);

    return NextResponse.json({ workspace, documents });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "File import failed."
      },
      { status: 500 }
    );
  }
}
