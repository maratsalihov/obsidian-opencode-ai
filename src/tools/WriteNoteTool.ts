import { Vault, TFile, normalizePath } from "obsidian";
import { BaseVaultTool } from "./BaseTool";

export class WriteNoteTool extends BaseVaultTool {
  constructor(vault: Vault) {
    super(
      vault,
      "write_note",
      "Create a new note or completely replace an existing note with new content.",
      {
        type: "object",
        properties: {
          note_path: { type: "string", description: "Name or path of the note (e.g., 'My Note' or 'Folder/Note')" },
          content: { type: "string", description: "The markdown content to write" },
        },
        required: ["note_path", "content"],
      }
    );
  }

  async execute(params: Record<string, unknown>): Promise<string> {
    const notePath = this.normalizePath(params.note_path as string);
    const content = params.content as string;

    try {
      const folder = notePath.includes("/") ? notePath.substring(0, notePath.lastIndexOf("/")) : "";
      if (folder) {
        await this.ensureFolderExists(folder);
      }

      await this.vault.adapter.write(notePath, content);

      const lines = content.split("\n").length;
      return `Successfully created note: ${notePath} (${lines} lines)`;
    } catch (error) {
      return `Error writing note: ${(error as Error).message}`;
    }
  }

  private async ensureFolderExists(folderPath: string): Promise<void> {
    const normalized = normalizePath(folderPath);
    const existing = this.vault.getAbstractFileByPath(normalized);
    if (!existing) {
      await this.vault.createFolder(normalized);
    }
  }
}
