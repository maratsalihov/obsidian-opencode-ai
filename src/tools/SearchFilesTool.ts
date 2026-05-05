import { Vault, TFile } from "obsidian";
import { BaseVaultTool } from "./BaseTool";

export class SearchFilesTool extends BaseVaultTool {
  constructor(vault: Vault) {
    super(
      vault,
      "search_files",
      "Search for files by name pattern or content.",
      {
        type: "object",
        properties: {
          query: { type: "string", description: "Search term (matches file names and content)" },
          file_type: { type: "string", description: "Filter by extension (e.g., 'md', 'ts', 'js')" },
          max_results: { type: "number", description: "Max results (default: 30)" },
        },
        required: ["query"],
      }
    );
  }

  async execute(params: Record<string, unknown>): Promise<string> {
    const query = (params.query as string).toLowerCase();
    const fileType = (params.file_type as string) || "";
    const maxResults = (params.max_results as number) || 30;

    try {
      const allFiles = this.vault.getMarkdownFiles();
      const results: Array<{ path: string; match: string }> = [];

      for (const file of allFiles) {
        if (results.length >= maxResults) break;

        const nameMatch = file.name.toLowerCase().includes(query);
        const pathMatch = file.path.toLowerCase().includes(query);

        if (nameMatch) {
          results.push({ path: file.path, match: "name" });
          continue;
        }

        if (pathMatch) {
          results.push({ path: file.path, match: "path" });
          continue;
        }

        const content = await this.vault.read(file).catch(() => "");
        if (content.toLowerCase().includes(query)) {
          const lines = content.split("\n");
          const matchLine = lines.find((l) => l.toLowerCase().includes(query)) || "";
          results.push({ path: file.path, match: matchLine.substring(0, 100) });
        }
      }

      if (results.length === 0) {
        return `No files found matching: "${query}"`;
      }

      const header = `Found ${results.length} file(s) for "${query}":\n`;
      return header + results.map((r) => `- ${r.path} (${r.match})`).join("\n");
    } catch (error) {
      return `Error searching files: ${(error as Error).message}`;
    }
  }
}
