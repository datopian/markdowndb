# MarkdownDB

[![](https://badgen.net/npm/v/mddb)](https://www.npmjs.com/package/mddb)

MarkdownDB is a javascript library for treating markdown files as a database -- as a "MarkdownDB". Specifically, it:

- Parses your markdown files to extract structured data (frontmatter, tags etc) and creates an index in a local SQLite database
- Provides a lightweight javascript API for querying the database and importing files into your application

**🚧 MarkdownDB is in its early development stage**

## Quick start

### You have a folder of markdown content

For example, your blog posts. Each file can have a YAML frontmatter header with metadata like title, date, tags, etc.

```md
---
title: My first blog post
date: 2021-01-01
tags: [a, b, c]
author: John Doe
---

# My first blog post

This is my first blog post.
I'm using MarkdownDB to manage my blog posts.
```

### Index the files with MarkdownDB

Use the npm `mddb` package to index Markdown files into an SQLite database. This will create a `markdown.db` file in the current directory. You can preview it with any SQLite viewer, e.g. https://sqlitebrowser.org/.

```bash
# npx mddb <path-to-folder-with-your-md-files>
npx mddb ./blog
```

### Query your files with SQL...

E.g. get all the files with with tag `a`.

```sql
SELECT files.*
FROM files
INNER JOIN file_tags ON files._id = file_tags.file
WHERE file_tags.tag = 'a'
```

### ...or using MarkdownDB Node.js API in a framework of your choice!

Use our Node API to query your data for your blog, wiki, docs, digital garden, or anything you want!

Install `mddb` package in your project:

```bash
npm install mddb
```

Now, once the data is in the database, you can add the following script to your project (e.g. in `/lib` folder). It will allow you to establish a single connection to the database and use it across you app.

```js
// @/lib/mddb.mjs
import { MarkdownDB } from "mddb";

const dbPath = "markdown.db";

const client = new MarkdownDB({
  client: "sqlite3",
  connection: {
    filename: dbPath,
  },
});

const clientPromise = client.init();

export default clientPromise;
```

Now, you can import it across your project to query the database, e.g.:

```js
import clientPromise from "@/lib/mddb";

const mddb = await clientPromise;
const blogs = await mddb.getFiles({
  folder: "blog",
  extensions: ["md", "mdx"],
});
```

### (Optional) Index your files in a `prebuild` script

```json
{
  "name": "my-mddb-app",
  "scripts": {
    ...
    "mddb": "mddb <path-to-your-content-folder>",
    "prebuild": "npm run mddb"
  },
  ...
}

```

### With Next.js project

For example, in your Next.js project's pages, you could do:

```js
// @/pages/blog/index.js
import React from "react";
import clientPromise from "@/lib/mddb.mjs";


export default function Blog({ blogs }) {
    return (
        <div>
            <h1>Blog</h1>
            <ul>
                {blogs.map((blog) => (
                    <li key={blog.id}>
                        <a href={blog.url_path}>{blog.title}</a>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export const getStaticProps = async () => {
    const mddb = await clientPromise;
    // get all files that are not marked as draft in the frontmatter
    const blogFiles = await mddb.getFiles({
        frontmatter: {
            draft: false
        }
    });

    const blogsList = blogFiles.map(({ metadata, url_path }) => ({
        ...metadata,
        url_path,
    }));

    return {
        props: {
            blogs: blogsList,
        },
    };
};
```

## API reference

### Queries

**Retrieve a file by URL path:**

```ts
mddb.getFileByUrl("urlPath");
```

Currently used file path -> url resolver function:

```ts
const defaultFilePathToUrl = (filePath: string) => {
  let url = filePath
    .replace(/\.(mdx|md)/, "") // remove file extension
    .replace(/\\/g, "/") // replace windows backslash with forward slash
    .replace(/(\/)?index$/, ""); // remove index at the end for index.md files
  url = url.length > 0 ? url : "/"; // for home page
  return encodeURI(url);
};
```

🚧 The resolver function will be configurable in the future.

**Retrieve a file by it's database ID:**

```ts
mddb.getFileByUrl("fileID");
```

**Get all indexed files**:

```ts
mddb.getFiles();
```

**By file types**:

You can specify `type` of the document in its frontmatter. You can then get all the files of this type, e.g. all `blog` type documents.

```ts
mddb.getFiles({ filetypes: ["blog", "article"] }); // files of either blog or article type
```

**By tags:**

```ts
mddb.getFiles({ tags: ["tag1", "tag2"] }); // files tagged with either tag1 or tag2
```

**By file extensions:**

```ts
mddb.getFiles({ extensions: ["mdx", "md"] }); // all md and mdx files
```

**By frontmatter fields:**

You can query by multiple frontmatter fields at once.

At them moment, only exact matches are supported. However, `false` values do not need to be set explicitly. I.e. if you set `draft: true` on some blog posts and want to get all the posts that are **not drafts**, you don't have to explicitly set `draft: false` on them.

```ts
mddb.getFiles({
	frontmatter: {
		key1: "value1",
		key2: true,
		key3: 123,
		key4: ["a", "b", "c"] // this will match exactly ["a", "b", "c"]
	}
});
```

**By folder:**

Get all files in a subfolder (path relative to your content folder).

```ts
mddb.getFiles({ folder: "path" });
```

**Combined conditions:**

```ts
mddb.getFiles({ tags: ["tag1"], filetypes: ["blog"], extensions: ["md"] });
```

**Retrieve all tags:**

```ts
mddb.getTags();
```

**Get links (forward or backward) related to a file:**

```ts
mddb.getLinks({ fileId: "ID", direction: "forward" });
```

## Features

- indexing markdown files into an SQLite database, with:
  - frontmatter data extraction (specifically tags and document types)
  - wiki links extraction (CommonMark links, Obsidian links and embeds)
- querying database for:
  - a list of all or some of the markdown files in your content folder: e.g. get all your blog posts tagged with "tutorial"
  - get backlinks to or forward on a given page, and e.g. list them in the bottom of your pages, so that users can quickly find related content

## Upcoming features

- custom document types and schemas with data validation
- computed fields
- indexing multiple folders
- extracting tasks
- and much more...
