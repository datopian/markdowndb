import { ZodError } from "zod";
import { CustomConfig } from "./CustomConfig.js";
import { FileInfo, processFile } from "./process.js";
import { recursiveWalkDir } from "./recursiveWalkDir.js";

export function indexFolder(
  folderPath: string,
  pathToUrlResolver: (filePath: string) => string,
  config: CustomConfig,
  ignorePatterns?: RegExp[]
) {
  const filePathsToIndex = recursiveWalkDir(folderPath);
  const filteredFilePathsToIndex = filePathsToIndex.filter((filePath) =>
    shouldIncludeFile(filePath, ignorePatterns)
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

        error.errors.forEach((err) => {
          const errorMessage = `Error: In ${
            fileObject.file_path
          } for the ${documentType} schema. \n    In "${err.path.join(
            ","
          )}" field: ${err.message}`;
          console.error(errorMessage);
        });
      }
    }

    files.push(fileObject);
  }
  return files;
}

export function shouldIncludeFile(
  filePath: string,
  ignorePatterns?: RegExp[]
): boolean {
  return !(
    ignorePatterns && ignorePatterns.some((pattern) => pattern.test(filePath))
  );
}
