import { readFileSync, writeFileSync } from "fs";
import { basename } from "path";

const file = process.argv[2];
if (!file) {
  console.error("Please provide a file path");
  process.exit(1);
}

const content = readFileSync(file, "utf8");
const manifest = JSON.parse(content);
const version = manifest.version;

console.log(`Version: ${version}`);
