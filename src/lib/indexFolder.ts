import { FileInfo, processFile } from "./process.js";
import { recursiveWalkDir } from "./recursiveWalkDir.js";
import { CustomConfig } from "./CustomConfig.js";
import micromatch from "micromatch";

export function indexFolder(
  folderPath: string,
  pathToUrlResolver: (filePath: string) => string,
  config: CustomConfig,
  ignorePatterns?: RegExp[]
) {
  const filePathsToIndex = recursiveWalkDir(folderPath);
  const filteredFilePathsToIndex = filePathsToIndex.filter((filePath) =>
    shouldIncludeFile({
      filePath,
      ignorePatterns,
      includeGlob: config.include,
      excludeGlob: config.exclude,
    })
  );
  const files: FileInfo[] = [];

  const customFields = config.customFields || [];
  for (const filePath of filteredFilePathsToIndex) {
    const fileObject = processFile(folderPath, filePath, {
      pathToUrlResolver,
      filePathsToIndex,
      customFields,
    });
    files.push(fileObject);
  }
  return files;
}

function shouldIncludeFile({
  filePath,
  ignorePatterns,
  includeGlob,
  excludeGlob,
}: {
  filePath: string;
  ignorePatterns?: RegExp[];
  includeGlob?: string[];
  excludeGlob?: string[];
}): boolean {
  const normalizedFilePath = filePath.replace(/\\/g, "/");

  if (
    ignorePatterns &&
    ignorePatterns.some((pattern) => pattern.test(normalizedFilePath))
  ) {
    return false;
  }

  // Check if the file should be included based on includeGlob
  if (
    includeGlob &&
    !includeGlob.some((pattern) =>
      micromatch.isMatch(normalizedFilePath, pattern)
    )
  ) {
    return false;
  }

  // Check if the file should be excluded based on excludeGlob
  if (
    excludeGlob &&
    excludeGlob.some((pattern) =>
      micromatch.isMatch(normalizedFilePath, pattern)
    )
  ) {
    return false;
  }

  return true;
}
