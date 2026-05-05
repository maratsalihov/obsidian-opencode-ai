import { AIModel, AIProvider, StreamChunk } from "../types";

export abstract class BaseAIProvider {
  protected apiKey: string;
  protected baseUrl: string;
  provider: AIProvider;

  constructor(apiKey: string, baseUrl: string, provider: AIProvider) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.provider = provider;
  }

  abstract isConfigured(): boolean;
  abstract getModels(): AIModel[];
  abstract chat(
    messages: Array<{ role: string; content: string }>,
    model: string,
    tools?: Record<string, unknown>[],
    onStream?: (chunk: StreamChunk) => void
  ): Promise<string>;
}
