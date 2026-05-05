import { AIModel, AIProvider, StreamChunk } from "../types";
import { BaseAIProvider } from "./BaseProvider";

export class AnthropicProvider extends BaseAIProvider {
  constructor(apiKey: string) {
    super(apiKey, "https://api.anthropic.com", AIProvider.ANTHROPIC);
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  getModels(): AIModel[] {
    return [
      { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", provider: this.provider, maxTokens: 8192, supportsStreaming: true, supportsTools: true, contextWindow: 200000 },
      { id: "claude-opus-4-20250514", name: "Claude Opus 4", provider: this.provider, maxTokens: 8192, supportsStreaming: true, supportsTools: true, contextWindow: 200000 },
      { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", provider: this.provider, maxTokens: 8192, supportsStreaming: true, supportsTools: true, contextWindow: 200000 },
      { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", provider: this.provider, maxTokens: 8192, supportsStreaming: true, supportsTools: true, contextWindow: 200000 },
    ];
  }

  async chat(
    messages: Array<{ role: string; content: string }>,
    model: string,
    tools?: Record<string, unknown>[],
    onStream?: (chunk: StreamChunk) => void
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error("Anthropic API key not configured. Please add your key in settings.");
    }

    const systemMessage = messages.find((m) => m.role === "system");
    const chatMessages = messages.filter((m) => m.role !== "system");

    const anthropicMessages = chatMessages.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));

    const body: Record<string, unknown> = {
      model,
      messages: anthropicMessages,
      max_tokens: 8192,
      stream: !!onStream,
    };

    if (systemMessage) {
      body.system = systemMessage.content;
    }

    if (tools && tools.length > 0) {
      body.tools = tools.map((t) => ({
        name: t.name as string,
        description: t.description as string,
        input_schema: t.parameters,
      }));
    }

    if (onStream) {
      return this.streamChat(body, onStream);
    }

    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify({ ...body, stream: false }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.content?.filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("\n") || "";
  }

  private async streamChat(
    body: Record<string, unknown>,
    onStream: (chunk: StreamChunk) => void
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
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
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        try {
          const json = JSON.parse(trimmed.slice(6));

          if (json.type === "content_block_delta") {
            const text = json.delta?.type === "text_delta" ? json.delta.text : "";
            if (text) {
              fullContent += text;
              onStream({ text, isComplete: false });
            }
          }

          if (json.type === "message_stop") {
            onStream({ text: "", isComplete: true });
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }

    return fullContent;
  }
}
