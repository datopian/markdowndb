import crypto from "crypto";
import fs from "fs";

import { parseFile, WikiLink } from "../utils/index.js";

// this file is an extraction of the file info parsing from markdowndb.ts without any sql stuff
// TODO: add back (as an option) - providing a "root folder" path for resolve
export function processFile(filePath: string) {
  // gets key file info if any e.g. extension (file size??)

  const encodedPath = Buffer.from(filePath, "utf-8").toString();
  const id = crypto.createHash("sha1").update(encodedPath).digest("hex");

  // extension
  // future use import Path from 'path'
  // Path.extname
  const [, extension] = filePath.match(/.(\w+)$/) || [];

  let fileInfo: FileInfo = {
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

  const { metadata, links } = parseFile(source, {
    permalinks: [],
  });
  fileInfo.metadata = metadata;
  fileInfo.links = links;

  const filetype = metadata?.type || null;
  fileInfo.filetype = filetype;

  const tags = metadata?.tags || [];
  fileInfo.tags = tags;

  return fileInfo;
}

// let's put types here - later we'll refactor them out ...
export interface FileInfo extends File {
  tags: Tag[];
  links: WikiLink[];
}

export interface File {
  _id: string;
  file_path: string;
  extension: string;
  url_path: string | null;
  filetype: string | null;
  metadata: MetaData | null;
}

export type MetaData = {
  [key: string]: any;
};

export interface Link {
  link_type: "normal" | "embed";
  from: string;
  to: string;
}

export interface Tag {
  name: string;
}

export interface FileTag {
  tag: string;
  file: string;
}
