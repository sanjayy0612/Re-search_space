import { getEnv } from "@/lib/env";
import type { SearchChunkResult } from "@/lib/types";

const OLLAMA_CHAT_URL = "http://localhost:11434/api/chat";
const DEFAULT_JUDGE_MODEL = "openai/gpt-oss-120b";
const THINKER_MAX_TOKENS = 350;
const JUDGE_MAX_TOKENS = 700;

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ThinkerDefinition = {
  role: string;
  label: string;
  systemPrompt: string;
};

export type ThinkerResponse = {
  role: string;
  label: string;
  response: string;
};

export type ThinkersResult = {
  finalAnswer: string;
  thinkers: ThinkerResponse[];
};

const THINKER_DEFINITIONS: ThinkerDefinition[] = [
  {
    role: "skeptic",
    label: "Skeptic",
    systemPrompt:
      "You are Skeptic. Review the evidence cautiously. Identify weak support, uncertainty, contradictions, and places where the retrieved text does not fully answer the question. Keep the response concise and grounded only in the provided material."
  },
  {
    role: "summarizer",
    label: "Summarizer",
    systemPrompt:
      "You are Summarizer. Produce the clearest direct answer you can using only the provided material. Distill the key facts, omit fluff, and avoid speculation."
  },
  {
    role: "connector",
    label: "Connector",
    systemPrompt:
      "You are Connector. Synthesize relationships across the retrieved chunks. Highlight patterns, agreements, tensions, and how separate pieces of evidence fit together to answer the question."
  },
  {
    role: "devils-advocate",
    label: "Devil's Advocate",
    systemPrompt:
      "You are Devil's Advocate. Deliberately test the strongest answer against alternate interpretations that could also fit the retrieved material. Surface edge cases and caveats, but stay grounded in the provided evidence."
  }
];

function formatChunks(chunks: SearchChunkResult[]) {
  if (!chunks.length) {
    return "No retrieved chunks were found.";
  }

  return chunks
    .map(
      (chunk, index) =>
        [
          `Chunk ${index + 1}`,
          `Source Type: ${chunk.sourceType}`,
          `Source ID: ${chunk.sourceId}`,
          `Title: ${chunk.title}`,
          `Locator: ${chunk.locator ?? "N/A"}`,
          `Score: ${chunk.score.toFixed(4)}`,
          "Content:",
          chunk.content
        ].join("\n")
    )
    .join("\n\n");
}

function buildThinkerUserPrompt(question: string, chunksText: string) {
  return [`Question:`, question, "", `Retrieved Chunks:`, chunksText].join("\n");
}

function buildJudgeUserPrompt(question: string, chunksText: string, thinkers: ThinkerResponse[]) {
  const thinkerPayload = JSON.stringify(
    {
      question,
      thinkers: thinkers.map((thinker) => ({
        role: thinker.role,
        label: thinker.label,
        response: thinker.response
      }))
    },
    null,
    2
  );

  return [
    "Original Question:",
    question,
    "",
    "Retrieved Chunks:",
    chunksText,
    "",
    "Thinker Outputs JSON:",
    thinkerPayload,
    "",
    "Write the best final answer using only the retrieved evidence and the thinker outputs."
  ].join("\n");
}

async function callOllama(messages: ChatMessage[], maxTokens: number) {
  const env = getEnv();
  const response = await fetch(OLLAMA_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: env.ollamaChatModel,
      stream: false,
      messages,
      options: {
        num_predict: maxTokens
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama chat request failed with status ${response.status}.`);
  }

  const data = (await response.json()) as {
    message?: {
      content?: string;
    };
  };

  return data.message?.content?.trim() ?? "";
}

async function callGroqJudge(messages: ChatMessage[], maxTokens: number) {
  const env = getEnv();

  if (!env.groqApiKey) {
    throw new Error("GROQ_API_KEY is required for the judge model.");
  }

  const response = await fetch(`${env.groqBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.groqApiKey}`
    },
    body: JSON.stringify({
      model: process.env.GROQ_JUDGE_MODEL ?? DEFAULT_JUDGE_MODEL,
      messages,
      max_tokens: maxTokens,
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`Groq judge request failed with status ${response.status}.`);
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

async function runSingleThinker(
  thinker: ThinkerDefinition,
  question: string,
  chunksText: string
): Promise<ThinkerResponse> {
  const response = await callOllama(
    [
      {
        role: "system",
        content: thinker.systemPrompt
      },
      {
        role: "user",
        content: buildThinkerUserPrompt(question, chunksText)
      }
    ],
    THINKER_MAX_TOKENS
  );

  return {
    role: thinker.role,
    label: thinker.label,
    response
  };
}

async function runJudge(question: string, chunksText: string, thinkers: ThinkerResponse[]) {
  return callGroqJudge(
    [
      {
        role: "system",
        content:
          "You are Judge. Read the four thinker outputs and produce one final answer to the user's question. Use only the retrieved evidence. Reconcile disagreements, preserve important caveats, and do not mention internal deliberation or personas."
      },
      {
        role: "user",
        content: buildJudgeUserPrompt(question, chunksText, thinkers)
      }
    ],
    JUDGE_MAX_TOKENS
  );
}

export async function runThinkers(args: {
  question: string;
  chunks: SearchChunkResult[];
}): Promise<ThinkersResult> {
  const chunksText = formatChunks(args.chunks);
  const thinkers: ThinkerResponse[] = [];

  for (const thinker of THINKER_DEFINITIONS) {
    thinkers.push(await runSingleThinker(thinker, args.question, chunksText));
  }

  const finalAnswer = await runJudge(args.question, chunksText, thinkers);

  return {
    finalAnswer,
    thinkers
  };
}
