import { parseFile2 } from "./process";
import Path from 'path';

describe("Can parse a file and get file info", () => {
  const pathToContentFixture = "__mocks__/content";

  test("can parse a file", async () => {
    const filePath = 'index.mdx';
    const fullPath = Path.join(pathToContentFixture, filePath);
    const fileInfo = await parseFile2(fullPath)
    expect(fileInfo.file_path).toBe(fullPath);
    // expect(fileInfo.metadata?.title).toBe('Homepage')
  });
});
