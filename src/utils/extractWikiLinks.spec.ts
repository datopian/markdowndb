import { extractWikiLinks } from "./extractWikiLinks";

// TODO test for links with headings and aliases ?
// TODO test pdf embeds
// TODO tests for wiki links with shortened Obsidian paths
// TODO tests for index pages
// TODO test custom extractors
// TODO test with other remark plugins e.g. original wiki links

describe("extractWikiLinks", () => {
  const from = "abc/foobar.md";

  describe("Common Mark links", () => {
    test("should extract CommonMark links", () => {
      const source = "[Page 1](page-1)";
      const links = extractWikiLinks(from, source);
      const expectedLinks = [
        {
          from: "abc/foobar.md",
          to: "abc/page-1",
          toRaw: "page-1",
          text: "Page 1",
          embed: false,
          internal: true,
        },
      ];
      expect(links).toEqual(expectedLinks);
    });

    test("should extract CommonMark links with image extension", () => {
      const source = "[hello](world.png)";
      const links = extractWikiLinks(from, source);
      const expectedLinks = [
        {
          from: "abc/foobar.md",
          to: "abc/world.png",
          toRaw: "world.png",
          text: "hello",
          embed: false,
          internal: true,
        },
      ];
      expect(links).toEqual(expectedLinks);
    });

    test("should extract CommonMark links with non-image extension", () => {
      const source = "[hello](world.mdx)";
      const links = extractWikiLinks(from, source);
      const expectedLinks = [
        {
          from: "abc/foobar.md",
          to: "abc/world.mdx",
          toRaw: "world.mdx",
          text: "hello",
          embed: false,
          internal: true,
        },
      ];
      expect(links).toEqual(expectedLinks);
    });

    test("should extract CommonMark links with absolute path", () => {
      const source = "[hello](/world)";
      const links = extractWikiLinks(from, source);
      const expectedLinks = [
        {
          from: "abc/foobar.md",
          to: "abc/world",
          toRaw: "/world",
          text: "hello",
          embed: false,
          internal: true,
        },
      ];
      expect(links).toEqual(expectedLinks);
    });

    test("should extract CommonMark image links", () => {
      const source = "![hello](world.png)";
      const links = extractWikiLinks(from, source);
      const expectedLinks = [
        {
          from: "abc/foobar.md",
          to: "abc/world.png",
          toRaw: "world.png",
          text: "hello",
          embed: true,
          internal: true,
        },
      ];
      expect(links).toEqual(expectedLinks);
    });

    test("should extract CommonMark image links without alt text", () => {
      const source = "![](world.png)";
      const links = extractWikiLinks(from, source);
      const expectedLinks = [
        {
          from: "abc/foobar.md",
          to: "abc/world.png",
          toRaw: "world.png",
          text: "",
          embed: true,
          internal: true,
        },
      ];
      expect(links).toEqual(expectedLinks);
    });
  });

  // TODO Obsidian wiki links
  describe("Obsidian wiki links", () => {
    test("should extract wiki links", () => {
      const source = "[[Page 1]] [[Page 2]] [[Page 3]]";
      const expectedLinks = [
        {
          embed: false,
          from: "abc/foobar.md",
          internal: true,
          text: "",
          to: "abc/Page 1",
          toRaw: "Page 1",
        },
        {
          embed: false,
          from: "abc/foobar.md",
          internal: true,
          text: "",
          to: "abc/Page 2",
          toRaw: "Page 2",
        },
        {
          embed: false,
          from: "abc/foobar.md",
          internal: true,
          text: "",
          to: "abc/Page 3",
          toRaw: "Page 3",
        },
      ];
      const links = extractWikiLinks("abc/foobar.md", source);
      expect(links).toHaveLength(expectedLinks.length);
      links.forEach((link) => {
        expect(expectedLinks).toContainEqual(link);
      });
    });

    test("should extract wiki links with Obsidian-style shortest path", () => {
      const source = "[[Page 1]] [[Page 2]] [[Page 3]]";
      const expectedLinks = [
        {
          embed: false,
          from: "abc/foobar.md",
          internal: true,
          text: "",
          to: "abc/some/folder/Page 1",
          toRaw: "/some/folder/Page 1",
        },
        {
          embed: false,
          from: "abc/foobar.md",
          internal: true,
          text: "",
          to: "abc/some/folder/Page 2",
          toRaw: "/some/folder/Page 2",
        },
        {
          embed: false,
          from: "abc/foobar.md",
          internal: true,
          text: "",
          to: "abc/some/folder/Page 3",
          toRaw: "/some/folder/Page 3",
        },
      ];
      const permalinks = [
        "/some/folder/Page 1",
        "/some/folder/Page 2",
        "/some/folder/Page 3",
      ];
      const links = extractWikiLinks("abc/foobar.md", source, { permalinks });
      expect(links).toHaveLength(expectedLinks.length);
      links.forEach((link) => {
        expect(expectedLinks).toContainEqual(link);
      });
    });

    test("should extract embedded wiki links", () => {
      const source = "![[My File.png]]]]";
      const expectedLinks = [
        {
          from: "abc/foobar.md",
          to: "abc/My File.png",
          toRaw: "My File.png",
          text: "",
          embed: true,
          internal: true,
        },
      ];
      const links = extractWikiLinks("abc/foobar.md", source);
      expect(links).toEqual(expectedLinks);
    });
  });

  // TODO fix this test
  // test("should return unique links", () => {
  //   const source = "[[Page 1]] [[Page 2]] [[Page 3]] [[Page 1]]";
  //   const expectedLinks = [
  //     { linkType: "normal", linkSrc: "page-1" },
  //     { linkType: "normal", linkSrc: "page-2" },
  //     { linkType: "normal", linkSrc: "page-3" },
  //   ];
  //   const links = extractWikiLinks({ source, ...config });
  //   expect(links).toHaveLength(expectedLinks.length);
  //   links.forEach((link) => {
  //     expect(expectedLinks).toContainEqual(link);
  //   });
  // });

  test("should extract external links", () => {
    const source = "[External Link](https://example.com)";
    const links = extractWikiLinks("abc/foobar.md", source);
    const expectedLinks = [
      {
        from: "abc/foobar.md",
        to: "https://example.com",
        toRaw: "https://example.com",
        text: "External Link",
        embed: false,
        internal: false,
      },
    ];
    expect(links).toEqual(expectedLinks);
  });

  test("should return empty array if no links are found", () => {
    const source = "No links here";
    const links = extractWikiLinks(from, source);
    expect(links).toHaveLength(0);
  });

  test("should return empty array if page is empty", () => {
    const source = "";
    const links = extractWikiLinks(from, source);
    expect(links).toHaveLength(0);
  });
});
