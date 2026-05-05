import { Vault, TFile } from "obsidian";
import { BaseVaultTool } from "./BaseTool";

interface EditBlock {
  search: string;
  replace: string;
}

export class EditNoteTool extends BaseVaultTool {
  constructor(vault: Vault) {
    super(
      vault,
      "edit_note",
      "Make targeted SEARCH/REPLACE edits to an existing note. Provide exact text to find and text to replace it with.",
      {
        type: "object",
        properties: {
          note_path: { type: "string", description: "Name or path of the note to edit" },
          edits: {
            type: "array",
            description: "Array of search/replace edit blocks",
            items: {
              type: "object",
              properties: {
                search: { type: "string", description: "Exact text to search for" },
                replace: { type: "string", description: "Text to replace it with" },
              },
              required: ["search", "replace"],
            },
          },
        },
        required: ["note_path", "edits"],
      }
    );
  }

  async execute(params: Record<string, unknown>): Promise<string> {
    const notePath = this.normalizePath(params.note_path as string);
    const edits = params.edits as EditBlock[];

    try {
      const file = this.vault.getAbstractFileByPath(notePath);
      if (!file || !(file instanceof TFile)) {
        return `Note not found: ${notePath}`;
      }

      let content = await this.vault.read(file);
      let changes = 0;
      const results: string[] = [];

      for (const edit of edits) {
        if (!content.includes(edit.search)) {
          results.push(`Search text not found: "${edit.search.substring(0, 50)}..."`);
          continue;
        }

        content = content.replace(edit.search, edit.replace);
        changes++;
        results.push(`Edit ${changes}: "${edit.search.substring(0, 50)}..."`);
      }

      if (changes > 0) {
        await this.vault.modify(file, content);
        return `Applied ${changes} edit(s) to ${notePath}:\n${results.join("\n")}`;
      }

      return `No edits applied:\n${results.join("\n")}`;
    } catch (error) {
      return `Error editing note: ${(error as Error).message}`;
    }
  }
}
