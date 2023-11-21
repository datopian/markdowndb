import { Knex } from "knex";
import {
  MddbFile,
  MddbTag,
  MddbLink,
  MddbFileTag,
  File,
} from "../lib/schema.js";
import path from "path";
import { WikiLink } from "./extractWikiLinks.js";

export async function resetDatabaseTables(db: Knex) {
  const tableNames = [MddbFile, MddbTag, MddbFileTag, MddbLink];
  // Drop and Create tables
  for (const table of tableNames) {
    await table.deleteTable(db);
    await table.createTable(db);
  }
}

export function mapFileToInsert(file: any) {
  const { _id, file_path, extension, url_path, filetype, metadata } = file;
  return { _id, file_path, extension, url_path, filetype, metadata };
}

export function mapLinksToInsert(filesToInsert: File[], file: any) {
  return file.links.map((link: WikiLink) => {
    let to: string | undefined;
    if (!link.internal) {
      to = link.toRaw;
    } else {
      to = findFileToInsert(filesToInsert, link.to)?._id;
    }
    return {
      from: file._id,
      to: to,
      link_type: link.embed ? "embed" : "normal",
    };
  });
}

function findFileToInsert(filesToInsert: File[], filePath: string) {
  const filePathWithoutExt = path.join(
    path.dirname(filePath),
    path.basename(filePath, path.extname(filePath))
  );

  return filesToInsert.find(({ url_path }) => {
    const normalizedFile = path.normalize(url_path || "");
    return normalizedFile === filePathWithoutExt;
  });
}

export function isLinkToDefined(link: any) {
  return link.to !== undefined;
}

export function mapFileTagsToInsert(file: any) {
  return file.tags.map((tag: any) => ({
    file: file._id,
    tag: tag as unknown as string,
  }));
}

export function getUniqueValues<T>(inputArray: T[]): T[] {
  const uniqueArray: T[] = [];

  for (const item of inputArray) {
    if (!uniqueArray.includes(item)) {
      uniqueArray.push(item);
    }
  }

  return uniqueArray;
}
