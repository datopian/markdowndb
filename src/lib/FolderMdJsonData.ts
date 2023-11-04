import { Knex } from "knex";
import { File, FileTag, Link, Tag } from "./schemaTypes";
import { arrayDiff, getDiffArray } from "./utils.js";
import { WikiLink } from "../utils";
import { FileJsonDataManager } from "./FileJsonDataManager.js";
import { TagsManager } from "./TagsManager.js";
import { FileTagsManager } from "./FileTagsManager.js";
import { LinksManager } from "./LinksManager.js";
import { mapTagsToFile } from "./utils.js";
import { processLinksDiff } from "./processLinksDiff.js";

export interface FileJson {
  file: File;
  tags: Tag[];
  links: WikiLink[];
}

export class FolderMdJsonData {
  fileJsonDataManager: FileJsonDataManager;
  tagsManager: TagsManager;
  fileTagsManager: FileTagsManager;
  linksManager: LinksManager;

  constructor(
    db: Knex,
    files: FileJson[],
    tags: Tag[],
    file_tags: FileTag[],
    links: Link[]
  ) {
    this.fileJsonDataManager = new FileJsonDataManager(db, files);
    this.tagsManager = new TagsManager(db, tags);
    this.fileTagsManager = new FileTagsManager(db, file_tags);
    this.linksManager = new LinksManager(db, links, []);
  }

  async addFileJson(newFileJson: FileJson) {
    const id = newFileJson.file._id;
    const tags = newFileJson.tags;
    const links = newFileJson.links;
    const filePath = newFileJson.file.file_path;
    await this.fileJsonDataManager.addFileJson(newFileJson);

    if (newFileJson.tags) {
      // tags
      await this.tagsManager.addTagsIfNotExists(tags);

      // file tags
      const mappedTags = mapTagsToFile(id, tags);
      const fileTagsDiff = getDiffArray(mappedTags, "create");
      await this.fileTagsManager.handleFileTagsDiff(fileTagsDiff);
    }

    if (newFileJson.links) {
      if (!newFileJson.file.url_path) {
        return;
      }

      const linksDiff = arrayDiff([], links);
      const { workingLinksDiff, brokenLinksDiff } = processLinksDiff(
        id,
        newFileJson.file.url_path,
        this.fileJsonDataManager,
        linksDiff
      );

      await this.linksManager.handleLinksDiff(workingLinksDiff);
      await this.linksManager.handleBrokenLinksDiff(brokenLinksDiff);
    }
    this.linksManager.updateBrokenLinksOnFileCreation(id, filePath);
  }

  async updateFileJson(fileId: string, newFileJson: FileJson) {
    const id = newFileJson.file._id;
    const oldTags = this.fileJsonDataManager.getFileTags(fileId);
    const oldLinks = this.fileJsonDataManager.getLinks(fileId);
    const newLinks = newFileJson.links;
    const newTags = newFileJson.tags;
    this.fileJsonDataManager.updateFileJson(id, newFileJson);

    // tags
    const oldFileTags = mapTagsToFile(id, oldTags);
    const newFileTags = mapTagsToFile(id, newTags);
    const fileTagsDiff = arrayDiff(oldFileTags, newFileTags);
    await this.tagsManager.addTagsIfNotExists(newTags).then(() => {
      this.fileTagsManager.handleFileTagsDiff(fileTagsDiff).then(() => {
        this.filterUnusedTags();
      });
    });

    if (newFileJson.links) {
      if (!newFileJson.file.url_path) {
        return;
      }
      const linksDiff = arrayDiff(oldLinks, newLinks);
      const { workingLinksDiff, brokenLinksDiff } = processLinksDiff(
        fileId,
        newFileJson.file.url_path,
        this.fileJsonDataManager,
        linksDiff
      );

      await this.linksManager.handleLinksDiff(workingLinksDiff);
      await this.linksManager.handleBrokenLinksDiff(brokenLinksDiff);
    }
  }

  async deleteFile(fileId: string) {
    const fileJson = this.fileJsonDataManager.getFileJsonById(fileId);
    if (!fileJson) {
      throw new Error(`Failed to delete links for non-existing file ${fileId}`);
    }
    const id = fileJson.file._id;
    const filePath = fileJson.file.file_path;

    // delete file_tags then tags
    await this.fileTagsManager.handleFileDelete(fileId);
    this.filterUnusedTags();

    // delete links where from = fileId
    await this.linksManager.handleFileDelete(fileId);
    // handle links where to = fileId
    await this.linksManager.updateBrokenLinksOnFileDeletion(id, filePath);

    // finally remove the file
    this.fileJsonDataManager.deleteFile(fileId);
  }

  private filterUnusedTags() {
    const unusedTags = this.fileTagsManager.findUnusedTags(
      this.tagsManager.tags
    );

    this.tagsManager.deleteTagsIfExists(unusedTags);
  }
}
