import { parseFile } from "../lib/parseFile";

const source = `---
title: Hello World
authors: [John Doe, Jane Doe]
tags: a, b, c
---
# Hello World
[[Some Link]]
[[blog/Some Other Link]]
[[blog/Some Other Link|Page Alias]]
![[Some Image.png]]
- [ ] uncompleted task
- [x] completed task

## Test tags

### Should be extracted 
#日本語タグ
Another tag: #标签名
#метка
Another tag: #태그이름
#tag_فارسی
#Tag_avec_éèç-_öäüßñ

### Shouldn't be extracted 
\`\`\`bash
#---------------------------------------------------------------------------------------
# This's a title
#---------------------------------------------------------------------------------------
...
\`\`\`

#4874
`;

describe("parseFile", () => {
  it("should parse a file returning metadata and wiki links", () => {
    const expectedMetadata = {
      title: "Hello World",
      authors: ["John Doe", "Jane Doe"],
      tags: ["a", "b", "c", "日本語タグ", "标签名", "метка", "태그이름", "tag_فارسی", "Tag_avec_éèç-_öäüßñ"],
      tasks: [
        { description: "uncompleted task", checked: false },
        { description: "completed task", checked: true },
      ],
    };
    const expectedLinks = [
      {
        embed: false,
        from: "",
        internal: true,
        text: "",
        to: "Some Link",
        toRaw: "Some Link",
      },
      {
        embed: false,
        from: "",
        internal: true,
        text: "",
        to: "blog/Some Other Link",
        toRaw: "blog/Some Other Link",
      },
      {
        embed: false,
        from: "",
        internal: true,
        text: "",
        to: "blog/Some Other Link",
        toRaw: "blog/Some Other Link",
      },
      {
        embed: true,
        from: "",
        internal: true,
        text: "",
        to: "Some Image.png",
        toRaw: "Some Image.png",
      },
    ];
    const { metadata, links } = parseFile(source);
    expect(metadata).toEqual(expectedMetadata);
    expect(links).toEqual(expectedLinks);
  });

  it("should parse a file returning metadata and wiki links with Obsidian-style shortest paths", () => {
    const expectedMetadata = {
      title: "Hello World",
      authors: ["John Doe", "Jane Doe"],
      tags: ["a", "b", "c", "日本語タグ", "标签名", "метка", "태그이름", "tag_فارسی", "Tag_avec_éèç-_öäüßñ"],
      tasks: [
        { description: "uncompleted task", checked: false },
        { description: "completed task", checked: true },
      ],
    };
    const expectedLinks = [
      {
        embed: false,
        from: "",
        internal: true,
        text: "",
        to: "some/folder/Some Link",
        toRaw: "/some/folder/Some Link",
      },
      {
        embed: false,
        from: "",
        internal: true,
        text: "",
        to: "some/folder/blog/Some Other Link",
        toRaw: "/some/folder/blog/Some Other Link",
      },
      {
        embed: false,
        from: "",
        internal: true,
        text: "",
        to: "some/folder/blog/Some Other Link",
        toRaw: "/some/folder/blog/Some Other Link",
      },
      {
        embed: true,
        from: "",
        internal: true,
        text: "",
        to: "some/folder/Some Image.png",
        toRaw: "/some/folder/Some Image.png",
      },
    ];
    const permalinks = [
      "/some/folder/Some Link",
      "/some/folder/blog/Some Other Link",
      "/some/folder/blog/Some Other Link",
      "/some/folder/Some Image.png",
    ];
    const { metadata, links } = parseFile(source, { permalinks });
    expect(metadata).toEqual(expectedMetadata);
    expect(links).toEqual(expectedLinks);
  });
});
