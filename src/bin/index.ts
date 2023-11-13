#!/usr/bin/env node

import { MarkdownDB } from "../lib/markdowndb.js";
// import MddbFolderWatcher from "./watch.js";

// TODO get these from markdowndb.config.js or something
const dbPath = "markdown.db";
const ignorePatterns = [/Excalidraw/, /\.obsidian/, /DS_Store/];
const [contentPath] = process.argv.slice(2);

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
});
