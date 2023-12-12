import { z } from "zod";
import { MarkdownDB } from "mddb";

const dbPath = "markdown.db";
const client = new MarkdownDB({
  client: "sqlite3",
  connection: {
    filename: dbPath,
  },
});
await client.init();

// Define the schemas using zod
const schemas = {
  post: z.object({
    date: z.string().refine((value) => /\d{4}-\d{2}-\d{2}/.test(value), {
      message:
        "Invalid date format. Please use YYYY-MM-DD format for the 'date' field.",
    }),
  }),
};

// Index the folder with the files
await client.indexFolder({
  folderPath: contentPath,
  ignorePatterns: ignorePatterns,
  schemas: schemas
});

process.exit(0);
