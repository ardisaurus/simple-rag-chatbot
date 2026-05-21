import { ChatOpenAI } from "@langchain/openai";
import { env } from "./env";

export function getChatModel(): ChatOpenAI {
  return new ChatOpenAI({
    apiKey: env.openrouter.apiKey,
    model: env.openrouter.model,
    temperature: 0.1,
    streaming: true,
    configuration: {
      baseURL: env.openrouter.baseUrl,
      defaultHeaders: {
        "HTTP-Referer": env.openrouter.siteUrl,
        "X-Title": env.openrouter.appName,
      },
    },
  });
}
