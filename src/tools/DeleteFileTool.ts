import { Vault, TFile, normalizePath } from "obsidian";
import { BaseVaultTool } from "./BaseTool";

export class DeleteFileTool extends BaseVaultTool {
  constructor(vault: Vault) {
    super(
      vault,
      "delete_file",
      "Delete a file permanently. Use with caution!",
      {
        type: "object",
        properties: {
          file_path: { type: "string", description: "Path to the file to delete" },
        },
        required: ["file_path"],
      }
    );
  }

  async execute(params: Record<string, unknown>): Promise<string> {
    const filePath = this.normalizePath(params.file_path as string);

    try {
      const file = this.vault.getAbstractFileByPath(filePath);
      if (!file || !(file instanceof TFile)) {
        return `File not found: ${filePath}`;
      }

      await this.vault.adapter.remove(filePath);
      return `Deleted: ${filePath}`;
    } catch (error) {
      return `Error deleting file: ${(error as Error).message}`;
    }
  }
}
