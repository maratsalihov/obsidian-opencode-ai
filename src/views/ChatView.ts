import { ItemView, WorkspaceLeaf, setIcon, Notice, MarkdownRenderer } from "obsidian";
import OpenCodeAIPlugin from "../main";
import { AIProvider, AgentMode, ChatSession, MessageRole } from "../types";

export const CHAT_VIEW_TYPE = "opencode-chat-view";

export class OpenCodeChatView extends ItemView {
  plugin: OpenCodeAIPlugin;
  private inputEl: HTMLTextAreaElement;
  private messagesEl: HTMLElement;
  private modelSelect: HTMLSelectElement;
  private providerSelect: HTMLSelectElement;
  private modeToggle: HTMLElement;
  private newChatBtn: HTMLElement;
  private isStreaming: boolean = false;

  constructor(leaf: WorkspaceLeaf, plugin: OpenCodeAIPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return CHAT_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "OpenCode AI Chat";
  }

  getIcon(): string {
    return "opencode";
  }

  async onOpen() {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("opencode-chat-container");

    this.buildHeader(container);
    this.buildMessagesArea(container);
    this.buildInputArea(container);

    this.updateState();
    this.loadChatHistory();
  }

  private buildHeader(container: HTMLElement) {
    const header = container.createDiv({ cls: "opencode-chat-header" });

    const controls = header.createDiv({ cls: "opencode-chat-controls" });

    // Provider select
    const providerLabel = controls.createEl("label", { text: "Provider:" }) as HTMLElement;
    providerLabel.addClass("opencode-label");
    this.providerSelect = controls.createEl("select", { cls: "opencode-select" }) as HTMLSelectElement;
    this.populateProviderSelect();
    this.providerSelect.value = this.plugin.settings.activeProvider;
    this.providerSelect.addEventListener("change", () => {
      this.updateModelsForProvider();
      this.saveProviderSettings();
    });

    // Model select
    const modelLabel = controls.createEl("label", { text: "Model:" }) as HTMLElement;
    modelLabel.addClass("opencode-label");
    this.modelSelect = controls.createEl("select", { cls: "opencode-select" }) as HTMLSelectElement;
    this.updateModelsForProvider();
    this.modelSelect.value = this.plugin.settings.activeModel;
    this.modelSelect.addEventListener("change", () => {
      this.saveProviderSettings();
    });

    // Mode toggle
    this.modeToggle = controls.createDiv({ cls: "opencode-mode-toggle" }) as HTMLElement;
    this.updateModeToggle();
    this.modeToggle.addEventListener("click", () => {
      const newMode = this.plugin.settings.agentMode === AgentMode.AGENT ? AgentMode.CHAT : AgentMode.AGENT;
      this.plugin.settings.agentMode = newMode;
      this.plugin.chatManager.setAgentMode(newMode);
      this.plugin.saveSettings();
      this.updateModeToggle();
      new Notice(`Mode: ${newMode === AgentMode.AGENT ? "Agent" : "Chat"}`);
    });

    // New chat button
    this.newChatBtn = controls.createDiv({ cls: "opencode-new-chat-btn" }) as HTMLElement;
    setIcon(this.newChatBtn, "plus");
    this.newChatBtn.addEventListener("click", () => {
      this.plugin.chatManager.createSession();
      this.updateState();
      new Notice("New chat started");
    });
  }

  private populateProviderSelect() {
    const providers = [
      { value: AIProvider.OPENAI, label: "OpenAI" },
      { value: AIProvider.ANTHROPIC, label: "Anthropic" },
      { value: AIProvider.OLLAMA, label: "Ollama" },
      { value: AIProvider.OPENROUTER, label: "OpenRouter" },
      { value: AIProvider.DEEPSEEK, label: "DeepSeek" },
      { value: AIProvider.GROQ, label: "Groq" },
      { value: AIProvider.MISTRAL, label: "Mistral" },
    ];

    for (const p of providers) {
      const option = document.createElement("option");
      option.value = p.value;
      option.textContent = p.label;
      this.providerSelect.appendChild(option);
    }
  }

  private updateModelsForProvider() {
    const provider = this.providerSelect.value as AIProvider;
    const providerInstance = this.plugin.providerManager.getProvider(provider);
    this.modelSelect.empty();

    if (providerInstance) {
      const models = providerInstance.getModels();
      for (const model of models) {
        const option = document.createElement("option");
        option.value = model.id;
        option.textContent = model.name;
        this.modelSelect.appendChild(option);
      }
    }
  }

  private updateModeToggle() {
    this.modeToggle.empty();
    const isAgent = this.plugin.settings.agentMode === AgentMode.AGENT;
    this.modeToggle.addClass("opencode-mode-btn", isAgent ? "opencode-mode-agent" : "opencode-mode-chat");
    this.modeToggle.createSpan({ text: isAgent ? "Agent" : "Chat" });
  }

  private saveProviderSettings() {
    this.plugin.settings.activeProvider = this.providerSelect.value as AIProvider;
    this.plugin.settings.activeModel = this.modelSelect.value;
    this.plugin.chatManager.setModel(this.plugin.settings.activeModel, this.plugin.settings.activeProvider);
    this.plugin.saveSettings();
  }

  private buildMessagesArea(container: HTMLElement) {
    const wrapper = container.createDiv({ cls: "opencode-messages-wrapper" });
    this.messagesEl = wrapper.createDiv({ cls: "opencode-messages" });
  }

  private buildInputArea(container: HTMLElement) {
    const inputArea = container.createDiv({ cls: "opencode-input-area" });

    this.inputEl = inputArea.createEl("textarea", {
      cls: "opencode-input",
      attr: {
        placeholder: "Message OpenCode AI... (use /help for commands)",
        rows: "1",
      },
    });

    this.inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    this.inputEl.addEventListener("input", () => {
      this.autoResize();
    });

    const sendBtn = inputArea.createDiv({ cls: "opencode-send-btn" });
    setIcon(sendBtn, "arrow-up");
    sendBtn.addEventListener("click", () => this.sendMessage());
  }

  private autoResize() {
    this.inputEl.style.height = "auto";
    this.inputEl.style.height = Math.min(this.inputEl.scrollHeight, 200) + "px";
  }

  async sendMessage() {
    const content = this.inputEl.value.trim();
    if (!content || this.isStreaming) return;

    this.inputEl.value = "";
    this.autoResize();

    this.addMessage(MessageRole.USER, content);

    this.isStreaming = true;

    const assistantMsgEl = this.addMessage(MessageRole.ASSISTANT, "", true);
    let fullContent = "";

    try {
      await this.plugin.chatManager.sendMessage(content, (chunk) => {
        if (chunk.text) {
          fullContent += chunk.text;
          this.appendStreamingText(assistantMsgEl, chunk.text);
        }
        if (chunk.isComplete) {
          this.isStreaming = false;
        }
      });
    } catch (error) {
      const contentEl = assistantMsgEl.querySelector(".opencode-message-content");
      if (contentEl) {
        contentEl.textContent = `Error: ${(error as Error).message}`;
      }
      this.isStreaming = false;
    }

    this.updateState();
  }

  private addMessage(role: MessageRole, content: string, isStreaming: boolean = false): HTMLElement {
    const msgEl = this.messagesEl.createDiv({ cls: `opencode-message opencode-message-${role}` });

    const header = msgEl.createDiv({ cls: "opencode-message-header" });
    const roleText = role === MessageRole.USER ? "You" : role === MessageRole.SYSTEM ? "System" : "OpenCode AI";
    header.createSpan({ text: roleText, cls: "opencode-message-role" });

    if (isStreaming) {
      header.createSpan({ text: "typing...", cls: "opencode-message-status" });
    }

    msgEl.createDiv({ cls: "opencode-message-content" });

    if (content) {
      this.renderMarkdown(msgEl.querySelector(".opencode-message-content") as HTMLElement, content);
    }

    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    return msgEl;
  }

  private appendStreamingText(msgEl: HTMLElement, text: string) {
    const contentEl = msgEl.querySelector(".opencode-message-content");
    if (contentEl) {
      contentEl.textContent += text;
      this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    }
  }

  private renderMarkdown(el: HTMLElement | null, content: string) {
    if (!el) return;
    el.empty();
    const lines = content.split("\n");
    let inCodeBlock = false;
    let codeContent = "";
    let codeLang = "";

    for (const line of lines) {
      if (line.startsWith("```")) {
        if (inCodeBlock) {
          const preEl = el.createEl("pre", { cls: "opencode-code-block" });
          if (codeLang) {
            preEl.createDiv({ cls: "opencode-code-lang", text: codeLang });
          }
          preEl.createEl("code", { text: codeContent });
          inCodeBlock = false;
          codeContent = "";
          codeLang = "";
        } else {
          inCodeBlock = true;
          codeLang = line.slice(3).trim();
        }
        continue;
      }

      if (inCodeBlock) {
        codeContent += line + "\n";
        continue;
      }

      if (line.startsWith("# ")) {
        el.createEl("h1", { text: line.slice(2) });
      } else if (line.startsWith("## ")) {
        el.createEl("h2", { text: line.slice(3) });
      } else if (line.startsWith("### ")) {
        el.createEl("h3", { text: line.slice(4) });
      } else if (line.startsWith("- ")) {
        el.createEl("li", { text: line.slice(2) });
      } else if (line.startsWith("> ")) {
        el.createEl("blockquote", { text: line.slice(2) });
      } else if (line === "") {
        el.createEl("br");
      } else {
        const p = el.createEl("p");
        this.renderInlineMarkdown(p, line);
      }
    }
  }

  private renderInlineMarkdown(el: HTMLElement, text: string) {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);

    for (const part of parts) {
      if (part.startsWith("**") && part.endsWith("**")) {
        el.createEl("strong", { text: part.slice(2, -2) });
      } else if (part.startsWith("`") && part.endsWith("`")) {
        el.createEl("code", { text: part.slice(1, -1) });
      } else if (part.startsWith("*") && part.endsWith("*")) {
        el.createEl("em", { text: part.slice(1, -1) });
      } else {
        el.createSpan({ text: part });
      }
    }
  }

  async loadChatHistory() {
    this.messagesEl.empty();

    const session = this.plugin.chatManager.getActiveSession();
    if (!session) return;

    for (const msg of session.messages) {
      const msgEl = this.messagesEl.createDiv({ cls: `opencode-message opencode-message-${msg.role}` });
      msgEl.createDiv({ cls: "opencode-message-header" }).createSpan({
        text: msg.role === MessageRole.USER ? "You" : msg.role === MessageRole.SYSTEM ? "System" : "OpenCode AI",
        cls: "opencode-message-role",
      });
      const contentEl = msgEl.createDiv({ cls: "opencode-message-content" });
      this.renderMarkdown(contentEl, msg.content);
    }

    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  updateState() {
    this.providerSelect.value = this.plugin.settings.activeProvider;
    this.updateModelsForProvider();
    this.modelSelect.value = this.plugin.settings.activeModel;
    this.updateModeToggle();
    this.loadChatHistory();
  }

  async onClose() {
    return;
  }
}
