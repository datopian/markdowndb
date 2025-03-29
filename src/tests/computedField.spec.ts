import { FileInfo, processFile } from "../lib/process";
import Path from "path";
import { Root, Content } from "mdast";

type MyContent = Content & {
    children?: { value: string }[];
};

describe("Can parse a file and get file info", () => {
    const pathToContentFixture = "__mocks__/content";
    const filePath = "index.mdx";
    const fullPath = Path.join(pathToContentFixture, filePath);
    test("Can get some values from AST and Add it to fileInfo", async () => {
        const fileInfo = processFile(
            pathToContentFixture,
            fullPath,
            (filePath) => filePath,
            [],
            [
                (fileInfo: FileInfo, ast: Root) => {
                    const headingNode = ast.children.filter((child) => {
                        return child.type === "heading" && child.depth === 1;
                    }) as MyContent[];
                    fileInfo.title = headingNode[0]?.children[0]?.value;
                },
            ]
        );

        expect(fileInfo.file_path).toBe(fullPath);
        expect(fileInfo.url_path).toBe("index.mdx");
        expect(fileInfo.title).toBe("Welcome");
        expect(fileInfo.extension).toBe("mdx");

        expect(fileInfo.tags).toEqual([
            "tag1",
            "tag2",
            "tag3",
            "日本語タグ",
            "标签名",
            "метка",
            "태그이름",
            "tag_فارسی",
            "Tag_avec_éèç-_öäüßñ",
        ]);

        expect(fileInfo.metadata).toEqual({
            title: "Homepage",
            tags: [
                "tag1",
                "tag2",
                "tag3",
                "日本語タグ",
                "标签名",
                "метка",
                "태그이름",
                "tag_فارسی",
                "Tag_avec_éèç-_öäüßñ",
            ],
            tasks: [
                {
                    checked: false,
                    description: "uncompleted task 2",
                    metadata: {},
                    created: null,
                    due: null,
                    completion: null,
                    start: null,
                    scheduled: null,
                    list: null,
                },
                {
                    checked: true,
                    description: "completed task 1",
                    metadata: {},
                    created: null,
                    due: null,
                    completion: null,
                    start: null,
                    scheduled: null,
                    list: null,
                },
                {
                    checked: true,
                    description: "completed task 2",
                    metadata: {},
                    created: null,
                    due: null,
                    completion: null,
                    start: null,
                    scheduled: null,
                    list: null,
                },
            ],
        });
        expect(fileInfo.links).toEqual([
            {
                embed: false,
                from: "index.mdx",
                internal: true,
                text: "link",
                to: "blog0.mdx",
                toRaw: "blog0.mdx",
            },
        ]);
    });
    test("Can add array,object,null,undefined values throw the computed fields", () => {
        const fileInfo = processFile(
            pathToContentFixture,
            fullPath,
            (filePath) => filePath,
            [],
            [
                // add homepage string to file info
                (fileInfo: FileInfo, ast: Root) => {
                    fileInfo.public = {
                        title: "Title",
                        pageSize: 34,
                        isLocked: false,
                    };
                },
                // add pageNumber as number to fileInfo
                (fileInfo: FileInfo, ast: Root) => {
                    fileInfo.Authors = ["Abdelrhiim", "Mohammed", "John"];
                },
                // add isLocked as boolean to fileInfo
                (fileInfo: FileInfo, ast: Root) => {
                    fileInfo.matrix = null;
                },
                // add isLocked as boolean to fileInfo
                (fileInfo: FileInfo, ast: Root) => {
                    fileInfo.building = undefined;
                },
            ]
        );
        expect(fileInfo.file_path).toBe(fullPath);
        expect(fileInfo.url_path).toBe("index.mdx");
        expect(fileInfo.public).toEqual({
            title: "Title",
            pageSize: 34,
            isLocked: false,
        });
        expect(fileInfo.Authors).toEqual(["Abdelrhiim", "Mohammed", "John"]);
        expect(fileInfo.matrix).toBeNull();
        expect(fileInfo.building).toBeUndefined();
    });
    test("Can add string,number,and boolean values throw the computed fields", () => {
        const fileInfo = processFile(
            pathToContentFixture,
            fullPath,
            (filePath) => filePath,
            [],
            [
                // add homepage string to file info
                (fileInfo: FileInfo, ast: Root) => {
                    fileInfo.homePage = "indexFile";
                },
                // add pageNumber as number to fileInfo
                (fileInfo: FileInfo, ast: Root) => {
                    fileInfo.pageNumber = 23;
                },
                // add isLocked as boolean to fileInfo
                (fileInfo: FileInfo, ast: Root) => {
                    fileInfo.isLocked = false;
                },
            ]
        );
        expect(fileInfo.file_path).toBe(fullPath);
        expect(fileInfo.url_path).toBe("index.mdx");
        expect(fileInfo.homePage).toBe("indexFile");
        expect(fileInfo.pageNumber).toBe(23);
        expect(fileInfo.isLocked).toBe(false);
    });
    test("Can add metadata field threw the computed fields", async () => {
        const fileInfo = processFile(
            pathToContentFixture,
            fullPath,
            (filePath) => filePath,
            [],
            [
                (fileInfo: FileInfo, ast: Root) => {
                    fileInfo.metadata.AuthorName = "John Smith";
                },
            ]
        );

        expect(fileInfo.file_path).toBe(fullPath);
        expect(fileInfo.url_path).toBe("index.mdx");
        expect(fileInfo.extension).toBe("mdx");

        expect(fileInfo.tags).toEqual([
            "tag1",
            "tag2",
            "tag3",
            "日本語タグ",
            "标签名",
            "метка",
            "태그이름",
            "tag_فارسی",
            "Tag_avec_éèç-_öäüßñ",
        ]);
        expect(fileInfo.metadata).toEqual({
            AuthorName: "John Smith",
            title: "Homepage",
            tags: [
                "tag1",
                "tag2",
                "tag3",
                "日本語タグ",
                "标签名",
                "метка",
                "태그이름",
                "tag_فارسی",
                "Tag_avec_éèç-_öäüßñ",
            ],
            tasks: [
                {
                    checked: false,
                    description: "uncompleted task 2",
                    metadata: {},
                    created: null,
                    due: null,
                    completion: null,
                    start: null,
                    scheduled: null,
                    list: null,
                },
                {
                    checked: true,
                    description: "completed task 1",
                    metadata: {},
                    created: null,
                    due: null,
                    completion: null,
                    start: null,
                    scheduled: null,
                    list: null,
                },
                {
                    checked: true,
                    description: "completed task 2",
                    metadata: {},
                    created: null,
                    due: null,
                    completion: null,
                    start: null,
                    scheduled: null,
                    list: null,
                },
            ],
        });
        expect(fileInfo.links).toEqual([
            {
                embed: false,
                from: "index.mdx",
                internal: true,
                text: "link",
                to: "blog0.mdx",
                toRaw: "blog0.mdx",
            },
        ]);
    });
    test("Can Edit and Delete Metadata Field threw the computed fields", () => {
        const fileInfo = processFile(
            pathToContentFixture,
            fullPath,
            (filePath) => filePath,
            [],
            [
                (fileInfo: FileInfo, ast: Root) => {
                    fileInfo.metadata.title = "Second Page";
                    delete fileInfo.metadata.AuthorName;
                },
            ]
        );
        expect(fileInfo.file_path).toBe(fullPath);
        expect(fileInfo.url_path).toBe("index.mdx");
        expect(fileInfo.extension).toBe("mdx");
        expect(fileInfo.tags).toEqual([
            "tag1",
            "tag2",
            "tag3",
            "日本語タグ",
            "标签名",
            "метка",
            "태그이름",
            "tag_فارسی",
            "Tag_avec_éèç-_öäüßñ",
        ]);
        expect(fileInfo.metadata).toEqual({
            title: "Second Page",
            tags: [
                "tag1",
                "tag2",
                "tag3",
                "日本語タグ",
                "标签名",
                "метка",
                "태그이름",
                "tag_فارسی",
                "Tag_avec_éèç-_öäüßñ",
            ],
            tasks: [
                {
                    checked: false,
                    description: "uncompleted task 2",
                    metadata: {},
                    created: null,
                    due: null,
                    completion: null,
                    start: null,
                    scheduled: null,
                    list: null,
                },
                {
                    checked: true,
                    description: "completed task 1",
                    metadata: {},
                    created: null,
                    due: null,
                    completion: null,
                    start: null,
                    scheduled: null,
                    list: null,
                },
                {
                    checked: true,
                    description: "completed task 2",
                    metadata: {},
                    created: null,
                    due: null,
                    completion: null,
                    start: null,
                    scheduled: null,
                    list: null,
                },
            ],
        });
        expect(fileInfo.links).toEqual([
            {
                embed: false,
                from: "index.mdx",
                internal: true,
                text: "link",
                to: "blog0.mdx",
                toRaw: "blog0.mdx",
            },
        ]);
    });
});
