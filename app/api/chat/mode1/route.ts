import { NextResponse } from "next/server";
import { embedTexts } from "@/lib/embeddings";
import { runThinkers } from "@/lib/thinkers";
import { searchChunks } from "@/lib/vector-store";

type Mode1RequestBody = {
  question?: string;
  sourceIds?: string[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Mode1RequestBody;
    const question = body.question?.trim();

    if (!question) {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }

    const [embedding] = await embedTexts([question]);

    if (!embedding) {
      throw new Error("Failed to generate an embedding for the question.");
    }

    const chunks = await searchChunks({
      embedding,
      sourceIds: body.sourceIds,
      limit: 8
    });

    const result = await runThinkers({
      question,
      chunks
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Mode 1 chat failed."
      },
      { status: 500 }
    );
  }
}
