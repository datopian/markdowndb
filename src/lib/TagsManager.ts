import { Knex } from "knex";
import { Tag } from "./schemaTypes.js";
import {
  ArrayDiffResult,
  getDiffArray,
  getUniqueValues,
  extractDataFromDiffArray,
  filterCreateDiffs,
  filterDeleteDiffs,
} from "./utils.js";
import { MddbTag } from "./schema.js";

export class TagsManager {
  private _tags: Tag[];
  db: Knex;

  constructor(db: Knex, initialTags: Tag[] = []) {
    this.db = db;
    this._tags = initialTags;
  }

  public async addTagsIfNotExists(tagsToAdd: Tag[]) {
    const tagsToAddFiltered = getUniqueValues(
      tagsToAdd.filter(
        (tag) => !this.tags.some((existingTag) => existingTag.name === tag.name)
      )
    );

    if (tagsToAddFiltered.length > 0) {
      const createDiffs = getDiffArray(tagsToAddFiltered, "create");
      this._tags.push(...tagsToAddFiltered);
      await this.handleTagsDiff(createDiffs);
    }
  }

  public async deleteTagsIfExists(tagsToDelete: Tag[]) {
    const tagsToDeleteFiltered = getUniqueValues(
      tagsToDelete.filter((tag) =>
        this.tags.some((existingTag) => existingTag.name === tag.name)
      )
    );

    if (tagsToDeleteFiltered.length > 0) {
      const deleteDiffs = getDiffArray(tagsToDeleteFiltered, "delete");
      this._tags = this._tags.filter(
        (tag) =>
          !tagsToDeleteFiltered.some((deleteTag) => tag.name === deleteTag.name)
      );
      await this.handleTagsDiff(deleteDiffs);
    }
  }

  private async handleTagsDiff(tagsDiff: ArrayDiffResult<Tag>[]) {
    const createDiffs = filterCreateDiffs(tagsDiff);
    const newTags = extractDataFromDiffArray(createDiffs);
    const deleteDiffs = filterDeleteDiffs(tagsDiff);
    const deletedTags = extractDataFromDiffArray(deleteDiffs);

    await MddbTag.batchInsert(this.db, newTags);

    for (const element of deletedTags) {
      await MddbTag.delete(this.db, element);
    }
  }

  get tags() {
    return this._tags;
  }
}
