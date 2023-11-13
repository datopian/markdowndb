import { FileObject } from "../lib/types/FileObject.js";

export function extractFileSchemeFromObject(fileObject: FileObject) {
  return {
    _id: fileObject._id,
    file_path: fileObject.file_path,
    extension: fileObject.extension,
    url_path: fileObject.url_path,
    filetype: fileObject.filetype,
    metadata: fileObject.metadata,
  };
}
