import { Vault, TFile, TFolder, normalizePath, FileSystemAdapter } from "obsidian";
import { BaseVaultTool } from "./BaseTool";

export class ReadFileTool extends BaseVaultTool {
  constructor(vault: Vault) {
    super(
      vault,
      "read_file",
      "Read the complete contents of a file. Use this before editing any file.",
      {
        type: "object",
        properties: {
          file_path: { type: "string", description: "Path to the file (relative or absolute)" },
          max_lines: { type: "number", description: "Max lines to read (default: 500)" },
        },
        required: ["file_path"],
      }
    );
  }

  async execute(params: Record<string, unknown>): Promise<string> {
    const filePath = this.normalizePath(params.file_path as string);
    const maxLines = (params.max_lines as number) || 500;

    try {
      const file = this.vault.getAbstractFileByPath(filePath);
      if (!file || !(file instanceof TFile)) {
        const files = this.vault.getMarkdownFiles();
        const similar = files.filter((f) => f.name.toLowerCase().includes(filePath.toLowerCase())).slice(0, 5);
        if (similar.length > 0) {
          return `File not found: "${filePath}". Did you mean:\n${similar.map((f) => `- ${f.path}`).join("\n")}`;
        }
        return `File not found: "${filePath}"`;
      }

      if (file.extension === "png" || file.extension === "jpg" || file.extension === "jpeg" || file.extension === "gif" || file.extension === "svg") {
        return `[Image file: ${file.name}] Images cannot be read as text. The model does not support image input.`;
      }

      let content = await this.vault.read(file);
      const lines = content.split("\n");
      const totalLines = lines.length;

      if (totalLines > maxLines) {
        content = lines.slice(0, maxLines).join("\n");
        return `${content}\n\n... (${totalLines - maxLines} more lines, use start_line to read further)`;
      }

      const numbered = lines.map((line, i) => `${i + 1}: ${line}`).join("\n");
      return `# ${file.path} (${totalLines} lines)\n\n${numbered}`;
    } catch (error) {
      return `Error reading file: ${(error as Error).message}`;
    }
  }
}
