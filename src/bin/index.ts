#!/usr/bin/env node

import { MarkdownDB } from "../lib/markdowndb.js";

// TODO get these from markdowndb.config.js or something
const dbPath = "markdown.db";
const ignorePatterns = [/Excalidraw/, /\.obsidian/, /DS_Store/];
const args = process.argv.slice(2);

let watch = false;
let contentPath;

// Iterate through the command-line arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  if (arg === "--watch" || arg === "-w") {
    // If --watch or -w is provided, set the watch flag to true
    watch = true;
  } else {
    // If not an option, assume it's the contentPath
    contentPath = arg;
  }
}

if (!contentPath) {
  throw new Error("Invalid/Missing path to markdown content folder");
}

const client = new MarkdownDB({
  client: "sqlite3",
  connection: {
    filename: dbPath,
  },
});

// Ignore top-level await errors
//@ts-ignore
await client.init();

//@ts-ignore
await client.indexFolder({
  folderPath: contentPath,
  ignorePatterns: ignorePatterns,
  watch: watch,
});
