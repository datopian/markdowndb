import { Knex } from "knex";
import { BrokenLink, Link } from "./schemaTypes.js";
import {
  ArrayDiffResult,
  CreateDiff,
  deepEqual,
  extractDataFromDiffArray,
  filterCreateDiffs,
  filterDeleteDiffs,
  getDiffArray,
  getItemsNotInFirstList,
} from "./utils.js";
import { MddbLink } from "./schema.js";

export class LinksManager {
  private db: Knex;
  private links: Link[];
  private brokenLinks: BrokenLink[];

  constructor(
    db: Knex,
    initialLinks: Link[] = [],
    initialBrokenLinks: BrokenLink[]
  ) {
    this.db = db;
    this.links = initialLinks;
    this.brokenLinks = initialBrokenLinks;
  }

  async handleLinksDiff(linksDiff: ArrayDiffResult<Link>[]) {
    // Add new links if unique
    const createDiffs = filterCreateDiffs(linksDiff);
    const newLinks = extractDataFromDiffArray(createDiffs);
    const uniqueNewLinks = getItemsNotInFirstList(this.links, newLinks);
    this.links.push(...uniqueNewLinks);
    await MddbLink.batchInsert(this.db, uniqueNewLinks);

    // Add links
    const deleteDiffs = filterDeleteDiffs(linksDiff);
    const deletedLinks = extractDataFromDiffArray(deleteDiffs);
    for (const link of deletedLinks) {
      await this.deleteLink(link);
    }
  }

  async handleBrokenLinksDiff(brokenLinksDiff: ArrayDiffResult<BrokenLink>[]) {
    const createDiffs = filterCreateDiffs(brokenLinksDiff);
    const newLinks = extractDataFromDiffArray(createDiffs);
    this.brokenLinks.push(...newLinks);

    const deleteDiffs = filterDeleteDiffs(brokenLinksDiff);
    const deletedLinks = extractDataFromDiffArray(deleteDiffs);
    for (const link of deletedLinks) {
      await this.deleteBrokenLink(link);
    }
  }

  async updateBrokenLinksOnFileCreation(
    createdFileId: string,
    createdFileUrl: string
  ) {
    const linksToFix = this.brokenLinks.filter(
      (link) => link.to_path === createdFileUrl
    );

    // Create diffs for re-broken links and handle them
    const newLinks = linksToFix.map(
      (link) =>
        ({
          type: "create",
          data: {
            from: createdFileId,
            to: createdFileUrl,
            link_type: link.link_type,
          },
        } as CreateDiff<Link>)
    );
    await this.handleLinksDiff(newLinks);

    const deleteDiffs = getDiffArray(linksToFix, "delete");
    this.handleBrokenLinksDiff(deleteDiffs);
  }

  async updateBrokenLinksOnFileDeletion(
    deletedFileId: string,
    deletedFileUrl: string
  ) {
    const linksToRebreak = this.links.filter(
      (link) => link.to === deletedFileId
    );

    // Create diffs for re-broken links and handle them
    const createDiffs = getDiffArray(linksToRebreak, "delete");
    await this.handleLinksDiff(createDiffs);

    const newBrokenLinks = linksToRebreak.map(
      (link) =>
        ({
          type: "create",
          data: {
            from: deletedFileId,
            to_path: deletedFileUrl,
            link_type: link.link_type,
          },
        } as ArrayDiffResult<BrokenLink>)
    );
    this.handleBrokenLinksDiff(newBrokenLinks);
  }

  // Delete a link
  deleteLink(link: Link): void {
    const linkIndex = this.findLinkIndex(link);
    if (linkIndex === -1) {
      throw new Error(`Link '${link}' not found.`);
    }

    this.links.splice(linkIndex, 1);
    MddbLink.delete(this.db, link);
  }

  deleteBrokenLink(link: BrokenLink): void {
    const linkIndex = this.brokenLinks.findIndex((existingLink) =>
      deepEqual(existingLink, link)
    );
    if (linkIndex === -1) {
      throw new Error(`Error deleting link '${link}' not found.`);
    }

    this.brokenLinks.splice(linkIndex, 1);
  }

  // delete where from = fileId
  async handleFileDelete(fileId: string) {
    this.links = this.links.filter((link) => link.from != fileId);
    // Find Links that has been broken
    await MddbLink.deleteByFileId(this.db, fileId);
  }

  // Find the index of a link by name
  private findLinkIndex(link: Link): number {
    return this.links.findIndex((existingLink) =>
      deepEqual(existingLink, link)
    );
  }
}
