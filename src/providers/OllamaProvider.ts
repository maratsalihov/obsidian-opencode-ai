import { AIProvider, AIModel, StreamChunk, ALL_MODELS } from "../types";
import { BaseAIProvider } from "./BaseProvider";

export class OllamaProvider extends BaseAIProvider {
  constructor(baseUrl: string) {
    super("", baseUrl, AIProvider.OLLAMA);
  }

  isConfigured(): boolean { return this.baseUrl.length > 0; }

  getModels(): AIModel[] {
    return ALL_MODELS.filter((m) => m.provider === AIProvider.OLLAMA);
  }

  async chat(
    messages: Array<{ role: string; content: string }>,
    model: string,
    _tools?: Record<string, unknown>[],
    onStream?: (chunk: StreamChunk) => void
  ): Promise<string> {
    if (!this.isConfigured()) throw new Error("Ollama URL not configured.");

    if (onStream) return this.streamChat(messages, model, onStream);

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, stream: false }),
    });

    if (!res.ok) throw new Error(`Ollama error: ${res.statusText}`);
    const data = await res.json();
    return data.message?.content || "";
  }

  private async streamChat(
    messages: Array<{ role: string; content: string }>,
    model: string,
    onStream: (chunk: StreamChunk) => void
  ): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, stream: true }),
    });

    if (!res.ok) throw new Error(`Ollama error: ${res.statusText}`);

    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response reader");

    const decoder = new TextDecoder();
    let buf = "", full = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() || "";

      for (const line of lines) {
        const t = line.trim();
        if (!t) continue;
        try {
          const j = JSON.parse(t);
          const c = j.message?.content || "";
          if (c) { full += c; onStream({ text: c, isComplete: false }); }
          if (j.done) onStream({ text: "", isComplete: true });
        } catch {}
      }
    }

    return full;
  }
}
