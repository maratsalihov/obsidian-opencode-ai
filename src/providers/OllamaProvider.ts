import { AIModel, AIProvider, StreamChunk } from "../types";
import { BaseAIProvider } from "./BaseProvider";

export class OllamaProvider extends BaseAIProvider {
  constructor(baseUrl: string) {
    super("", baseUrl, AIProvider.OLLAMA);
  }

  isConfigured(): boolean {
    return this.baseUrl.length > 0;
  }

  getModels(): AIModel[] {
    return [
      { id: "llama3.1", name: "Llama 3.1", provider: this.provider, maxTokens: 8192, supportsStreaming: true, supportsTools: true, contextWindow: 128000 },
      { id: "qwen2.5-coder", name: "Qwen 2.5 Coder", provider: this.provider, maxTokens: 8192, supportsStreaming: true, supportsTools: true, contextWindow: 32000 },
      { id: "deepseek-coder-v2", name: "DeepSeek Coder V2", provider: this.provider, maxTokens: 8192, supportsStreaming: true, supportsTools: true, contextWindow: 32000 },
      { id: "mistral-nemo", name: "Mistral Nemo", provider: this.provider, maxTokens: 8192, supportsStreaming: true, supportsTools: true, contextWindow: 32000 },
    ];
  }

  async chat(
    messages: Array<{ role: string; content: string }>,
    model: string,
    _tools?: Record<string, unknown>[],
    onStream?: (chunk: StreamChunk) => void
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error("Ollama base URL not configured.");
    }

    if (onStream) {
      return this.streamChat(messages, model, onStream);
    }

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.message?.content || "";
  }

  private async streamChat(
    messages: Array<{ role: string; content: string }>,
    model: string,
    onStream: (chunk: StreamChunk) => void
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Failed to get response reader");
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let fullContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const json = JSON.parse(trimmed);
          const content = json.message?.content || "";
          if (content) {
            fullContent += content;
            onStream({ text: content, isComplete: false });
          }
          if (json.done) {
            onStream({ text: "", isComplete: true });
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }

    return fullContent;
  }

  async listLocalModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) return [];
      const data = await response.json();
      return (data.models || []).map((m: { name: string }) => m.name);
    } catch {
      return [];
    }
  }
}
