// import knex from "knex";
import { MarkdownDB } from "./markdowndb";
import { File, MddbFile, Table } from "./schema";
import { recursiveWalkDir } from "../utils";

/**
 * @jest-environment node
 */

// TODO test index files
describe("MarkdownDB - default config", () => {
  const pathToContentFixture = "__mocks__/content";
  let mddb: MarkdownDB;

  beforeAll(async () => {
    const dbConfig = {
      client: "sqlite3",
      connection: {
        filename: "markdown.db",
      },
    };

    mddb = new MarkdownDB(dbConfig);
    await mddb.init();
    await mddb.indexFolder({ folderPath: pathToContentFixture });
  });

  afterAll(async () => {
    // TODO why we have to call this twice?
    mddb.db.destroy();
    mddb._destroyDb();
  });

  describe("correct startup and indexing", () => {
    test("adds tables to db", async () => {
      expect(await mddb.db.schema.hasTable(Table.Files)).toBe(true);
      expect(await mddb.db.schema.hasTable(Table.Tags)).toBe(true);
      expect(await mddb.db.schema.hasTable(Table.FileTags)).toBe(true);
      expect(await mddb.db.schema.hasTable(Table.Links)).toBe(true);
    });

    test("indexes all files in folder", async () => {
      const allFiles = recursiveWalkDir(pathToContentFixture);
      const allIndexedFiles = await mddb.getFiles();
      expect(allIndexedFiles).toHaveLength(allFiles.length);
    });

    test("correctly converts file paths to urls (default convereter function)", async () => {
      const dbFile1 = await mddb.getFileByUrl("blog/Some Blog 4");
      expect(dbFile1).not.toBeNull();

      const dbFile2 = await mddb.getFileByUrl("blog/blog2");
      expect(dbFile2).not.toBeNull();
    });
  });

  describe("querying files", () => {
    test("can get all files", async () => {
      const dbFiles = await mddb.getFiles();
      const allFilesPaths = recursiveWalkDir(pathToContentFixture);

      expect(dbFiles).toHaveLength(allFilesPaths.length);
      dbFiles.forEach((file) => {
        expect(allFilesPaths).toContain(file.file_path);
      });
    });

    test("can query by file type", async () => {
      const dbFiles = await mddb.getFiles({ filetypes: ["blog"] });
      const dbFilesPaths = dbFiles.map((f) => f.file_path);

      const expectedPaths = [
        `${pathToContentFixture}/blog/blog3.mdx`,
        `${pathToContentFixture}/blog/blog2.mdx`,
        `${pathToContentFixture}/blog0.mdx`,
      ];

      expect(dbFilesPaths).toHaveLength(expectedPaths.length);
      dbFilesPaths.forEach((p) => {
        expect(expectedPaths).toContain(p);
      });
    });

    test("can query by tags", async () => {
      const dbFiles = await mddb.getFiles({ tags: ["economy", "politics"] });
      const dbFilesPaths = dbFiles.map((f) => f.file_path);

      const expectedPaths = [
        `${pathToContentFixture}/blog/blog3.mdx`,
        `${pathToContentFixture}/blog/blog2.mdx`,
      ];

      expect(dbFilesPaths).toHaveLength(expectedPaths.length);
      dbFilesPaths.forEach((p) => {
        expect(expectedPaths).toContain(p);
      });
    });

    test("can query by extensions", async () => {
      const dbFiles = await mddb.getFiles({ extensions: ["png"] });
      const dbFilesPaths = dbFiles.map((f) => f.file_path);

      const expectedPaths = [
        `${pathToContentFixture}/assets/datopian-logo.png`,
      ];

      expect(dbFilesPaths).toHaveLength(expectedPaths.length);
      dbFilesPaths.forEach((p) => {
        expect(expectedPaths).toContain(p);
      });
    });

    test("can query by a frontmatter field", async () => {
      const dbFiles = await mddb.getFiles({
        frontmatter: { author: "John Doe" },
      });
      const dbFilesPaths = dbFiles.map((f) => f.file_path);

      const expectedPaths = [
        `${pathToContentFixture}/blog/blog1.mdx`,
        `${pathToContentFixture}/blog/blog2.mdx`,
      ];

      expect(dbFilesPaths).toHaveLength(expectedPaths.length);
      dbFilesPaths.forEach((p) => {
        expect(expectedPaths).toContain(p);
      });
    });

    test("can query by multiple frontmatter fields", async () => {
      const dbFiles = await mddb.getFiles({
        frontmatter: { author: "John Doe", draft: true },
      });
      const dbFilesPaths = dbFiles.map((f) => f.file_path);

      const expectedPaths = [`${pathToContentFixture}/blog/blog1.mdx`];

      expect(dbFilesPaths).toHaveLength(expectedPaths.length);
      dbFilesPaths.forEach((p) => {
        expect(expectedPaths).toContain(p);
      });
    });

    test("can get records with non-existing field for `false` queries", async () => {
      const dbFiles = await mddb.getFiles({
        frontmatter: { author: "John Doe", draft: false },
      });
      const dbFilesPaths = dbFiles.map((f) => f.file_path);

      const expectedPaths = [`${pathToContentFixture}/blog/blog2.mdx`];

      expect(dbFilesPaths).toHaveLength(expectedPaths.length);
      dbFilesPaths.forEach((p) => {
        expect(expectedPaths).toContain(p);
      });
    });

    test("can query by tags AND filetypes AND extensions", async () => {
      const dbFiles = await mddb.getFiles({
        tags: ["culture"],
        filetypes: ["news"],
        extensions: ["md", "mdx"],
      });
      const dbFilesPaths = dbFiles.map((f) => f.file_path);
      const expectedPaths = [`${pathToContentFixture}/news/news1.mdx`];

      expect(dbFilesPaths).toHaveLength(expectedPaths.length);
      dbFilesPaths.forEach((p) => {
        expect(expectedPaths).toContain(p);
      });
    });

    test("can find file by url path", async () => {
      const dbFile = await mddb.getFileByUrl("blog/blog2");
      expect(dbFile).not.toBeNull();
      expect(dbFile!.url_path).toBe("blog/blog2");
    });

    test("can find file by id", async () => {
      const dbFile = await mddb.getFileByUrl("blog/blog2");
      const dbFileById = await mddb.getFileById(dbFile!._id);
      expect(dbFileById).not.toBeNull();
      expect(dbFileById!.url_path).toBe("blog/blog2");
    });
  });

  describe("getTags", () => {
    // TODO the list of tags in db should be defined in some config file instead of being extracted from all the files
    test("can get all tags", async () => {
      const dbTags = await mddb.getTags();
      const extectedTags = [
        { name: "tag1" },
        { name: "tag2" },
        { name: "tag3" },
        { name: "economy" },
        { name: "politics" },
        { name: "sports" },
        { name: "culture" },
      ];

      expect(dbTags).toHaveLength(extectedTags.length);
      dbTags.forEach((t) => {
        expect(extectedTags).toContainEqual(t);
      });
    });
  });

  describe("getLinks", () => {
    test("can get all forward links of a file", async () => {
      const fromFile = await mddb.getFileByUrl("blog/blog2");
      const toFile = await mddb.getFileByUrl("blog0");

      const forwardLinks = await mddb.getLinks({
        fileId: fromFile!._id,
      });
      expect(forwardLinks.length).toBe(1);
      expect(forwardLinks[0].to).toBe(toFile!._id);
    });

    test("can get all backward links of a file", async () => {
      const toFile = await mddb.getFileByUrl("blog/blog2");
      const fromFile1 = await mddb.getFileByUrl("blog0");
      const fromFile2 = await mddb.getFileByUrl("blog/blog1");

      const backwardLinks = await mddb.getLinks({
        fileId: toFile!._id,
        direction: "backward",
      });
      const backwardLinksFileIds = backwardLinks.map((l) => l.from);
      expect(backwardLinksFileIds).toHaveLength(2);
      expect(backwardLinksFileIds).toContain(fromFile1!._id);
      expect(backwardLinksFileIds).toContain(fromFile2!._id);
    });
  });

  test("can query by folder", async () => {
    const allBlogFiles = recursiveWalkDir(`${pathToContentFixture}/blog`);
    const indexedBlogFiles = await mddb.getFiles({
      folder: "blog",
      extensions: ["md", "mdx"],
    });
    expect(indexedBlogFiles.length).toBe(allBlogFiles.length);
  });

  describe("MddbFile schema", () => {
    it("batchInsert should throw an error if some file objects have duplicate _id", () => {
      const files: File[] = [
        {
          _id: "1",
          file_path: "aaa.md",
          extension: "md",
          url_path: "aaa",
          metadata: null,
          filetype: null,
        },
        {
          _id: "2",
          file_path: "bbb.md",
          extension: "md",
          url_path: "bbb",
          metadata: null,
          filetype: null,
        },
        {
          _id: "1",
          file_path: "ccc.md",
          extension: "md",
          url_path: "ccc",
          metadata: null,
          filetype: null,
        },
      ];
      // TODO fix types
      expect(() => MddbFile.batchInsert(mddb as any, files)).toThrow();
    });
  });
});

describe("MarkdownDB - custom config", () => {
  const pathToContentFixture = "__mocks__/content";
  let mddb: MarkdownDB;

  beforeAll(async () => {
    const dbConfig = {
      client: "sqlite3",
      connection: {
        filename: "markdown.db",
      },
    };

    mddb = new MarkdownDB(dbConfig);
    await mddb.init();
    await mddb.indexFolder({
      folderPath: pathToContentFixture,
      ignorePatterns: [/[\\/]ignore[\\/].*/],
      pathToUrlResolver: (path) =>
        path
          .replace(/\.mdx?$/, "")
          .replace(/\s+/g, "-")
          .toLowerCase(),
    });
  });

  afterAll(async () => {
    // TODO why we have to call this twice?
    mddb.db.destroy();
    mddb._destroyDb();
  });

  describe("correct startup and indexing", () => {
    test("indexes all files in folder BUT ignored paths", async () => {
      const allFiles = recursiveWalkDir(pathToContentFixture);
      const allIndexedFilesCount = allFiles.length - 1; // ignore/ignore.md
      const allIndexedFiles = await mddb.getFiles();
      expect(allIndexedFiles).toHaveLength(allIndexedFilesCount);
    });

    test("correctly converts file paths to urls", async () => {
      const dbFile1 = await mddb.getFileByUrl("blog/some-blog-4"); // note: the file name is "Some Blog 4.md"
      expect(dbFile1).not.toBeNull();

      const dbFile2 = await mddb.getFileByUrl("blog/blog2");
      expect(dbFile2).not.toBeNull();
    });
  });
});
