import { NextResponse } from "next/server";
import { embedTexts } from "@/lib/embeddings";
import { searchChunks } from "@/lib/vector-store";

type Mode2RequestBody = {
  question?: string;
  sourceIds?: string[];
};

type Mode2ServiceResponse = {
  finalAnswer?: string;
  thinkers?: Array<{
    role: string;
    label: string;
    response: string;
  }>;
};

const DEFAULT_MODE2_URL = "http://127.0.0.1:8000/mode2";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Mode2RequestBody;
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

    const mode2Response = await fetch(process.env.MODE2_API_URL ?? DEFAULT_MODE2_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        question,
        chunks: chunks.map((chunk) => chunk.content)
      })
    });

    if (!mode2Response.ok) {
      throw new Error(`Mode 2 service failed with status ${mode2Response.status}.`);
    }

    const mode2Json = (await mode2Response.json()) as Mode2ServiceResponse;

    return NextResponse.json({
      answer: mode2Json.finalAnswer ?? "",
      citations: chunks,
      thinkers: mode2Json.thinkers ?? [],
      mode: "mode2"
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Mode 2 chat failed."
      },
      { status: 500 }
    );
  }
}
