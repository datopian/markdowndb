import { WikiLink, getUniqueValues, recursiveWalkDir } from "../utils/index.js";
import { markdownToObject } from "./markdownToObject.js";
import { File, FileTag, Link, Tag } from "./types/schemaTypes.js";

export function indexFolderToObjects(
  folderPath: string,
  ignorePatterns?: RegExp[],
  pathToUrlResolver?: (filePath: string) => string
) {
  const filePathsToIndex = recursiveWalkDir(folderPath);
  const files: File[] = [];
  const tags: Tag[] = [];
  const fileTags: FileTag[] = [];
  const links: Link[] = [];
  const filteredFilePathsToIndex = filePathsToIndex.filter((filePath) => {
    return !(
      ignorePatterns && ignorePatterns.some((pattern) => pattern.test(filePath))
    );
  });

  for (const filePath of filteredFilePathsToIndex) {
    const fileObject = markdownToObject(folderPath, filePath, filePathsToIndex);

    files.push(fileObject.file);
    tags.push(...fileObject.tags);

    const fileTagsToInsert = fileObject.tags.map((tag) => ({
      tag: tag.name,
      file: fileObject.file._id,
    }));
    const uniqueFileTags = getUniqueValues(fileTagsToInsert);
    fileTags.push(...uniqueFileTags);

    const linksToInsert: Link[] = processWikiLinks(
      fileObject.links,
      fileObject.file._id,
      filePathsToIndex
    );
    links.push(...linksToInsert);
  }

  const uniqueTags = getUniqueValues(tags);
  return {
    files: files,
    tags: uniqueTags,
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
