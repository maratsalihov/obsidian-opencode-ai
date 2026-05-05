import { AIProvider, AIModel, StreamChunk } from "../types";
import { BaseAIProvider } from "./BaseProvider";
import { OpenAIProvider } from "./OpenAIProvider";
import { AnthropicProvider } from "./AnthropicProvider";
import { OllamaProvider } from "./OllamaProvider";

export class ProviderManager {
  private providers: Map<AIProvider, BaseAIProvider> = new Map();

  initialize(
    openaiKey: string,
    anthropicKey: string,
    ollamaUrl: string,
    openrouterKey: string,
    deepseekKey: string,
    groqKey: string,
    mistralKey: string
  ): void {
    this.providers.clear();

    if (openaiKey) {
      this.providers.set(AIProvider.OPENAI, new OpenAIProvider(openaiKey));
    }

    if (anthropicKey) {
      this.providers.set(AIProvider.ANTHROPIC, new AnthropicProvider(anthropicKey));
    }

    if (ollamaUrl) {
      this.providers.set(AIProvider.OLLAMA, new OllamaProvider(ollamaUrl));
    }

    if (openrouterKey) {
      const p = new OpenAIProvider(openrouterKey);
      (p as any).baseUrl = "https://openrouter.ai/api/v1";
      this.providers.set(AIProvider.OPENROUTER, p);
    }

    if (deepseekKey) {
      const p = new OpenAIProvider(deepseekKey);
      (p as any).baseUrl = "https://api.deepseek.com/v1";
      this.providers.set(AIProvider.DEEPSEEK, p);
    }

    if (groqKey) {
      const p = new OpenAIProvider(groqKey);
      (p as any).baseUrl = "https://api.groq.com/openai/v1";
      this.providers.set(AIProvider.GROQ, p);
    }

    if (mistralKey) {
      const p = new OpenAIProvider(mistralKey);
      (p as any).baseUrl = "https://api.mistral.ai/v1";
      this.providers.set(AIProvider.MISTRAL, p);
    }
  }

  getProvider(provider: AIProvider): BaseAIProvider | undefined {
    return this.providers.get(provider);
  }

  getAllModels(): AIModel[] {
    const models: AIModel[] = [];
    for (const [, p] of this.providers) {
      models.push(...p.getModels());
    }
    return models;
  }

  async chat(
    provider: AIProvider,
    messages: Array<{ role: string; content: string }>,
    model: string,
    tools?: Record<string, unknown>[],
    onStream?: (chunk: StreamChunk) => void
  ): Promise<string> {
    const p = this.providers.get(provider);
    if (!p) {
      throw new Error(`Provider ${provider} not configured`);
    }
    if (!p.isConfigured()) {
      throw new Error(`Provider ${provider} not configured. Please add API key in settings.`);
    }
    return p.chat(messages, model, tools, onStream);
  }
}
