import { getUniqueValues, recursiveWalkDir } from "../utils/index.js";
import type { WikiLink } from "../utils/index.js";
import { extractFileSchemeFromObject } from "../utils/extractFileSchemeFromObject.js";
import { readLocalMarkdownFileToObject } from "./readLocalMarkdownFileToObject.js";
import { File, FileTag, Link, Tag } from "./types/schemaTypes.js";

export function indexFolderToObjects(
  folderPath: string,
  pathToUrlResolver: (filePath: string) => string,
  ignorePatterns?: RegExp[]
) {
  const filePathsToIndex = recursiveWalkDir(folderPath);
  const files: File[] = [];
  const tags: string[] = [];
  const fileTags: FileTag[] = [];
  const links: Link[] = [];
  const filteredFilePathsToIndex = filePathsToIndex.filter((filePath) =>
    shouldIncludeFile(filePath, ignorePatterns)
  );

  for (const filePath of filteredFilePathsToIndex) {
    const fileObject = readLocalMarkdownFileToObject(
      folderPath,
      filePath,
      filePathsToIndex,
      pathToUrlResolver
    );

    const file = extractFileSchemeFromObject(fileObject);
    files.push(file);

    tags.push(...fileObject.tags);

    const fileTagsToInsert = fileObject.tags.map((tag) => ({
      tag: tag,
      file: fileObject._id,
    }));
    fileTags.push(...fileTagsToInsert);

    const linksToInsert: Link[] = processWikiLinks(
      fileObject.links,
      fileObject._id,
      filePathsToIndex
    );
    links.push(...linksToInsert);
  }

  const uniqueTags = getUniqueValues(tags);
  const TagsToInsert = uniqueTags.map((tag) => ({ name: tag }));
  return {
    files: files,
    tags: TagsToInsert,
    fileTags: fileTags,
    links: links,
  };
}

function processWikiLinks(
  links: WikiLink[],
  fileId: string,
  filePathsToIndex: string[]
): Link[] {
  return links
    .map((link) => ({
      from: fileId,
      to: filePathsToIndex.find((file) => file === link.linkSrc)!,
      link_type: link.linkType,
    }))
    .filter((link) => link.to !== undefined);
}

function shouldIncludeFile(
  filePath: string,
  ignorePatterns?: RegExp[]
): boolean {
  return !(
    ignorePatterns && ignorePatterns.some((pattern) => pattern.test(filePath))
  );
}
