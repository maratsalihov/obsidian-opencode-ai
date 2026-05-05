import { Vault, TFile } from "obsidian";
import { BaseVaultTool } from "./BaseTool";

export class EditFileTool extends BaseVaultTool {
  constructor(vault: Vault) {
    super(
      vault,
      "edit_file",
      "Make targeted SEARCH/REPLACE edits. Provide exact text to find and replacement text.",
      {
        type: "object",
        properties: {
          file_path: { type: "string", description: "Path to the file to edit" },
          edits: {
            type: "array",
            items: {
              type: "object",
              properties: {
                search: { type: "string", description: "Exact text to find" },
                replace: { type: "string", description: "Replacement text" },
              },
              required: ["search", "replace"],
            },
          },
        },
        required: ["file_path", "edits"],
      }
    );
  }

  async execute(params: Record<string, unknown>): Promise<string> {
    const filePath = this.normalizePath(params.file_path as string);
    const edits = params.edits as Array<{ search: string; replace: string }>;

    try {
      const file = this.vault.getAbstractFileByPath(filePath);
      if (!file || !(file instanceof TFile)) {
        return `File not found: ${filePath}`;
      }

      let content = await this.vault.read(file);
      const originalContent = content;
      const results: string[] = [];
      let applied = 0;

      for (const edit of edits) {
        const searchStr = edit.search;
        if (!content.includes(searchStr)) {
          results.push(`NOT FOUND: "${searchStr.substring(0, 60)}${searchStr.length > 60 ? "..." : ""}"`);
          continue;
        }

        content = content.replace(searchStr, edit.replace);
        applied++;
        results.push(`APPLIED: "${searchStr.substring(0, 60)}${searchStr.length > 60 ? "..." : ""}"`);
      }

      if (applied === 0) {
        return `No edits applied:\n${results.join("\n")}`;
      }

      await this.vault.modify(file, content);
      const linesChanged = content.split("\n").length;
      return `Applied ${applied}/${edits.length} edit(s) to ${filePath} (${linesChanged} lines total):\n${results.join("\n")}`;
    } catch (error) {
      return `Error editing file: ${(error as Error).message}`;
    }
  }
}
