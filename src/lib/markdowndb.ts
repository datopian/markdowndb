import path from "path";
import knex, { Knex } from "knex";

import { MddbFile, MddbTag, MddbLink, MddbFileTag } from "./schema.js";
import { indexFolder, shouldIncludeFile } from "./indexFolder.js";
import {
  resetDatabaseTables,
  mapFileToInsert,
  mapLinksToInsert,
  isLinkToDefined,
  mapFileTagsToInsert,
  getUniqueValues,
  getUniqueProperties,
} from "./databaseUtils.js";
import fs from "fs";
import { CustomConfig } from "./CustomConfig.js";
import { FileInfo, processFile } from "./process.js";
import chokidar from "chokidar";
import { recursiveWalkDir } from "./recursiveWalkDir.js";
import { loadConfig } from "./loadConfig.js";

const defaultFilePathToUrl = (filePath: string) => {
  let url = filePath
    .replace(/\.(mdx|md)/, "")
    .replace(/\\/g, "/") // replace windows backslash with forward slash
    .replace(/(\/)?index$/, ""); // remove index from the end of the permalink
  url = url.length > 0 ? url : "/"; // for home page
  return encodeURI(url);
};

const resolveLinkToUrlPath = (link: string, sourceFilePath?: string) => {
  if (!sourceFilePath) {
    return link;
  }
  // needed to make path.resolve work correctly
  // becuase we store urls without leading slash
  const sourcePath = "/" + sourceFilePath;
  const dir = path.dirname(sourcePath);
  const resolved = path.resolve(dir, link);
  // remove leading slash
  return resolved.slice(1);
};

/**
 * MarkdownDB class for managing a Markdown database.
 */
export class MarkdownDB {
  config: Knex.Config;
  db: Knex;

  /**
   * Constructs a new MarkdownDB instance.
   * @param {Knex.Config} config - Knex configuration object.
   */
  constructor(config: Knex.Config) {
    this.config = config;
  }

  /**
   * Initializes the MarkdownDB instance and database connection.
   * @returns {Promise<MarkdownDB>} - A promise resolving to the initialized MarkdownDB instance.
   */
  async init() {
    this.db = knex({ ...this.config, useNullAsDefault: true });
    return this;
  }

  /**
   * Indexes the files in a specified folder and updates the database accordingly.
   * @param {Object} options - Options for indexing the folder.
   * @param {string} options.folderPath - The path of the folder to be indexed.
   * @param {RegExp[]} [options.ignorePatterns=[]] - Array of RegExp patterns to ignore during indexing.
   * @param {(filePath: string) => string} [options.pathToUrlResolver=defaultFilePathToUrl] - Function to resolve file paths to URLs.
   * @returns {Promise<void>} - A promise resolving when the indexing is complete.
   */
  async indexFolder({
    folderPath,
    // TODO support glob patterns
    ignorePatterns = [],
    pathToUrlResolver = defaultFilePathToUrl,
    customConfig,
    watch = false,
    configFilePath,
  }: {
    folderPath: string;
    ignorePatterns?: RegExp[];
    pathToUrlResolver?: (filePath: string) => string;
    customConfig?: CustomConfig;
    watch?: boolean;
    configFilePath: string;
  }) {
    const config = customConfig || (await loadConfig(configFilePath));
    const fileObjects = indexFolder(
      folderPath,
      pathToUrlResolver,
      config,
      ignorePatterns
    );
    await this.saveDataToDisk(fileObjects);

    if (watch) {
      const watcher = chokidar.watch(folderPath, {
        ignoreInitial: true,
      });

      const filePathsToIndex = recursiveWalkDir(folderPath);
      const computedFields = config.computedFields || [];

      const handleFileEvent = (event: string, filePath: string) => {
        if (
          !shouldIncludeFile({
            filePath,
            ignorePatterns,
            includeGlob: config.include,
            excludeGlob: config.exclude,
          })
        ) {
          return;
        }

        if (event === "unlink") {
          const index = fileObjects.findIndex(
            (obj) => obj.file_path === filePath
          );
          if (index !== -1) {
            fileObjects.splice(index, 1);
          }
          console.log(`File ${filePath} has been removed`);
          return;
        }

        const fileObject = processFile(
          folderPath,
          filePath,
          pathToUrlResolver,
          filePathsToIndex,
          computedFields
        );
        const index = fileObjects.findIndex(
          (obj) => obj.file_path === filePath
        );

        if (index !== -1) {
          fileObjects[index] = fileObject;
        } else {
          fileObjects.push(fileObject);
        }

        console.log(
          `File ${filePath} has been ${event === "add" ? "added" : "updated"}`
        );
      };

      watcher
        .on("add", (filePath) => handleFileEvent("add", filePath))
        .on("change", (filePath) => handleFileEvent("change", filePath))
        .on("unlink", (filePath) => handleFileEvent("unlink", filePath))
        .on("all", () => this.saveDataToDisk(fileObjects))
        .on("error", (error) => console.error(`Watcher error: ${error}`));
    }
  }

  private async saveDataToDisk(fileObjects: FileInfo[]) {
    await resetDatabaseTables(this.db);
    const properties = getUniqueProperties(fileObjects);
    MddbFile.deleteTable(this.db);
    await MddbFile.createTable(this.db, properties);

    const filesToInsert = fileObjects.map(mapFileToInsert);
    const uniqueTags = getUniqueValues(
      fileObjects.flatMap((file) => file.tags)
    );
    const tagsToInsert = uniqueTags.map((tag) => ({ name: tag }));
    const linksToInsert = fileObjects
      .flatMap((fileObject) => {
        return mapLinksToInsert(filesToInsert, fileObject);
      })
      .filter(isLinkToDefined);
    const fileTagsToInsert = fileObjects.flatMap(mapFileTagsToInsert);

    writeJsonToFile(".markdowndb/files.json", fileObjects);
    await MddbFile.batchInsert(this.db, filesToInsert);
    await MddbTag.batchInsert(this.db, tagsToInsert);
    await MddbFileTag.batchInsert(this.db, fileTagsToInsert);
    await MddbLink.batchInsert(this.db, getUniqueValues(linksToInsert));
  }

  /**
   * Retrieves a file from the database by its ID.
   * @param {string} id - The ID of the file to retrieve.
   * @returns {Promise<MddbFile | null>} - A promise resolving to the retrieved file or null if not found.
   */
  async getFileById(id: string): Promise<MddbFile | null> {
    const file = await this.db.from("files").where("_id", id).first();
    return new MddbFile(file);
  }

  /**
   * Retrieves a file from the database by its URL.
   * @param {string} url - The URL of the file to retrieve.
   * @returns {Promise<MddbFile | null>} - A promise resolving to the retrieved file or null if not found.
   */
  async getFileByUrl(url: string): Promise<MddbFile | null> {
    const file = await this.db
      .from("files")
      .where("url_path", encodeURI(url))
      .first();
    return new MddbFile(file);
  }

  /**
   * Retrieves files from the database based on the specified query parameters.
   * @param {Object} [query] - Query parameters for filtering files.
   * @param {string} [query.folder] - The folder to filter files by.
   * @param {string[]} [query.filetypes] - Array of file types to filter by.
   * @param {string[]} [query.tags] - Array of tags to filter by.
   * @param {string[]} [query.extensions] - Array of file extensions to filter by.
   * @param {Record<string, string | number | boolean>} [query.frontmatter] - Object representing frontmatter key-value pairs for filtering.
   * @returns {Promise<MddbFile[]>} - A promise resolving to an array of retrieved files.
   */
  async getFiles(query?: {
    folder?: string;
    filetypes?: string[];
    tags?: string[];
    extensions?: string[];
    frontmatter?: Record<string, string | number | boolean>;
  }): Promise<MddbFile[]> {
    const { filetypes, tags, extensions, folder, frontmatter } = query || {};

    const files = await this.db
      // TODO join only if tags are specified ?
      .leftJoin("file_tags", "files._id", "file_tags.file")
      .where((builder) => {
        // TODO temporary solution before we have a proper way to filter files by and assign file types
        if (folder) {
          builder.whereLike("url_path", `${folder}/%`);
        }
        if (tags) {
          builder.whereIn("tag", tags);
        }

        if (extensions) {
          builder.whereIn("extension", extensions);
        }

        if (filetypes) {
          builder.whereIn("filetype", filetypes);
        }

        if (frontmatter) {
          Object.entries(frontmatter).forEach(([key, value]) => {
            if (typeof value === "string" || typeof value === "number") {
              builder.whereRaw(`json_extract(metadata, '$.${key}') = ?`, [
                value,
              ]);
            } else if (typeof value === "boolean") {
              if (value) {
                builder.whereRaw(`json_extract(metadata, '$.${key}') = ?`, [
                  true,
                ]);
              } else {
                builder.where(function () {
                  this.whereRaw(`json_extract(metadata, '$.${key}') = ?`, [
                    false,
                  ]).orWhereRaw(`json_extract(metadata, '$.${key}') IS NULL`);
                });
              }
            }
            // To check if the provided value exists in an array inside the JSON
            else {
              builder.whereRaw(`json_extract(metadata, '$.${key}') LIKE ?`, [
                `%${value}%`,
              ]);
            }
          });
        }
      })
      .select("files.*")
      .from("files")
      .groupBy("_id");

    return files.map((file) => new MddbFile(file));
  }

  /**
   * Retrieves all tags from the database.
   * @returns {Promise<MddbTag[]>} - A promise resolving to an array of retrieved tags.
   */
  async getTags(): Promise<MddbTag[]> {
    const tags = await this.db("tags").select();
    return tags.map((tag) => new MddbTag(tag));
  }

  /**
   * Retrieves links associated with a file based on the specified query parameters.
   * @param {Object} [query] - Query parameters for filtering links.
   * @param {string} query.fileId - The ID of the file to retrieve links for.
   * @param {"normal" | "embed"} [query.linkType] - Type of link to filter by (normal or embed).
   * @param {"forward" | "backward"} [query.direction="forward"] - Direction of the link (forward or backward).
   * @returns {Promise<MddbLink[]>} - A promise resolving to an array of retrieved links.
   */
  async getLinks(query?: {
    fileId: string;
    linkType?: "normal" | "embed";
    direction?: "forward" | "backward";
  }): Promise<MddbLink[]> {
    const { fileId, direction = "forward", linkType } = query || {};
    const joinKey = direction === "forward" ? "from" : "to";
    const where = {
      [joinKey]: fileId,
    };
    if (linkType) {
      where["link_type"] = linkType;
    }
    const dbLinks = await this.db
      .select("links.*")
      .from("links")
      .rightJoin("files", `links.${joinKey}`, "=", "files._id")
      .where(where);

    const links = dbLinks.map((link) => new MddbLink(link));
    return links;
  }

  /**
   * Destroys the database connection.
   */
  _destroyDb() {
    this.db.destroy();
  }
}

function writeJsonToFile(filePath: string, jsonData: any[]) {
  try {
    const directory = path.dirname(filePath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    const jsonString = JSON.stringify(jsonData, null, 2);
    fs.writeFileSync(filePath, jsonString);
  } catch (error: any) {
    console.error(`Error writing data to ${filePath}: ${error}`);
  }
}
