import { extractTagsFromBody } from "./extractTagsFromBody";

describe("extractTagsFromBody", () => {
  test("should extract tags from body", () => {
    const source = "#tag";
    const tags = extractTagsFromBody(source);
    const expectedTags = ["tag"];
    expect(tags).toEqual(expectedTags);
  });

  test("should extract tags from heading", () => {
    const source = "# heading #tag";
    const tags = extractTagsFromBody(source);
    const expectedTags = ["tag"];
    expect(tags).toEqual(expectedTags);
  });

  test("should extract 2 tags from heading", () => {
    const source = "# heading #tag #tag2";
    const tags = extractTagsFromBody(source);
    const expectedTags = ["tag", "tag2"];
    expect(tags).toEqual(expectedTags);
  });

  test("should extract tags from body text", () => {
    const source = "This is a #tag in the body text.";
    const tags = extractTagsFromBody(source);
    const expectedTags = ["tag"];
    expect(tags).toEqual(expectedTags);
  });

  test("should extract 2 tags from body text", () => {
    const source = "This is #tag1 and #tag2 in the body text.";
    const tags = extractTagsFromBody(source);
    const expectedTags = ["tag1", "tag2"];
    expect(tags).toEqual(expectedTags);
  });

  test("should extract tags from both heading and body text", () => {
    const source = `# head #tag 
    in heading and also in the #tag-body body text.`;
    const tags = extractTagsFromBody(source);
    const expectedTags = ["tag", "tag-body"];
    expect(tags).toEqual(expectedTags);
  });

  test("should extract tags with numbers", () => {
    const source = "This is #tag123 with numbers.";
    const tags = extractTagsFromBody(source);
    const expectedTags = ["tag123"];
    expect(tags).toEqual(expectedTags);
  });

  test("should extract tags with special characters", () => {
    const source =
      "This is #special-tag #special_tag2 with special characters.";
    const tags = extractTagsFromBody(source);
    const expectedTags = ["special-tag", "special_tag2"];
    expect(tags).toEqual(expectedTags);
  });

  test("should extract tags with slash", () => {
    const source = "This is #tag/with/slash.";
    const tags = extractTagsFromBody(source);
    const expectedTags = ["tag/with/slash"];
    expect(tags).toEqual(expectedTags);
  });

  test("should extract tags with multiple tags in a line", () => {
    const source = "#tag1 #tag2 #tag3";
    const tags = extractTagsFromBody(source);
    const expectedTags = ["tag1", "tag2", "tag3"];
    expect(tags).toEqual(expectedTags);
  });

  // for now we will pass the body content only not the whole source
  test("shouldn't extract frontmatter tags", () => {
    const content = `
    No tags in this content.
    #gr3
    `;
    const tags = extractTagsFromBody(content);
    const expectedTags: string[] = ["gr3"];
    expect(tags).toEqual(expectedTags);
  });

  test("should extract tags from multiline text", () => {
    const source = `This is a multiline text with #tag1 and #tag2.
      Multiple tags on different lines: 
      #tag3
      #tag4
      And another tag: #tag5.
    `;
    const tags = extractTagsFromBody(source);
    const expectedTags: string[] = ["tag1", "tag2", "tag3", "tag4", "tag5"];
    expect(tags).toEqual(expectedTags);
  });

  test("should handle multiple tags in the same line", () => {
    const source = `#tag1 #tag2 #tag3
      #tag4 #tag5`;
    const tags = extractTagsFromBody(source);
    const expectedTags: string[] = ["tag1", "tag2", "tag3", "tag4", "tag5"];
    expect(tags).toEqual(expectedTags);
  });

  test("should handle tags with numbers and slashes in multiline text", () => {
    const source = `Tags with numbers: #tag123 and #tag456.
      Tags with slashes: #tag/one and #tag/two/three.
    `;
    const tags = extractTagsFromBody(source);
    const expectedTags: string[] = [
      "tag123",
      "tag456",
      "tag/one",
      "tag/two/three",
    ];
    expect(tags).toEqual(expectedTags);
  });

  test("should handle tags with special characters in multiline text", () => {
    const source = `Tags with special characters: #special-tag and #tag$percent.
      Another tag: #tag_with_underscore.
    `;
    const tags = extractTagsFromBody(source);
    const expectedTags: string[] = [
      "special-tag",
      "tag",
      "tag_with_underscore",
    ];
    expect(tags).toEqual(expectedTags);
  });

  test("should handle edge case with no tags in multiline text", () => {
    const source = `No tags in this multiline content.
      Another line without tags.
    `;
    const tags = extractTagsFromBody(source);
    const expectedTags: string[] = [];
    expect(tags).toEqual(expectedTags);
  });

  test("should handle edge case with no tags", () => {
    const source = "No tags in this content.";
    const tags = extractTagsFromBody(source);
    const expectedTags: string[] = [];
    expect(tags).toEqual(expectedTags);
  });
});
