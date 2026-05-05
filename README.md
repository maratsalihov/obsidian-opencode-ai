# OpenCode AI Agent for Obsidian

> **AI coding agent with file editing, agent mode, and multi-provider support — like Claude Code inside Obsidian.**

Search for **"OpenCode"** or **"opencode"** in the Obsidian Community Plugins browser to find this plugin.

![OpenCode AI](https://img.shields.io/badge/version-1.0.0-blue)
![Obsidian](https://img.shields.io/badge/Obsidian-1.1.0+-purple)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

### Multi-Provider AI Support
- **OpenAI** — GPT-4o, GPT-4o mini, o1, o3-mini
- **Anthropic** — Claude Sonnet 4, Opus 4, 3.5 Sonnet, 3.5 Haiku
- **Ollama** — Llama 3.1, Qwen 2.5 Coder, DeepSeek Coder V2 (local!)
- **OpenRouter** — 100+ models from one API
- **DeepSeek** — DeepSeek Chat & Coder
- **Groq** — Ultra-fast inference
- **Mistral** — Mistral Large, Codestral

### Agent Mode
- **Autonomous task completion** — AI works step-by-step to fulfill your requests
- **Vault tools** — Read, write, edit, search, and list notes
- **Tool calling loop** — AI can chain multiple tool calls to complete complex tasks
- **Safety checks** — No destructive operations without confirmation

### Chat Interface
- **Streaming responses** — See tokens appear in real-time
- **Model switching** — Change provider and model on the fly
- **Chat history** — Sessions auto-save as markdown notes
- **Markdown rendering** — Code blocks, headings, lists, quotes

### Vault Integration
| Tool | Description |
|------|-------------|
| `read_note` | Read any note in your vault |
| `write_note` | Create or replace notes |
| `edit_note` | SEARCH/REPLACE targeted edits |
| `search_notes` | Find notes by name or content |
| `list_notes` | List notes in a folder |
| `append_to_note` | Add content to existing note |

## Installation

### From Obsidian Community Plugins
1. Open Obsidian **Settings** → **Community Plugins** → **Browse**
2. Search for **"OpenCode AI Agent"** or **"opencode"**
3. Click **Install** and **Enable**

### Manual Installation
1. Download `main.js`, `manifest.json`, and `styles.css` from the latest [release](https://github.com/maratsalihov/obsidian-opencode-ai/releases)
2. Create a folder `.obsidian/plugins/obsidian-opencode-ai/` in your vault
3. Place the three files in that folder
4. Enable the plugin in **Settings** → **Community Plugins**

## Setup

1. Open **Settings** → **OpenCode AI Agent**
2. Add at least one API key (OpenAI, Anthropic, etc.)
3. For local models, set the Ollama URL
4. Open the chat from the ribbon icon or command palette

## Usage

### Opening Chat
- Click the **OpenCode** ribbon icon
- Run command: `OpenCode AI Chat`

### Commands
| Command | Description |
|---------|-------------|
| `OpenCode AI: Open AI Chat` | Open the chat view |
| `OpenCode AI: Start New Chat` | Create a new chat session |
| `OpenCode AI: Toggle Agent Mode` | Switch between chat/agent mode |
| `OpenCode AI: Send Selection to AI Chat` | Send selected text to chat |

### Agent Mode vs Chat Mode
- **Chat Mode** — Conversational responses without using tools
- **Agent Mode** — AI autonomously uses tools to complete tasks (read, write, edit notes)

### Example Prompts
- "Create a daily journal template in Templates folder"
- "Search for all notes about project management and summarize"
- "Create a MOC (Map of Content) for my Zettelkasten notes"
- "Refactor the structure of my Daily Notes"
- "Find all notes with TODO items and create a task list"

## Configuration

### API Keys
Configure in **Settings** → **OpenCode AI Agent**:

- **OpenAI**: `sk-...` from [platform.openai.com](https://platform.openai.com)
- **Anthropic**: `sk-ant-...` from [console.anthropic.com](https://console.anthropic.com)
- **OpenRouter**: `sk-or-...` from [openrouter.ai](https://openrouter.ai)
- **DeepSeek**: `sk-...` from [platform.deepseek.com](https://platform.deepseek.com)
- **Groq**: `gsk_...` from [console.groq.com](https://console.groq.com)
- **Mistral**: From [console.mistral.ai](https://console.mistral.ai)

### Local Models (Ollama)
1. Install [Ollama](https://ollama.com)
2. Pull a model: `ollama pull llama3.1`
3. Set Ollama URL to `http://localhost:11434`

### System Prompt Presets
- **General Chat** — Friendly assistant for Q&A
- **Autonomous Agent** — Task-completing agent with tools
- **Coding Assistant** — Code-focused assistant

## Building from Source

```bash
git clone https://github.com/maratsalihov/obsidian-opencode-ai.git
cd obsidian-opencode-ai
npm install
npm run build
```

Copy `main.js`, `manifest.json`, and `styles.css` to your vault's plugin folder.

## Architecture

```
src/
├── main.ts                    # Plugin entry point
├── types.ts                   # TypeScript types
├── defaults.ts                # Default settings & prompts
├── icons.ts                   # SVG icons
├── providers/
│   ├── BaseProvider.ts        # Abstract provider
│   ├── OpenAIProvider.ts      # OpenAI/compatible APIs
│   ├── AnthropicProvider.ts   # Anthropic Claude
│   ├── OllamaProvider.ts      # Local Ollama
│   └── ProviderManager.ts     # Provider orchestration
├── tools/
│   ├── BaseTool.ts            # Abstract tool
│   ├── ReadNoteTool.ts        # Read vault notes
│   ├── WriteNoteTool.ts       # Create/replace notes
│   ├── EditNoteTool.ts        # SEARCH/REPLACE edits
│   ├── SearchNotesTool.ts     # Search notes
│   ├── ListNotesTool.ts       # List notes
│   ├── AppendNoteTool.ts      # Append to notes
│   └── ToolRegistry.ts        # Tool registry
├── core/
│   └── ChatManager.ts         # Chat & agent logic
├── views/
│   └── ChatView.ts            # Chat UI view
└── settings/
    └── SettingTab.ts          # Settings UI
```

## License

MIT

## Author

**Marat Salikhov** — [GitHub](https://github.com/maratsalihov)

## Support

If you find this plugin useful, consider:
- Starring the [GitHub repo](https://github.com/maratsalihov/obsidian-opencode-ai)
- Reporting bugs or feature requests via Issues
