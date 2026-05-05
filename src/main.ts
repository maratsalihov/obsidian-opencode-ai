import { Plugin, WorkspaceLeaf, addIcon, Notice } from "obsidian";
import { OpenCodeAISettings, AIProvider, AgentMode } from "./types";
import { DEFAULT_SETTINGS } from "./defaults";
import { ProviderManager } from "./providers/ProviderManager";
import { ChatManager } from "./core/ChatManager";
import { VaultToolRegistry } from "./tools/ToolRegistry";
import { OpenCodeChatView, CHAT_VIEW_TYPE } from "./views/ChatView";
import { OpenCodeSettingTab } from "./settings/SettingTab";
import { OpenCodeIcon } from "./icons";

export default class OpenCodeAIPlugin extends Plugin {
  settings: OpenCodeAISettings;
  providerManager: ProviderManager;
  chatManager: ChatManager;

  async onload() {
    await this.loadSettings();

    addIcon("opencode", OpenCodeIcon);

    this.providerManager = new ProviderManager();
    this.providerManager.initialize(
      this.settings.openaiApiKey,
      this.settings.anthropicApiKey,
      this.settings.ollamaBaseUrl,
      this.settings.openrouterApiKey,
      this.settings.deepseekApiKey,
      this.settings.groqApiKey,
      this.settings.mistralApiKey
    );

    this.chatManager = new ChatManager(this.app.vault, this.providerManager);
    this.chatManager.setSystemPrompt(this.settings.systemPrompt);
    this.chatManager.setModel(this.settings.activeModel, this.settings.activeProvider);
    this.chatManager.setAgentMode(this.settings.agentMode);
    this.chatManager.setChatHistoryFolder(this.settings.chatHistoryFolder);

    VaultToolRegistry.getInstance().initialize(this.app.vault);

    this.registerView(CHAT_VIEW_TYPE, (leaf) => new OpenCodeChatView(leaf, this));

    this.addRibbonIcon("opencode", "Open OpenCode AI Chat", () => {
      this.activateView();
    });

    this.addCommand({
      id: "open-chat",
      name: "Open AI Chat",
      callback: () => this.activateView(),
    });

    this.addCommand({
      id: "new-chat",
      name: "Start New Chat",
      callback: () => {
        this.chatManager.createSession();
        this.activateView();
      },
    });

    this.addCommand({
      id: "toggle-agent-mode",
      name: "Toggle Agent Mode",
      callback: () => {
        const newMode = this.settings.agentMode === AgentMode.AGENT ? AgentMode.CHAT : AgentMode.AGENT;
        this.settings.agentMode = newMode;
        this.chatManager.setAgentMode(newMode);
        this.saveSettings();
        new Notice(`Agent mode ${newMode === AgentMode.AGENT ? "enabled" : "disabled"}`);
      },
    });

    this.addCommand({
      id: "send-selection",
      name: "Send Selection to AI Chat",
      editorCallback: (editor) => {
        const text = editor.getSelection();
        if (text) {
          this.activateView();
          setTimeout(() => {
            this.chatManager.sendMessage(`Selected text:\n\n${text}`);
          }, 500);
        }
      },
    });

    this.addSettingTab(new OpenCodeSettingTab(this.app, this));

    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => {
        this.updateChatView();
      })
    );

    this.addStatusBarItem().createEl("span", { text: "OpenCode AI" });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);

    this.providerManager.initialize(
      this.settings.openaiApiKey,
      this.settings.anthropicApiKey,
      this.settings.ollamaBaseUrl,
      this.settings.openrouterApiKey,
      this.settings.deepseekApiKey,
      this.settings.groqApiKey,
      this.settings.mistralApiKey
    );

    this.chatManager.setSystemPrompt(this.settings.systemPrompt);
    this.chatManager.setModel(this.settings.activeModel, this.settings.activeProvider);
    this.chatManager.setAgentMode(this.settings.agentMode);
    this.chatManager.setChatHistoryFolder(this.settings.chatHistoryFolder);
  }

  async activateView() {
    const { workspace } = this.app;
    let leaf: WorkspaceLeaf | null = null;

    const leaves = workspace.getLeavesOfType(CHAT_VIEW_TYPE);
    if (leaves.length > 0) {
      leaf = leaves[0];
    } else {
      leaf = workspace.getRightLeaf(false);
      if (leaf) {
        await leaf.setViewState({ type: CHAT_VIEW_TYPE, active: true });
      }
    }

    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }

  updateChatView() {
    const leaves = this.app.workspace.getLeavesOfType(CHAT_VIEW_TYPE);
    for (const leaf of leaves) {
      const view = leaf.view as OpenCodeChatView;
      if (view instanceof OpenCodeChatView) {
        view.updateState();
      }
    }
  }

  onunload() {}
}
