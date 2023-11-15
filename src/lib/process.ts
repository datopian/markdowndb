import crypto from "crypto";
import fs from "fs";
import path from "path";

import { parseFile, WikiLink } from "../utils/index.js";

// this file is an extraction of the file info parsing from markdowndb.ts without any sql stuff
export function parseFile2(filePath:string) {
  // gets key file info if any e.g. extension (file size??)

  const encodedPath = Buffer.from(filePath, "utf-8").toString();
  const id = crypto.createHash("sha1").update(encodedPath).digest("hex");

  // extension
  // future use import Path from 'path'
  // Path.extname
  const [, extension] = filePath.match(/.(\w+)$/) || [];

  let fileInfo = {
    _id: id,
    file_path: filePath,
    extension,
    url_path: null,
    filetype: null,
    metadata: {},
    tags: [],
    links: []
  }

  return fileInfo;
  
  // TODO: add back later
  // if not a file type we can parse exit here ...
  // if (extension ! in list of supported extensions exit now ...)

  // url_path
  // const pathRelativeToFolder = path.relative(folderPath, filePath);
  // const urlPath = pIathToUrlResolver(pathRelativeToFolder);

  // metadata, tags, links
  const source: string = fs.readFileSync(filePath, {
    encoding: "utf8",
    flag: "r",
  });

  const { metadata, links } = parseFile(source, {
    permalinks: []
  });
  const filetype = metadata?.type || null;

  // fileInfo.links = links;

  const tags = metadata?.tags || [];
  fileInfo.tags = tags;
  fileInfo.metadata = metadata;
}