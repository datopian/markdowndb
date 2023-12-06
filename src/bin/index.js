#!/usr/bin/env node
import * as path from 'path';
import { MarkdownDB } from "../lib/markdowndb.js";

async function loadConfig(configFilePath) {
  const normalizedPath = path.resolve(configFilePath || 'mddb.config.js');
  const fileUrl = new URL(`file://${normalizedPath}`);

  try {
    // Import the module using the file URL 
    const configModule = await import(fileUrl.href);
    return configModule.default;
  } catch (error) {
    if (configFilePath) {
      throw new Error(`Error loading configuration file from ${normalizedPath}: ${error.message}`);
    }
  }
}

// TODO get these from markdowndb.config.js or something
const dbPath = "markdown.db";
const ignorePatterns = [/Excalidraw/, /\.obsidian/, /DS_Store/];
const [contentPath, configFilePath] = process.argv.slice(2);

if (!contentPath) {
  throw new Error("Invalid/Missing path to markdown content folder");
}

// Load the configuration file dynamically
const config = await loadConfig(configFilePath);

const client = new MarkdownDB({
  client: "sqlite3",
  connection: {
    filename: dbPath,
  },
}, {
  customConfig: config
});

await client.init();

await client.indexFolder({
  folderPath: contentPath,
  ignorePatterns: ignorePatterns,
});

process.exit();
