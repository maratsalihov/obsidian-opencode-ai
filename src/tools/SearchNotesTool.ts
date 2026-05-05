import { Vault, TFile } from "obsidian";
import { BaseVaultTool } from "./BaseTool";

export class SearchNotesTool extends BaseVaultTool {
  constructor(vault: Vault) {
    super(
      vault,
      "search_notes",
      "Search for notes by filename pattern or content. Returns matching notes.",
      {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query - matches against filenames and content" },
          max_results: { type: "number", description: "Maximum results to return (default: 20)" },
        },
        required: ["query"],
      }
    );
  }

  async execute(params: Record<string, unknown>): Promise<string> {
    const query = (params.query as string).toLowerCase();
    const maxResults = (params.max_results as number) || 20;

    try {
      const files = this.vault.getMarkdownFiles();
      const results: Array<{ path: string; name: string; match: string }> = [];

      for (const file of files) {
        const nameMatch = file.name.toLowerCase().includes(query);
        const pathMatch = file.path.toLowerCase().includes(query);

        if (nameMatch || pathMatch) {
          results.push({ path: file.path, name: file.name, match: nameMatch ? "filename" : "path" });
          if (results.length >= maxResults) break;
          continue;
        }

        const content = await this.vault.read(file);
        if (content.toLowerCase().includes(query)) {
          const lines = content.split("\n");
          const matchingLine = lines.find((l) => l.toLowerCase().includes(query)) || "";
          results.push({ path: file.path, name: file.name, match: `content: "${matchingLine.substring(0, 100)}"` });
          if (results.length >= maxResults) break;
        }
      }

      if (results.length === 0) {
        return `No notes found matching: ${query}`;
      }

      const header = `Found ${results.length} note(s) matching "${query}":\n`;
      const formatted = results.map((r) => `- ${r.path} (${r.match})`);
      return header + formatted.join("\n");
    } catch (error) {
      return `Error searching notes: ${(error as Error).message}`;
    }
  }
}
