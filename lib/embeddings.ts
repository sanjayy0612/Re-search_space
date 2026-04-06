// Converts text inputs into embedding vectors using the configured provider.
import { generateEmbeddings } from "@/lib/llm";

export async function embedTexts(input: string[]) {
  return generateEmbeddings(input);
}
