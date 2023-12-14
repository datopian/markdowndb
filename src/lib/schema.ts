import { Knex } from "knex";
import { areUniqueObjectsByKey } from "./validate.js";

/*
 * Types
 */
export enum Table {
  Files = "files",
  Tags = "tags",
  FileTags = "file_tags",
  Links = "links",
}

type MetaData = {
  [key: string]: any;
};

/*
 * Schema
 */
interface File {
  _id: string;
  file_path: string;
  extension: string;
  url_path: string | null;
  filetype: string | null;
  metadata: MetaData | null;
  [key: string]: string | null | MetaData | undefined;
}

class MddbFile {
  static table = Table.Files;
  static supportedExtensions = ["md", "mdx"];

  file: File = {
    _id: "",
    file_path: "",
    extension: "",
    url_path: null,
    filetype: null,
    metadata: null,
  };

  // TODO type?
  constructor(file: any) {
    this.file._id = file._id;
    this.file.file_path = file.file_path;
    this.file.extension = file.extension;
    this.file.url_path = file.url_path;
    this.file.filetype = file.filetype;
    this.file.metadata = file.metadata ? JSON.parse(file.metadata) : null;

    // Assign dynamic properties using index signature to this.file
    for (const key in file) {
      if (
        key !== "_id" &&
        key !== "file_path" &&
        key !== "extension" &&
        key !== "url_path" &&
        key !== "filetype" &&
        key !== "metadata"
      ) {
        this.file[key] = file[key];
      }
    }
  }

  toObject(): File {
    return { ...this.file };
  }

  static async createTable(db: Knex, properties: string[]) {
    const creator = (table: Knex.TableBuilder) => {
      table.string("_id").primary();
      table.string("file_path").unique().notNullable();
      table.string("extension").notNullable();
      table.string("url_path");
      table.string("filetype");
      table.string("metadata");
      for (let index = 0; index < properties.length; index++) {
        table.string(properties[index]);
      }
    };
    const tableExists = await db.schema.hasTable(this.table);

    if (!tableExists) {
      await db.schema.createTable(this.table, creator);
    }
  }

  static async deleteTable(db: Knex) {
    await db.schema.dropTableIfExists(this.table);
  }

  static batchInsert(db: Knex, files: File[]) {
    if (!areUniqueObjectsByKey(files, "_id")) {
      throw new Error("Files must have unique _id");
    }
    if (!areUniqueObjectsByKey(files, "file_path")) {
      throw new Error("Files must have unique file_path");
    }

    const serializedFiles = files.map((file) => {
      const serializedFile: any = {};
      const defaultProperties = [
        "_id",
        "file_path",
        "extension",
        "url_path",
        "filetype",
      ];

      for (const key in file) {
        if (Object.prototype.hasOwnProperty.call(file, key)) {
          const value = file[key];
          // If the value is undefined, default it to null
          serializedFile[key] = defaultProperties.includes(key)
            ? value
            : value !== undefined
            ? JSON.stringify(value)
            : null;
        }
      }

      return serializedFile;
    });

    return db.batchInsert(Table.Files, serializedFiles);
  }

  get _id(): string {
    return this.file._id;
  }

  get file_path(): string {
    return this.file.file_path;
  }

  get extension(): string {
    return this.file.extension;
  }

  get url_path(): string | null {
    return this.file.url_path;
  }

  get filetype(): string | null {
    return this.file.filetype;
  }

  get metadata(): MetaData | null {
    return this.file.metadata;
  }
}

interface Link {
  link_type: "normal" | "embed";
  from: string;
  to: string;
}

class MddbLink {
  static table = Table.Links;

  // _id: string;
  link_type: "normal" | "embed";
  from: string;
  to: string;

  // TODO type?
  constructor(link: any) {
    // this._id = dbLink._id;
    this.link_type = link.link_type;
    this.from = link.from;
    this.to = link.to;
  }

  toObject(): Link {
    return {
      link_type: this.link_type,
      from: this.from,
      to: this.to,
    };
  }

  static async createTable(db: Knex) {
    const creator = (table: Knex.TableBuilder) => {
      // table.string("_id").primary();
      table.enum("link_type", ["normal", "embed"]).notNullable();
      table.string("from").notNullable();
      table.string("to").notNullable();
      table.foreign("from").references("files._id").onDelete("CASCADE");
      table.foreign("to").references("files._id").onDelete("CASCADE");
    };
    const tableExists = await db.schema.hasTable(this.table);

    if (!tableExists) {
      await db.schema.createTable(this.table, creator);
    }
  }

  static async deleteTable(db: Knex) {
    await db.schema.dropTableIfExists(this.table);
  }

  static batchInsert(db: Knex, links: Link[]) {
    return db.batchInsert(Table.Links, links);
  }
}

interface Tag {
  name: string;
}

class MddbTag {
  static table = Table.Tags;

  name: string;
  // description: string;

  // TODO type?
  constructor(tag: any) {
    this.name = tag.name;
    // this.description = dbTag.description;
  }

  toObject(): Tag {
    return {
      name: this.name,
      // description: this.description,
    };
  }

  static async createTable(db: Knex) {
    const creator = (table: Knex.TableBuilder) => {
      table.string("name").primary();
      // table.string("description");
    };
    const tableExists = await db.schema.hasTable(this.table);

    if (!tableExists) {
      await db.schema.createTable(this.table, creator);
    }
  }

  static async deleteTable(db: Knex) {
    await db.schema.dropTableIfExists(this.table);
  }

  static batchInsert(db: Knex, tags: Tag[]) {
    if (!areUniqueObjectsByKey(tags, "name")) {
      throw new Error("Tags must have unique name");
    }
    return db.batchInsert(Table.Tags, tags);
  }
}

interface FileTag {
  tag: string;
  file: string;
}

class MddbFileTag {
  static table = Table.FileTags;
  // _id: string;
  tag: string;
  file: string;

  constructor(fileTag: any) {
    this.tag = fileTag.tag;
    this.file = fileTag.file;
  }

  static async createTable(db: Knex) {
    const creator = (table: Knex.TableBuilder) => {
      table.string("tag").notNullable();
      table.string("file").notNullable();

      // TODO this is now saved as tag name, not as tag id ...
      table.foreign("tag").references("tags.name").onDelete("CASCADE");
      table.foreign("file").references("files._id").onDelete("CASCADE");
    };
    const tableExists = await db.schema.hasTable(this.table);

    if (!tableExists) {
      await db.schema.createTable(this.table, creator);
    }
  }

  static async deleteTable(db: Knex) {
    await db.schema.dropTableIfExists(this.table);
  }

  static batchInsert(db: Knex, fileTags: FileTag[]) {
    return db.batchInsert(Table.FileTags, fileTags);
  }
}

export { File, MddbFile, Link, MddbLink, Tag, MddbTag, FileTag, MddbFileTag };
