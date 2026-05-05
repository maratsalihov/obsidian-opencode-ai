import { Vault, TFile } from "obsidian";
import { BaseVaultTool } from "./BaseTool";

export class ReadNoteTool extends BaseVaultTool {
  constructor(vault: Vault) {
    super(
      vault,
      "read_note",
      "Read the full contents of a note in the vault. Provide the note name or path.",
      {
        type: "object",
        properties: {
          note_path: { type: "string", description: "Name or path of the note to read (e.g., 'My Note' or 'Folder/Note')" },
        },
        required: ["note_path"],
      }
    );
  }

  async execute(params: Record<string, unknown>): Promise<string> {
    const notePath = this.normalizePath(params.note_path as string);

    try {
      const file = this.vault.getAbstractFileByPath(notePath);
      if (!file || !(file instanceof TFile)) {
        return `Note not found: ${notePath}`;
      }

      const content = await this.vault.read(file);
      return `# ${file.name}\n\n${content}`;
    } catch (error) {
      return `Error reading note: ${(error as Error).message}`;
    }
  }
}
