import { processFile } from "../lib/process";
import Path from "path";

describe("Can parse a file and get file info", () => {
  const pathToContentFixture = "__mocks__/content";

  test("can parse a file", async () => {
    const filePath = "index.mdx";
    const fullPath = Path.join(pathToContentFixture, filePath);
    const fileInfo = processFile(
      pathToContentFixture,
      fullPath,
      (filePath) => filePath,
      [],
      []
    );

    expect(fileInfo.file_path).toBe(fullPath);
    expect(fileInfo.url_path).toBe("index.mdx");
    expect(fileInfo.extension).toBe("mdx");
    expect(fileInfo.tags).toEqual([
      "tag1",
      "tag2",
      "tag3",
      "日本語タグ",
      "标签名",
      "метка",
      "태그이름",
      "tag_فارسی",
      "Tag_avec_éèç-_öäüßñ",
    ]);
    expect(fileInfo.metadata).toEqual({
      title: "Homepage",
      tags: [
        "tag1",
        "tag2",
        "tag3",
        "日本語タグ",
        "标签名",
        "метка",
        "태그이름",
        "tag_فارسی",
        "Tag_avec_éèç-_öäüßñ",
      ],
      tasks: [
        {
          checked: false,
          description: "uncompleted task 2",
        },
        {
          checked: true,
          description: "completed task 1",
        },
        {
          checked: true,
          description: "completed task 2",
        },
      ],
    });
    expect(fileInfo.links).toEqual([
      {
        embed: false,
        from: "index.mdx",
        internal: true,
        text: "link",
        to: "blog0.mdx",
        toRaw: "blog0.mdx",
      },
    ]);
  });
});
