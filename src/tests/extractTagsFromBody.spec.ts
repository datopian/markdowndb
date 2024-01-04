import { extractTagsFromBody, processAST } from "../lib/parseFile";

const getTagsFromSource = (source: string) => {
  const ast = processAST(source, {});
  const tags = extractTagsFromBody(ast);
  return tags;
};

describe("extractTagsFromBody", () => {
  test("should extract tags from body", () => {
    const tags = getTagsFromSource("#tag");
    const expectedTags = ["tag"];
    expect(tags).toEqual(expectedTags);
  });

  test("should extract tags from heading", () => {
    const tags = getTagsFromSource("# heading #tag");
    const expectedTags = ["tag"];
    expect(tags).toEqual(expectedTags);
  });

  test("should extract 2 tags from heading", () => {
    const tags = getTagsFromSource("# heading #tag #tag2");
    const expectedTags = ["tag", "tag2"];
    expect(tags).toEqual(expectedTags);
  });

  test("should extract tags from body text", () => {
    const tags = getTagsFromSource("This is a #tag in the body text.");
    const expectedTags = ["tag"];
    expect(tags).toEqual(expectedTags);
  });

  test("should extract 2 tags from body text", () => {
    const tags = getTagsFromSource("This is #tag1 and #tag2 in the body text.");
    const expectedTags = ["tag1", "tag2"];
    expect(tags).toEqual(expectedTags);
  });

  test("should extract tags from both heading and body text", () => {
    const tags = getTagsFromSource(`# head #tag 
in heading and also in the #tag-body body text.`);
    const expectedTags = ["tag", "tag-body"];
    expect(tags).toEqual(expectedTags);
  });

  test("should extract tags with numbers", () => {
    const tags = getTagsFromSource("This is #tag123 with numbers.");
    const expectedTags = ["tag123"];
    expect(tags).toEqual(expectedTags);
  });

  test("should extract tags with special characters", () => {
    const tags = getTagsFromSource(
      "This is #special-tag #special_tag2 with special characters."
    );
    const expectedTags = ["special-tag", "special_tag2"];
    expect(tags).toEqual(expectedTags);
  });

  test("should extract tags with slash", () => {
    const tags = getTagsFromSource("This is #tag/with/slash.");
    const expectedTags = ["tag/with/slash"];
    expect(tags).toEqual(expectedTags);
  });

  test("should extract tags with multiple tags in a line", () => {
    const tags = getTagsFromSource("#tag1 #tag2 #tag3");
    const expectedTags = ["tag1", "tag2", "tag3"];
    expect(tags).toEqual(expectedTags);
  });

  // for now we will pass the body content only not the whole source
  test("shouldn't extract frontmatter tags", () => {
    const tags = getTagsFromSource(`
No tags in this content.
#gr3
    `);
    const expectedTags: string[] = ["gr3"];
    expect(tags).toEqual(expectedTags);
  });

  test("should extract tags from multiline text", () => {
    const tags =
      getTagsFromSource(`This is a multiline text with #tag1 and #tag2.
      Multiple tags on different lines: 
      #tag3
      #tag4
      And another tag: #tag5.
    `);
    const expectedTags: string[] = ["tag1", "tag2", "tag3", "tag4", "tag5"];
    expect(tags).toEqual(expectedTags);
  });

  test("should handle multiple tags in the same line", () => {
    const tags = getTagsFromSource(`#tag1 #tag2 #tag3
      #tag4 #tag5`);
    const expectedTags: string[] = ["tag1", "tag2", "tag3", "tag4", "tag5"];
    expect(tags).toEqual(expectedTags);
  });

  test("should handle tags with numbers and slashes in multiline text", () => {
    const tags = getTagsFromSource(`Tags with numbers: #tag123 and #tag456.
      Tags with slashes: #tag/one and #tag/two/three.
    `);
    const expectedTags: string[] = [
      "tag123",
      "tag456",
      "tag/one",
      "tag/two/three",
    ];
    expect(tags).toEqual(expectedTags);
  });

  test("should handle tags with special characters in multiline text", () => {
    const tags =
      getTagsFromSource(`Tags with special characters: #special-tag and #tag$percent.
      Another tag: #tag_with_underscore.
    `);
    const expectedTags: string[] = [
      "special-tag",
      "tag",
      "tag_with_underscore",
    ];
    expect(tags).toEqual(expectedTags);
  });

  test("should handle edge case with no tags in multiline text", () => {
    const tags = getTagsFromSource(`No tags in this multiline content.
      Another line without tags.
    `);
    const expectedTags: string[] = [];
    expect(tags).toEqual(expectedTags);
  });

  test("should handle edge case with no tags", () => {
    const tags = getTagsFromSource("No tags in this content.");
    const expectedTags: string[] = [];
    expect(tags).toEqual(expectedTags);
  });
});
