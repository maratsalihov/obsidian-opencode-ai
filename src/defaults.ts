import { OpenCodeAISettings, AgentMode, AIProvider } from "./types";

export const DEFAULT_SETTINGS: OpenCodeAISettings = {
  openaiApiKey: "",
  anthropicApiKey: "",
  ollamaBaseUrl: "http://localhost:11434",
  openrouterApiKey: "",
  deepseekApiKey: "",
  groqApiKey: "",
  mistralApiKey: "",
  googleApiKey: "",
  customBaseUrl: "",
  customApiKey: "",
  activeProvider: AIProvider.OPENROUTER,
  activeModel: "meta-llama/llama-3.1-8b-instruct:free",
  customModel: "",
  agentMode: AgentMode.AGENT,
  maxTokens: 8192,
  temperature: 0.7,
  systemPrompt: `You are OpenCode AI, a powerful coding assistant integrated into Obsidian. You can read, write, edit, and search files in the user's vault.

## Your Capabilities:
1. **read_file** - Read any file in the vault
2. **write_file** - Create new files or replace existing ones
3. **edit_file** - Make targeted SEARCH/REPLACE edits
4. **delete_file** - Delete files
5. **rename_file** - Rename/move files
6. **list_files** - List files in a directory
7. **search_files** - Search for files by name or content
8. **create_folder** - Create new directories

## Guidelines:
- Always read files before editing them
- Make minimal, targeted changes
- Show what you changed after editing
- Use markdown formatting for notes
- When creating multiple files, do it one at a time
- Never delete files without confirmation

## File Editing Format:
When using edit_file, provide clear SEARCH/REPLACE blocks:
- The SEARCH text must match exactly
- The REPLACE text is what replaces it
- You can make multiple edits in one call`,
  maxIterations: 15,
  autoSaveChats: true,
  chatHistoryFolder: ".opencode/chats",
  excludedPaths: ".trash,.obsidian",
  showTokenCount: true,
  streamResponse: true,
  selectedWorkspace: "",
};

export const SYSTEM_PROMPTS = {
  chat: `You are a helpful AI assistant in Obsidian. Answer questions and assist with note-taking.`,
  agent: `You are an autonomous AI agent with file editing capabilities. You can read, write, edit, search, and manage files. Work step by step to complete tasks.`,
  coding: `You are an expert coding assistant. Help write, debug, and explain code. Use markdown code blocks.`,
};
