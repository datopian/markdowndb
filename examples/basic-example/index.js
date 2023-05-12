import { MarkdownDB } from "@flowershow/markdowndb";
import columnify from "columnify";

const dbPath = "markdown.db";

const client = new MarkdownDB({
  client: "sqlite3",
  connection: {
    filename: dbPath,
  },
});

const mddb = await client.init();
const projects = await mddb.getFiles();

// console.log(JSON.stringify(projects, null, 2));

const projects2 = projects.map((project) => {
  const { file_path, metadata } = project;
  return {
    file_path,
    ...metadata,
  };
});

const columns = columnify(projects2, {
  truncate: true,
  columnSplitter: " | ",
  config: {
    description: {
      maxWidth: 80,
    },
  },
});

console.log("\n");
console.log(columns);
console.log("\n");

process.exit(0);
