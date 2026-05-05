import esbuild from "esbuild";
import { copy } from "esbuild-plugin-copy";

const prod = process.argv[2] === "production";

esbuild
  .build({
    banner: { js: "/* OpenCode AI Agent - obsidian plugin */" },
    entryPoints: ["src/main.ts"],
    bundle: true,
    external: [
      "obsidian", "electron",
      "@codemirror/autocomplete", "@codemirror/collab", "@codemirror/commands",
      "@codemirror/language", "@codemirror/lint", "@codemirror/search",
      "@codemirror/state", "@codemirror/view",
      "@lezer/common", "@lezer/highlight", "@lezer/lr",
      "fs", "path", "crypto", "os", "child_process", "util",
      "stream", "events", "url", "http", "https", "buffer",
    ],
    format: "cjs",
    target: "es2018",
    logLevel: "info",
    sourcemap: prod ? false : "inline",
    treeShaking: true,
    outfile: "main.js",
    minify: prod,
    plugins: [
      copy({
        resolveFrom: "cwd",
        assets: [{ from: ["./manifest.json"], to: ["."] }],
      }),
    ],
  })
  .catch(() => process.exit(1));
