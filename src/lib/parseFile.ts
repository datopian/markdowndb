import matter from "gray-matter";
import markdown from "remark-parse";
import { Plugin, unified } from "unified";
import { selectAll } from "unist-util-select";
import * as path from "path";
import gfm from "remark-gfm";
import remarkWikiLink from "@portaljs/remark-wiki-link";
import { Root } from "remark-parse/lib";

export function parseFile(source: string, options?: ParsingOptions) {
  // Metadata
  const { data: metadata } = matter(source);

  // Obsidian style tags i.e. tags: tag1, tag2, tag3
  if (metadata.tags && typeof metadata.tags === "string") {
    metadata.tags = metadata.tags.split(",").map((tag: string) => tag.trim());
  }

  const ast = processAST(source, options);

  const bodyTags = extractTagsFromBody(ast);
  metadata.tags = metadata.tags ? [...metadata.tags, ...bodyTags] : bodyTags;

  // Links
  const links = extractWikiLinks(ast, options);

  const tasks = extractTasks(ast);
  metadata.tasks = tasks;

  return {
    metadata,
    links,
  };
}

// Exported for testing
export function processAST(source: string, options?: ParsingOptions) {
  const userRemarkPlugins: Array<Plugin> = options?.remarkPlugins || [];

  const processor = unified()
    .use(markdown)
    .use([
      gfm,
      [
        remarkWikiLink,
        { pathFormat: "obsidian-short", permalinks: options?.permalinks },
      ],
      ...(userRemarkPlugins || []),
    ]);

  const ast = processor.parse(source);
  return ast;
}

export interface ParsingOptions {
  from?: string;
  remarkPlugins?: Array<Plugin>; // remark plugins that add custom nodes to the AST
  extractors?: LinkExtractors; // mapping from custom node types (e.g. added by above plugins) to functions that should handle them
  permalinks?: string[];
}

export const extractTagsFromBody = (ast: Root) => {
  let tags: string[] = [];

  const nodes = selectAll("*", ast);
  for (let index = 0; index < nodes.length; index++) {
    const node: any = nodes[index];
    if (node.value) {
      const textTags = node.value.match(/(?:^|\s)(#(\w+|\/|-|_)+)/g);
      if (textTags) {
        tags = tags.concat(textTags.map((tag: string) => tag.trim().slice(1))); // Extract tags and remove the '#'
      }
    }
  }

  return tags;
};

export interface LinkExtractors {
  [test: string]: (node: any) => WikiLink;
}

export interface WikiLink {
  from: string;
  to: string;
  toRaw: string; // raw link to
  text: string;
  embed: boolean; // is it an embed link (default: false)
  internal: boolean; // default true (external means http etc - not inside the contentbase)
}

export const extractWikiLinks = (ast: Root, options?: ParsingOptions) => {
  let wikiLinks: WikiLink[] = [];
  const from = options?.from || "";
  const userExtractors: LinkExtractors = options?.extractors || {};
  const directory = path.dirname(from);

  const extractors: LinkExtractors = {
    link: (node: any) => {
      const to = !node.url.startsWith("http")
        ? node.url.startsWith("/")
          ? node.url.slice(1)
          : path.posix.join(directory, node.url)
        : node.url;
      return {
        from: from,
        to: to,
        toRaw: node.url,
        text: node.children?.[0]?.value || "",
        embed: false,
        internal: !node.url.startsWith("http"),
      };
    },
    image: (node: any) => ({
      from: from,
      to: node.url.startsWith("/")
        ? node.url.slice(1)
        : path.posix.join(directory, node.url),
      toRaw: node.url,
      text: node.alt || "",
      embed: true,
      internal: !node.url.startsWith("http"),
    }),
    wikiLink: (node) => {
      const linkType = node.data.isEmbed ? "embed" : "normal";
      let linkSrc = "";
      let text = "";

      if (node.data.hName === "img" || node.data.hName === "iframe") {
        linkSrc = node.data.hProperties.src;
        text = node.children?.[0]?.value || "";
      } else if (node.data.hName === "a") {
        linkSrc = node.data.hProperties.href;
        text = node.children?.[0]?.value || "";
      } else {
        linkSrc = node.data.permalink;
        text = node.children?.[0]?.value || "";
      }
      const to = !linkSrc.startsWith("http")
        ? linkSrc.startsWith("/")
          ? linkSrc.slice(1)
          : path.posix.join(directory, linkSrc)
        : linkSrc;

      return {
        from: from,
        to: to,
        toRaw: linkSrc,
        text,
        embed: linkType === "embed",
        internal: !linkSrc.startsWith("http"),
      };
    },
    ...userExtractors,
  };

  Object.entries(extractors).forEach(([test, extractor]) => {
    const nodes = selectAll(test, ast);
    const extractedWikiLinks: WikiLink[] = nodes.map((node) => extractor(node));
    wikiLinks = wikiLinks.concat(extractedWikiLinks);
  });

  // const uniqueLinks = [...new Set(allLinks)];
  return wikiLinks;
};

export interface Task {
  description: string;
  checked: boolean;
}

export const extractTasks = (ast: Root) => {
  const nodes = selectAll("*", ast);
  const tasks: Task[] = [];
  nodes.map((node: any) => {
    if (node.type === "listItem") {
      const description = recursivelyExtractText(node).trim();
      const checked = node.checked;
      if (checked !== null && checked !== undefined) {
        tasks.push({
          description,
          checked,
        });
      }
    }
  });

  return tasks;
};

function recursivelyExtractText(node: any) {
  if (node.value) {
    return node.value;
  } else if (node.children) {
    return node.children.map(recursivelyExtractText).join(" ");
  } else {
    return "";
  }
}

// links = extractWikiLinks({
//   source,
//   // TODO pass slug instead of file path as hrefs/srcs are sluggified too
//   // (where will we get it from?)
//   filePath: tempSluggify(`/${filePath}`),
//   ...extractWikiLinksConfig,
// }).map((link) => {
//   const linkEncodedPath = Buffer.from(
//     JSON.stringify(link),
//     "utf-8"
//   ).toString();
//   const linkId = crypto
//     .createHash("sha1")
//     .update(linkEncodedPath)
//     .digest("hex");
//   return {
//     _id: linkId,
//     from: fileId,
//     to: link.to,
//     link_type: link.linkType,
//   };
// });

// SLUGGIFY
// if (filename != "index") {
//   if (pathToFileFolder) {
//     _url_path = `${pathToFileFolder}/${filename}`;
//   } else {
//     //  The file is in the root folder
//     _url_path = filename;
//   }
// } else {
//   _url_path = pathToFileFolder;
// }
