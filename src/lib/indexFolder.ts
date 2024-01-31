import { ZodError } from "zod";
import { CustomConfig } from "./CustomConfig.js";
import { FileInfo, processFile } from "./process.js";
import { recursiveWalkDir } from "./recursiveWalkDir.js";
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
  const computedFields = config.computedFields || [];
  const schemas = config.schemas;
  for (const filePath of filteredFilePathsToIndex) {
    const fileObject = processFile(
      folderPath,
      filePath,
      pathToUrlResolver,
      filePathsToIndex,
      computedFields
    );
    const urlPath = fileObject?.url_path ?? "";
    // This is temporary.
    // Note: Subject to change pending agreement on the final structure of document types.
    const flattenedFileObject = {
      ...fileObject,
      ...fileObject.metadata,
      tags: fileObject.tags, // Don't override the tags
    };
    const documentType = urlPath.split("/")[0];

    if (schemas && schemas[documentType]) {
      const result = schemas[documentType].safeParse(flattenedFileObject);

      if (!result.success) {
        const error: ZodError = (result as any).error;

        error.errors.forEach((err: any) => {
          const errorMessage = `Error: In ${fileObject.file_path
            } for the ${documentType} schema. \n    In "${err.path.join(
              ","
            )}" field: ${err.message}`;
          console.error(errorMessage);
        });
        
        throw new Error(
          "Validation Failed: Unable to validate files against the specified scheme. Ensure that the file formats and content adhere to the specified scheme."
        );
      }
      throw new Error(
        "Validation Failed: Unable to validate files against the specified scheme. Ensure that the file formats and content adhere to the specified scheme."
      );
    }

    files.push(fileObject);
  }
  return files;
}

export function shouldIncludeFile({
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
    includeGlob.length > 0 &&
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
