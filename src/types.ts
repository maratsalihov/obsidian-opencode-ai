export enum AIProvider {
  OPENAI = "openai",
  ANTHROPIC = "anthropic",
  OLLAMA = "ollama",
  OPENROUTER = "openrouter",
  DEEPSEEK = "deepseek",
  GROQ = "groq",
  MISTRAL = "mistral",
  GOOGLE = "google",
  CUSTOM = "custom",
}

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  maxTokens: number;
  contextWindow: number;
  isFree: boolean;
  requiresApiKey: boolean;
  supportsImages: boolean;
  supportsTools: boolean;
  inputPrice?: string;
  outputPrice?: string;
  description?: string;
}

export const ALL_MODELS: AIModel[] = [
  // === FREE MODELS (no API key needed) ===
  { id: "llama3.2", name: "Llama 3.2 (Free)", provider: AIProvider.OLLAMA, maxTokens: 8192, contextWindow: 128000, isFree: true, requiresApiKey: false, supportsImages: false, supportsTools: true, description: "Local, free, fast — Ollama required" },
  { id: "llama3.1:70b", name: "Llama 3.1 70B (Free)", provider: AIProvider.OLLAMA, maxTokens: 8192, contextWindow: 128000, isFree: true, requiresApiKey: false, supportsImages: false, supportsTools: true, description: "Local, free, powerful — Ollama required" },
  { id: "qwen2.5-coder:32b", name: "Qwen 2.5 Coder 32B (Free)", provider: AIProvider.OLLAMA, maxTokens: 8192, contextWindow: 32000, isFree: true, requiresApiKey: false, supportsImages: false, supportsTools: true, description: "Local coding specialist — Ollama required" },
  { id: "deepseek-coder-v2:16b", name: "DeepSeek Coder V2 (Free)", provider: AIProvider.OLLAMA, maxTokens: 8192, contextWindow: 32000, isFree: true, requiresApiKey: false, supportsImages: false, supportsTools: true, description: "Local coding expert — Ollama required" },
  { id: "deepseek-r1:8b", name: "DeepSeek R1 8B (Free)", provider: AIProvider.OLLAMA, maxTokens: 8192, contextWindow: 32000, isFree: true, requiresApiKey: false, supportsImages: false, supportsTools: true, description: "Local reasoning model — Ollama required" },
  { id: "phi3", name: "Phi-3 (Free)", provider: AIProvider.OLLAMA, maxTokens: 4096, contextWindow: 128000, isFree: true, requiresApiKey: false, supportsImages: false, supportsTools: true, description: "Tiny local model — Ollama required" },

  // === OpenRouter FREE ===
  { id: "meta-llama/llama-3.1-8b-instruct:free", name: "Llama 3.1 8B (Free via OpenRouter)", provider: AIProvider.OPENROUTER, maxTokens: 8192, contextWindow: 128000, isFree: true, requiresApiKey: true, supportsImages: false, supportsTools: false, description: "Free tier on OpenRouter" },
  { id: "google/gemma-2-9b-it:free", name: "Gemma 2 9B (Free via OpenRouter)", provider: AIProvider.OPENROUTER, maxTokens: 8192, contextWindow: 8192, isFree: true, requiresApiKey: true, supportsImages: false, supportsTools: false, description: "Free tier on OpenRouter" },
  { id: "qwen/qwen-2.5-coder-32b-instruct:free", name: "Qwen 2.5 Coder 32B (Free via OpenRouter)", provider: AIProvider.OPENROUTER, maxTokens: 8192, contextWindow: 32000, isFree: true, requiresApiKey: true, supportsImages: false, supportsTools: false, description: "Free tier on OpenRouter" },
  { id: "mistralai/mistral-nemo:free", name: "Mistral Nemo (Free via OpenRouter)", provider: AIProvider.OPENROUTER, maxTokens: 8192, contextWindow: 128000, isFree: true, requiresApiKey: true, supportsImages: false, supportsTools: false, description: "Free tier on OpenRouter" },

  // === Anthropic ===
  { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", provider: AIProvider.ANTHROPIC, maxTokens: 8192, contextWindow: 200000, isFree: false, requiresApiKey: true, supportsImages: true, supportsTools: true, inputPrice: "$3/M", outputPrice: "$15/M", description: "Best balance of speed and quality" },
  { id: "claude-opus-4-20250514", name: "Claude Opus 4", provider: AIProvider.ANTHROPIC, maxTokens: 8192, contextWindow: 200000, isFree: false, requiresApiKey: true, supportsImages: true, supportsTools: true, inputPrice: "$15/M", outputPrice: "$75/M", description: "Most capable model" },
  { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", provider: AIProvider.ANTHROPIC, maxTokens: 8192, contextWindow: 200000, isFree: false, requiresApiKey: true, supportsImages: true, supportsTools: true, inputPrice: "$3/M", outputPrice: "$15/M", description: "Previous gen, still excellent" },
  { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", provider: AIProvider.ANTHROPIC, maxTokens: 8192, contextWindow: 200000, isFree: false, requiresApiKey: true, supportsImages: false, supportsTools: true, inputPrice: "$0.80/M", outputPrice: "$4/M", description: "Fast and affordable" },

  // === OpenAI ===
  { id: "gpt-4o", name: "GPT-4o", provider: AIProvider.OPENAI, maxTokens: 4096, contextWindow: 128000, isFree: false, requiresApiKey: true, supportsImages: true, supportsTools: true, inputPrice: "$2.50/M", outputPrice: "$10/M", description: "OpenAI's flagship model" },
  { id: "gpt-4o-mini", name: "GPT-4o mini", provider: AIProvider.OPENAI, maxTokens: 4096, contextWindow: 128000, isFree: false, requiresApiKey: true, supportsImages: true, supportsTools: true, inputPrice: "$0.15/M", outputPrice: "$0.60/M", description: "Affordable and fast" },
  { id: "o1", name: "o1", provider: AIProvider.OPENAI, maxTokens: 100000, contextWindow: 200000, isFree: false, requiresApiKey: true, supportsImages: false, supportsTools: true, inputPrice: "$15/M", outputPrice: "$60/M", description: "Advanced reasoning" },
  { id: "o3-mini", name: "o3 mini", provider: AIProvider.OPENAI, maxTokens: 100000, contextWindow: 200000, isFree: false, requiresApiKey: true, supportsImages: false, supportsTools: true, inputPrice: "$1.10/M", outputPrice: "$4.40/M", description: "Fast reasoning model" },

  // === Google ===
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: AIProvider.GOOGLE, maxTokens: 8192, contextWindow: 1000000, isFree: true, requiresApiKey: true, supportsImages: true, supportsTools: true, inputPrice: "Free", outputPrice: "Free", description: "Free tier, 1M context" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: AIProvider.GOOGLE, maxTokens: 65536, contextWindow: 1000000, isFree: false, requiresApiKey: true, supportsImages: true, supportsTools: true, inputPrice: "$1.25/M", outputPrice: "$10/M", description: "Google's most capable" },

  // === DeepSeek ===
  { id: "deepseek-chat", name: "DeepSeek Chat V3", provider: AIProvider.DEEPSEEK, maxTokens: 8192, contextWindow: 128000, isFree: false, requiresApiKey: true, supportsImages: false, supportsTools: true, inputPrice: "$0.27/M", outputPrice: "$1.10/M", description: "Very affordable, strong coding" },
  { id: "deepseek-reasoner", name: "DeepSeek R1", provider: AIProvider.DEEPSEEK, maxTokens: 8192, contextWindow: 128000, isFree: false, requiresApiKey: true, supportsImages: false, supportsTools: true, inputPrice: "$0.55/M", outputPrice: "$2.19/M", description: "Reasoning model" },

  // === Groq ===
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B (Groq)", provider: AIProvider.GROQ, maxTokens: 8192, contextWindow: 128000, isFree: true, requiresApiKey: true, supportsImages: false, supportsTools: false, inputPrice: "Free tier", outputPrice: "Free tier", description: "Ultra-fast inference, free tier" },
  { id: "meta-llama/llama-3.1-8b-instant", name: "Llama 3.1 8B Instant (Groq)", provider: AIProvider.GROQ, maxTokens: 8192, contextWindow: 128000, isFree: true, requiresApiKey: true, supportsImages: false, supportsTools: false, inputPrice: "Free tier", outputPrice: "Free tier", description: "Lightning fast, free tier" },

  // === Mistral ===
  { id: "mistral-large-latest", name: "Mistral Large", provider: AIProvider.MISTRAL, maxTokens: 8192, contextWindow: 128000, isFree: false, requiresApiKey: true, supportsImages: false, supportsTools: true, inputPrice: "$2/M", outputPrice: "$6/M", description: "Mistral's flagship" },
  { id: "codestral-latest", name: "Codestral", provider: AIProvider.MISTRAL, maxTokens: 8192, contextWindow: 32000, isFree: false, requiresApiKey: true, supportsImages: false, supportsTools: true, inputPrice: "$0.30/M", outputPrice: "$0.90/M", description: "Code specialist" },
];

export enum AgentMode {
  CHAT = "chat",
  AGENT = "agent",
}

export enum MessageRole {
  USER = "user",
  ASSISTANT = "assistant",
  SYSTEM = "system",
  TOOL_RESULT = "tool_result",
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
  isError?: boolean;
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResult {
  toolName: string;
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

export interface StreamChunk {
  text: string;
  isComplete: boolean;
}

export interface OpenCodeAISettings {
  openaiApiKey: string;
  anthropicApiKey: string;
  ollamaBaseUrl: string;
  openrouterApiKey: string;
  deepseekApiKey: string;
  groqApiKey: string;
  mistralApiKey: string;
  googleApiKey: string;
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
  showTokenCount: boolean;
  streamResponse: boolean;
  selectedWorkspace: string;
}
