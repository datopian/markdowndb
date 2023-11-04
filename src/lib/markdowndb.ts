import crypto from "crypto";
import knex, { Knex } from "knex";

import { recursiveWalkDir } from "../utils/index.js";
import { MddbFile, MddbTag, MddbFileTag, MddbLink } from "./schema.js";
import MddbFolderWatcher from "../bin/watch.js";
import { FolderMdJsonData } from "./FolderMdJsonData.js";

export const defaultFilePathToUrl = (filePath: string) => {
  let url = filePath
    .replace(/\.(mdx|md)/, "")
    .replace(/\\/g, "/") // replace windows backslash with forward slash
    .replace(/(\/)?index$/, ""); // remove index from the end of the permalink
  url = url.length > 0 ? url : "/"; // for home page
  return encodeURI(url);
};

export class MarkdownDB {
  config: Knex.Config;
  db: Knex;
  folderMdJsonData: FolderMdJsonData;
  watcher: MddbFolderWatcher;

  constructor(config: Knex.Config) {
    this.config = config;
  }

  async init() {
    this.db = knex({ ...this.config, useNullAsDefault: true });
    return this;
  }

  async indexFolder({
    folderPath,
    // TODO support glob patterns
    ignorePatterns = [],
    pathToUrlResolver = defaultFilePathToUrl,
    watch = false,
  }: {
    folderPath: string;
    ignorePatterns?: RegExp[];
    pathToUrlResolver?: (filePath: string) => string;
    watch?: boolean;
  }) {
    const tableNames = [MddbFile, MddbTag, MddbFileTag, MddbLink];
    // Drop and Create tables
    for (const table of tableNames) {
      await table.deleteTable(this.db);
      await table.createTable(this.db);
    }
    const filePathsToIndex = recursiveWalkDir(folderPath);

    this.watcher = new MddbFolderWatcher(
      this.db,
      new FolderMdJsonData(this.db, [], [], [], []),
      folderPath
    );

    const promises = [];
    if (watch) {
      this.watcher.createWatcher();
      this.watcher.start();
    }

    for (const filePath of filePathsToIndex) {
      const isFilePathIgnored = ignorePatterns.some((pattern) =>
        pattern.test(filePath)
      );

      if (isFilePathIgnored) {
        continue;
      }

      promises.push(this.watcher.handleFileAdd(filePath, filePathsToIndex));
    }

    if (!watch) {
      await Promise.all(promises).catch((error) => {
        console.error("Failed to parse files:", error);
        process.exit(1);
      });

      this.watcher.stop();
      process.exit(0);
    }
  }

  async getFileById(id: string): Promise<MddbFile | null> {
    const file = await this.db.from("files").where("_id", id).first();
    return new MddbFile(file);
  }

  async getFileByUrl(url: string): Promise<MddbFile | null> {
    const file = await this.db
      .from("files")
      .where("url_path", encodeURI(url))
      .first();
    return new MddbFile(file);
  }

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

  async getTags(): Promise<MddbTag[]> {
    const tags = await this.db("tags").select();
    return tags.map((tag) => new MddbTag(tag));
  }

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

  _destroyDb() {
    this.db.destroy();
  }
}

export function getFileExtensionFromPath(filePath: string) {
  const [, extension] = filePath.match(/.(\w+)$/) || [];
  return extension;
}

export function generateFileIdFromPath(filePath: string) {
  const encodedPath = Buffer.from(filePath, "utf-8").toString();
  const id = crypto.createHash("sha1").update(encodedPath).digest("hex");
  return id;
}
