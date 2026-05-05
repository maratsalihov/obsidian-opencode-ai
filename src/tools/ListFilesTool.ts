import { Vault, TFile, TFolder, normalizePath } from "obsidian";
import { BaseVaultTool } from "./BaseTool";

export class ListFilesTool extends BaseVaultTool {
  constructor(vault: Vault) {
    super(
      vault,
      "list_files",
      "List all files in a directory. Leave empty for vault root.",
      {
        type: "object",
        properties: {
          folder: { type: "string", description: "Folder path to list (empty for root)" },
          recursive: { type: "boolean", description: "List subdirectories recursively (default: false)" },
        },
      }
    );
  }

  async execute(params: Record<string, unknown>): Promise<string> {
    const folder = (params.folder as string) || "";
    const recursive = (params.recursive as boolean) || false;

    try {
      const normalizedFolder = folder ? normalizePath(folder) : "";
      let files: TFile[] = [];
      let folders: string[] = [];

      if (normalizedFolder) {
        const abstract = this.vault.getAbstractFileByPath(normalizedFolder);
        if (!abstract || !(abstract instanceof TFolder)) {
          return `Folder not found: ${normalizedFolder}`;
        }
        this.collectFiles(abstract, recursive, files, folders);
      } else {
        const root = this.vault.getRoot();
        this.collectFiles(root, recursive, files, folders);
      }

      const fileEntries = files.map((f) => `  ${f.extension === "md" ? "📝" : "📄"} ${f.path}`);
      const folderEntries = folders.map((f) => `  📁 ${f}/`);

      let output = `Contents of "${normalizedFolder || "/"}":\n`;
      if (folderEntries.length > 0) {
        output += "\nFolders:\n" + folderEntries.slice(0, 50).join("\n");
      }
      if (fileEntries.length > 0) {
        output += "\nFiles:\n" + fileEntries.slice(0, 100).join("\n");
        if (fileEntries.length > 100) {
          output += `\n  ... and ${fileEntries.length - 100} more files`;
        }
      }

      return output || `Empty folder: ${normalizedFolder}`;
    } catch (error) {
      return `Error listing files: ${(error as Error).message}`;
    }
  }

  private collectFiles(folder: TFolder, recursive: boolean, files: TFile[], folders: string[]) {
    for (const child of folder.children) {
      if (child instanceof TFile) {
        files.push(child);
      } else if (child instanceof TFolder) {
        if (recursive) {
          folders.push(child.path);
          this.collectFiles(child, true, files, folders);
        } else {
          folders.push(child.path);
        }
      }
    }
  }
}
