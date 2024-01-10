import { FileInfo } from "../lib/process";
import { Root } from "mdast";
import { MarkdownDB } from "../lib/markdowndb";
import { z } from "zod";

describe("Document Types Schema Validate Testing", () => {
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
    });

    afterAll(async () => {
        await mddb.db.destroy();
    });

    test("Test that the 'indexFolder' function throws a validation error for a missing field in the blog schema.", async () => {
        try {
            await mddb.indexFolder({
                folderPath: pathToContentFixture,
                customConfig: {
                    schemas: {
                        blog: z.object({
                            missingField: z.string(),
                        }),
                    },
                },
            });
            
            fail("Expected a validation error due to a missing field in the blog schema, but none was thrown.");
        } catch (error: any) {
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toContain("Validation Failed: Unable to validate files against the specified scheme.");
            ;
        }
    });
    test("Should check if the title field is created and save in db", async () => {
        await mddb.indexFolder({
            folderPath: pathToContentFixture,
            customConfig: {
                computedFields: [
                    (fileInfo: FileInfo, ast: Root) => {
                        fileInfo.title = "Hello";
                    },
                ],
                schemas: {
                    blog: z.object({
                        title: z.string(),
                    }),
                },
            },
        });
        const dbFiles = await mddb.getFiles({ filetypes: ["blog"] });
        for (const file of dbFiles) {
            expect(file.title).toBe("Hello");
        }
    });
});
