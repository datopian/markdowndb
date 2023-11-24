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
      tags: ["a", "b", "c"],
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
