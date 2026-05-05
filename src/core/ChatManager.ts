import { Vault, TFile, normalizePath } from "obsidian";
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
    this.activeModel = "meta-llama/llama-3.1-8b-instruct:free";
    this.activeProvider = AIProvider.OPENROUTER;
    this.agentMode = AgentMode.AGENT;
    this.maxIterations = 15;
    this.chatHistoryFolder = ".opencode/chats";
  }

  createSession(title: string = "New Chat"): ChatSession {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
    const session: ChatSession = {
      id, title, messages: [],
      createdAt: Date.now(), updatedAt: Date.now(),
      model: this.activeModel, provider: this.activeProvider,
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
    if (this.sessions.has(id)) { this.activeSessionId = id; return true; }
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

      try {
        responseContent = await this.providerManager.chat(
          this.activeProvider,
          messages,
          this.activeModel,
          tools as unknown as Record<string, unknown>[],
          (chunk) => {
            if (chunk.text) {
              fullResponse += chunk.text;
              if (onStream) onStream(chunk);
            }
          }
        );
      } catch (error) {
        fullResponse += `\n\nError: ${(error as Error).message}`;
        break;
      }

      const toolCalls = this.parseToolCalls(responseContent);

      if (toolCalls.length === 0) break;

      for (const tc of toolCalls) {
        const result = await this.toolRegistry.execute(tc.name, tc.input);
        session.messages.push({
          id: Date.now().toString(),
          role: MessageRole.TOOL_RESULT,
          content: `Tool "${tc.name}" result:\n${result}`,
          timestamp: Date.now(),
        });
        fullResponse += `\n\n[Used: ${tc.name}]`;
      }
    }

    return fullResponse;
  }

  private parseToolCalls(content: string): Array<{ name: string; input: Record<string, unknown> }> {
    const calls: Array<{ name: string; input: Record<string, unknown> }> = [];

    // Pattern: "name": "tool_name" ... "arguments": { ... }
    const re = /"name":\s*"([^"]+)"[\s\S]*?"arguments":\s*(\{[\s\S]*?\})/g;
    let m;
    while ((m = re.exec(content)) !== null) {
      try {
        calls.push({ name: m[1], input: JSON.parse(m[2]) });
      } catch {}
    }

    return calls;
  }

  private buildMessages(session: ChatSession): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [];

    if (this.systemPrompt) {
      messages.push({ role: "system", content: this.systemPrompt });
    }

    for (const msg of session.messages) {
      const role = msg.role === MessageRole.USER ? "user" : msg.role === MessageRole.TOOL_RESULT ? "system" : "assistant";
      messages.push({ role, content: msg.content });
    }

    return messages;
  }

  async saveSession(session: ChatSession): Promise<void> {
    try {
      const folder = normalizePath(this.chatHistoryFolder);
      const exists = await this.vault.adapter.exists(folder);
      if (!exists) await this.vault.adapter.mkdir(folder);

      const md = session.messages.map((msg) => {
        const role = msg.role === MessageRole.USER ? "You" : msg.role === MessageRole.TOOL_RESULT ? "Tool" : "OpenCode";
        return `## ${role}\n\n${msg.content}`;
      }).join("\n\n---\n\n");

      const content = `---\ntitle: "${session.title}"\nmodel: ${session.model}\n---\n\n# ${session.title}\n\n${md}`;
      await this.vault.adapter.write(`${folder}/${session.id}.md`, content);
    } catch (e) {
      console.error("Failed to save chat:", e);
    }
  }

  setSystemPrompt(p: string): void { this.systemPrompt = p; }

  setModel(model: string, provider: AIProvider): void {
    this.activeModel = model;
    this.activeProvider = provider;
  }

  setAgentMode(mode: AgentMode): void { this.agentMode = mode; }

  setChatHistoryFolder(folder: string): void { this.chatHistoryFolder = folder; }

  getContext() {
    return { model: this.activeModel, provider: this.activeProvider, mode: this.agentMode, sessions: this.sessions.size };
  }
}
