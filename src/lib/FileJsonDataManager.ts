import { Knex } from "knex";
import { jsonDiff } from "./utils.js";
import { MddbFile } from "./schema.js";
import { FileJson } from "./FolderMdJsonData.js";

export class FileJsonDataManager {
  private db: Knex;
  private _files: FileJson[];

  constructor(db: Knex, files: FileJson[]) {
    this.db = db;
    this._files = files;
  }

  async addFileJson(newFileJson: FileJson) {
    this._files.push(newFileJson);
    await MddbFile.insert(this.db, newFileJson.file);
  }

  async updateFileJson(fileId: string, newFileJson: FileJson) {
    const index = this.getFileIndex(fileId);
    if (index === -1) {
      throw new Error(`Failed to update non-sxising file ${fileId}`);
    }

    const oldJson = this._files[index];
    this._files[index] = newFileJson;

    const fileDiff = jsonDiff(oldJson.file, newFileJson.file);
    if (Object.keys(fileDiff).length === 0) {
      return;
    }
    await MddbFile.updateFileProperties(this.db, fileId, fileDiff);
  }

  async deleteFile(fileId: string) {
    const index = this.getFileIndex(fileId);
    if (index === -1) {
      throw new Error("Failed to delete file");
    }
    this._files.splice(index, 1);
    this._files.push();
    await MddbFile.deleteById(this.db, fileId);
  }

  getFileIndex(fileId: string) {
    return this._files.findIndex((fileJson) => fileJson.file._id === fileId);
  }

  getFileJsonById(fileId: string) {
    return this._files.find((fileJson) => fileJson.file._id === fileId);
  }

  getFileJsonByUrlPath(urlPath: string) {
    return this._files.find((fileJson) => fileJson.file.url_path === urlPath);
  }

  getFileTags(fileId: string) {
    const fileJson = this.getFileJsonById(fileId);

    if (!fileJson) {
      throw new Error(`Unable to get non-existing file ${fileId}`);
    }

    return fileJson.tags;
  }

  getLinks(fileId: string) {
    const fileJson = this.getFileJsonById(fileId);

    if (!fileJson) {
      throw new Error(`Unable to get non-existing file ${fileId}`);
    }

    return fileJson.links;
  }

  get files() {
    return this._files;
  }
}
