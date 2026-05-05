import { Vault, TFile, normalizePath } from "obsidian";
import { BaseVaultTool } from "./BaseTool";

export class RenameFileTool extends BaseVaultTool {
  constructor(vault: Vault) {
    super(
      vault,
      "rename_file",
      "Rename or move a file to a new path.",
      {
        type: "object",
        properties: {
          old_path: { type: "string", description: "Current file path" },
          new_path: { type: "string", description: "New file path" },
        },
        required: ["old_path", "new_path"],
      }
    );
  }

  async execute(params: Record<string, unknown>): Promise<string> {
    const oldPath = this.normalizePath(params.old_path as string);
    const newPath = this.normalizePath(params.new_path as string);

    try {
      const file = this.vault.getAbstractFileByPath(oldPath);
      if (!file || !(file instanceof TFile)) {
        return `File not found: ${oldPath}`;
      }

      const newDir = newPath.includes("/") ? newPath.substring(0, newPath.lastIndexOf("/")) : "";
      if (newDir) {
        const exists = await this.vault.adapter.exists(normalizePath(newDir));
        if (!exists) {
          await this.vault.adapter.mkdir(normalizePath(newDir));
        }
      }

      await this.vault.rename(file, newPath);
      return `Renamed: ${oldPath} -> ${newPath}`;
    } catch (error) {
      return `Error renaming file: ${(error as Error).message}`;
    }
  }
}
