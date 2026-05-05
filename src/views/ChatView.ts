import { ItemView, WorkspaceLeaf, setIcon, Notice, Modal, App } from "obsidian";
import OpenCodeAIPlugin from "../main";
import { AIProvider, AgentMode, ChatSession, MessageRole, ALL_MODELS, AIModel } from "../types";

export const CHAT_VIEW_TYPE = "opencode-chat-view";

export class ModelPickerModal extends Modal {
  selectedModel: AIModel | null = null;
  onSelect: (model: AIModel) => void;

  constructor(app: App, onSelect: (model: AIModel) => void) {
    super(app);
    this.onSelect = onSelect;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("opencode-model-picker");

    contentEl.createEl("h2", { text: "Select AI Model" });

    // Free models section
    const freeHeader = contentEl.createDiv({ cls: "opencode-model-section-header" });
    freeHeader.createEl("h3", { text: "FREE" });
    freeHeader.createSpan({ text: "No API key needed", cls: "opencode-model-section-desc" });

    const freeModels = ALL_MODELS.filter((m) => m.isFree);
    for (const model of freeModels) {
      this.addModelButton(contentEl, model);
    }

    // Paid models sections by provider
    const providers = [
      { key: AIProvider.ANTHROPIC, label: "Anthropic" },
      { key: AIProvider.OPENAI, label: "OpenAI" },
      { key: AIProvider.GOOGLE, label: "Google" },
      { key: AIProvider.DEEPSEEK, label: "DeepSeek" },
      { key: AIProvider.GROQ, label: "Groq" },
      { key: AIProvider.MISTRAL, label: "Mistral" },
    ];

    for (const provider of providers) {
      const providerModels = ALL_MODELS.filter((m) => m.provider === provider.key && !m.isFree);
      if (providerModels.length === 0) continue;

      const header = contentEl.createDiv({ cls: "opencode-model-section-header" });
      header.createEl("h3", { text: provider.label });

      for (const model of providerModels) {
        this.addModelButton(contentEl, model);
      }
    }
  }

  private addModelButton(container: HTMLElement, model: AIModel) {
    const btn = container.createDiv({ cls: "opencode-model-item" });

    const info = btn.createDiv({ cls: "opencode-model-info" });
    const nameRow = info.createDiv({ cls: "opencode-model-name-row" });

    if (model.isFree) {
      nameRow.createEl("span", { text: "FREE", cls: "opencode-model-badge-free" });
    }

    nameRow.createEl("span", { text: model.name, cls: "opencode-model-name" });

    if (model.description) {
      info.createEl("span", { text: model.description, cls: "opencode-model-desc" });
    }

    const meta = info.createDiv({ cls: "opencode-model-meta" });
    if (model.inputPrice) {
      meta.createSpan({ text: `Input: ${model.inputPrice}`, cls: "opencode-model-price" });
    }
    meta.createSpan({ text: `Context: ${(model.contextWindow / 1000).toFixed(0)}K`, cls: "opencode-model-context" });

    btn.addEventListener("click", () => {
      this.selectedModel = model;
      this.onSelect(model);
      this.close();
    });
  }

  onClose() {
    this.contentEl.empty();
  }
}

export class OpenCodeChatView extends ItemView {
  plugin: OpenCodeAIPlugin;
  private inputEl: HTMLTextAreaElement;
  private messagesEl: HTMLElement;
  private modelDisplayEl: HTMLElement;
  private modeToggleEl: HTMLElement;
  private isStreaming: boolean = false;

  constructor(leaf: WorkspaceLeaf, plugin: OpenCodeAIPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return CHAT_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "OpenCode AI";
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

    this.updateModelDisplay();
    this.updateModeDisplay();
    this.loadChatHistory();
  }

  private buildHeader(container: HTMLElement) {
    const header = container.createDiv({ cls: "opencode-chat-header" });

    // Model selector (ZED-style)
    this.modelDisplayEl = header.createDiv({ cls: "opencode-model-display" });
    this.modelDisplayEl.addEventListener("click", () => this.openModelPicker());

    // Mode toggle
    this.modeToggleEl = header.createDiv({ cls: "opencode-mode-toggle" });
    this.modeToggleEl.addEventListener("click", () => this.toggleMode());
  }

  private openModelPicker() {
    const modal = new ModelPickerModal(this.app, (model) => {
      this.plugin.settings.activeModel = model.id;
      this.plugin.settings.activeProvider = model.provider;
      this.plugin.chatManager.setModel(model.id, model.provider);
      this.plugin.saveSettings();
      this.updateModelDisplay();
      new Notice(`Switched to ${model.name}`);
    });
    modal.open();
  }

  private updateModelDisplay() {
    this.modelDisplayEl.empty();

    const model = ALL_MODELS.find((m) => m.id === this.plugin.settings.activeModel);
    if (!model) {
      this.modelDisplayEl.createSpan({ text: this.plugin.settings.activeModel, cls: "opencode-model-display-name" });
      return;
    }

    const nameEl = this.modelDisplayEl.createSpan({ text: model.name, cls: "opencode-model-display-name" });
    if (model.isFree) {
      nameEl.createEl("span", { text: "FREE", cls: "opencode-model-badge-inline" });
    }

    this.modelDisplayEl.createSpan({ text: model.provider.toUpperCase(), cls: "opencode-model-display-provider" });

    const chevron = this.modelDisplayEl.createEl("span", { cls: "opencode-model-chevron" });
    setIcon(chevron, "chevron-down");
  }

  private toggleMode() {
    const newMode = this.plugin.settings.agentMode === AgentMode.AGENT ? AgentMode.CHAT : AgentMode.AGENT;
    this.plugin.settings.agentMode = newMode;
    this.plugin.chatManager.setAgentMode(newMode);
    this.plugin.saveSettings();
    this.updateModeDisplay();
    new Notice(`Mode: ${newMode === AgentMode.AGENT ? "Agent" : "Chat"}`);
  }

  private updateModeDisplay() {
    this.modeToggleEl.empty();
    const isAgent = this.plugin.settings.agentMode === AgentMode.AGENT;
    this.modeToggleEl.addClass("opencode-mode-btn", isAgent ? "opencode-mode-agent" : "opencode-mode-chat");

    const icon = this.modeToggleEl.createEl("span", { cls: "opencode-mode-icon" });
    setIcon(icon, isAgent ? "zap" : "message-square");
    this.modeToggleEl.createSpan({ text: isAgent ? "Agent" : "Chat" });
  }

  private buildMessagesArea(container: HTMLElement) {
    const wrapper = container.createDiv({ cls: "opencode-messages-wrapper" });
    this.messagesEl = wrapper.createDiv({ cls: "opencode-messages" });
  }

  private buildInputArea(container: HTMLElement) {
    const inputArea = container.createDiv({ cls: "opencode-input-area" });

    // File context indicator
    const contextBar = inputArea.createDiv({ cls: "opencode-context-bar" });
    contextBar.createSpan({ text: "Agent can read, write & edit files", cls: "opencode-context-hint" });

    this.inputEl = inputArea.createEl("textarea", {
      cls: "opencode-input",
      attr: { placeholder: "Ask me to create, edit, or search files...", rows: "1" },
    });

    this.inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    this.inputEl.addEventListener("input", () => this.autoResize());

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

    try {
      await this.plugin.chatManager.sendMessage(content, (chunk) => {
        if (chunk.text) {
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

    this.loadChatHistory();
  }

  private addMessage(role: MessageRole, content: string, isStreaming: boolean = false): HTMLElement {
    const msgEl = this.messagesEl.createDiv({ cls: `opencode-message opencode-message-${role}` });

    const header = msgEl.createDiv({ cls: "opencode-message-header" });
    const roleText = role === MessageRole.USER ? "You" : "OpenCode";
    header.createSpan({ text: roleText, cls: "opencode-message-role" });

    if (isStreaming) {
      const status = header.createSpan({ text: "working...", cls: "opencode-message-status" });
      status.addClass("opencode-status-working");
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
    let inCode = false;
    let codeBuf = "";
    let codeLang = "";

    for (const line of lines) {
      if (line.startsWith("```")) {
        if (inCode) {
          const pre = el.createEl("pre", { cls: "opencode-code-block" });
          if (codeLang) pre.createDiv({ cls: "opencode-code-lang", text: codeLang });
          pre.createEl("code", { text: codeBuf });
          inCode = false;
          codeBuf = "";
          codeLang = "";
        } else {
          inCode = true;
          codeLang = line.slice(3).trim();
        }
        continue;
      }

      if (inCode) { codeBuf += line + "\n"; continue; }

      if (line.startsWith("# ")) el.createEl("h1", { text: line.slice(2) });
      else if (line.startsWith("## ")) el.createEl("h2", { text: line.slice(3) });
      else if (line.startsWith("### ")) el.createEl("h3", { text: line.slice(4) });
      else if (line.startsWith("- ")) el.createEl("li", { text: line.slice(2) });
      else if (line.startsWith("> ")) el.createEl("blockquote", { text: line.slice(2) });
      else if (line === "") el.createEl("br");
      else {
        const p = el.createEl("p");
        this.renderInline(p, line);
      }
    }
  }

  private renderInline(el: HTMLElement, text: string) {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
    for (const part of parts) {
      if (part.startsWith("**") && part.endsWith("**")) el.createEl("strong", { text: part.slice(2, -2) });
      else if (part.startsWith("`") && part.endsWith("`")) el.createEl("code", { text: part.slice(1, -1) });
      else if (part.startsWith("*") && part.endsWith("*")) el.createEl("em", { text: part.slice(1, -1) });
      else el.createSpan({ text: part });
    }
  }

  async loadChatHistory() {
    this.messagesEl.empty();
    const session = this.plugin.chatManager.getActiveSession();
    if (!session) return;

    for (const msg of session.messages) {
      const msgEl = this.messagesEl.createDiv({ cls: `opencode-message opencode-message-${msg.role}` });
      msgEl.createDiv({ cls: "opencode-message-header" }).createSpan({
        text: msg.role === MessageRole.USER ? "You" : msg.role === MessageRole.SYSTEM ? "System" : "OpenCode",
        cls: "opencode-message-role",
      });
      const contentEl = msgEl.createDiv({ cls: "opencode-message-content" });
      if (msg.isError) contentEl.addClass("opencode-message-error");
      this.renderMarkdown(contentEl, msg.content);
    }

    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  async onClose() {
    return;
  }
}
