import { Vault, normalizePath } from "obsidian";
import { BaseVaultTool } from "./BaseTool";

export class WriteFileTool extends BaseVaultTool {
  constructor(vault: Vault) {
    super(
      vault,
      "write_file",
      "Create a new file or completely overwrite an existing file.",
      {
        type: "object",
        properties: {
          file_path: { type: "string", description: "Path to the file to create/overwrite" },
          content: { type: "string", description: "Content to write" },
        },
        required: ["file_path", "content"],
      }
    );
  }

  async execute(params: Record<string, unknown>): Promise<string> {
    const filePath = this.normalizePath(params.file_path as string);
    const content = params.content as string;

    try {
      const dir = filePath.includes("/") ? filePath.substring(0, filePath.lastIndexOf("/")) : "";
      if (dir) await this.ensureFolder(dir);

      await this.vault.adapter.write(filePath, content);
      const lines = content.split("\n").length;
      return `Wrote ${lines} lines to ${filePath}`;
    } catch (error) {
      return `Error writing file: ${(error as Error).message}`;
    }
  }

  private async ensureFolder(folderPath: string): Promise<void> {
    const normalized = normalizePath(folderPath);
    const exists = await this.vault.adapter.exists(normalized);
    if (!exists) {
      await this.vault.adapter.mkdir(normalized);
    }
  }
}
