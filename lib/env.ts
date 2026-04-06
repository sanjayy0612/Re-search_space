// Centralizes required environment variables and provides sensible model defaults.
const required = ["DATABASE_URL", "OPENAI_API_KEY"] as const;

export function getEnv() {
  const env = {
    databaseUrl: process.env.DATABASE_URL,
    openAiApiKey: process.env.OPENAI_API_KEY,
    chatModel: process.env.OPENAI_CHAT_MODEL ?? "gpt-4.1-mini",
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small"
  };

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  return env;
}
