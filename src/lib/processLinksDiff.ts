import { Link } from "./schemaTypes";
import { ArrayDiffResult } from "./utils";
import { WikiLink } from "../utils";
import { FileJsonDataManager } from "./FileJsonDataManager";
import path from "path";

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

export function processLinksDiff(
  fileId: string,
  urlPath: string,
  fileJsonDataManager: FileJsonDataManager,
  linksDiff: ArrayDiffResult<WikiLink>[]
) {
  const workingLinksDiff = [];
  const brokenLinksDiff = [];

  for (const linkDiff of linksDiff) {
    const { linkSrc, linkType } = linkDiff.data;
    const destPath = resolveLinkToUrlPath(linkSrc, urlPath);

    const destFile = fileJsonDataManager.getFileJsonByUrlPath(destPath);

    if (destFile) {
      const linkToInsert: Link = {
        from: fileId,
        to: destFile.file._id,
        link_type: linkType,
      };

      workingLinksDiff.push({
        type: linkDiff.type,
        data: linkToInsert,
      });
    } else {
      brokenLinksDiff.push({
        type: linkDiff.type,
        data: {
          from: fileId,
          to_path: destPath,
          link_type: linkType,
        },
      });
    }
  }

  return { workingLinksDiff, brokenLinksDiff };
}
