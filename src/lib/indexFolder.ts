import { FileInfo, processFile } from "./process.js";
import { recursiveWalkDir } from "./recursiveWalkDir.js";

export function indexFolder(
  folderPath: string,
  pathToUrlResolver: (filePath: string) => string,
  ignorePatterns?: RegExp[]
) {
  const filePathsToIndex = recursiveWalkDir(folderPath);
  const filteredFilePathsToIndex = filePathsToIndex.filter((filePath) =>
    shouldIncludeFile(filePath, ignorePatterns)
  );
  const files: FileInfo[] = [];
  for (const filePath of filteredFilePathsToIndex) {
    const fileObject = processFile(
      folderPath,
      filePath,
      pathToUrlResolver,
      filePathsToIndex
    );
    files.push(fileObject);
  }
  return files;
}

function shouldIncludeFile(
  filePath: string,
  ignorePatterns?: RegExp[]
): boolean {
  return !(
    ignorePatterns && ignorePatterns.some((pattern) => pattern.test(filePath))
  );
}
