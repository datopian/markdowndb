import chokidar from "chokidar";
import { generateFileIdFromPath } from "../lib/markdowndb.js";
import { markdownToJson } from "../lib/markdownToJson.js";
import { Knex } from "knex";
import { FolderMdJsonData } from "../lib/FolderMdJsonData.js";

class MddbFolderWatcher {
  folderPath: any;
  watcher: chokidar.FSWatcher | null = null;
  folderMdJsonData: FolderMdJsonData;
  db: Knex;
  ready = false;

  constructor(
    db: Knex,
    folderMdJsonData: FolderMdJsonData,
    folderPath: string
  ) {
    this.folderPath = folderPath;
    this.folderMdJsonData = folderMdJsonData;
    this.db = db;
  }

  createWatcher() {
    this.watcher = chokidar.watch(this.folderPath, {
      ignoreInitial: true,
    });

    this.watcher.on("add", this.handleFileAdd.bind(this));
    this.watcher.on("unlink", this.handleFileDelete.bind(this));
    this.watcher.on("change", this.handleFileChange.bind(this));
    this.watcher.on("ready", () => {
      this.ready = true;
      console.log("Initial scan complete. Chokidar is ready.");
    });
  }

  async handleFileAdd(filePath: string, filePathsToIndex: string[]) {
    const newJson = markdownToJson(this.folderPath, filePath, filePathsToIndex);
    await this.folderMdJsonData.addFileJson(newJson);
  }

  handleFileDelete(filePath: string) {
    const fileId = generateFileIdFromPath(filePath);
    this.folderMdJsonData.deleteFile(fileId);
  }

  handleFileChange(filePath: string) {
    const newFileJson = markdownToJson(this.folderPath, filePath, []);
    const fileId = generateFileIdFromPath(filePath);
    this.folderMdJsonData.updateFileJson(fileId, newFileJson);
  }

  start() {
    if (this.watcher === null) {
      this.createWatcher();
    }
    this.watcher!.add(this.folderPath);
  }

  stop() {
    if (this.watcher !== null) {
      this.watcher.close();
    }
  }

  setDatabase(db: Knex<any, any[]>) {
    this.db = db;
  }
}

export default MddbFolderWatcher;
