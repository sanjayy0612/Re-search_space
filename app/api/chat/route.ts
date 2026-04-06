// Runs a retrieval-augmented question against the current workspace and returns
// the answer with supporting citations.
import { NextResponse } from "next/server";
import { runWorkspaceChat } from "@/lib/chat";
import { getOrCreateWorkspace } from "@/lib/workspace";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      question?: string;
      sourceIds?: string[];
    };

    if (!body.question?.trim()) {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }

    const workspace = await getOrCreateWorkspace();
    const result = await runWorkspaceChat({
      workspaceId: workspace.id,
      question: body.question,
      sourceIds: body.sourceIds
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Chat failed."
      },
      { status: 500 }
    );
  }
}
