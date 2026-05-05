import { Vault } from "obsidian";
import { BaseVaultTool } from "./BaseTool";
import { ReadNoteTool } from "./ReadNoteTool";
import { WriteNoteTool } from "./WriteNoteTool";
import { EditNoteTool } from "./EditNoteTool";
import { SearchNotesTool } from "./SearchNotesTool";
import { ListNotesTool } from "./ListNotesTool";
import { AppendNoteTool } from "./AppendNoteTool";
import { ToolDefinition } from "../types";

export class VaultToolRegistry {
  private static instance: VaultToolRegistry;
  private tools: Map<string, BaseVaultTool> = new Map();

  static getInstance(): VaultToolRegistry {
    if (!VaultToolRegistry.instance) {
      VaultToolRegistry.instance = new VaultToolRegistry();
    }
    return VaultToolRegistry.instance;
  }

  initialize(vault: Vault): void {
    this.tools.clear();
    this.register(new ReadNoteTool(vault));
    this.register(new WriteNoteTool(vault));
    this.register(new EditNoteTool(vault));
    this.register(new SearchNotesTool(vault));
    this.register(new ListNotesTool(vault));
    this.register(new AppendNoteTool(vault));
  }

  register(tool: BaseVaultTool): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): BaseVaultTool | undefined {
    return this.tools.get(name);
  }

  getDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map((t) => t.toDefinition());
  }

  async execute(name: string, params: Record<string, unknown>): Promise<string> {
    const tool = this.tools.get(name);
    if (!tool) {
      return `Error: Tool "${name}" not found`;
    }
    return tool.execute(params);
  }
}
