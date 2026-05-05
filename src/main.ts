import { Plugin, WorkspaceLeaf, addIcon, setIcon, Notice, Modal, Setting, App, ItemView, PluginSettingTab } from "obsidian";

export const CHAT_VIEW_TYPE = "opencode-chat-view";

export const DEFAULT_SETTINGS: OpenCodeSettings = {
  openaiApiKey: "",
  anthropicApiKey: "",
  ollamaBaseUrl: "http://localhost:11434",
  openrouterApiKey: "",
  deepseekApiKey: "",
  groqApiKey: "",
  mistralApiKey: "",
  googleApiKey: "",
  activeProvider: "openrouter",
  activeModel: "meta-llama/llama-3.1-8b-instruct:free",
  agentMode: "agent",
  maxTokens: 8192,
  temperature: 0.7,
  systemPrompt: `You are OpenCode AI, an AI assistant integrated into Obsidian.

## Guidelines:
- Always read notes before editing
- Make minimal targeted changes
- Show what you changed
- Use markdown formatting
- Never delete without confirmation`,
  maxIterations: 15,
  autoSaveChats: true,
  chatHistoryFolder: ".opencode/chats",
  streamResponse: true,
};

export interface OpenCodeSettings {
  openaiApiKey: string;
  anthropicApiKey: string;
  ollamaBaseUrl: string;
  openrouterApiKey: string;
  deepseekApiKey: string;
  groqApiKey: string;
  mistralApiKey: string;
  googleApiKey: string;
  activeProvider: string;
  activeModel: string;
  agentMode: string;
  maxTokens: number;
  temperature: number;
  systemPrompt: string;
  maxIterations: number;
  autoSaveChats: boolean;
  chatHistoryFolder: string;
  streamResponse: boolean;
}

export const OpenCodeIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"><path d="M30 20 L10 50 L30 80"/><path d="M70 20 L90 50 L70 80"/><path d="M55 15 L45 85"/></svg>`;

interface ModelOption {
  id: string;
  name: string;
  provider: string;
  free: boolean;
}

const MODEL_OPTIONS: ModelOption[] = [
  { id: "meta-llama/llama-3.1-8b-instruct:free", name: "Llama 3.1 8B", provider: "openrouter", free: true },
  { id: "google/gemma-2-9b-it:free", name: "Gemma 2 9B", provider: "openrouter", free: true },
  { id: "qwen/qwen-2.5-coder-32b-instruct:free", name: "Qwen 2.5 Coder 32B", provider: "openrouter", free: true },
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", provider: "groq", free: true },
  { id: "llama3.2", name: "Llama 3.2 (Local)", provider: "ollama", free: true },
  { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", provider: "anthropic", free: false },
  { id: "gpt-4o", name: "GPT-4o", provider: "openai", free: false },
  { id: "gpt-4o-mini", name: "GPT-4o mini", provider: "openai", free: false },
  { id: "deepseek-chat", name: "DeepSeek Chat V3", provider: "deepseek", free: false },
];

export default class OpenCodeAIPlugin extends Plugin {
  settings: OpenCodeSettings;

  async onload() {
    await this.loadSettings();
    addIcon("opencode", OpenCodeIcon);
    this.registerView(CHAT_VIEW_TYPE, (leaf) => new OpenCodeChatView(leaf, this));
    this.addRibbonIcon("opencode", "OpenCode AI Chat", () => this.activateView());
    this.addCommand({ id: "open-chat", name: "Open AI Chat", callback: () => this.activateView() });
    this.addCommand({ id: "new-chat", name: "Start New Chat", callback: () => this.activateView() });
    this.addCommand({
      id: "toggle-agent",
      name: "Toggle Agent Mode",
      callback: () => {
        this.settings.agentMode = this.settings.agentMode === "agent" ? "chat" : "agent";
        this.saveSettings();
        new Notice(`Mode: ${this.settings.agentMode}`);
      },
    });
    this.addSettingTab(new OpenCodeSettingTab(this.app, this));
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async activateView() {
    const { workspace } = this.app;
    let leaf: WorkspaceLeaf | null = workspace.getLeavesOfType(CHAT_VIEW_TYPE)[0] || null;
    if (!leaf) {
      leaf = workspace.getRightLeaf(false);
      if (leaf) await leaf.setViewState({ type: CHAT_VIEW_TYPE, active: true });
    }
    if (leaf) workspace.revealLeaf(leaf);
  }
}

class OpenCodeChatView extends ItemView {
  plugin: OpenCodeAIPlugin;
  inputEl!: HTMLTextAreaElement;
  messagesEl!: HTMLElement;
  modelBtn!: HTMLElement;
  modeBtn!: HTMLElement;

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
    container.addClass("opencode-container");

    const header = container.createDiv({ cls: "opencode-header" });
    this.modelBtn = header.createDiv({ cls: "opencode-model-btn" });
    this.updateModelBtn();
    this.modelBtn.addEventListener("click", () => this.pickModel());

    this.modeBtn = header.createDiv({ cls: "opencode-mode-btn" });
    this.updateModeBtn();
    this.modeBtn.addEventListener("click", () => this.toggleMode());

    this.messagesEl = container.createDiv({ cls: "opencode-messages" });

    const inputArea = container.createDiv({ cls: "opencode-input-area" });
    this.inputEl = inputArea.createEl("textarea", {
      cls: "opencode-input",
      attr: { placeholder: "Ask me anything...", rows: "1" },
    });
    this.inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.send();
      }
    });
    this.inputEl.addEventListener("input", () => {
      this.inputEl.style.height = "auto";
      this.inputEl.style.height = Math.min(this.inputEl.scrollHeight, 200) + "px";
    });

    const sendBtn = inputArea.createDiv({ cls: "opencode-send-btn" });
    setIcon(sendBtn, "arrow-up");
    sendBtn.addEventListener("click", () => this.send());

    this.addMessage("system", "OpenCode AI ready. Click the model name to switch models.");
  }

  updateModelBtn() {
    this.modelBtn.empty();
    const m = this.plugin.settings.activeModel.split("/").pop() || this.plugin.settings.activeModel;
    this.modelBtn.createSpan({ text: m });
    this.modelBtn.createSpan({ cls: "opencode-model-provider", text: this.plugin.settings.activeProvider.toUpperCase() });
  }

  updateModeBtn() {
    this.modeBtn.empty();
    const isAgent = this.plugin.settings.agentMode === "agent";
    this.modeBtn.toggleClass("agent", isAgent);
    setIcon(this.modeBtn, isAgent ? "zap" : "message-square");
    this.modeBtn.createSpan({ text: isAgent ? "Agent" : "Chat" });
  }

  pickModel() {
    const modal = new Modal(this.app);
    modal.titleEl.setText("Select Model");
    const c = modal.contentEl;

    c.createEl("h4", { text: "FREE MODELS" });
    for (const m of MODEL_OPTIONS.filter((x) => x.free)) this.addModelOption(c, m, modal);

    c.createEl("h4", { text: "PAID MODELS" });
    for (const m of MODEL_OPTIONS.filter((x) => !x.free)) this.addModelOption(c, m, modal);

    modal.open();
  }

  addModelOption(container: HTMLElement, model: ModelOption, modal: Modal) {
    const btn = container.createDiv({ cls: "opencode-model-option" });
    btn.createSpan({ text: model.name });
    if (model.free) btn.createSpan({ cls: "opencode-free-badge", text: "FREE" });
    if (this.plugin.settings.activeModel === model.id) btn.addClass("active");
    btn.addEventListener("click", () => {
      this.plugin.settings.activeModel = model.id;
      this.plugin.settings.activeProvider = model.provider;
      this.plugin.saveSettings();
      this.updateModelBtn();
      modal.close();
      new Notice(`Model: ${model.name}`);
    });
  }

  toggleMode() {
    this.plugin.settings.agentMode = this.plugin.settings.agentMode === "agent" ? "chat" : "agent";
    this.plugin.saveSettings();
    this.updateModeBtn();
    new Notice(`Mode: ${this.plugin.settings.agentMode}`);
  }

  async send() {
    const text = this.inputEl.value.trim();
    if (!text) return;
    this.inputEl.value = "";
    this.inputEl.style.height = "auto";
    this.addMessage("user", text);
    const loadingEl = this.addMessage("assistant", "Thinking...", true);
    try {
      const response = await this.callAI(text);
      const textEl = loadingEl.querySelector(".opencode-msg-text");
      if (textEl) textEl.setText(response);
      const statusEl = loadingEl.querySelector(".opencode-msg-status");
      if (statusEl) statusEl.remove();
    } catch (e) {
      const textEl = loadingEl.querySelector(".opencode-msg-text");
      if (textEl) textEl.setText(`Error: ${(e as Error).message}`);
      const statusEl = loadingEl.querySelector(".opencode-msg-status");
      if (statusEl) statusEl.remove();
    }
  }

  async callAI(prompt: string): Promise<string> {
    const provider = this.plugin.settings.activeProvider;
    const model = this.plugin.settings.activeModel;
    const s = this.plugin.settings;

    const messages = [
      { role: "system", content: s.systemPrompt },
      { role: "user", content: prompt },
    ];

    let apiKey = "";
    let baseUrl = "";
    if (provider === "openai") {
      apiKey = s.openaiApiKey;
      baseUrl = "https://api.openai.com/v1";
    } else if (provider === "anthropic") {
      apiKey = s.anthropicApiKey;
      baseUrl = "https://api.anthropic.com";
    } else if (provider === "openrouter") {
      apiKey = s.openrouterApiKey;
      baseUrl = "https://openrouter.ai/api/v1";
    } else if (provider === "deepseek") {
      apiKey = s.deepseekApiKey;
      baseUrl = "https://api.deepseek.com/v1";
    } else if (provider === "groq") {
      apiKey = s.groqApiKey;
      baseUrl = "https://api.groq.com/openai/v1";
    } else if (provider === "mistral") {
      apiKey = s.mistralApiKey;
      baseUrl = "https://api.mistral.ai/v1";
    } else if (provider === "google") {
      apiKey = s.googleApiKey;
      baseUrl = "https://generativelanguage.googleapis.com/v1beta/openai";
    } else if (provider === "ollama") {
      baseUrl = s.ollamaBaseUrl;
    }

    if (!apiKey && provider !== "ollama") throw new Error(`API key not set for ${provider}`);

    if (provider === "ollama") {
      const res = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, stream: false }),
      });
      if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
      const data = await res.json();
      return data.message?.content || "No response";
    }

    if (provider === "anthropic") {
      const sysMsg = messages.find((m) => m.role === "system");
      const chatMsgs = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));
      const res = await fetch(`${baseUrl}/v1/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "anthropic-version": "2023-06-01", "x-api-key": apiKey },
        body: JSON.stringify({ model, messages: chatMsgs, max_tokens: s.maxTokens, system: sysMsg?.content }),
      });
      if (!res.ok) throw new Error(`Anthropic error: ${await res.text()}`);
      const data = await res.json();
      return data.content?.find((b: { type: string }) => b.type === "text")?.text || "No response";
    }

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages, max_tokens: s.maxTokens }),
    });
    if (!res.ok) throw new Error(`${provider} error: ${await res.text()}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "No response";
  }

  addMessage(role: string, text: string, loading = false): HTMLElement {
    const el = this.messagesEl.createDiv({ cls: `opencode-msg opencode-msg-${role}` });
    const header = el.createDiv({ cls: "opencode-msg-header" });
    header.createSpan({ text: role === "user" ? "You" : role === "system" ? "System" : "OpenCode", cls: "opencode-msg-role" });
    if (loading) el.createDiv({ cls: "opencode-msg-status", text: "typing..." });
    el.createDiv({ cls: "opencode-msg-text", text });
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    return el;
  }

  async onClose() {
    return;
  }
}

class OpenCodeSettingTab extends PluginSettingTab {
  plugin: OpenCodeAIPlugin;

  constructor(app: App, plugin: OpenCodeAIPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "OpenCode AI Agent Settings" });

    const providers: { key: keyof OpenCodeSettings; name: string; placeholder: string }[] = [
      { key: "openaiApiKey", name: "OpenAI API Key", placeholder: "sk-..." },
      { key: "anthropicApiKey", name: "Anthropic API Key", placeholder: "sk-ant-..." },
      { key: "openrouterApiKey", name: "OpenRouter API Key", placeholder: "sk-or-..." },
      { key: "deepseekApiKey", name: "DeepSeek API Key", placeholder: "sk-..." },
      { key: "groqApiKey", name: "Groq API Key", placeholder: "gsk_..." },
      { key: "mistralApiKey", name: "Mistral API Key", placeholder: "..." },
      { key: "googleApiKey", name: "Google API Key (Gemini)", placeholder: "AIza..." },
    ];

    containerEl.createEl("h3", { text: "API Keys" });
    for (const p of providers) {
      new Setting(containerEl)
        .setName(p.name)
        .addText((t) =>
          t.setPlaceholder(p.placeholder).setValue(this.plugin.settings[p.key] as string).onChange(async (v) => {
            (this.plugin.settings[p.key] as string) = v;
            await this.plugin.saveSettings();
          })
        );
    }

    new Setting(containerEl)
      .setName("Ollama Base URL")
      .addText((t) =>
        t.setPlaceholder("http://localhost:11434").setValue(this.plugin.settings.ollamaBaseUrl).onChange(async (v) => {
          this.plugin.settings.ollamaBaseUrl = v;
          await this.plugin.saveSettings();
        })
      );

    containerEl.createEl("h3", { text: "Model" });
    new Setting(containerEl)
      .setName("Active Provider")
      .addText((t) =>
        t.setValue(this.plugin.settings.activeProvider).onChange(async (v) => {
          this.plugin.settings.activeProvider = v;
          await this.plugin.saveSettings();
        })
      );
    new Setting(containerEl)
      .setName("Active Model")
      .addText((t) =>
        t.setValue(this.plugin.settings.activeModel).onChange(async (v) => {
          this.plugin.settings.activeModel = v;
          await this.plugin.saveSettings();
        })
      );

    containerEl.createEl("h3", { text: "System Prompt" });
    new Setting(containerEl)
      .setName("System Prompt")
      .addTextArea((t) =>
        t.setValue(this.plugin.settings.systemPrompt).onChange(async (v) => {
          this.plugin.settings.systemPrompt = v;
          await this.plugin.saveSettings();
        })
      );
  }
}
