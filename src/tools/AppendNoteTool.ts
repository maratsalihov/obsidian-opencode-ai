import { Vault, TFile } from "obsidian";
import { BaseVaultTool } from "./BaseTool";

export class AppendNoteTool extends BaseVaultTool {
  constructor(vault: Vault) {
    super(
      vault,
      "append_to_note",
      "Append content to the end of an existing note.",
      {
        type: "object",
        properties: {
          note_path: { type: "string", description: "Name or path of the note to append to" },
          content: { type: "string", description: "Content to append" },
        },
        required: ["note_path", "content"],
      }
    );
  }

  async execute(params: Record<string, unknown>): Promise<string> {
    const notePath = this.normalizePath(params.note_path as string);
    const content = params.content as string;

    try {
      const file = this.vault.getAbstractFileByPath(notePath);
      if (!file || !(file instanceof TFile)) {
        return `Note not found: ${notePath}`;
      }

      const existing = await this.vault.read(file);
      const separator = existing.endsWith("\n") ? "\n" : "\n\n";
      await this.vault.modify(file, existing + separator + content);

      const lines = content.split("\n").length;
      return `Appended ${lines} line(s) to ${notePath}`;
    } catch (error) {
      return `Error appending to note: ${(error as Error).message}`;
    }
  }
}
