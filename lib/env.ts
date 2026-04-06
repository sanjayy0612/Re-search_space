// Centralizes provider settings and validates only the env vars required for the
// currently selected model backend.
const required = ["DATABASE_URL"] as const;

export function getEnv() {
  const env = {
    databaseUrl: process.env.DATABASE_URL,
    modelProvider: process.env.MODEL_PROVIDER ?? "openai",
    openAiApiKey: process.env.OPENAI_API_KEY,
    openAiChatModel: process.env.OPENAI_CHAT_MODEL ?? "gpt-4.1-mini",
    openAiEmbeddingModel: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434",
    ollamaChatModel: process.env.OLLAMA_CHAT_MODEL ?? "llama3.1:8b",
    ollamaEmbeddingModel:
      process.env.OLLAMA_EMBEDDING_MODEL ?? process.env.OLLAMA_CHAT_MODEL ?? "nomic-embed-text"
  };

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  if (env.modelProvider !== "openai" && env.modelProvider !== "ollama") {
    throw new Error("MODEL_PROVIDER must be either 'openai' or 'ollama'.");
  }

  if (env.modelProvider === "openai" && !env.openAiApiKey) {
    throw new Error("Missing required environment variable: OPENAI_API_KEY");
  }

  return env;
}
