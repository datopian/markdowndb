#!/usr/bin/env node

import { MarkdownDB } from "../lib/markdowndb.js";

// TODO get these from markdowndb.config.js or something
const dbPath = "markdown.db";
const ignorePatterns = [/Excalidraw/, /\.obsidian/, /DS_Store/];
const [contentPath, watchFlag] = process.argv.slice(2);

if (!contentPath) {
  throw new Error("Invalid/Missing path to markdown content folder");
}

const watchEnabled = watchFlag && watchFlag === "--watch";

const client = new MarkdownDB({
  client: "sqlite3",
  connection: {
    filename: dbPath,
  },
});

await client.init();

await client.indexFolder({
  folderPath: contentPath,
  ignorePatterns: ignorePatterns,
  watch: watchEnabled,
});

if (!watchEnabled) {
  process.exit();
}
