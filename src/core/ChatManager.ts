import { Vault, TFile, normalizePath, DataWriteOptions } from "obsidian";
import { ChatMessage, ChatSession, AIProvider, AgentMode, MessageRole, StreamChunk } from "../types";
import { ProviderManager } from "../providers/ProviderManager";
import { VaultToolRegistry } from "../tools/ToolRegistry";

export class ChatManager {
  private sessions: Map<string, ChatSession> = new Map();
  private activeSessionId: string | null = null;
  private providerManager: ProviderManager;
  private toolRegistry: VaultToolRegistry;
  private systemPrompt: string;
  private activeModel: string;
  private activeProvider: AIProvider;
  private agentMode: AgentMode;
  private maxIterations: number;
  private vault: Vault;
  private chatHistoryFolder: string;

  constructor(vault: Vault, providerManager: ProviderManager) {
    this.vault = vault;
    this.providerManager = providerManager;
    this.toolRegistry = VaultToolRegistry.getInstance();
    this.systemPrompt = "";
    this.activeModel = "gpt-4o";
    this.activeProvider = AIProvider.OPENAI;
    this.agentMode = AgentMode.CHAT;
    this.maxIterations = 10;
    this.chatHistoryFolder = ".opencode/chats";
  }

  createSession(title: string = "New Chat"): ChatSession {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
    const session: ChatSession = {
      id,
      title,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: this.activeModel,
      provider: this.activeProvider,
    };
    this.sessions.set(id, session);
    this.activeSessionId = id;
    return session;
  }

  getActiveSession(): ChatSession | null {
    if (!this.activeSessionId) return this.createSession();
    return this.sessions.get(this.activeSessionId) || null;
  }

  setActiveSession(id: string): boolean {
    if (this.sessions.has(id)) {
      this.activeSessionId = id;
      return true;
    }
    return false;
  }

  getAllSessions(): ChatSession[] {
    return Array.from(this.sessions.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  deleteSession(id: string): boolean {
    return this.sessions.delete(id);
  }

  async sendMessage(content: string, onStream?: (chunk: StreamChunk) => void): Promise<string> {
    const session = this.getActiveSession() || this.createSession();

    session.messages.push({
      id: Date.now().toString(),
      role: MessageRole.USER,
      content,
      timestamp: Date.now(),
    });

    let responseContent = "";

    if (this.agentMode === AgentMode.AGENT) {
      responseContent = await this.agentLoop(session, onStream);
    } else {
      responseContent = await this.simpleChat(session, onStream);
    }

    session.messages.push({
      id: (Date.now() + 1).toString(),
      role: MessageRole.ASSISTANT,
      content: responseContent,
      timestamp: Date.now(),
    });
    session.updatedAt = Date.now();

    await this.saveSession(session);

    return responseContent;
  }

  private async simpleChat(session: ChatSession, onStream?: (chunk: StreamChunk) => void): Promise<string> {
    const messages = this.buildMessages(session);
    return this.providerManager.chat(this.activeProvider, messages, this.activeModel, undefined, onStream);
  }

  private async agentLoop(session: ChatSession, onStream?: (chunk: StreamChunk) => void): Promise<string> {
    let fullResponse = "";
    let iteration = 0;

    while (iteration < this.maxIterations) {
      iteration++;
      const messages = this.buildMessages(session);
      const tools = this.toolRegistry.getDefinitions();

      let responseContent = "";
      let hasToolCalls = false;

      const content = await this.providerManager.chat(
        this.activeProvider,
        messages,
        this.activeModel,
        tools as unknown as Record<string, unknown>[],
        (chunk) => {
          responseContent += chunk.text;
          if (onStream) onStream(chunk);
        }
      );

      fullResponse += content;

      // Check for tool calls in response (simple pattern matching)
      const toolCallPattern = /"name":\s*"([^"]+)"[\s\S]*?"arguments":\s*({[\s\S]*?})/g;
      let match;

      while ((match = toolCallPattern.exec(content)) !== null) {
        hasToolCalls = true;
        const toolName = match[1];
        const toolInput = JSON.parse(match[2]);

        const result = await this.toolRegistry.execute(toolName, toolInput);

        session.messages.push({
          id: Date.now().toString(),
          role: MessageRole.SYSTEM,
          content: `[Tool: ${toolName}] Result:\n${result}`,
          timestamp: Date.now(),
        });

        fullResponse += `\n\n[Used tool: ${toolName}]`;
      }

      if (!hasToolCalls) break;
    }

    return fullResponse;
  }

  private buildMessages(session: ChatSession): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [];

    if (this.systemPrompt) {
      messages.push({ role: "system", content: this.systemPrompt });
    }

    for (const msg of session.messages) {
      messages.push({
        role: msg.role === "user" ? "user" : msg.role === "system" ? "system" : "assistant",
        content: msg.content,
      });
    }

    return messages;
  }

  async saveSession(session: ChatSession): Promise<void> {
    try {
      const folder = normalizePath(this.chatHistoryFolder);
      const existing = this.vault.getAbstractFileByPath(folder);
      if (!existing) {
        await this.vault.createFolder(folder);
      }

      const content = `---
id: ${session.id}
title: "${session.title.replace(/"/g, '\\"')}"
model: ${session.model}
provider: ${session.provider}
createdAt: ${session.createdAt}
updatedAt: ${session.updatedAt}
---

# ${session.title}

${session.messages.map((m) => `## ${m.role === "user" ? "You" : m.role === "assistant" ? "Assistant" : "System"}\n\n${m.content}`).join("\n\n---\n\n")}`;

      await this.vault.adapter.write(`${folder}/${session.id}.md`, content);
    } catch (error) {
      console.error("Failed to save chat session:", error);
    }
  }

  setSystemPrompt(prompt: string): void {
    this.systemPrompt = prompt;
  }

  setModel(model: string, provider: AIProvider): void {
    this.activeModel = model;
    this.activeProvider = provider;
  }

  setAgentMode(mode: AgentMode): void {
    this.agentMode = mode;
  }

  setChatHistoryFolder(folder: string): void {
    this.chatHistoryFolder = folder;
  }

  getContext() {
    return {
      model: this.activeModel,
      provider: this.activeProvider,
      mode: this.agentMode,
      sessions: this.sessions.size,
    };
  }
}
