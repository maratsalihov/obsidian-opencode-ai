import { AIProvider, AIModel, StreamChunk, ALL_MODELS } from "../types";
import { BaseAIProvider } from "./BaseProvider";

export class AnthropicProvider extends BaseAIProvider {
  constructor(apiKey: string) {
    super(apiKey, "https://api.anthropic.com", AIProvider.ANTHROPIC);
  }

  isConfigured(): boolean { return this.apiKey.length > 0; }

  getModels(): AIModel[] {
    return ALL_MODELS.filter((m) => m.provider === AIProvider.ANTHROPIC);
  }

  async chat(
    messages: Array<{ role: string; content: string }>,
    model: string,
    tools?: Record<string, unknown>[],
    onStream?: (chunk: StreamChunk) => void
  ): Promise<string> {
    if (!this.isConfigured()) throw new Error("Anthropic API key not configured.");

    const sysMsg = messages.find((m) => m.role === "system");
    const chatMsgs = messages.filter((m) => m.role !== "system").map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));

    const body: Record<string, unknown> = { model, messages: chatMsgs, max_tokens: 8192, stream: !!onStream };
    if (sysMsg) body.system = sysMsg.content;
    if (tools?.length) {
      body.tools = tools.map((t) => ({ name: t.name as string, description: t.description as string, input_schema: t.parameters }));
    }

    if (onStream) return this.streamChat(body, onStream);

    const res = await fetch(`${this.baseUrl}/v1/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "anthropic-version": "2023-06-01", "x-api-key": this.apiKey },
      body: JSON.stringify({ ...body, stream: false }),
    });

    if (!res.ok) throw new Error(`Anthropic error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.content?.filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("\n") || "";
  }

  private async streamChat(body: Record<string, unknown>, onStream: (chunk: StreamChunk) => void): Promise<string> {
    const res = await fetch(`${this.baseUrl}/v1/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "anthropic-version": "2023-06-01", "x-api-key": this.apiKey },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Anthropic error ${res.status}: ${await res.text()}`);

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
        if (!t || !t.startsWith("data: ")) continue;
        try {
          const j = JSON.parse(t.slice(6));
          if (j.type === "content_block_delta") {
            const text = j.delta?.type === "text_delta" ? j.delta.text : "";
            if (text) { full += text; onStream({ text, isComplete: false }); }
          }
          if (j.type === "message_stop") onStream({ text: "", isComplete: true });
        } catch {}
      }
    }

    return full;
  }
}
