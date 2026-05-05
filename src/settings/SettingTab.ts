import { App, PluginSettingTab, Setting, Notice } from "obsidian";
import OpenCodeAIPlugin from "../main";
import { AgentMode, AIProvider } from "../types";
import { SYSTEM_PROMPTS } from "../defaults";
import { OpenCodeAISettings } from "../types";

export class OpenCodeSettingTab extends PluginSettingTab {
  plugin: OpenCodeAIPlugin;

  constructor(app: App, plugin: OpenCodeAIPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "OpenCode AI Agent Settings" });

    containerEl.createEl("h3", { text: "API Keys" });

    new Setting(containerEl)
      .setName("OpenAI API Key")
      .setDesc("Get your key from https://platform.openai.com/api-keys")
      .addText((text) =>
        text
          .setPlaceholder("sk-...")
          .setValue(this.plugin.settings.openaiApiKey)
          .onChange(async (value) => {
            this.plugin.settings.openaiApiKey = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Anthropic API Key")
      .setDesc("Get your key from https://console.anthropic.com/settings/keys")
      .addText((text) =>
        text
          .setPlaceholder("sk-ant-...")
          .setValue(this.plugin.settings.anthropicApiKey)
          .onChange(async (value) => {
            this.plugin.settings.anthropicApiKey = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("OpenRouter API Key")
      .setDesc("Get your key from https://openrouter.ai/keys")
      .addText((text) =>
        text
          .setPlaceholder("sk-or-...")
          .setValue(this.plugin.settings.openrouterApiKey)
          .onChange(async (value) => {
            this.plugin.settings.openrouterApiKey = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("DeepSeek API Key")
      .setDesc("Get your key from https://platform.deepseek.com/")
      .addText((text) =>
        text
          .setPlaceholder("sk-...")
          .setValue(this.plugin.settings.deepseekApiKey)
          .onChange(async (value) => {
            this.plugin.settings.deepseekApiKey = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Groq API Key")
      .setDesc("Get your key from https://console.groq.com/keys")
      .addText((text) =>
        text
          .setPlaceholder("gsk_...")
          .setValue(this.plugin.settings.groqApiKey)
          .onChange(async (value) => {
            this.plugin.settings.groqApiKey = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Mistral API Key")
      .setDesc("Get your key from https://console.mistral.ai/")
      .addText((text) =>
        text
          .setPlaceholder("...")
          .setValue(this.plugin.settings.mistralApiKey)
          .onChange(async (value) => {
            this.plugin.settings.mistralApiKey = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Google API Key")
      .setDesc("Get your key from https://aistudio.google.com/apikey - Enables Gemini with free tier")
      .addText((text) =>
        text
          .setPlaceholder("AIza...")
          .setValue(this.plugin.settings.googleApiKey)
          .onChange(async (value) => {
            this.plugin.settings.googleApiKey = value;
            await this.plugin.saveSettings();
          })
      );

    containerEl.createEl("h3", { text: "Local Models" });

    new Setting(containerEl)
      .setName("Ollama Base URL")
      .setDesc("URL for your local Ollama instance")
      .addText((text) =>
        text
          .setPlaceholder("http://localhost:11434")
          .setValue(this.plugin.settings.ollamaBaseUrl)
          .onChange(async (value) => {
            this.plugin.settings.ollamaBaseUrl = value;
            await this.plugin.saveSettings();
          })
      );

    containerEl.createEl("h3", { text: "Model Settings" });

    new Setting(containerEl)
      .setName("Active Provider")
      .setDesc("Which AI provider to use by default")
      .addDropdown((dropdown) => {
        dropdown
          .addOption(AIProvider.OPENAI, "OpenAI")
          .addOption(AIProvider.ANTHROPIC, "Anthropic")
          .addOption(AIProvider.OLLAMA, "Ollama")
          .addOption(AIProvider.OPENROUTER, "OpenRouter")
          .addOption(AIProvider.DEEPSEEK, "DeepSeek")
          .addOption(AIProvider.GROQ, "Groq")
          .addOption(AIProvider.MISTRAL, "Mistral")
          .addOption(AIProvider.GOOGLE, "Google")
          .setValue(this.plugin.settings.activeProvider)
          .onChange(async (value) => {
            this.plugin.settings.activeProvider = value as AIProvider;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Active Model")
      .setDesc("Model to use for chat")
      .addText((text) =>
        text
          .setPlaceholder("gpt-4o")
          .setValue(this.plugin.settings.activeModel)
          .onChange(async (value) => {
            this.plugin.settings.activeModel = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Custom Model")
      .setDesc("Custom model name for OpenRouter or compatible APIs")
      .addText((text) =>
        text
          .setPlaceholder("anthropic/claude-3.5-sonnet")
          .setValue(this.plugin.settings.customModel)
          .onChange(async (value) => {
            this.plugin.settings.customModel = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Max Tokens")
      .setDesc("Maximum tokens in response")
      .addSlider((slider) =>
        slider
          .setLimits(256, 16384, 256)
          .setValue(this.plugin.settings.maxTokens)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.maxTokens = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Temperature")
      .setDesc("Controls randomness (0 = deterministic, 1 = creative)")
      .addSlider((slider) =>
        slider
          .setLimits(0, 1, 0.1)
          .setValue(this.plugin.settings.temperature)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.temperature = value;
            await this.plugin.saveSettings();
          })
      );

    containerEl.createEl("h3", { text: "Agent Mode" });

    new Setting(containerEl)
      .setName("Default Mode")
      .setDesc("Start in chat or agent mode")
      .addDropdown((dropdown) => {
        dropdown
          .addOption(AgentMode.CHAT, "Chat")
          .addOption(AgentMode.AGENT, "Agent")
          .setValue(this.plugin.settings.agentMode)
          .onChange(async (value) => {
            this.plugin.settings.agentMode = value as AgentMode;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Max Agent Iterations")
      .setDesc("Maximum tool call loops in agent mode")
      .addSlider((slider) =>
        slider
          .setLimits(1, 20, 1)
          .setValue(this.plugin.settings.maxIterations)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.maxIterations = value;
            await this.plugin.saveSettings();
          })
      );

    containerEl.createEl("h3", { text: "System Prompt" });

    new Setting(containerEl)
      .setName("System Prompt")
      .setDesc("Instructions for the AI assistant")
      .addTextArea((text) =>
        text
          .setPlaceholder("You are a helpful AI assistant...")
          .setValue(this.plugin.settings.systemPrompt)
          .onChange(async (value) => {
            this.plugin.settings.systemPrompt = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Quick Presets")
      .setDesc("Apply a predefined system prompt")
      .addDropdown((dropdown) => {
        dropdown
          .addOption("chat", "General Chat")
          .addOption("agent", "Autonomous Agent")
          .addOption("coding", "Coding Assistant")
          .setValue("chat")
          .onChange(async (value) => {
            const preset = SYSTEM_PROMPTS[value as keyof typeof SYSTEM_PROMPTS];
            if (preset) {
              this.plugin.settings.systemPrompt = preset;
              await this.plugin.saveSettings();
              this.display();
              new Notice("System prompt updated");
            }
          });
      });

    containerEl.createEl("h3", { text: "Chat History" });

    new Setting(containerEl)
      .setName("Chat History Folder")
      .setDesc("Where to save chat history")
      .addText((text) =>
        text
          .setPlaceholder(".opencode/chats")
          .setValue(this.plugin.settings.chatHistoryFolder)
          .onChange(async (value) => {
            this.plugin.settings.chatHistoryFolder = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Auto-Save Chats")
      .setDesc("Automatically save chat sessions as notes")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autoSaveChats)
          .onChange(async (value) => {
            this.plugin.settings.autoSaveChats = value;
            await this.plugin.saveSettings();
          })
      );

    containerEl.createEl("h3", { text: "Advanced" });

    new Setting(containerEl)
      .setName("Stream Response")
      .setDesc("Stream tokens as they are generated")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.streamResponse)
          .onChange(async (value) => {
            this.plugin.settings.streamResponse = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Show Token Count")
      .setDesc("Display token usage in the chat header")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showTokenCount)
          .onChange(async (value) => {
            this.plugin.settings.showTokenCount = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Reset Settings")
      .setDesc("Reset all settings to defaults")
      .addButton((btn) =>
        btn
          .setButtonText("Reset")
          .setWarning()
          .onClick(async () => {
            this.plugin.settings = Object.assign({}, require("../defaults").DEFAULT_SETTINGS);
            await this.plugin.saveSettings();
            this.display();
            new Notice("Settings reset to defaults");
          })
      );
  }
}
