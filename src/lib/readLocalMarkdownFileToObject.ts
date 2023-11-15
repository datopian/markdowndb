import fs from "fs";
import path from "path";
import {
  parseMarkdownContent,
  generateFileIdFromPath,
  getFileExtensionFromPath
} from "../utils/index.js";
import type { FileObject } from "./types/FileObject.js";
import { MddbFile } from "./schema.js";

export function readLocalMarkdownFileToObject(
  folderPath: string,
  filePath: string,
  filePathsToIndex: string[],
  pathToUrlResolver: (filePath: string) => string
): FileObject {
  const id = generateFileIdFromPath(filePath);
  const extension = getFileExtensionFromPath(filePath);
  const fileObject: FileObject = {
    _id: id,
    file_path: filePath,
    extension,
    url_path: null,
    filetype: null,
    metadata: null,
    tags: [],
    links: [],
  };

  // if not md or mdx return this
  const isExtensionNotSupported =
    !MddbFile.supportedExtensions.includes(extension);
  if (isExtensionNotSupported) {
    return fileObject;
  }

  // url_path
  const pathRelativeToFolder = path.relative(folderPath, filePath);
  const urlPath = pathToUrlResolver(pathRelativeToFolder);

  // metadata, tags, links
  let source: string, metadata, links;
  try {
    source = fs.readFileSync(filePath, {
      encoding: "utf8",
      flag: "r",
    });

    ({ metadata, links } = parseMarkdownContent(source, {
      permalinks: filePathsToIndex,
    }));

    fileObject.url_path = urlPath;
    fileObject.metadata = metadata;
    fileObject.filetype = metadata?.type || null;
    fileObject.links = links;
    if (metadata.tags) {
      fileObject.tags = metadata.tags;
    }

    return fileObject;
  } catch (e) {
    console.error(`Error processing file ${filePath}: ${e}`);
    return fileObject;
  }
}
