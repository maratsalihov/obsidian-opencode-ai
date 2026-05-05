import { AIProvider, AIModel, StreamChunk, ALL_MODELS } from "../types";
import { BaseAIProvider } from "./BaseProvider";

export class OpenAIProvider extends BaseAIProvider {
  constructor(apiKey: string, baseUrl = "https://api.openai.com/v1") {
    super(apiKey, baseUrl, AIProvider.OPENAI);
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  getModels(): AIModel[] {
    return ALL_MODELS.filter((m) => m.provider === AIProvider.OPENAI);
  }

  async chat(
    messages: Array<{ role: string; content: string }>,
    model: string,
    tools?: Record<string, unknown>[],
    onStream?: (chunk: StreamChunk) => void
  ): Promise<string> {
    if (!this.isConfigured()) throw new Error("OpenAI API key not configured.");

    const noStreamModels = ["o1", "o3-mini"];
    const useStream = !!onStream && !noStreamModels.includes(model);

    const body: Record<string, unknown> = { model, messages, stream: useStream, max_tokens: 8192 };
    if (tools?.length && !noStreamModels.includes(model)) body.tools = tools;

    if (useStream) return this.streamChat(body, onStream!);

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({ ...body, stream: false }),
    });

    if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }

  private async streamChat(body: Record<string, unknown>, onStream: (chunk: StreamChunk) => void): Promise<string> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);

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
        if (!t || t === "data: [DONE]") {
          if (t === "data: [DONE]") onStream({ text: "", isComplete: true });
          continue;
        }
        if (!t.startsWith("data: ")) continue;
        try {
          const j = JSON.parse(t.slice(6));
          const c = j.choices?.[0]?.delta?.content || "";
          if (c) { full += c; onStream({ text: c, isComplete: false }); }
        } catch {}
      }
    }

    onStream({ text: "", isComplete: true });
    return full;
  }
}
