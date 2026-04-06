// Provides a thin provider-agnostic interface for text generation and
// embeddings so the app can run on OpenAI or a local Ollama instance.
import { getEnv } from "@/lib/env";
import { getOpenAIClient } from "@/lib/openai";

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function generateText(input: { messages: Message[] }) {
  const env = getEnv();

  if (env.modelProvider === "ollama") {
    const response = await fetch(`${env.ollamaBaseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: env.ollamaChatModel,
        stream: false,
        messages: input.messages
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

  const response = await getOpenAIClient().responses.create({
    model: env.openAiChatModel,
    input: input.messages
  });

  return response.output_text;
}

export async function generateEmbeddings(input: string[]) {
  if (!input.length) {
    return [];
  }

  const env = getEnv();

  if (env.modelProvider === "ollama") {
    const response = await fetch(`${env.ollamaBaseUrl}/api/embed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: env.ollamaEmbeddingModel,
        input
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama embedding request failed with status ${response.status}.`);
    }

    const data = (await response.json()) as {
      embeddings?: number[][];
    };

    return data.embeddings ?? [];
  }

  const response = await getOpenAIClient().embeddings.create({
    model: env.openAiEmbeddingModel,
    input
  });

  return response.data.map((item) => item.embedding);
}
