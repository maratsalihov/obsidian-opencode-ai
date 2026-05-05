import { Vault } from "obsidian";
import { BaseVaultTool } from "./BaseTool";

export class ListNotesTool extends BaseVaultTool {
  constructor(vault: Vault) {
    super(
      vault,
      "list_notes",
      "List all notes in the vault or in a specific folder.",
      {
        type: "object",
        properties: {
          folder: { type: "string", description: "Folder path to list notes from (leave empty for all notes)" },
        },
      }
    );
  }

  async execute(params: Record<string, unknown>): Promise<string> {
    const folder = (params.folder as string) || "";

    try {
      let files = this.vault.getMarkdownFiles();

      if (folder) {
        const normalizedFolder = folder.replace(/\\/g, "/");
        files = files.filter((f) => f.path.startsWith(normalizedFolder));
      }

      if (files.length === 0) {
        return folder ? `No notes found in folder: ${folder}` : "No notes found in vault.";
      }

      const header = `Found ${files.length} note(s):\n`;
      const formatted = files.slice(0, 100).map((f) => `- ${f.path}`);
      return header + formatted.join("\n") + (files.length > 100 ? `\n... and ${files.length - 100} more` : "");
    } catch (error) {
      return `Error listing notes: ${(error as Error).message}`;
    }
  }
}
