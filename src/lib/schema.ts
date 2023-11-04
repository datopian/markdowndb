import { Knex } from "knex";
import { areUniqueObjectsByKey } from "./validate.js";
import { Table, File, MetaData, Link, Tag, FileTag } from "./schemaTypes.js";

class MddbFile {
  static table = Table.Files;
  static supportedExtensions = ["md", "mdx"];

  _id: string;
  file_path: string;
  extension: string;
  url_path: string | null;
  // TODO there should be a separate table for filetypes
  // and another one for many-to-many relationship between files and filetypes
  filetype: string | null;
  metadata: MetaData | null;

  // TODO type?
  constructor(file: any) {
    this._id = file._id;
    this.file_path = file.file_path;
    this.extension = file.extension;
    this.url_path = file.url_path;
    this.filetype = file.filetype;
    this.metadata = file.metadata ? JSON.parse(file.metadata) : null;
  }

  toObject(): File {
    return {
      _id: this._id,
      file_path: this.file_path,
      extension: this.extension,
      url_path: this.url_path,
      filetype: this.filetype,
      metadata: this.metadata,
    };
  }

  static async createTable(db: Knex) {
    const creator = (table: Knex.TableBuilder) => {
      table.string("_id").primary();
      table.string("file_path").unique().notNullable(); // Path relative to process.cwd()
      table.string("extension").notNullable(); // File extension
      table.string("url_path"); // Sluggfied path relative to content folder
      table.string("filetype"); // Type field in frontmatter if it exists
      table.string("metadata"); // All frontmatter data
    };
    const tableExists = await db.schema.hasTable(this.table);

    if (!tableExists) {
      await db.schema.createTable(this.table, creator);
    }
  }

  static async deleteTable(db: Knex) {
    await db.schema.dropTableIfExists(this.table);
  }

  static async batchInsert(db: Knex, files: File[]) {
    if (!areUniqueObjectsByKey(files, "_id")) {
      throw new Error("Files must have unique _id");
    }
    if (!areUniqueObjectsByKey(files, "file_path")) {
      throw new Error("Files must have unique file_path");
    }
    const serializedFiles = files.map((file) => {
      return {
        ...file,
        metadata: JSON.stringify(file.metadata),
      };
    });

    return await db.batchInsert(Table.Files, serializedFiles);
  }

  static async insert(db: Knex, file: File) {
    await db(Table.Files).insert({
      ...file,
      metadata: JSON.stringify(file.metadata),
    });
  }

  static async deleteById(db: Knex, fileId: string) {
    await db(Table.Files)
      .where({
        _id: fileId,
      })
      .delete();
  }
  static async deleteByFilePath(db: Knex, file_path: string) {
    await db(Table.Files)
      .where({
        file_path: file_path,
      })
      .delete();
  }

  static async updateFileProperties(
    db: Knex,
    fileId: string,
    updatedProperties: Partial<File>
  ) {
    const updatedPropertiesCopy = { ...updatedProperties } as any; // Create a copy of the original object

    if (updatedPropertiesCopy.metadata) {
      updatedPropertiesCopy.metadata = JSON.stringify(
        updatedPropertiesCopy.metadata
      );
    }

    await db("files")
      .where({
        _id: fileId,
      })
      .update(updatedPropertiesCopy);
  }
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

  static async batchInsert(db: Knex, links: Link[]) {
    if (links.length === 0) {
      return;
    }

    return await db.batchInsert(Table.Links, links);
  }

  static async insert(db: Knex, link: Link) {
    await db(Table.Links).insert(link);
  }

  static async delete(db: Knex, link: Link) {
    await db(Table.Links).where(link).delete();
  }

  static async deleteByFileId(db: Knex, fileId: string) {
    await db(Table.Links)
      .where({
        from: fileId,
      })
      .delete();
  }
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
    if (tags.length === 0) {
      return;
    }
    if (!areUniqueObjectsByKey(tags, "name")) {
      throw new Error("Tags must have unique name");
    }
    return db.batchInsert(Table.Tags, tags);
  }

  static async insert(db: Knex, tag: Tag) {
    await db(Table.Tags).insert(tag);
  }

  static async delete(db: Knex, tag: Tag) {
    await db(Table.Tags).where(tag).delete();
  }
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

  static async batchInsert(db: Knex, fileTags: FileTag[]) {
    if (fileTags.length === 0) {
      return;
    }

    return await db.batchInsert(Table.FileTags, fileTags);
  }

  static async insert(db: Knex, fileTag: FileTag) {
    return await db(Table.FileTags).insert(fileTag);
  }

  static async delete(db: Knex, fileTag: FileTag) {
    await db(Table.FileTags).where(fileTag).delete();
  }

  static async deleteByFileId(db: Knex, fileId: string) {
    await db(Table.FileTags)
      .where({
        file: fileId,
      })
      .delete();
  }
}

export { MddbFile, MddbLink, MddbTag, MddbFileTag };
