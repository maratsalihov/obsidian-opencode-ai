import { AIModel, AIProvider, StreamChunk } from "../types";
import { BaseAIProvider } from "./BaseProvider";

export class OpenAIProvider extends BaseAIProvider {
  constructor(apiKey: string) {
    super(apiKey, "https://api.openai.com/v1", AIProvider.OPENAI);
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  getModels(): AIModel[] {
    return [
      { id: "gpt-4o", name: "GPT-4o", provider: this.provider, maxTokens: 4096, supportsStreaming: true, supportsTools: true, contextWindow: 128000 },
      { id: "gpt-4o-mini", name: "GPT-4o mini", provider: this.provider, maxTokens: 4096, supportsStreaming: true, supportsTools: true, contextWindow: 128000 },
      { id: "o1", name: "o1", provider: this.provider, maxTokens: 100000, supportsStreaming: false, supportsTools: true, contextWindow: 200000 },
      { id: "o3-mini", name: "o3 mini", provider: this.provider, maxTokens: 100000, supportsStreaming: false, supportsTools: true, contextWindow: 200000 },
    ];
  }

  async chat(
    messages: Array<{ role: string; content: string }>,
    model: string,
    tools?: Record<string, unknown>[],
    onStream?: (chunk: StreamChunk) => void
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error("OpenAI API key not configured. Please add your key in settings.");
    }

    const isStreaming = !!onStream && model !== "o1" && model !== "o3-mini";

    const body: Record<string, unknown> = {
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: isStreaming,
      max_tokens: 4096,
    };

    if (tools && tools.length > 0 && model !== "o1" && model !== "o3-mini") {
      body.tools = tools;
    }

    if (isStreaming) {
      return this.streamChat(body, onStream!);
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ ...body, stream: false }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }

  private async streamChat(
    body: Record<string, unknown>,
    onStream: (chunk: StreamChunk) => void
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
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
        if (!trimmed || trimmed === "data: [DONE]") {
          if (trimmed === "data: [DONE]") {
            onStream({ text: "", isComplete: true });
          }
          continue;
        }

        if (trimmed.startsWith("data: ")) {
          try {
            const json = JSON.parse(trimmed.slice(6));
            const content = json.choices?.[0]?.delta?.content || "";
            if (content) {
              fullContent += content;
              onStream({ text: content, isComplete: false });
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }

    onStream({ text: "", isComplete: true });
    return fullContent;
  }
}
