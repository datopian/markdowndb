import { parseFile } from "./parseFile";

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
`;

describe("parseFile", () => {
  it("should parse a file returning metadata and wiki links", () => {
    const expectedMetadata = {
      title: "Hello World",
      authors: ["John Doe", "Jane Doe"],
      tags: ["a", "b", "c"],
    };
    const expectedLinks = [
      { linkType: "normal", linkSrc: "Some Link" },
      { linkType: "normal", linkSrc: "blog/Some Other Link" },
      { linkType: "normal", linkSrc: "blog/Some Other Link" },
      { linkType: "embed", linkSrc: "Some Image.png" },
    ];
    const { metadata, links } = parseFile(source);
    expect(metadata).toEqual(expectedMetadata);
    expect(links).toEqual(expectedLinks);
  });

  it("should parse a file returning metadata and wiki links with Obsidian-style shortest paths", () => {
    const expectedMetadata = {
      title: "Hello World",
      authors: ["John Doe", "Jane Doe"],
      tags: ["a", "b", "c"],
    };
    const expectedLinks = [
      { linkType: "normal", linkSrc: "/some/folder/Some Link" },
      { linkType: "normal", linkSrc: "/some/folder/blog/Some Other Link" },
      { linkType: "normal", linkSrc: "/some/folder/blog/Some Other Link" },
      { linkType: "embed", linkSrc: "/some/folder/Some Image.png" },
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
