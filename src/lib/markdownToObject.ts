import fs from "fs";
import path from "path";
import { parseFile } from "../utils/index.js";
import { FileObject } from "./types/FileObject.js";
import { MddbFile } from "./schema.js";
import {
  defaultFilePathToUrl,
} from "./markdowndb.js";
import { generateFileIdFromPath } from "../utils/index.js";
import { getFileExtensionFromPath } from "../utils/index.js";

export function markdownToObject(
  folderPath: string,
  filePath: string,
  filePathsToIndex: string[]
): FileObject {
  const id = generateFileIdFromPath(filePath);
  const extension = getFileExtensionFromPath(filePath);
  const defaultFileJson = {
    file: {
      _id: id,
      file_path: filePath,
      extension,
      url_path: null,
      filetype: null,
      metadata: null,
    },
    tags: [],
    links: [],
  };
  
  // if not md or mdx return this
  const isExtensionNotSupported =
    !MddbFile.supportedExtensions.includes(extension);
  if (isExtensionNotSupported) {
    return defaultFileJson;
  }

  // url_path
  const pathRelativeToFolder = path.relative(folderPath, filePath);
  // const urlPath = defaultFilePathToUrl(pathRelativeToFolder);
  const urlPath = defaultFilePathToUrl(pathRelativeToFolder);

  // metadata, tags, links
  let source: string, metadata, links;
  try {
    source = fs.readFileSync(filePath, {
      encoding: "utf8",
      flag: "r",
    });

    ({ metadata, links } = parseFile(source, {
      permalinks: filePathsToIndex,
    }));
  } catch (e) {
    console.error(
      `Failed to parse file ${filePath}. Waiting for file changes.`
    );

    return defaultFileJson;
  }

  // get tags in the file
  const tags = (metadata?.tags || []).map((tag: string) => {
    return { name: tag };
  });

  let fileObject: FileObject = {
    file: {
      _id: id,
      extension: extension,
      url_path: urlPath,
      file_path: filePath,
      filetype: metadata?.type || null,
      metadata: metadata,
    },
    tags: [...tags],
    links: links,
  };

  return fileObject;
}
