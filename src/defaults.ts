import { OpenCodeAISettings, AgentMode, AIProvider } from "./types";
export { AIProvider } from "./types";

export const DEFAULT_SETTINGS: OpenCodeAISettings = {
  openaiApiKey: "",
  anthropicApiKey: "",
  ollamaBaseUrl: "http://localhost:11434",
  openrouterApiKey: "",
  deepseekApiKey: "",
  groqApiKey: "",
  mistralApiKey: "",
  customBaseUrl: "",
  customApiKey: "",
  activeProvider: AIProvider.OPENAI,
  activeModel: "gpt-4o",
  customModel: "",
  agentMode: AgentMode.CHAT,
  maxTokens: 4096,
  temperature: 0.7,
  systemPrompt: `You are an AI assistant integrated into Obsidian. You can read, write, and edit notes in the user's vault.

## Guidelines:
1. Be concise and direct
2. When editing notes, always show what you changed
3. Use markdown formatting for all note content
4. Prefer small, focused changes over large rewrites
5. Always check if a note exists before editing it
6. When in agent mode, work autonomously to complete requests

## Available Tools:
- read_note: Read the contents of a note
- write_note: Create or replace a note
- edit_note: Make targeted edits to a note
- search_notes: Search for notes by name or content
- list_notes: List all notes in a folder
- delete_note: Delete a note
- append_to_note: Append content to an existing note

## Safety:
- Never delete notes without explicit confirmation
- Always backup important content before modifying`,
  maxIterations: 10,
  autoSaveChats: true,
  chatHistoryFolder: ".opencode/chats",
  excludedPaths: ".trash,.obsidian/templates",
  includeCurrentNote: false,
  showTokenCount: true,
  streamResponse: true,
};

export const SYSTEM_PROMPTS = {
  chat: `You are a helpful AI assistant in Obsidian. Answer questions, help with writing, and assist with note-taking.`,
  agent: `You are an autonomous AI agent in Obsidian. You have tools to read, write, edit, and search notes. Work step by step to complete the user's request. Make one tool call at a time and wait for results before proceeding.`,
  coding: `You are a coding assistant. Help with code explanations, debugging, and writing code snippets. Use markdown code blocks for all code.`,
};

export const COMMANDS = {
  NEW_CHAT: "opencode:new-chat",
  TOGGLE_AGENT: "opencode:toggle-agent-mode",
  SEND_TO_CHAT: "opencode:send-selection",
  OPEN_CHAT: "opencode:open-chat",
  QUICK_ASK: "opencode:quick-ask",
} as const;
