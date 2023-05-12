# Basic MarkdownDB tutorial

In this tutorial, we'll learn how to use the MarkdownDB package to create a list of some of the cool projects we've built over the years and turn them into an SQLite database. Next, we'll also write a script, that will query a database for our projects and display them in a nice format on the terminal.

## Step 1: Create a markdown file for each project

First, let's create a markdown file for each project. You can use real project details or make up some examples. For the sake of this tutorial, we'll create files for some of the projects we've built at Datopian.

```bash
mkdir projects
cd projects
touch portaljs.md flowershow.md datapipes.md giftless.md data-cli.md aircan.md
```

In each file we'll write some short info about a given project, like so:

```md
# What is Portal.JS

🌀 Portal.JS is a framework for rapidly building rich data portal frontends using a modern frontend approach. Portal.JS can be used to present a single dataset or build a full-scale data catalog/portal.
```

## Step 2: Index markdown files into SQLite database

Once we have prepared our markdown files, we can store them (or more precisely - their metadata) in a database, so that we can then query it later for specific project files.

```bash
# npx @flowershow/markdowndb <path-to-folder-with-md-files>
npx @flowershow/markdowndb ./projects
```

The above command will output a `markdown.db` file in the directory where it was executed. So, in our case the folder structure will look like this:

```
.
├── markdown.db
└── projects
    ├── aircan.md
    ├── ...
    └── portaljs.md
```

## Step 3: Explore the SQLite database

Now, let's explore the database. We can do it with any SQLite viewer, e.g. https://sqlitebrowser.org/. When we open the `markdown.db` file in the viewer, we'll see a list of tables:
- `files`: containing metadata of our markdown,
- `file_tags`: containing tags set in the frontmatter of our markdown files,
- `links`: containing wiki links, i.e. links between our markdown files,
- `tags`: containing all tags used in our markdown files.

In our case, the `files` table will look like this:

![](sqlite_viewer.png)

You can also explore the database from the command line, e.g.:

```bash
sqlite3 markdown.db
```

And then run SQL queries, e.g.:

```sql
SELECT * FROM files;
```

Which will output:
```bash
d8bd91a7663d721e8ef4c3abe6d706c7dc903fa0|projects/aircan.md|md|aircan||{}
27ce406aac24e59af7a9f3c0c0a437c1d024152b|projects/data-cli.md|md|data-cli||{}
26b1b0b06a4f450646f9e22fc18ec069bf577d8c|projects/datapipes.md|md|datapipes||{}
dafdd0daf71a1b06db1988c57848dc36947375f4|projects/flowershow.md|md|flowershow||{}
32c8db33fb8758516bfefb6ab1f22d03b1e53a08|projects/giftless.md|md|giftless||{}
5445349c6822704d6f531a83c2aca2e4f90de864|projects/portaljs.md|md|portaljs||{}

```

## Step 4: Query the database in Node.js app

Now, let's write a simple script that will query the database for our projects and display them on the terminal.

First, let's create a new Node.js project:

```bash
mkdir projects-list
cd projects-list
npm init -y
```

Then, let's install the `@flowershow/markdowndb` package:

```bash
npm install @flowershow/markdowndb
```

Now, let's create a new file `index.js` and add the following code:

```js
import { MarkdownDB } from "@flowershow/markdowndb";

// change this to the path to your markdown.db file
const dbPath = "markdown.db";

const client = new MarkdownDB({
  client: "sqlite3",
  connection: {
    filename: dbPath,
  },
});

const mddb = await client.init();

// get all projects
const projects = await mddb.getFiles()

console.log(JSON.stringify(projects, null, 2));

process.exit(0);
```

Since we're using ES6 modules, we also need to add `"type": "module"` to our `package.json` file.

Before we run the above script, we need to make sure that the `dbPath` variable is pointing to our `markdown.db` file. If you want to store the database outside of your project folder, you can update the `dbPath` variable to point to the correct location. If you want to have it inside your project folder, you can copy it there, or simply re-run the `npx @flowershow/markdowndb <path-to-markdown-folder>` command from within your project folder.

Now, let's run the script:

```bash
node index.js
```

It should output the JSON with all our projects.

```json
[
  {
    "_id": "26b1b0b06a4f450646f9e22fc18ec069bf577d8c",
    "file_path": "projects/datapipes.md",
    "extension": "md",
    "url_path": "datapipes",
    "filetype": null,
    "metadata": {}
  },
  ...
]
```

## Step 5: Add metadata to project files

Now, let's add some metadata to our project files. We'll use frontmatter for that. Since we're creating a catalog of our github projects, we'll add the following frontmatter fields to each file:

```md
---
name: portaljs
description: Rapidly build rich data portals using a modern frontend framework.
stars: 2000
forks: 317
---
```

After adding the metadata, we need to re-index our markdown files into the database:

```bash
npx @flowershow/markdowndb ../projects
```

Now, if we run our script again, we'll see that the `metadata` field in the output contains the metadata we've added to our project files:

```json
[
  {
    "_id": "26b1b0b06a4f450646f9e22fc18ec069bf577d8c",
    "file_path": "projects/portaljs.md",
    "extension": "md",
    "url_path": "portaljs",
    "metadata": {
      "name": "portaljs",
      "description": "🌀 Rapidly build rich data portals using a modern frontend framework.",
      "stars": 2000,
      "forks": 317
    }
  },
  ...
]
```

## Step 6: Pretty print the output

Now, let's make the output a bit more readable. We'll use the `columnify` package for that:

```bash
npm install columnify
```

And then we'll update our `index.js` file:

```js {2,16-38}
import { MarkdownDB } from "@flowershow/markdowndb";
import columnify from "columnify";

const dbPath = "markdown.db";

const client = new MarkdownDB({
  client: "sqlite3",
  connection: {
    filename: dbPath,
  },
});

const mddb = await client.init();
const projects = await mddb.getFiles()

// console.log(JSON.stringify(projects, null, 2));

const projects2 = projects.map((project) => {
  const { file_path, metadata } = project;
  return {
    file_path,
    ...metadata,
  };
});

const columns = columnify(projects2, {
  truncate: true,
  columnSplitter: ' | ',
  config: {
    description: {
      maxWidth: 80,
    },
  },
});

console.log("\n")
console.log(columns);
console.log("\n")

process.exit(0);
```

The above script will output the following to the terminal:

![](result.png)

## Done!

That's it! We've just created a simple catalog of our GitHub projects using markdown files and the `markdowndb` package. You can find the full code for this tutorial [here](https://github.com/datopian/markdowndb/tree/main/examples/basic-example).
