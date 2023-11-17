import markdown from "remark-parse";
import { unified, Plugin } from "unified";
import { selectAll } from "unist-util-select";
import remarkWikiLink from "@portaljs/remark-wiki-link";
import gfm from "remark-gfm";
import * as path from "path";

export interface ExtractWikiLinksOptions {
  remarkPlugins?: Array<Plugin>; // remark plugins that add custom nodes to the AST
  extractors?: LinkExtractors; // mapping from custom node types (e.g. added by above plugins) to functions that should handle them
  permalinks?: string[];
}

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

const extractWikiLinks = (
  from: string,
  source: string,
  options?: ExtractWikiLinksOptions
) => {
  let wikiLinks: WikiLink[] = [];
  const userExtractors: LinkExtractors = options?.extractors || {};
  const userRemarkPlugins: Array<Plugin> = options?.remarkPlugins || [];
  const directory = path.dirname(from);

  const extractors: LinkExtractors = {
    link: (node: any) => {
      const to = !node.url.startsWith("http")
        ? path.posix.join(directory, node.url)
        : node.url;
      return {
        from: from,
        to: to,
        toRaw: node.url,
        text: node.children?.[0]?.value || "",
        embed: true,
        internal: !node.url.startsWith("http"),
      };
    },
    image: (node: any) => ({
      from: from,
      to: path.posix.join(directory, node.url),
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

      return {
        from: from,
        to: linkSrc,
        toRaw: linkSrc,
        text,
        embed: linkType === "embed",
        internal: !linkSrc.startsWith("http"),
      };
    },
    ...userExtractors,
  };

  const processor = unified()
    .use(markdown)
    .use([
      gfm,
      [
        remarkWikiLink,
        { pathFormat: "obsidian-short", permalinks: options?.permalinks },
      ],
      ...userRemarkPlugins,
    ]);

  const ast = processor.parse(source);

  Object.entries(extractors).forEach(([test, extractor]) => {
    const nodes = selectAll(test, ast);
    const extractedWikiLinks: WikiLink[] = nodes.map((node) => extractor(node));
    wikiLinks = wikiLinks.concat(extractedWikiLinks);
  });

  // const uniqueLinks = [...new Set(allLinks)];

  return wikiLinks;
};

export { extractWikiLinks };
