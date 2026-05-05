export enum AIProvider {
  OPENAI = "openai",
  ANTHROPIC = "anthropic",
  OLLAMA = "ollama",
  OPENROUTER = "openrouter",
  DEEPSEEK = "deepseek",
  GROQ = "groq",
  MISTRAL = "mistral",
  CUSTOM = "custom",
}

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  maxTokens: number;
  supportsStreaming: boolean;
  supportsTools: boolean;
  contextWindow: number;
}

export enum AgentMode {
  CHAT = "chat",
  AGENT = "agent",
}

export enum MessageRole {
  USER = "user",
  ASSISTANT = "assistant",
  SYSTEM = "system",
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResult {
  id: string;
  name: string;
  output: string;
  isError: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  model: string;
  provider: AIProvider;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface OpenCodeAISettings {
  openaiApiKey: string;
  anthropicApiKey: string;
  ollamaBaseUrl: string;
  openrouterApiKey: string;
  deepseekApiKey: string;
  groqApiKey: string;
  mistralApiKey: string;
  customBaseUrl: string;
  customApiKey: string;
  activeProvider: AIProvider;
  activeModel: string;
  customModel: string;
  agentMode: AgentMode;
  maxTokens: number;
  temperature: number;
  systemPrompt: string;
  maxIterations: number;
  autoSaveChats: boolean;
  chatHistoryFolder: string;
  excludedPaths: string;
  includeCurrentNote: boolean;
  showTokenCount: boolean;
  streamResponse: boolean;
}

export interface StreamChunk {
  text: string;
  isComplete: boolean;
}
