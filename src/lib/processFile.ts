import fs from "fs";
import path from "path";
import { parseMarkdownContent } from "../utils/index.js";
import type { FileObject } from "./types/FileObject.js";
import crypto from "crypto";

export function processFile(
  filePath: string,
  folderPath: string,
  filePathsToIndex: string[],
  pathToUrlResolver: (filePath: string) => string
): FileObject {
  const encodedPath = Buffer.from(filePath, "utf-8").toString();
  const id = crypto.createHash("sha1").update(encodedPath).digest("hex");
  const extension = path.extname(filePath).slice(1);

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
  const isExtensionSupported = ["md", "mdx"].includes(extension);
  if (!isExtensionSupported) {
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
