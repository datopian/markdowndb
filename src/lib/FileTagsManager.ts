import { Knex } from "knex";
import { FileTag, Tag } from "./schemaTypes.js";
import {
  ArrayDiffResult,
  deepEqual,
  extractDataFromDiffArray,
  filterCreateDiffs,
  filterDeleteDiffs,
} from "./utils.js";
import { MddbFileTag } from "./schema.js";

export class FileTagsManager {
  private db: Knex;
  private fileTags: FileTag[];

  constructor(db: Knex, initialFileTags: FileTag[] = []) {
    this.db = db;
    this.fileTags = initialFileTags;
  }

  async handleFileTagsDiff(fileTagsDiff: ArrayDiffResult<FileTag>[]) {
    const createDiffs = filterCreateDiffs(fileTagsDiff);
    const newFileTags = extractDataFromDiffArray(createDiffs);
    const deleteDiffs = filterDeleteDiffs(fileTagsDiff);
    const deletedFileTags = extractDataFromDiffArray(deleteDiffs);

    this.fileTags.push(...newFileTags);
    await MddbFileTag.batchInsert(this.db, newFileTags);

    for (const fileTag of deletedFileTags) {
      await this.deleteFileTag(fileTag);
    }
  }

  // Create a new fileTag
  async createFileTag(fileTag: FileTag): Promise<void> {
    if (this.fileTagExists(fileTag)) {
      throw new Error(`FileTag '${fileTag}' already exists.`);
    }

    this.fileTags.push(fileTag);
    await MddbFileTag.insert(this.db, fileTag);
  }

  async handleFileDelete(fileId: string) {
    this.fileTags = this.fileTags.filter((fileTag) => fileTag.file != fileId);
    await MddbFileTag.deleteByFileId(this.db, fileId);
  }

  // Delete a fileTag by name
  async deleteFileTag(fileTag: FileTag): Promise<void> {
    const fileTagIndex = this.findFileTagIndex(fileTag);
    if (fileTagIndex === -1) {
      throw new Error(`FileTag '${fileTag}' not found.`);
    }

    this.fileTags.splice(fileTagIndex, 1);
    await MddbFileTag.delete(this.db, fileTag);
  }

  findUnusedTags(tags: Tag[]) {
    const unusedTags = tags.filter((tag) =>
      this.fileTags.every((fileTag) => fileTag.tag != tag.name)
    );

    return unusedTags;
  }

  // Find the index of a fileTag by name
  private findFileTagIndex(fileTag: FileTag): number {
    return this.fileTags.findIndex((existingFileTag) =>
      deepEqual(existingFileTag, fileTag)
    );
  }

  // Check if a fileTag with the given name already exists
  private fileTagExists(newFileTag: FileTag): boolean {
    return this.fileTags.some((fileTag) => deepEqual(fileTag, newFileTag));
  }
}
