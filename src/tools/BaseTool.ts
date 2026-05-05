import { Vault, TFile, TFolder, normalizePath } from "obsidian";
import { ToolDefinition } from "../types";

export abstract class BaseVaultTool {
  protected vault: Vault;
  name: string;
  description: string;
  parameters: Record<string, unknown>;

  constructor(vault: Vault, name: string, description: string, parameters: Record<string, unknown>) {
    this.vault = vault;
    this.name = name;
    this.description = description;
    this.parameters = parameters;
  }

  abstract execute(params: Record<string, unknown>): Promise<string>;

  toDefinition(): ToolDefinition {
    return { name: this.name, description: this.description, parameters: this.parameters };
  }

  protected normalizePath(filePath: string): string {
    let path = filePath;
    if (path.endsWith(".md") === false && !path.includes(".")) {
      path += ".md";
    }
    return normalizePath(path);
  }
}
