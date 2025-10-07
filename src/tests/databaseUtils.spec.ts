import { MarkdownDB } from "../lib/markdowndb";

/**
 * @jest-environment node
 */

describe("MarkdownDB - Nested WikiLink Bug", () => {
  const pathToContentFixture = "__mocks__/wikilink-nested";
  let mddb: MarkdownDB;

  beforeAll(async () => {
    const dbConfig = {
      client: "sqlite3",
      connection: {
        filename: ":memory:",
      },
    };

    mddb = new MarkdownDB(dbConfig);
    await mddb.init();
    await mddb.indexFolder({ folderPath: pathToContentFixture });
  });

  afterAll(async () => {
    await mddb.db.destroy();
  });

  test("indexes wikilinks when target file is in subdirectory", async () => {
    // Foo.md contains [[Bar]] which should link to folder/Bar.md
    const fooFile = await mddb.getFileByUrl("Foo");
    const barFile = await mddb.getFileByUrl("folder/Bar");

    expect(fooFile).not.toBeNull();
    expect(barFile).not.toBeNull();

    // Get links from Foo.md
    const forwardLinks = await mddb.getLinks({
      fileId: fooFile!._id,
    });

    // Should have 1 link
    expect(forwardLinks.length).toBe(1);
    // Link should point to Bar file
    expect(forwardLinks[0].to).toBe(barFile!._id);
  });

  test("existing same-directory wikilinks still work", async () => {
    // Test with blog1.mdx -> [[blog2]] -> blog/blog2.mdx (same directory)
    const pathToBlog = "__mocks__/content";
    
    const dbConfig = {
      client: "sqlite3",
      connection: {
        filename: ":memory:",
      },
    };

    const testMddb = new MarkdownDB(dbConfig);
    await testMddb.init();
    await testMddb.indexFolder({ folderPath: pathToBlog });

    const blog1File = await testMddb.getFileByUrl("blog/blog1");
    const blog2File = await testMddb.getFileByUrl("blog/blog2");

    expect(blog1File).not.toBeNull();
    expect(blog2File).not.toBeNull();

    const forwardLinks = await testMddb.getLinks({
      fileId: blog1File!._id,
    });

    expect(forwardLinks.length).toBe(1);
    expect(forwardLinks[0].to).toBe(blog2File!._id);

    await testMddb.db.destroy();
  });

  test("exact path match is preferred over basename match", async () => {
    // This test ensures that if there's an exact path match, it takes priority
    // over a basename-only match
    const pathToBlog = "__mocks__/content";
    
    const dbConfig = {
      client: "sqlite3",
      connection: {
        filename: ":memory:",
      },
    };

    const testMddb = new MarkdownDB(dbConfig);
    await testMddb.init();
    await testMddb.indexFolder({ folderPath: pathToBlog });

    // blog/blog1.mdx contains [[blog2]] which should match blog/blog2.mdx 
    // (same directory) even though there might be other "blog2" files elsewhere
    const blog1File = await testMddb.getFileByUrl("blog/blog1");
    const blog2File = await testMddb.getFileByUrl("blog/blog2");

    expect(blog1File).not.toBeNull();
    expect(blog2File).not.toBeNull();

    const forwardLinks = await testMddb.getLinks({
      fileId: blog1File!._id,
    });

    // Should match the one in the same directory (blog/blog2)
    expect(forwardLinks.length).toBe(1);
    expect(forwardLinks[0].to).toBe(blog2File!._id);

    await testMddb.db.destroy();
  });
});
