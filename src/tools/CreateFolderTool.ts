import { Vault, normalizePath } from "obsidian";
import { BaseVaultTool } from "./BaseTool";

export class CreateFolderTool extends BaseVaultTool {
  constructor(vault: Vault) {
    super(
      vault,
      "create_folder",
      "Create a new directory (and parent directories if needed).",
      {
        type: "object",
        properties: {
          folder_path: { type: "string", description: "Path of the folder to create" },
        },
        required: ["folder_path"],
      }
    );
  }

  async execute(params: Record<string, unknown>): Promise<string> {
    const folderPath = normalizePath(params.folder_path as string);

    try {
      const exists = await this.vault.adapter.exists(folderPath);
      if (exists) {
        return `Folder already exists: ${folderPath}`;
      }

      await this.vault.adapter.mkdir(folderPath);
      return `Created folder: ${folderPath}`;
    } catch (error) {
      return `Error creating folder: ${(error as Error).message}`;
    }
  }
}
