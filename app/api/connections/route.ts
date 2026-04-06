// Returns shared themes/entities inferred across ready source summaries for the
// connections panel in the dashboard.
import { NextResponse } from "next/server";
import { getWorkspaceConnections } from "@/lib/connections";
import { getOrCreateWorkspace } from "@/lib/workspace";

export async function GET() {
  try {
    const workspace = await getOrCreateWorkspace();
    const connections = await getWorkspaceConnections(workspace.id);
    return NextResponse.json({ connections });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not load connections."
      },
      { status: 500 }
    );
  }
}
