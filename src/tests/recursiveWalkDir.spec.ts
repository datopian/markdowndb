import { recursiveWalkDir } from "../lib/recursiveWalkDir";
import path from "path";

describe("recursiveWalkDir", () => {
  const contentFixturePath = "__mocks__/content/blog";
  /*
   * To get all the file paths in the content fixture, run the following command in the terminal:
   * find <contentFicturePath> -type f
   * watch out for double slashes in the output
   * */
  const contentFixtureFilePaths = [
    `${contentFixturePath}/Some Blog 4.md`,
    `${contentFixturePath}/blog3.mdx`,
    `${contentFixturePath}/blog2.mdx`,
    `${contentFixturePath}/blog1.mdx`,
  ].map(normalizePathSeparator);

  test("should return all files in a directory", async () => {
    const paths = recursiveWalkDir(contentFixturePath);

    expect(paths.length).toBe(contentFixtureFilePaths.length);
    paths.forEach((file) => {
      expect(contentFixtureFilePaths).toContain(file);
    });
  });
});

function normalizePathSeparator(filePath: string): string {
  // Use path.sep to dynamically determine the path separator based on the OS
  return filePath.split("/").join(path.sep);
}
