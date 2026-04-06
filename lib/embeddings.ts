// Converts text inputs into embedding vectors using the configured OpenAI model.
import { getEnv } from "@/lib/env";
import { getOpenAIClient } from "@/lib/openai";

export async function embedTexts(input: string[]) {
  if (!input.length) {
    return [];
  }

  const response = await getOpenAIClient().embeddings.create({
    model: getEnv().embeddingModel,
    input
  });

  return response.data.map((item) => item.embedding);
}
