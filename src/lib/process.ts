import crypto from "crypto";
import fs from "fs";
import path from "path";

import { File } from "./schema.js";
import { WikiLink, parseFile } from "./parseFile.js";
import { Root } from "remark-parse/lib/index.js";

export interface FileInfo extends File {
  tags: string[];
  links: WikiLink[];
}

// this file is an extraction of the file info parsing from markdowndb.ts without any sql stuff
// TODO: add back (as an option) - providing a "root folder" path for resolve
export function processFile(
  rootFolder: string,
  filePath: string,
  {
    pathToUrlResolver = (filePath) => filePath,
    filePathsToIndex = [],
    customFields = [(fileInfo: FileInfo, ast: Root) => {}],
  }: {
    pathToUrlResolver: (filePath: string) => string;
    filePathsToIndex: string[];
    customFields: ((fileInfo: FileInfo, ast: Root) => any)[];
  }
) {
  // Remove rootFolder from filePath
  const relativePath = path.relative(rootFolder, filePath);

  // gets key file info if any e.g. extension (file size??)
  const encodedPath = Buffer.from(relativePath, "utf-8").toString();
  const id = crypto.createHash("sha1").update(encodedPath).digest("hex");

  // extension
  const extension = path.extname(relativePath).slice(1);

  const fileInfo: FileInfo = {
    _id: id,
    file_path: filePath,
    extension,
    url_path: null,
    filetype: null,
    metadata: {},
    tags: [],
    links: [],
  };

  // if not a file type we can parse exit here ...
  // if (extension ! in list of supported extensions exit now ...)
  const isExtensionSupported = extension === "md" || extension === "mdx";
  if (!isExtensionSupported) {
    return fileInfo;
  }

  // metadata, tags, links
  const source: string = fs.readFileSync(filePath, {
    encoding: "utf8",
    flag: "r",
  });

  const { ast, metadata, links } = parseFile(source, {
    from: relativePath,
    permalinks: filePathsToIndex,
  });

  fileInfo.url_path = pathToUrlResolver(relativePath);
  fileInfo.metadata = metadata;
  fileInfo.links = links;

  const filetype = metadata?.type || null;
  fileInfo.filetype = filetype;

  const tags = metadata?.tags || [];
  fileInfo.tags = tags;
  for (let index = 0; index < customFields.length; index++) {
    const customFieldFunction = customFields[index];
    customFieldFunction(fileInfo, ast);
  }

  return fileInfo;
}
