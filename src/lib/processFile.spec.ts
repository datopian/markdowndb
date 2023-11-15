import path from "path";
import { processFile } from "./processFile";

describe("Can parse a file and get file info", () => {
  const pathToContentFixture = "__mocks__/content";

  test("can parse a file", async () => {
    const filePath = "index.mdx";
    const fullPath = path.join(pathToContentFixture, filePath);
    const fileInfo = processFile(
      fullPath,
      pathToContentFixture,
      [],
      (filePath: string) => filePath
    );

    expect(fileInfo.file_path).toBe(fullPath);
    expect(fileInfo.extension).toBe("mdx");
    expect(fileInfo.tags).toEqual(["tag1", "tag2", "tag3"]);
    expect(fileInfo.metadata).toEqual({
      title: "Homepage",
      tags: ["tag1", "tag2", "tag3"],
    });
    expect(fileInfo.links).toEqual([
      { linkSrc: "blog0.mdx", linkType: "normal" },
    ]);
  });
});
