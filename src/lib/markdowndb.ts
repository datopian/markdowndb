import knex, { Knex } from "knex";

import { MddbFile, MddbTag, MddbFileTag, MddbLink } from "./schema.js";
import { DbQueryManager } from "./DbQueryManager.js";
import type { FilesQuery, LinkQuery } from "./types/DbQueryTypes.js";
import { indexFolderToObjects } from "./indexFolderToObjects.js";
import { defaultFilePathToUrl } from "../utils/defaultFilePathToUrl.js";

export class MarkdownDB {
  config: Knex.Config;
  db: Knex;
  dbQueryManager: DbQueryManager;

  constructor(config: Knex.Config) {
    this.config = config;
  }

  async init() {
    this.db = knex({ ...this.config, useNullAsDefault: true });
    this.dbQueryManager = new DbQueryManager(this.db);
    return this;
  }

  async indexFolder({
    folderPath,
    // TODO support glob patterns
    ignorePatterns = [],
    pathToUrlResolver = defaultFilePathToUrl,
  }: {
    folderPath: string;
    ignorePatterns?: RegExp[];
    pathToUrlResolver?: (filePath: string) => string;
  }) {
    await resetDatabaseTables(this.db);
    const { files, tags, fileTags, links } = indexFolderToObjects(
      folderPath,
      pathToUrlResolver,
      ignorePatterns
    );

    await MddbFile.batchInsert(this.db, files);
    await MddbTag.batchInsert(this.db, tags);
    await MddbFileTag.batchInsert(this.db, fileTags);
    await MddbLink.batchInsert(this.db, links);
  }

  async getFileById(id: string): Promise<MddbFile | null> {
    return this.dbQueryManager.getFileById(id);
  }

  async getFileByUrl(url: string): Promise<MddbFile | null> {
    return this.dbQueryManager.getFileByUrl(url);
  }

  async getFiles(query?: FilesQuery): Promise<MddbFile[]> {
    return this.dbQueryManager.getFiles(query);
  }

  async getTags(): Promise<MddbTag[]> {
    return this.dbQueryManager.getTags();
  }

  async getLinks(query?: LinkQuery): Promise<MddbLink[]> {
    return this.dbQueryManager.getLinks(query);
  }

  _destroyDb() {
    this.dbQueryManager._destroyDb();
  }
}

async function resetDatabaseTables(db: Knex) {
  const tableNames = [MddbFile, MddbTag, MddbFileTag, MddbLink];
  // Drop and Create tables
  for (const table of tableNames) {
    await table.deleteTable(db);
    await table.createTable(db);
  }
}
