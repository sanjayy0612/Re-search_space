// Lazily creates and reuses a single OpenAI client instance for server-side calls.
import OpenAI from "openai";
import { getEnv } from "@/lib/env";

let client: OpenAI | null = null;

export function getOpenAIClient() {
  if (!client) {
    client = new OpenAI({
      apiKey: getEnv().openAiApiKey
    });
  }

  return client;
}
