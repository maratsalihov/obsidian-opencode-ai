import { Vault } from "obsidian";
import { BaseVaultTool } from "./BaseTool";
import { ReadFileTool } from "./ReadFileTool";
import { WriteFileTool } from "./WriteFileTool";
import { EditFileTool } from "./EditFileTool";
import { DeleteFileTool } from "./DeleteFileTool";
import { RenameFileTool } from "./RenameFileTool";
import { ListFilesTool } from "./ListFilesTool";
import { SearchFilesTool } from "./SearchFilesTool";
import { CreateFolderTool } from "./CreateFolderTool";
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
    this.register(new ReadFileTool(vault));
    this.register(new WriteFileTool(vault));
    this.register(new EditFileTool(vault));
    this.register(new DeleteFileTool(vault));
    this.register(new RenameFileTool(vault));
    this.register(new ListFilesTool(vault));
    this.register(new SearchFilesTool(vault));
    this.register(new CreateFolderTool(vault));
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
