import path from "path";
import knex, { Knex } from "knex";

import { MddbFile, MddbTag, MddbLink, MddbFileTag } from "./schema.js";
import { indexFolder } from "./indexFolder.js";
import {
  resetDatabaseTables,
  mapFileToInsert,
  mapLinksToInsert,
  isLinkToDefined,
  mapFileTagsToInsert,
  getUniqueValues,
} from "./databaseUtils.js";

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

export class MarkdownDB {
  config: Knex.Config;
  db: Knex;

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
  }: {
    folderPath: string;
    ignorePatterns?: RegExp[];
  }) {
    await resetDatabaseTables(this.db);

    const fileObjects = indexFolder(folderPath, ignorePatterns);
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

    await MddbFile.batchInsert(this.db, filesToInsert);
    // @ts-ignore
    await MddbTag.batchInsert(this.db, tagsToInsert);
    await MddbFileTag.batchInsert(this.db, fileTagsToInsert);
    await MddbLink.batchInsert(this.db, getUniqueValues(linksToInsert));
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
