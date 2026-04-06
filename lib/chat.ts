// Runs retrieval-augmented chat for a workspace and persists the exchange as a
// chat session with citations.
import { prisma } from "@/lib/db";
import { embedTexts } from "@/lib/embeddings";
import { answerQuestion } from "@/lib/summarize";
import type { Citation } from "@/lib/types";
import { searchChunks } from "@/lib/vector-store";

export async function runWorkspaceChat(args: {
  workspaceId: string;
  question: string;
  videoIds?: string[];
}) {
  const [embedding] = await embedTexts([args.question]);
  const matches = await searchChunks({
    embedding,
    videoIds: args.videoIds,
    limit: 8
  });

  const citations: Citation[] = matches.map((match) => ({
    videoId: match.videoId,
    title: match.title,
    chunkId: match.chunkId,
    startSec: match.startSec,
    endSec: match.endSec,
    content: match.content
  }));

  const answer = await answerQuestion({
    question: args.question,
    citations
  });

  const session =
    (await prisma.chatSession.findFirst({
      where: {
        workspaceId: args.workspaceId
      },
      orderBy: {
        createdAt: "desc"
      }
    })) ??
    (await prisma.chatSession.create({
      data: {
        workspaceId: args.workspaceId,
        title: args.question.slice(0, 60)
      }
    }));

  await prisma.chatMessage.createMany({
    data: [
      {
        chatSessionId: session.id,
        role: "USER",
        content: args.question
      },
      {
        chatSessionId: session.id,
        role: "ASSISTANT",
        content: answer,
        citationsJson: citations
      }
    ]
  });

  return {
    answer,
    citations,
    sessionId: session.id
  };
}
