import markdown from "remark-parse";
import { unified } from "unified";
import { selectAll, Node } from "unist-util-select";

export interface TagExtractors {
  [test: string]: (node: Node) => string[]; // Updated interface for tag extractors
}

const extractTagsFromBody = (source: string) => {
  let tags: string[] = [];

  const processor = unified().use(markdown);

  const ast = processor.parse(source);
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

export { extractTagsFromBody };
